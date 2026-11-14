// layout.js
// Pure maths for fitting the fixed-size Figma canvas into a window.

/**
 * Scale factor that makes a design `designWidth` pixels wide fit an `availableWidth` window.
 * - never above 1: a window as wide as the design (or wider) shows it at exactly 100%
 * - never wider than the window: rounded DOWN to 4 decimals so a rounding error can't create
 *   a 1px horizontal scrollbar
 * - an unusable width (0, NaN, undefined) falls back to 1
 */
export function fitScale(availableWidth, designWidth) {
  if (!Number.isFinite(availableWidth) || !Number.isFinite(designWidth) || availableWidth <= 0 || designWidth <= 0) {
    return 1;
  }
  if (availableWidth >= designWidth) return 1;
  return Math.floor((availableWidth / designWidth) * 10000) / 10000;
}

/**
 * Scale that makes the whole design fit inside the window, both across and down, without
 * distorting it. 1 when the window is at least as large as the design in both directions.
 */
export function fitScaleToBox(availableWidth, availableHeight, designWidth, designHeight) {
  return Math.min(fitScale(availableWidth, designWidth), fitScale(availableHeight, designHeight));
}

/**
 * Everything the app shell needs to size the Figma canvas for a window.
 *  - scale: uniform shrink so the design fits (1 when the window is at least as big as the design)
 *  - canvasWidth: the width of the canvas in design pixels. It is never below `designWidth`, and in a
 *    window wider than the design it grows to fill the window, so the sidebar stays on the left and
 *    the main content takes all the remaining width. At exactly the design width it equals it.
 */
export function layoutForWindow(availableWidth, availableHeight, designWidth, designHeight) {
  const scale = fitScaleToBox(availableWidth, availableHeight, designWidth, designHeight);
  const usable = Number.isFinite(availableWidth) && availableWidth > 0;
  // rounded DOWN to 2 decimals so the scaled canvas can never be wider than the window
  const canvasWidth = usable ? Math.max(designWidth, Math.floor((availableWidth / scale) * 100) / 100) : designWidth;
  return { scale, canvasWidth };
}
