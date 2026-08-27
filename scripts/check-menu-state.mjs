import assert from "node:assert/strict";
import { closeOpenMenus, isMenuInteraction } from "../src/menu-state.js";
import {
  applyConfigSelection,
  applyModelSelection,
  capturePopoverScroll,
  restorePopoverScroll,
} from "../src/picker-state.js";
import { getLeaderboardRows } from "../src/leaderboard-data.js";

const state = { configOpen: true, modelsOpen: true, menuOpen: true };

assert.equal(closeOpenMenus(state), true);
assert.deepEqual(state, { configOpen: false, modelsOpen: false, menuOpen: false });
assert.equal(closeOpenMenus(state), false);

const targetInsideMenu = { closest: (selector) => selector === ".popover-anchor" };
const targetOutsideMenu = { closest: () => null };
const detachedMenuTarget = { closest: () => null };
const menuEventPath = [{ matches: (selector) => selector === ".popover-anchor" }];

assert.equal(isMenuInteraction(targetInsideMenu), true);
assert.equal(isMenuInteraction(targetOutsideMenu), false);
assert.equal(isMenuInteraction(detachedMenuTarget, menuEventPath), true);

const selectionState = { selectedModels: new Set(), selectedConfigs: new Set() };
const geminiRows = getLeaderboardRows("v1.1").filter((row) => row.model === "gemini-3-1-pro-preview");
applyModelSelection(selectionState, getLeaderboardRows("v1.1"), "gemini-3-1-pro-preview", true);
assert.equal(selectionState.selectedModels.has("gemini-3-1-pro-preview"), true);
assert.deepEqual([...selectionState.selectedConfigs], geminiRows.map((row) => row.config));
applyModelSelection(selectionState, getLeaderboardRows("v1.1"), "gemini-3-1-pro-preview", false);
assert.equal(selectionState.selectedModels.has("gemini-3-1-pro-preview"), false);
assert.equal(selectionState.selectedConfigs.size, 0);

const geminiConfig = geminiRows[0].config;
applyConfigSelection(selectionState, getLeaderboardRows("v1.1"), geminiConfig, true);
assert.equal(selectionState.selectedModels.has("gemini-3-1-pro-preview"), true);
assert.deepEqual([...selectionState.selectedConfigs], [geminiConfig]);
applyConfigSelection(selectionState, getLeaderboardRows("v1.1"), geminiConfig, false);
assert.equal(selectionState.selectedModels.has("gemini-3-1-pro-preview"), false);
assert.equal(selectionState.selectedConfigs.size, 0);

const oldConfigList = { scrollTop: 187 };
const oldConfigPopover = {
  dataset: { popover: "config" },
  querySelector: (selector) => selector === ".config-group-list" ? oldConfigList : null,
};
const scrollState = capturePopoverScroll({ querySelectorAll: () => [oldConfigPopover] });
assert.deepEqual(scrollState, [{ type: "config", scrollTop: 187 }]);

const newConfigList = { scrollTop: 0 };
const newConfigPopover = {
  dataset: { popover: "config" },
  querySelector: (selector) => selector === ".config-group-list" ? newConfigList : null,
};
restorePopoverScroll({ querySelectorAll: () => [newConfigPopover] }, scrollState);
assert.equal(newConfigList.scrollTop, 187);

console.log("Menu state check passed: outside interactions can close all menus.");
