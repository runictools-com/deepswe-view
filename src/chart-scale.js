const METRIC_HEADROOM = 1.04;
const PASS_SCALE_STEP = 0.2;
const PASS_SCALE_MIN = 0.8;
const PASS_SCALE_MAX = 1;

function rounded(value) {
  return Number(value.toFixed(10));
}

export function getNiceTicks(max, count = 6) {
  if (!(max > 0)) return [0];

  const targetStep = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(targetStep));
  const normalizedStep = targetStep / magnitude;
  const step = (normalizedStep >= 5 ? 10 : normalizedStep >= 2 ? 5 : normalizedStep >= 1 ? 2 : 1) * magnitude;
  const ticks = [];

  for (let value = 0; value <= max + Number.EPSILON * Math.max(1, max); value += step) {
    ticks.push(rounded(value));
  }

  return ticks;
}

export function getMetricScale(values, count = 6) {
  const maxValue = values.reduce(
    (max, value) => (Number.isFinite(value) && value >= 0 ? Math.max(max, value) : max),
    0,
  );
  const max = maxValue > 0 ? maxValue * METRIC_HEADROOM : 1;

  return { max, ticks: getNiceTicks(max, count) };
}

export function getPassScaleMax(rows) {
  const maxValue = rows.reduce((max, row) => {
    const pass = Number.isFinite(row.pass) ? row.pass : 0;
    const high = Number.isFinite(row.high) ? row.high : 0;
    return Math.max(max, pass, high);
  }, 0);
  const steppedMax = Math.ceil((maxValue - Number.EPSILON) / PASS_SCALE_STEP) * PASS_SCALE_STEP;

  return rounded(Math.min(PASS_SCALE_MAX, Math.max(PASS_SCALE_MIN, steppedMax)));
}

export function getPassScaleTicks(max) {
  const tickCount = Math.round(max / PASS_SCALE_STEP);
  return Array.from({ length: tickCount + 1 }, (_, index) => rounded(index * PASS_SCALE_STEP));
}
