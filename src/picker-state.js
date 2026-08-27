export function applyModelSelection(state, rows, model, selected) {
  const modelConfigs = rows.filter((row) => row.model === model).map((row) => row.config);

  if (selected) {
    state.selectedModels.add(model);
    modelConfigs.forEach((config) => state.selectedConfigs.add(config));
  } else {
    state.selectedModels.delete(model);
    modelConfigs.forEach((config) => state.selectedConfigs.delete(config));
  }
}

export function applyConfigSelection(state, rows, config, selected) {
  const row = rows.find((candidate) => candidate.config === config);
  if (!row) return;

  if (selected) {
    state.selectedConfigs.add(config);
    state.selectedModels.add(row.model);
    return;
  }

  state.selectedConfigs.delete(config);
  if (!rows.some((candidate) => candidate.model === row.model && state.selectedConfigs.has(candidate.config))) {
    state.selectedModels.delete(row.model);
  }
}

function scrollContainer(popover) {
  return popover.querySelector(".config-group-list") ?? popover;
}

export function capturePopoverScroll(root) {
  return [...root.querySelectorAll("[data-popover]")].map((popover) => ({
    type: popover.dataset.popover,
    scrollTop: scrollContainer(popover).scrollTop,
  }));
}

export function restorePopoverScroll(root, scrollState) {
  const popovers = [...root.querySelectorAll("[data-popover]")];
  scrollState.forEach(({ type, scrollTop }) => {
    const popover = popovers.find((candidate) => candidate.dataset.popover === type);
    if (popover) scrollContainer(popover).scrollTop = scrollTop;
  });
}
