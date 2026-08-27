export function closeOpenMenus(state) {
  const wasOpen = state.configOpen || state.modelsOpen || state.menuOpen;
  state.configOpen = false;
  state.modelsOpen = false;
  state.menuOpen = false;
  return wasOpen;
}

export function isMenuInteraction(target, eventPath = []) {
  const menuSelectors = [".popover-anchor", ".mobile-menu", ".menu-toggle"];
  return [target, ...eventPath].some((element) => menuSelectors.some((selector) => Boolean(
    element?.matches?.(selector) || element?.closest?.(selector),
  )));
}
