const MOBILE_BREAKPOINT = 640;
const DESKTOP_ASPECT_RATIO = 960 / 600;
const DESKTOP_MIN_WIDTH = 600;
const DESKTOP_MAX_WIDTH = 1200;
const DEFAULT_DESKTOP_WIDTH = 950;

const desktopMargin = { top: 40, right: 60, bottom: 52, left: 46 };
const mobileMargin = { top: 40, right: 68, bottom: 52, left: 46 };

export function getChartLayout(width, viewportWidth) {
  const mobile = Number.isFinite(viewportWidth) && viewportWidth < MOBILE_BREAKPOINT;
  if (mobile) {
    return { W: 440, H: 500, mobile: true, margin: mobileMargin };
  }

  const availableWidth = Number.isFinite(width) && width > 0 ? width : DEFAULT_DESKTOP_WIDTH;
  const W = Math.round(Math.min(DESKTOP_MAX_WIDTH, Math.max(DESKTOP_MIN_WIDTH, availableWidth)));

  return { W, H: Math.round(W / DESKTOP_ASPECT_RATIO), mobile: false, margin: desktopMargin };
}
