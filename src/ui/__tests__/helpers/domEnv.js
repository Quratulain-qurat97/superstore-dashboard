// A simulated browser for the UI tests (jsdom has no layout engine, so sizes are supplied here).
import { JSDOM } from 'jsdom';

/**
 * Installs window/document globals and layout stand-ins.
 * `viewport` is the browser window; `boxFor(element)` gives the size of an element's box
 * (the chart cards get their Figma sizes).
 */
export function installDom(viewport = { width: 1920, height: 1080 }) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/', pretendToBeVisual: true });
  const { window } = dom;
  for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'SVGElement', 'Node', 'Event', 'KeyboardEvent', 'MouseEvent', 'getComputedStyle']) {
    Object.defineProperty(globalThis, key, { value: key === 'window' ? window : window[key], configurable: true, writable: true });
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.ResizeObserver = globalThis.ResizeObserver;
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  window.requestAnimationFrame = globalThis.requestAnimationFrame;
  window.cancelAnimationFrame = globalThis.cancelAnimationFrame;
  window.HTMLElement.prototype.scrollIntoView = () => {};

  // The chart boxes: trend 641 x 252, category 660 x 267 (their Figma sizes), everything else generic.
  const boxFor = (element) => {
    const card = element.closest && element.closest('section[aria-label]');
    const label = card ? card.getAttribute('aria-label') : '';
    // a test can make one chart box wider, e.g. globalThis.__boxWidth = { 'Revenue by Segment': 900 }
    const width = globalThis.__boxWidth && globalThis.__boxWidth[label];
    if (width) return { width, height: label === 'Monthly Sales Trend' ? 252 : 267 };
    if (label === 'Monthly Sales Trend') return { width: 641, height: 252 };
    if (label === 'Revenue by Category' || label === 'Regional Performance' || label === 'Revenue by Segment') return { width: 660, height: 267 };
    return { width: 1000, height: 100 };
  };
  const define = (proto, name, getter) => Object.defineProperty(proto, name, { configurable: true, get() { return getter(this); } });
  define(window.HTMLElement.prototype, 'clientWidth', (el) => boxFor(el).width);
  define(window.HTMLElement.prototype, 'clientHeight', (el) => boxFor(el).height);
  define(window.HTMLElement.prototype, 'offsetWidth', (el) => boxFor(el).width);
  define(window.HTMLElement.prototype, 'offsetHeight', (el) => boxFor(el).height);
  window.Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
    const { width, height } = boxFor(this);
    return { x: 0, y: 0, left: 0, top: 0, right: width, bottom: height, width, height };
  };

  const win = { ...viewport };
  Object.defineProperty(window.document.documentElement, 'clientWidth', { configurable: true, get: () => win.width });
  Object.defineProperty(window.document.documentElement, 'clientHeight', { configurable: true, get: () => win.height });
  return { window, viewport: win };
}
