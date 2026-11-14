import test from 'node:test';
import assert from 'node:assert/strict';
import { rows } from './helpers/loadRows.js';
import {
  buildHomeData, buildCategorySeries, CATEGORIES, REGIONS, SEGMENTS, YEARS, formatCompactCurrency, formatCurrency,
} from '../index.js';

const none = { region: null, category: null, segment: null, year: null, month: null };
const near = (a, b) => Math.abs(a - b) < 1e-6;

// The SQL the backend will run for this chart (kept here so the test and the future MySQL query agree):
//   SELECT Category, SUM(Sales) AS sales
//   FROM sample_superstore
//   WHERE (:region  IS NULL OR Region  = :region)
//     AND (:segment IS NULL OR Segment = :segment)
//     AND (:year    IS NULL OR YEAR(order_date) = :year)
//     AND (:month   IS NULL OR DATE_FORMAT(order_date, '%Y-%m') = :month)
//   GROUP BY Category;            -- note: NO filter on Category (the chart compares all three)
function sqlCategoryRevenue(f) {
  const groups = new Map();
  for (const r of rows) {
    if (f.region && r.region !== f.region) continue;
    if (f.segment && r.segment !== f.segment) continue;
    if (f.year && Number(r.orderDate.slice(0, 4)) !== f.year) continue;
    if (f.month && r.orderDate.slice(0, 7) !== f.month) continue;
    groups.set(r.category, (groups.get(r.category) ?? 0) + r.sales);
  }
  return groups;
}

const seriesFor = (f) => buildCategorySeries(buildHomeData(rows, f).categories);

test('unfiltered category revenue: the verified figures (compare with the SQL above in MySQL)', () => {
  const { bars, total } = seriesFor(none);
  const byName = Object.fromEntries(bars.map((b) => [b.category, b.sales]));
  assert.ok(Math.abs(byName.Furniture - 741999.80) < 0.005);
  assert.ok(Math.abs(byName['Office Supplies'] - 719047.03) < 0.005);
  assert.ok(Math.abs(byName.Technology - 836154.03) < 0.005);
  assert.ok(Math.abs(total - 2297200.86) < 0.005);
});

test('bars are always Furniture, Office Supplies, Technology, in that order', () => {
  assert.deepEqual(seriesFor(none).bars.map((b) => b.category), ['Furniture', 'Office Supplies', 'Technology']);
  assert.deepEqual(seriesFor({ ...none, region: 'South', year: 2014 }).bars.map((b) => b.category), CATEGORIES);
});

test('all 240 Region x Segment x Year combinations equal the SQL GROUP BY result', () => {
  let combos = 0;
  for (const region of [null, ...REGIONS]) for (const segment of [null, ...SEGMENTS]) for (const year of [null, ...YEARS]) {
    combos++;
    const sql = sqlCategoryRevenue({ region, segment, year, month: null });
    const { bars } = seriesFor({ ...none, region, segment, year });
    for (const bar of bars) {
      if (sql.has(bar.category)) assert.ok(near(bar.sales, sql.get(bar.category)), `${bar.category} ${region}/${segment}/${year}`);
      else assert.equal(bar.sales, null);
    }
  }
  assert.equal(combos, 5 * 4 * 5);
});

test('month selection filters the category revenue like the SQL does', () => {
  for (const month of ['2014-01', '2015-06', '2016-11', '2017-12']) {
    const sql = sqlCategoryRevenue({ month });
    for (const bar of seriesFor({ ...none, month }).bars) assert.ok(near(bar.sales ?? 0, sql.get(bar.category) ?? 0), `${month} ${bar.category}`);
  }
});

test('the Category filter does NOT remove bars: all three stay, whatever is selected (highlight, not filter)', () => {
  const all = seriesFor(none).bars.map((b) => b.sales);
  for (const category of CATEGORIES) {
    assert.deepEqual(seriesFor({ ...none, category }).bars.map((b) => b.sales), all);
  }
});

test('revenue is not profit: bars are SUM(Sales) and differ from SUM(Profit)', () => {
  const furniture = rows.filter((r) => r.category === 'Furniture');
  const sales = furniture.reduce((t, r) => t + r.sales, 0);
  const profit = furniture.reduce((t, r) => t + r.profit, 0);
  assert.ok(near(seriesFor(none).bars[0].sales, sales));
  assert.ok(Math.abs(seriesFor(none).bars[0].sales - profit) > 1000);
});

test('the chart total matches the Total Sales KPI whenever no Category is chosen; a chosen category equals its own bar', () => {
  const f = { ...none, region: 'West', year: 2016 };
  const series = seriesFor(f);
  assert.ok(near(series.total, buildHomeData(rows, f).kpis.totalSales));
  for (const bar of series.bars) {
    assert.ok(near(buildHomeData(rows, { ...f, category: bar.category }).kpis.totalSales, bar.sales));
  }
});

test('shares add up to 100% and match each bar', () => {
  const { bars } = seriesFor({ ...none, segment: 'Corporate' });
  assert.ok(Math.abs(bars.reduce((t, b) => t + b.share, 0) - 100) < 1e-9);
  assert.ok(Math.abs(seriesFor(none).bars[2].share - 36.4) < 0.05);
});

test('axis for the unfiltered data is $0 to $1M in $200K steps, like the Figma chart', () => {
  const { axis } = seriesFor(none);
  assert.deepEqual(axis.ticks, [0, 200000, 400000, 600000, 800000, 1000000]);
  assert.equal(axis.max, 1000000);
  assert.equal(seriesFor(none).hasAnyData, true);
});

test('callout and tooltip text come from the numbers', () => {
  const { total, bars } = seriesFor(none);
  assert.equal(formatCompactCurrency(total), '$2.30M');
  assert.equal(formatCurrency(bars[2].sales), '$836,154.03');
});

test('a category with no transactions has no bar (null), never a made-up zero', () => {
  let found = null;
  outer: for (const region of REGIONS) for (const segment of SEGMENTS) for (const year of YEARS) for (let m = 1; m <= 12; m++) {
    const month = `${year}-${String(m).padStart(2, '0')}`;
    const series = seriesFor({ ...none, region, segment, year, month });
    if (series.bars.some((b) => !b.hasData) && series.hasAnyData) { found = series; break outer; }
  }
  assert.ok(found, 'the data contains slices where a category has no sales');
  for (const b of found.bars) {
    if (!b.hasData) { assert.equal(b.sales, null); assert.equal(b.share, null); }
    else assert.ok(b.sales > 0);
  }
  assert.equal(Number.isFinite(found.total) && Number.isFinite(found.axis.max), true);
});

test('a slice with no sales at all: no bars with data, a usable axis, no NaN', () => {
  const series = buildCategorySeries([]);
  assert.equal(series.hasAnyData, false);
  assert.equal(series.total, 0);
  assert.deepEqual(series.bars.map((b) => b.sales), [null, null, null]);
  assert.deepEqual(series.axis.ticks, [0, 1, 2, 3, 4, 5]);
  assert.ok(!/NaN/.test(JSON.stringify(series)));
});
