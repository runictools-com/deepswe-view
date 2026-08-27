import assert from "node:assert/strict";
import {
  getConfigGroups,
  getDefaultConfigSet,
  getDefaultModelSet,
  getLeaderboardRows,
  getModelRows,
} from "../src/leaderboard-data.js";
import v11Artifact from "../artifacts/v1.1/leaderboard-live.json" with { type: "json" };
import v1Artifact from "../artifacts/v1/leaderboard-live.json" with { type: "json" };

const pricingChanges = {
  "glm-5-3-flash": {
    from: { input: 0.15, cached: 0.03, output: 0.5 },
    to: { input: 0.075, cached: 0.015, output: 0.25 },
  },
  "gpt-5-6-luna": {
    from: { input: 1, cached: 0.1, output: 6 },
    to: { input: 0.2, cached: 0.02, output: 1.2 },
  },
  "gpt-5-6-terra": {
    from: { input: 2.5, cached: 0.25, output: 15 },
    to: { input: 2, cached: 0.2, output: 12 },
  },
  "gpt-5-6-sol": {
    from: { input: 5, cached: 0.5, output: 30 },
    to: { input: 4, cached: 0.4, output: 20 },
  },
  "deepseek-v4-pro": {
    v1: {
      from: { input: 1.74, cached: 0.0145, output: 3.48 },
      to: { input: 0.435, cached: 0.003625, output: 0.87 },
    },
    "v1.1": {
      from: { input: 0.435, cached: 0.003625, output: 0.87 },
      to: { input: 1.32, cached: 0.044, output: 3.96 },
    },
  },
  "deepseek-v4-flash": {
    from: { input: 0.14, cached: 0.0028, output: 0.28 },
    to: { input: 0.44, cached: 0.014, output: 1.32 },
  },
  "gemini-3-6-flash": {
    from: { input: 1.5, cached: 0.15, output: 7.5 },
    to: { input: 0.75, cached: 0.075, output: 3.75 },
  },
};

function priceForTokens(tokens, price) {
  return (
    (tokens.input - tokens.cached) * price.input +
    tokens.cached * price.cached +
    tokens.output * price.output
  );
}

function proportionalPriceRatio(pricing) {
  const ratio = pricing.to.input / pricing.from.input;
  const cachedRatio = pricing.to.cached / pricing.from.cached;
  const outputRatio = pricing.to.output / pricing.from.output;
  return Math.abs(cachedRatio - ratio) < 1e-9 && Math.abs(outputRatio - ratio) < 1e-9 ? ratio : null;
}

function expectedCost(row, version) {
  const change = pricingChanges[row.model];
  const pricing = row.model === "deepseek-v4-pro" ? change?.[version] : change;
  if (!pricing) return row.mean_cost_usd;
  const tokens = {
    input: row.mean_input_tokens,
    cached: row.mean_cache_tokens,
    output: row.mean_output_tokens,
  };
  if (![tokens.input, tokens.cached, tokens.output].every(Number.isFinite)) {
    const ratio = proportionalPriceRatio(pricing);
    return ratio == null ? row.mean_cost_usd : row.mean_cost_usd * ratio;
  }
  return row.mean_cost_usd * (priceForTokens(tokens, pricing.to) / priceForTokens(tokens, pricing.from));
}

for (const [version, artifact] of Object.entries({ "v1.1": v11Artifact, v1: v1Artifact })) {
  const rows = getLeaderboardRows(version);
  assert.equal(rows.length, artifact.rows.length);
  artifact.rows.forEach((expected, index) => {
    const actual = rows[index];
    assert.deepEqual(
      {
        model: actual.model,
        effort: actual.effort,
        config: actual.config,
        pass: actual.pass,
        output: actual.output,
        steps: actual.steps,
        ci: actual.ci,
        low: actual.low,
        high: actual.high,
      },
      {
        model: expected.model,
        effort: expected.reasoning_effort || "default",
        config: expected.config,
        pass: expected.pass_rate,
        output: expected.mean_output_tokens,
        steps: expected.mean_agent_steps,
        ci: Math.round(expected.ci_half * 100),
        low: expected.ci_lo,
        high: expected.ci_hi,
      },
    );
    assert.ok(Math.abs(actual.cost - expectedCost(expected, version)) < 1e-12, `${version} ${expected.model} ${expected.config} cost mismatch`);
  });
}

