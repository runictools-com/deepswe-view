import assert from "node:assert/strict";

const appUrl = process.env.DEEPSWE_TEST_URL ?? "http://127.0.0.1:5173/";
const cdpUrl = process.env.DEEPSWE_CDP_URL ?? "http://127.0.0.1:9222";
const pages = await fetch(`${cdpUrl}/json/list`).then((response) => response.json());
const page = pages.find((candidate) => candidate.type === "page" && candidate.webSocketDebuggerUrl);

assert.ok(page, `No Chromium page found at ${cdpUrl}`);

const socket = new WebSocket(page.webSocketDebuggerUrl);
let nextId = 0;
const pending = new Map();

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  const resolve = pending.get(message.id);
  if (!resolve) return;
  pending.delete(message.id);
  resolve(message);
};

await new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
});

function command(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, (message) => {
      if (message.error) {
        reject(new Error(message.error.message));
        return;
      }
      resolve(message);
    });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const response = await command("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.result.exceptionDetails) {
    throw new Error(response.result.exceptionDetails.text ?? "Browser evaluation failed");
  }
  return response.result.result.value;
}

async function waitForApp() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      if (await evaluate("document.readyState === \"complete\" && Boolean(document.querySelector(\".config-toggle\"))")) return;
    } catch {
      // The execution context can be unavailable briefly while navigation replaces it.
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`App did not load at ${appUrl}`);
}

try {
  await command("Page.navigate", { url: appUrl });
  await waitForApp();

  const result = await evaluate(`(() => {
    const model = "gpt-5-6-terra";
    const readState = () => {
      const toggle = document.querySelector('[data-config-model-toggle="' + model + '"]');
      const group = toggle?.closest(".config-group");
      return {
        checked: toggle?.getAttribute("aria-checked"),
        count: group?.querySelector(".config-selected-count")?.textContent,
        modelRow: Boolean(document.querySelector('[data-model-row="' + model + '"]')),
      };
    };

    document.querySelector(".config-toggle").click();
    const before = readState();
    document.querySelector('[data-config-model-toggle="' + model + '"]').click();
    const after = readState();
    document.querySelector('[data-config-model-toggle="' + model + '"]').click();
    return { before, after, deselected: readState() };
  })()`);

  assert.equal(result.before.checked, "false");
  assert.equal(result.before.count, "0/5");
  assert.equal(result.after.checked, "true", JSON.stringify(result));
  assert.equal(result.after.count, "5/5", JSON.stringify(result));
  assert.equal(result.after.modelRow, true, JSON.stringify(result));
  assert.equal(result.deselected.checked, "false", JSON.stringify(result));
  assert.equal(result.deselected.count, "0/5", JSON.stringify(result));
  assert.equal(result.deselected.modelRow, false, JSON.stringify(result));
  console.log("Config model toggle check passed: model visibility updates from the configs menu.");
} finally {
  socket.close();
}
