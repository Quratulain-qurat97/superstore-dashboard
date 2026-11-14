import test from 'node:test';
import assert from 'node:assert/strict';
import { rows } from './helpers/loadRows.js';
import {
  buildHomeData, buildRegionSeries, resolveRegionClick, niceAxisRange, niceAxis,
  REGIONS, CATEGORIES, SEGMENTS, YEARS, formatCurrency, formatAxisCurrency,
} from '../index.js';

const none = { region: null, category: null, segment: null, year: null, month: null };
const near = (a, b) => Math.abs(a - b) < 1e-6;

// The SQL the backend will run for this chart (kept here so the test and the future MySQL query agree):
//   SELECT Region, SUM(Sales) AS sales, SUM(Profit) AS profit, SUM(Profit) / SUM(Sales) * 100 AS margin
//   FROM sample_superstore
//   WHERE (:category IS NULL OR Category = :category)
//     AND (:segment  IS NULL OR Segment  = :segment)
//     AND (:year     IS NULL OR YEAR(order_date) = :year)
//     AND (:month    IS NULL OR DATE_FORMAT(order_date, '%Y-%m') = :month)
//   GROUP BY Region;               -- note: NO filter on Region (the chart compares all four)
function sqlRegional(f) {
  const groups = new Map();
  for (const r of rows) {
    if (f.category && r.category !== f.category) continue;
    if (f.segment && r.segment !== f.segment) continue;
    if (f.year && Number(r.orderDate.slice(0, 4)) !== f.year) continue;
    if (f.month && r.orderDate.slice(0, 7) !== f.month) continue;
    const g = groups.get(r.region) ?? { sales: 0, profit: 0 };
    g.sales += r.sales; g.profit += r.profit; groups.set(r.region, g);
  }
  return groups;
}
const seriesFor = (f) => buildRegionSeries(buildHomeData(rows, f).regions);

test('unfiltered regional Sales and Profit: the verified figures (compare with the SQL above in MySQL)', () => {
  const expected = {
    West: [725457.82, 108418.45], East: [678781.24, 91522.78], Central: [501239.89, 39706.36], South: [391721.91, 46749.43],
  };
  const { bars, totalSales, totalProfit } = seriesFor(none);
  for (const bar of bars) {
    assert.ok(Math.abs(bar.sales - expected[bar.region][0]) < 0.005, `${bar.region} sales`);
    assert.ok(Math.abs(bar.profit - expected[bar.region][1]) < 0.005, `${bar.region} profit`);
  }
  assert.ok(Math.abs(totalSales - 2297200.86) < 0.005);
  assert.ok(Math.abs(totalProfit - 286397.02) < 0.005);
});

test('bars are always West, East, Central, South, in that order', () => {
  assert.deepEqual(seriesFor(none).bars.map((b) => b.region), ['West', 'East', 'Central', 'South']);
  assert.deepEqual(seriesFor({ ...none, category: 'Furniture', year: 2014 }).bars.map((b) => b.region), REGIONS);
});

test('all 80 Category x Segment x Year combinations equal the SQL GROUP BY result, for every region', () => {
  let combos = 0;
  for (const category of [null, ...CATEGORIES]) for (const segment of [null, ...SEGMENTS]) for (const year of [null, ...YEARS]) {
    combos++;
    const sql = sqlRegional({ category, segment, year, month: null });
    for (const bar of seriesFor({ ...none, category, segment, year }).bars) {
      const expected = sql.get(bar.region);
      assert.ok(expected, `${bar.region} has sales in ${category}/${segment}/${year}`);
      assert.ok(near(bar.sales, expected.sales) && near(bar.profit, expected.profit), `${bar.region} ${category}/${segment}/${year}`);
      assert.ok(near(bar.margin, (expected.profit / expected.sales) * 100));
    }
  }
  assert.equal(combos, 4 * 4 * 5);
});

test('month selection filters regional Sales and Profit like the SQL does', () => {
  for (const month of ['2014-02', '2015-06', '2016-11', '2017-12']) {
    const sql = sqlRegional({ month });
    for (const bar of seriesFor({ ...none, month }).bars) {
      const e = sql.get(bar.region) ?? { sales: 0, profit: 0 };
      assert.ok(near(bar.sales ?? 0, e.sales) && near(bar.profit ?? 0, e.profit), `${month} ${bar.region}`);
    }
  }
});

test('the Region filter does NOT remove bars: all four stay, whatever is selected (highlight, not filter)', () => {
  const all = seriesFor(none).bars.map((b) => [b.sales, b.profit]);
  for (const region of REGIONS) assert.deepEqual(seriesFor({ ...none, region }).bars.map((b) => [b.sales, b.profit]), all);
});