const expectedLuna = [
  ["low", 0.015486725663716814, 0.014481247876106192, 3127.754424778761, 12.464601769911505],
  ["medium", 0.11283185840707964, 0.04326195796460178, 8179.570796460177, 23.67699115044248],
  ["high", 0.4424778761061947, 0.15558014999999997, 25778.274336283186, 49.02212389380531],
  ["xhigh", 0.5685840707964602, 0.30712385371681417, 44677.900442477876, 71.09955752212389],
  ["max", 0.671875, 0.6056233620535714, 73399.70758928571, 101.68080357142857],
];

const luna = getLeaderboardRows("v1.1")
  .filter((row) => row.model === "gpt-5-6-luna")
  .sort((a, b) => ["low", "medium", "high", "xhigh", "max"].indexOf(a.effort) - ["low", "medium", "high", "xhigh", "max"].indexOf(b.effort));

assert.equal(getLeaderboardRows("v1.1").length, 63);
assert.equal(getLeaderboardRows("v1").length, 29);
assert.ok(Math.abs(getLeaderboardRows("v1").find((row) => row.model === "deepseek-v4-pro").cost - 1.0545908544590708) < 1e-12);
assert.equal(luna.length, expectedLuna.length);

const selectedModels = getDefaultModelSet("v1.1");
const selectedConfigs = getDefaultConfigSet("v1.1", selectedModels);
const configGroups = getConfigGroups("v1.1", selectedConfigs);
const expectedDefaultEfforts = new Map([
  ["claude-opus-5", ["low", "medium", "high"]],
  ["gpt-5-6-sol", ["low", "medium", "high", "xhigh"]],
  ["claude-fable-5", ["low", "medium", "high"]],
  ["glm-5-3", null],
  ["glm-5-3-flash", null],
  ["kimi-k3", null],
  ["grok-4-6", ["low", "medium", "high", "xhigh"]],
  ["gpt-5-6-luna", ["low", "medium", "high", "xhigh", "max"]],
  ["gemini-3-7-flash", ["low", "medium", "high"]],
  ["deepseek-v4-pro", null],
  ["deepseek-v4-flash", null],
]);

assert.equal(configGroups.length, 26);
assert.deepEqual(configGroups.map((group) => group.model), getModelRows("v1.1").map((row) => row.model));
assert.ok(configGroups.some((group) => group.model === "gpt-5-5"));
assert.equal(selectedModels.has("gpt-5-5"), false);
assert.deepEqual([...selectedModels], [...expectedDefaultEfforts.keys()]);
assert.equal(selectedConfigs.size, 27);
for (const [model, efforts] of expectedDefaultEfforts) {
  const group = configGroups.find((candidate) => candidate.model === model);
  assert.ok(group, `${model} default group is missing`);
  const selectedEfforts = group.rows.filter((row) => selectedConfigs.has(row.config)).map((row) => row.effort);
  assert.deepEqual(selectedEfforts, efforts ?? group.rows.map((row) => row.effort), `${model} default efforts mismatch`);
}

for (const [index, [effort, pass, cost, output, steps]] of expectedLuna.entries()) {
  assert.equal(luna[index].effort, effort);
  assert.equal(luna[index].pass, pass);
  assert.ok(Math.abs(luna[index].cost - cost) < 1e-12, `${effort} cost mismatch`);
  assert.equal(luna[index].output, output);
  assert.equal(luna[index].steps, steps);
}

console.log("Leaderboard data check passed: GPT-5.6-Luna has all five reference effort levels.");
