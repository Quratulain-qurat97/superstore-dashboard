// Guards the layout numbers: the sidebar-to-content gap is wider than the Figma's, while every component
// keeps its exact Figma width at the design size.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../layout/designCanvas.js';

const here = dirname(fileURLToPath(import.meta.url));
const tokens = readFileSync(resolve(here, '../../styles/tokens.css'), 'utf8');
const token = (name) => Number(new RegExp(`${name}:\\s*(\\d+(?:\\.\\d+)?)px`).exec(tokens)[1]);

const frameWidth = token('--frame-width');
const contentLeft = token('--content-left');

test('the JavaScript design width equals the CSS design width', () => {
  assert.equal(DESIGN_WIDTH, frameWidth);
  assert.equal(DESIGN_HEIGHT, token('--frame-height'));
});

test('at the design width every component has its exact Figma size', () => {
  const content = frameWidth - contentLeft - 9;
  assert.equal(content, 1340, 'main column');
  assert.equal(frameWidth - contentLeft - 7, 1342, 'filter bar');
  assert.equal((content - 60) / 4, 320, 'KPI card');
  assert.equal((content - 20) / 2, 660, 'chart card');
  assert.equal((1342 - 170) / 4, 293, 'filter dropdown');
});

test('the gap between the sidebar (ends at x=76) and the main content was widened from 15px', () => {
  const gap = contentLeft - (21 + 55);
  assert.ok(gap > 15, `gap is ${gap}px`);
  assert.equal(gap, 35);
});

test('the right edge is unchanged: the profile badge and the content still end 9px from the edge', () => {
  assert.equal(frameWidth - (frameWidth - 405 + 396), 9);
});
