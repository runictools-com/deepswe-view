import assert from "node:assert/strict";
import { getDefaultConfigSet, getDefaultModelSet, getLeaderboardRows } from "../src/leaderboard-data.js";
import { getMetricScale, getPassScaleMax, getPassScaleTicks } from "../src/chart-scale.js";
import { getChartLayout } from "../src/chart-layout.js";

function selectedRows(version) {
  const models = getDefaultModelSet(version);
  const configs = getDefaultConfigSet(version, models);
  return getLeaderboardRows(version).filter((row) => models.has(row.model) && configs.has(row.config));
}

const v1Rows = selectedRows("v1");
const outputScale = getMetricScale(v1Rows.map((row) => row.output), 6);
const stepsScale = getMetricScale(v1Rows.map((row) => row.steps), 6);

assert.ok(outputScale.max > Math.max(...v1Rows.map((row) => row.output)));
assert.ok(stepsScale.max > Math.max(...v1Rows.map((row) => row.steps)));
assert.notEqual(outputScale.max, 220000);
assert.notEqual(stepsScale.max, 280);
assert.ok(outputScale.ticks.every((tick) => tick <= outputScale.max));
assert.ok(stepsScale.ticks.every((tick) => tick <= stepsScale.max));

assert.equal(getPassScaleMax([{ pass: 0.84, high: 0.9 }]), 1);
assert.deepEqual(getPassScaleTicks(0.8), [0, 0.2, 0.4, 0.6, 0.8]);

assert.equal(getChartLayout(950, 1280).W, 950);
assert.equal(getChartLayout(700, 1280).W, 700);
assert.equal(getChartLayout(700, 1280).H, 438);
assert.deepEqual(getChartLayout(380, 500), {
  W: 440,
  H: 500,
  mobile: true,
  margin: { top: 40, right: 68, bottom: 52, left: 46 },
});

console.log("Chart scale check passed: visible data fits dynamic metric and pass-rate scales.");
