// The month selection (query.month): filters KPIs and the other charts, but not the trend.
import test from 'node:test';
import assert from 'node:assert/strict';
import { rows } from './helpers/loadRows.js';
import { buildHomeData, monthsInPeriod, REGIONS } from '../index.js';

const none = { region: null, category: null, segment: null, year: null, month: null };
const near = (a, b) => Math.abs(a - b) < 1e-6;
const salesFor = (f) => rows.filter((r) => (!f.region || r.region === f.region) && (!f.category || r.category === f.category) && (!f.segment || r.segment === f.segment) && (!f.year || r.orderDate.startsWith(String(f.year))) && (!f.month || r.orderDate.startsWith(f.month))).reduce((t, r) => t + r.sales, 0);

test('month = null leaves every result unchanged (additive extension)', () => {
  const a = buildHomeData(rows, none);
  const b = buildHomeData(rows, { ...none, month: null });
  assert.deepEqual(a, b);
});

test('all 48 months: KPIs and the three breakdown charts follow the month', () => {
  for (const month of monthsInPeriod(null)) {
    const home = buildHomeData(rows, { ...none, month });
    assert.ok(near(home.kpis.totalSales, salesFor({ month })), month);
    for (const chart of ['regions', 'categories', 'segments']) {
      assert.ok(near(home[chart].reduce((t, x) => t + x.sales, 0), salesFor({ month })), `${chart} ${month}`);
    }
  }
});

test('the trend chart ignores the month selection (it keeps showing every month)', () => {
  const without = buildHomeData(rows, none).monthlyTrend;
  assert.deepEqual(buildHomeData(rows, { ...none, month: '2016-03' }).monthlyTrend, without);
  const withRegion = buildHomeData(rows, { ...none, region: 'East' }).monthlyTrend;
  assert.deepEqual(buildHomeData(rows, { ...none, region: 'East', month: '2016-03' }).monthlyTrend, withRegion);
});

test('month combines with the dropdown filters', () => {
  for (const region of REGIONS) {
    const f = { ...none, region, segment: 'Consumer', category: 'Technology', year: 2017, month: '2017-11' };
    assert.ok(near(buildHomeData(rows, f).kpis.totalSales, salesFor(f)), region);
  }
});

test('a month in a different year than the Year filter gives an empty result', () => {
  const home = buildHomeData(rows, { ...none, year: 2015, month: '2016-03' });
  assert.equal(home.kpis.rowCount, 0);
  assert.equal(home.kpis.profitMargin, null);
});
