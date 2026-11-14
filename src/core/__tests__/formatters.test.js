import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatInteger, formatCurrency, formatCompactCurrency, formatPercent, percentOf, formatMonthLong, formatMonthShort,
} from '../index.js';

test('compact currency', () => {
  assert.equal(formatCompactCurrency(2297200.86), '$2.30M');
  assert.equal(formatCompactCurrency(286397.02), '$286.4K');
  assert.equal(formatCompactCurrency(412.4), '$412');
  assert.equal(formatCompactCurrency(0), '$0');
  assert.equal(formatCompactCurrency(-17725.48), '-$17.7K');
  assert.equal(formatCompactCurrency(999999), '$1.00M'); // promotes instead of showing "$1000.0K"
  assert.equal(formatCompactCurrency(999.6), '$1.0K');
  assert.equal(formatCompactCurrency(-0.2), '$0'); // no "-$0"
  assert.equal(formatCompactCurrency(null), '—');
});

test('exact currency and integers', () => {
  assert.equal(formatCurrency(2297200.86), '$2,297,200.86');
  assert.equal(formatCurrency(-17725.48), '-$17,725.48');
  assert.equal(formatCurrency(0), '$0.00');
  assert.equal(formatCurrency(-0.001), '$0.00');
  assert.equal(formatInteger(5009), '5,009');
  assert.equal(formatInteger(793), '793');
  assert.equal(formatInteger(1234567), '1,234,567');
});

test('percent, share and month labels', () => {
  assert.equal(formatPercent(12.4678), '12.5%');
  assert.equal(formatPercent(-8.5608, 2), '-8.56%');
  assert.equal(formatPercent(null), '—');
  assert.equal(percentOf(25, 100), 25);
  assert.equal(percentOf(5, 0), null);
  assert.equal(formatMonthLong('2016-03'), 'March 2016');
  assert.equal(formatMonthShort('2016-03'), 'Mar 2016');
  assert.equal(formatMonthShort('2017-12'), 'Dec 2017');
});

import { rows } from './helpers/loadRows.js';

test('money rounds half away from zero on its exact value, like MySQL ROUND (not floating-point toFixed)', () => {
  assert.equal(formatCurrency(1161401.345), '$1,161,401.35');           // toFixed(2) gives .34 for the float
  assert.equal(formatCurrency(1161401.3449999999), '$1,161,401.35');    // float noise around an exact half-cent
  assert.equal(formatCurrency(391721.905), '$391,721.91');
  assert.equal(formatCurrency(2.675), '$2.68');                         // toFixed(2) gives 2.67
  assert.equal(formatCurrency(1.005), '$1.01');                         // toFixed(2) gives 1.00
  assert.equal(formatCurrency(-2.675), '-$2.68');
  assert.equal(formatCurrency(0.0049), '$0.00');
  assert.equal(formatCurrency(-0.004), '$0.00');                        // no "-$0.00"
  assert.equal(formatCurrency(0.0050), '$0.01');
  assert.equal(formatCurrency(1234.5, 0), '$1,235');
  assert.equal(formatCurrency(0.12345678), '$0.12');                    // not a money amount: ordinary rounding
});

test('displayed sums from the real data use exact rounding, including the two half-cent cases', () => {
  const sum = (filter, key = 'sales') => rows.filter(filter).reduce((t, r) => t + r[key], 0);
  assert.equal(formatCurrency(sum((r) => r.segment === 'Consumer')), '$1,161,401.35');   // raw 1,161,401.3450
  assert.equal(formatCurrency(sum((r) => r.region === 'South')), '$391,721.91');         // raw 391,721.9050
  assert.equal(formatCurrency(sum((r) => r.segment === 'Corporate')), '$706,146.37');
  assert.equal(formatCurrency(sum(() => true)), '$2,297,200.86');
  assert.equal(formatCurrency(sum(() => true, 'profit')), '$286,397.02');
  assert.equal(formatCurrency(sum((r) => r.category === 'Technology')), '$836,154.03');
});
