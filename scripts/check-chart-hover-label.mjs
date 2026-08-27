import assert from "node:assert/strict";
import { chromium } from "playwright";

const model = "gpt-5-6-luna";
const highConfig = "mini_swe_agent_gpt_5_6_luna_high";
const appUrl = process.env.DEEPSWE_TEST_URL ?? "http://127.0.0.1:5173/";

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } });
  await page.goto(appUrl, { waitUntil: "domcontentloaded" });
  await page.locator(".chart-wrap svg").waitFor();

  const highPath = page.locator(`.chart-line-hit[data-chart-model="${model}"][data-chart-config="${highConfig}"]`).nth(1);
  const coords = await highPath.evaluate((path) => {
    const local = path.getPointAtLength(path.getTotalLength() / 2);
    const screen = new DOMPoint(local.x, local.y).matrixTransform(path.getScreenCTM());
    return { x: screen.x, y: screen.y };
  });
  const highLabel = page.locator(`g.chart-hover-label[data-chart-config="${highConfig}"]`);
  assert.equal(await highLabel.count(), 1);
  assert.equal(await highLabel.evaluate((label) => getComputedStyle(label).display), "none");
  assert.equal(await highLabel.locator(".chart-effort-label").textContent(), "HIGH");

  await page.mouse.move(coords.x, coords.y);
  await page.waitForTimeout(30);
  assert.equal(await highLabel.evaluate((label) => getComputedStyle(label).display), "block");
  assert.equal(await page.locator(`[data-chart-guide="${highConfig}"]`).evaluate((guide) => getComputedStyle(guide).display), "block");

  console.log("Chart hover label check passed: hovering Luna high shows HIGH.");
} finally {
  await browser.close();
}
