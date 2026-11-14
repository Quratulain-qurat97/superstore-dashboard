import test from 'node:test';
import assert from 'node:assert/strict';
import { fitScale } from '../index.js';

test('a window as wide as the design, or wider, shows it at exactly 100%', () => {
  assert.equal(fitScale(1440, 1440), 1);
  assert.equal(fitScale(1920, 1440), 1);
  assert.equal(fitScale(5000, 1440), 1);
});

test('a narrower window scales the design down proportionally', () => {
  assert.equal(fitScale(720, 1440), 0.5);
  assert.equal(fitScale(1080, 1440), 0.75);
  assert.ok(Math.abs(fitScale(1280, 1440) - 0.8889) < 0.0001);
});

test('the scaled design is never wider than the window (no 1px scrollbar from rounding)', () => {
  // Tolerance 1e-9 px: floating-point noise (e.g. 1440 x 0.275 = 396.00000000000006) is far below
  // the 1/64 px a browser lays out with, so it cannot cause a scrollbar.
  for (let width = 200; width < 1440; width += 7) {
    assert.ok(1440 * fitScale(width, 1440) <= width + 1e-9, `width ${width}`);
    assert.ok(fitScale(width, 1440) <= 1);
  }
});

test('unusable widths fall back to 100%', () => {
  for (const bad of [0, -5, NaN, undefined, null, Infinity]) assert.equal(fitScale(bad, 1440), 1);
  assert.equal(fitScale(1000, 0), 1);
});

import { fitScaleToBox } from '../index.js';

test('fitScaleToBox: fits both directions, never above 100%', () => {
  assert.equal(fitScaleToBox(1440, 1024, 1440, 1024), 1);
  assert.equal(fitScaleToBox(2560, 1440, 1440, 1024), 1);
  // wide but short window: the height decides
  assert.equal(fitScaleToBox(1920, 512, 1440, 1024), 0.5);
  // tall but narrow window: the width decides
  assert.equal(fitScaleToBox(720, 1200, 1440, 1024), 0.5);
  // both too small: the smaller scale wins, and the scaled design fits in both directions
  const s = fitScaleToBox(1280, 650, 1440, 1024);
  assert.ok(1440 * s <= 1280 + 1e-9 && 1024 * s <= 650 + 1e-9);
});

test('fitScaleToBox: an unusable height is ignored (width alone decides)', () => {
  assert.equal(fitScaleToBox(720, 0, 1440, 1024), 0.5);
  assert.equal(fitScaleToBox(720, NaN, 1440, 1024), 0.5);
});

import { layoutForWindow } from '../index.js';

test('layoutForWindow: at or below the design size the canvas keeps the design width', () => {
  assert.deepEqual(layoutForWindow(1440, 1024, 1440, 1024), { scale: 1, canvasWidth: 1440 });
  const narrow = layoutForWindow(1280, 1024, 1440, 1024);
  assert.ok(narrow.scale < 1 && narrow.canvasWidth >= 1440 && narrow.canvasWidth < 1440.5);
  assert.ok(narrow.canvasWidth * narrow.scale <= 1280 + 1e-9);
});

test('layoutForWindow: a wider window makes the canvas wider (content fills the space)', () => {
  assert.deepEqual(layoutForWindow(1920, 1080, 1440, 1024), { scale: 1, canvasWidth: 1920 });
  assert.deepEqual(layoutForWindow(2560, 1440, 1440, 1024), { scale: 1, canvasWidth: 2560 });
});

test('layoutForWindow: a wide but short window scales down, and the canvas widens so it still fills the width', () => {
  const { scale, canvasWidth } = layoutForWindow(1920, 700, 1440, 1024);
  assert.ok(scale < 1);
  assert.ok(canvasWidth > 1920);
  assert.ok(canvasWidth * scale <= 1920 + 1e-9);
  assert.ok(canvasWidth * scale > 1919);
  assert.ok(1024 * scale <= 700 + 1e-9);
});

test('layoutForWindow: unusable sizes fall back to the design', () => {
  assert.deepEqual(layoutForWindow(0, 0, 1440, 1024), { scale: 1, canvasWidth: 1440 });
  assert.deepEqual(layoutForWindow(NaN, NaN, 1440, 1024), { scale: 1, canvasWidth: 1440 });
});