test('profit is summed from the transactions, never from already-aggregated values', () => {
  for (const bar of seriesFor({ ...none, segment: 'Consumer' }).bars) {
    const brute = rows.filter((r) => r.region === bar.region && r.segment === 'Consumer').reduce((t, r) => t + r.profit, 0);
    assert.ok(near(bar.profit, brute));
  }
  // the regional profits add up to the Total Profit KPI
  const f = { ...none, category: 'Technology', year: 2016 };
  assert.ok(near(seriesFor(f).totalProfit, buildHomeData(rows, f).kpis.totalProfit));
  assert.ok(near(seriesFor(f).totalSales, buildHomeData(rows, f).kpis.totalSales));
});

test('a region + category slice with a loss shows a NEGATIVE profit bar (Central / Furniture)', () => {
  const central = seriesFor({ ...none, category: 'Furniture' }).bars.find((b) => b.region === 'Central');
  assert.ok(Math.abs(central.profit - -2871.05) < 0.005);
  assert.ok(central.sales > 0);
  assert.ok(central.margin < 0);
  const { axis } = seriesFor({ ...none, category: 'Furniture' });
  assert.ok(axis.min < 0 && axis.ticks.includes(0) && axis.min <= central.profit);
  assert.equal(formatCurrency(central.profit), '-$2,871.05');
});

test('axis without losses: $0 to $1M in $200K steps (same as the category chart)', () => {
  const { axis } = seriesFor(none);
  assert.deepEqual(axis.ticks, [0, 200000, 400000, 600000, 800000, 1000000]);
  assert.equal(axis.min, 0);
  assert.deepEqual(axis, { ...niceAxis(725457.82, 5), min: 0 });
});

test('axis range with a loss: extends below zero by whole steps, zero stays a tick', () => {
  const a = niceAxisRange(-2871.05, 700000, 5);
  assert.equal(a.step, 200000);
  assert.deepEqual(a.ticks, [-200000, 0, 200000, 400000, 600000, 800000]);
  assert.equal(a.min, -200000);
  assert.equal(a.max, 800000);
  for (const [lo, hi] of [[-1, 10], [-0.5, 3000], [-17725.48, 206965.53], [-5e6, 2e7], [-120, 120]]) {
    const r = niceAxisRange(lo, hi, 5);
    assert.ok(r.min <= lo && r.max >= hi && r.ticks.includes(0), `${lo}..${hi}`);
    assert.equal(r.ticks[0], r.min);
    assert.equal(r.ticks.at(-1), r.max);
    assert.ok(r.ticks.every((t, i) => i === 0 || Math.abs(t - r.ticks[i - 1] - r.step) < 1e-6 * r.step));
  }
  assert.equal(formatAxisCurrency(-200000), '-$200K');
});

test('a region with no transactions has no bars (null), never a made-up zero', () => {
  const series = buildRegionSeries([{ region: 'West', sales: 100, profit: -5, margin: -5 }, { region: 'South', sales: 50, profit: 10, margin: 20 }]);
  assert.deepEqual(series.bars.map((b) => b.hasData), [true, false, false, true]);
  for (const b of series.bars.filter((x) => !x.hasData)) assert.deepEqual([b.sales, b.profit, b.margin], [null, null, null]);
  assert.ok(!/NaN/.test(JSON.stringify(series)));
  assert.ok(series.axis.min < 0);
});

test('a selection with no sales at all: no bars, a usable axis, no NaN', () => {
  const series = buildRegionSeries([]);
  assert.equal(series.hasAnyData, false);
  assert.equal(series.totalSales, 0);
  assert.deepEqual(series.axis.ticks, [0, 1, 2, 3, 4, 5]);
  assert.ok(!/NaN/.test(JSON.stringify(series)));
});

test('click rules: a region column with data is selected; anything else clears', () => {
  const { bars } = seriesFor(none);
  assert.deepEqual(resolveRegionClick({ isTooltipActive: true, activeIndex: '2' }, bars), { kind: 'select', region: 'Central' });
  assert.deepEqual(resolveRegionClick({ isTooltipActive: true, activeIndex: 0 }, bars), { kind: 'select', region: 'West' });
  assert.deepEqual(resolveRegionClick({ isTooltipActive: false, activeIndex: 0 }, bars), { kind: 'clear' });
  assert.deepEqual(resolveRegionClick({ isTooltipActive: true, activeIndex: undefined }, bars), { kind: 'clear' });
  assert.deepEqual(resolveRegionClick({ isTooltipActive: true, activeIndex: 9 }, bars), { kind: 'clear' });
  assert.deepEqual(resolveRegionClick(undefined, bars), { kind: 'clear' });
  const gap = [{ region: 'West', hasData: false }];
  assert.deepEqual(resolveRegionClick({ isTooltipActive: true, activeIndex: 0 }, gap), { kind: 'clear' });
});
