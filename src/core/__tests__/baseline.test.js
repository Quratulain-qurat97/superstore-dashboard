// The verified baseline figures. These are VALIDATION values, not dashboard values:
// the dashboard always calculates them from the transaction data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { rows, meta } from './helpers/loadRows.js';
import { buildHomeData, getEffectiveFilters, initialFilterState } from '../index.js';

const close = (actual, expected, tolerance = 0.005) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `expected ${expected}, got ${actual}`);

test('unfiltered baseline matches the verified figures', () => {
  const { kpis } = buildHomeData(rows, getEffectiveFilters(initialFilterState()));
  close(kpis.totalSales, 2297200.86);
  close(kpis.totalProfit, 286397.02);
  assert.equal(kpis.orderCount, 5009);
  assert.equal(kpis.customerCount, 793);
  assert.equal(kpis.rowCount, 9994);
  assert.equal(meta.rowCount, 9994);
});

test('orders are distinct Order IDs, not rows', () => {
  const { kpis } = buildHomeData(rows, getEffectiveFilters(initialFilterState()));
  assert.ok(kpis.orderCount < kpis.rowCount);
});

test('profit margin is SUM(profit)/SUM(sales), not an average of row margins', () => {
  const { kpis } = buildHomeData(rows, getEffectiveFilters(initialFilterState()));
  close(kpis.profitMargin, (kpis.totalProfit / kpis.totalSales) * 100, 1e-9);
  const rowMarginAverage = rows.reduce((t, r) => t + (r.profit / r.sales) * 100, 0) / rows.length;
  // Measured on this data: 12.47% (correct) vs 12.03% (average of row margins), a 0.44-point gap.
  assert.ok(Math.abs(kpis.profitMargin - rowMarginAverage) > 0.1, 'the two methods give different answers here');
});
