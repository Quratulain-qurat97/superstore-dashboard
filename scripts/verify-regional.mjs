
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { buildRegionalData } from '../src/core/index.js';

// Load the exact dataset used by the dashboard.
const { transactions: rows } = JSON.parse(
  readFileSync(
    new URL('../data/superstore.json', import.meta.url),
    'utf8',
  ),
);

const result = buildRegionalData(rows);

const close = (actual, expected, tolerance = 0.01) =>
  Math.abs(actual - expected) <= tolerance;

function check(label, actual, expected) {
  const passed =
    typeof actual === 'number' &&
    close(actual, expected);

  console.log(
    `${passed ? 'PASS' : 'FAIL'}  ${label}:`,
    actual,
    `(expected ${expected})`,
  );

  assert.ok(passed, `${label} does not match the expected value.`);
}

console.log('\nREGIONAL ANALYSIS — BASELINE VALIDATION\n');

// Dataset coverage
check('Distinct states', result.totalStateCount, 49);

// KPIs
check('Loss-making states', result.kpis.lossMakingStateCount, 10);
check('Total state losses', result.kpis.totalStateLosses, 98246.74);
check('Overall loss impact', result.kpis.lossImpact, 25.54);
check('Worst state profit', result.kpis.worstStateProfit, -25729.36);

// Worst-performing state
assert.equal(result.kpis.worstStateName, 'Texas');
console.log('PASS  Worst-performing state: Texas');

// Regional loss impact
const expectedRegionalImpact = {
  Central: 49.12,
  East: 26.22,
  South: 25.77,
  West: 9.32,
};

for (const [region, expected] of Object.entries(expectedRegionalImpact)) {
  const actual = result.regions.find(
    (item) => item.region === region,
  );

  assert.ok(actual, `Missing region: ${region}`);

  check(`${region} loss impact`, actual.lossImpact, expected);
}

// Loss-making state count by region
const expectedLossCounts = {
  Central: 2,
  East: 2,
  South: 3,
  West: 3,
};

for (const [region, expected] of Object.entries(expectedLossCounts)) {
  const actual = result.regions.find(
    (item) => item.region === region,
  );

  check(`${region} loss-making states`, actual.lossMakingStateCount, expected);
}

// Check state-level results.
const texas = result.states.find(
  (state) => state.state === 'Texas',
);

check('Texas sales', texas.sales, 170188.05);
check('Texas profit', texas.profit, -25729.36);
check('Texas margin', texas.margin, -15.12);

// Check total profit reconciles between states and regions.
check(
  'State profits reconcile to total profit',
  result.totalProfit,
  result.regions.reduce((total, region) => total + region.profit, 0),
);

check(
  'State sales reconcile to total sales',
  result.totalSales,
  result.regions.reduce((total, region) => total + region.sales, 0),
);

// Check that no calculated values contain NaN or Infinity.
function containsInvalidNumber(value) {
  if (typeof value === 'number') {
    return !Number.isFinite(value);
  }

  if (Array.isArray(value)) {
    return value.some(containsInvalidNumber);
  }

  if (value && typeof value === 'object') {
    return Object.values(value).some(containsInvalidNumber);
  }

  return false;
}

assert.equal(
  containsInvalidNumber(result),
  false,
  'Regional data contains NaN or Infinity.',
);

console.log('\nPASS  No NaN or Infinity values.');
console.log('\nAll Regional Analysis baseline checks passed.');
