import assert from "node:assert/strict";
import { buildStepPath, buildStepSegments } from "../src/chart-path.js";

assert.equal(buildStepPath([]), "");
assert.equal(
  buildStepPath([
    { x: "320.0", y: "240.0" },
    { x: "210.0", y: "190.0" },
    { x: "90.0", y: "140.0" },
  ]),
  "M 320.0 240.0 H 210.0 V 190.0 H 90.0 V 140.0",
);
assert.deepEqual(
  buildStepSegments([
    { config: "low", x: "320.0", y: "240.0" },
    { config: "medium", x: "210.0", y: "190.0" },
    { config: "high", x: "90.0", y: "140.0" },
  ]),
  [
    { config: "low", d: "M 320.0 240.0 H 210.0" },
    { config: "medium", d: "M 210.0 240.0 V 190.0" },
    { config: "medium", d: "M 210.0 190.0 H 90.0" },
    { config: "high", d: "M 90.0 190.0 V 140.0" },
  ],
);

console.log("Chart path check passed: configurations connect with horizontal and vertical steps.");
