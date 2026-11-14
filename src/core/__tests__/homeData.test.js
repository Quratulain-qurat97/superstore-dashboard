// Cross-checks buildHomeData against (a) the saved contract sample and (b) a deliberately
// simple brute-force calculation, across every dropdown combination.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { rows } from './helpers/loadRows.js';
import { buildHomeData, monthsInPeriod, REGIONS, CATEGORIES, SEGMENTS, YEARS } from '../index.js';

const here = dirname(fileURLToPath(import.meta.url));
const contractSample = JSON.parse(readFileSync(resolve(here, 'fixtures/contract-sample.json'), 'utf8'));
const none = { region: null, category: null, segment: null, year: null, month: null };

// ---- the simplest possible independent calculation ---------------------------------------
function oracle(f) {
  let sales = 0, profit = 0;
  const orders = new Set(), customers = new Set();
  let count = 0;
  for (const r of rows) {
    if (f.region && r.region !== f.region) continue;
    if (f.category && r.category !== f.category) continue;
    if (f.segment && r.segment !== f.segment) continue;
    if (f.year && !r.orderDate.startsWith(String(f.year))) continue;
    if (f.month && !r.orderDate.startsWith(f.month)) continue;
    sales += r.sales; profit += r.profit; orders.add(r.orderId); customers.add(r.customerId); count++;
  }
  return { sales, profit, orders: orders.size, customers: customers.size, count };
}
const near = (a, b) => Math.abs(a - b) < 1e-6;

test('unfiltered output equals the saved contract sample (kpis, trend, categories, regions, segments)', () => {
  const home = buildHomeData(rows, none);
  assert.deepEqual(home.kpis, contractSample.kpis);
  assert.deepEqual(home.monthlyTrend, contractSample.monthlyTrend);
  assert.deepEqual(home.categories, contractSample.categories);
  assert.deepEqual(home.regions, contractSample.regions);
  assert.deepEqual(home.segments, contractSample.segments);
  assert.deepEqual({ ...home.query, month: undefined }, { ...contractSample.query, month: undefined });
});

test('all 400 dropdown combinations: KPIs and every chart agree with the brute-force calculation', () => {
  let combos = 0;
  for (const region of [null, ...REGIONS])
    for (const category of [null, ...CATEGORIES])
      for (const segment of [null, ...SEGMENTS])
        for (const year of [null, ...YEARS]) {
          combos++;
          const f = { region, category, segment, year, month: null };
          const home = buildHomeData(rows, f);
          const all = oracle(f);
          assert.ok(near(home.kpis.totalSales, all.sales), `sales ${JSON.stringify(f)}`);
          assert.ok(near(home.kpis.totalProfit, all.profit), `profit ${JSON.stringify(f)}`);
          assert.equal(home.kpis.orderCount, all.orders);
          assert.equal(home.kpis.customerCount, all.customers);
          assert.equal(home.kpis.rowCount, all.count);
          // trend ignores nothing except month, so it sums to the KPI sales when month is null
          assert.ok(near(home.monthlyTrend.reduce((t, m) => t + m.sales, 0), all.sales));
          // each breakdown chart sums to the slice that ignores its OWN dimension
          assert.ok(near(home.regions.reduce((t, x) => t + x.sales, 0), oracle({ ...f, region: null }).sales));
          assert.ok(near(home.categories.reduce((t, x) => t + x.sales, 0), oracle({ ...f, category: null }).sales));
          assert.ok(near(home.segments.reduce((t, x) => t + x.sales, 0), oracle({ ...f, segment: null }).sales));
          // profit is summed from rows, never from already-aggregated values
          assert.ok(near(home.regions.reduce((t, x) => t + x.profit, 0), oracle({ ...f, region: null }).profit));
        }
  assert.equal(combos, 400);
});

test('selecting a region keeps all four regions in the Regional chart (highlight, not filter)', () => {
  const home = buildHomeData(rows, { ...none, region: 'Central' });
  assert.deepEqual(home.regions.map((r) => r.region).sort(), [...REGIONS].sort());
  assert.ok(near(home.kpis.totalSales, oracle({ ...none, region: 'Central' }).sales));
});

test('trend covers 48 months for All Years and 12 for a single year', () => {
  assert.equal(buildHomeData(rows, none).monthlyTrend.length, 48);
  assert.equal(buildHomeData(rows, { ...none, year: 2016 }).monthlyTrend.length, 12);
  assert.deepEqual(monthsInPeriod(null)[0], '2014-01');
  assert.deepEqual(monthsInPeriod(null).at(-1), '2017-12');
});

test('trend months are chronological, and sales of 0 appear exactly where there are no transactions', () => {
  for (const f of [none, { ...none, region: 'South', category: 'Furniture', segment: 'Home Office' }, { ...none, year: 2014, region: 'South', segment: 'Home Office', category: 'Technology' }]) {
    const trend = buildHomeData(rows, f).monthlyTrend;
    const months = trend.map((m) => m.month);
    assert.deepEqual(months, [...months].sort());
    for (const m of trend) assert.equal(m.sales === 0, oracle({ ...f, year: null, month: m.month }).count === 0, `${m.month}`);
  }
});

test('empty results are handled: zero KPIs, null margin, no NaN', () => {
  // find a real single-month + dropdown combination with no transactions
  let empty = null;
  outer: for (const y of YEARS) for (let m = 1; m <= 12; m++) for (const region of REGIONS) for (const segment of SEGMENTS) for (const category of CATEGORIES) {
    const f = { region, segment, category, year: y, month: `${y}-${String(m).padStart(2, '0')}` };
    if (oracle(f).count === 0) { empty = f; break outer; }
  }
  assert.ok(empty, 'the data contains at least one empty selection');
  const home = buildHomeData(rows, empty);
  assert.equal(home.kpis.totalSales, 0);
  assert.equal(home.kpis.totalProfit, 0);
  assert.equal(home.kpis.orderCount, 0);
  assert.equal(home.kpis.customerCount, 0);
  assert.equal(home.kpis.profitMargin, null);
  assert.ok(!JSON.stringify(home).includes('null,null,null,NaN') && !/NaN|Infinity/.test(JSON.stringify(home, (k, v) => (typeof v === 'number' && !Number.isFinite(v) ? 'NaN' : v))));
});

test('performance: one full rebuild is fast enough for instant filtering', () => {
  const runs = 40;
  const start = performance.now();
  for (let i = 0; i < runs; i++) buildHomeData(rows, { ...none, region: REGIONS[i % 4], year: YEARS[i % 4] });
  const average = (performance.now() - start) / runs;
  console.log(`      average buildHomeData time: ${average.toFixed(1)} ms over ${runs} runs`);
  assert.ok(average < 100);
});
