import test from 'node:test';
import assert from 'node:assert/strict';
import { rows } from './helpers/loadRows.js';
import {
  buildHomeData, buildTrendSeries, resolveChartClick, niceAxis,
  formatAxisCurrency, formatSignedCurrency, formatSignedPercent, REGIONS, YEARS,
} from '../index.js';

const none = { region: null, category: null, segment: null, year: null, month: null };
const near = (a, b) => Math.abs(a - b) < 1e-6;

test('niceAxis: round maximum that always contains the data', () => {
  assert.deepEqual(niceAxis(118448), { step: 50000, max: 200000, ticks: [0, 50000, 100000, 150000, 200000] });
  assert.deepEqual(niceAxis(200), { step: 50, max: 200, ticks: [0, 50, 100, 150, 200] });
  assert.deepEqual(niceAxis(86000).ticks, [0, 25000, 50000, 75000, 100000]);
  assert.deepEqual(niceAxis(7).ticks, [0, 2, 4, 6, 8]);
  for (const v of [0.4, 1, 3.3, 99, 1234, 50001, 118448.2, 2297200.86, 9e9]) {
    const axis = niceAxis(v);
    assert.ok(axis.max >= v, `max ${axis.max} must contain ${v}`);
    assert.equal(axis.ticks.length, 5);
    assert.equal(axis.ticks[0], 0);
    assert.equal(axis.ticks[4], axis.max);
  }
});

test('niceAxis: nothing to plot still gives a usable axis', () => {
  assert.deepEqual(niceAxis(0).ticks, [0, 1, 2, 3, 4]);
  assert.deepEqual(niceAxis(NaN).ticks, [0, 1, 2, 3, 4]);
});

test('series for all years: 48 points, total = the Total Sales KPI, labels every 3rd month', () => {
  const home = buildHomeData(rows, none);
  const series = buildTrendSeries(home.monthlyTrend);
  assert.equal(series.points.length, 48);
  assert.equal(series.labelStep, 3);
  assert.ok(near(series.total, home.kpis.totalSales));
  assert.ok(series.points.every((p) => p.hasData && p.sales > 0));
  assert.ok(series.axis.max >= series.maxSales);
  assert.deepEqual(series.points.slice(0, 2).map((p) => p.month), ['2014-01', '2014-02']);
});

test('series for one year: 12 points, labelled every month', () => {
  const series = buildTrendSeries(buildHomeData(rows, { ...none, year: 2016 }).monthlyTrend);
  assert.equal(series.points.length, 12);
  assert.equal(series.labelStep, 1);
});

test('first month has no comparison; later months compare with the previous month', () => {
  const series = buildTrendSeries(buildHomeData(rows, none).monthlyTrend);
  assert.equal(series.points[0].momChange, null);
  assert.equal(series.points[0].momPercent, null);
  const [a, b] = series.points.slice(1, 3);
  assert.ok(near(b.momChange, b.sales - a.sales));
  assert.ok(near(b.momPercent, ((b.sales - a.sales) / a.sales) * 100));
});

test('months with no transactions become gaps (null), never made-up zeros, and have no comparison', () => {
  let found = null;
  outer: for (const region of REGIONS) for (const y of YEARS) {
    const f = { ...none, region, segment: 'Home Office', category: 'Technology', year: y };
    const series = buildTrendSeries(buildHomeData(rows, f).monthlyTrend);
    if (series.points.some((p) => !p.hasData)) { found = series; break outer; }
  }
  assert.ok(found, 'the data contains slices with empty months');
  for (const p of found.points) {
    if (!p.hasData) {
      assert.equal(p.sales, null);
      assert.equal(p.momChange, null);
    }
  }
  // the month right after a gap has no percentage change (its previous month had no sales)
  found.points.forEach((p, i) => { if (i > 0 && !found.points[i - 1].hasData) assert.equal(p.momPercent, null); });
});

test('a slice with no data at all: no total, no points with sales', () => {
  const series = buildTrendSeries(buildHomeData(rows, { ...none, year: 2015 }).monthlyTrend.map((m) => ({ ...m, sales: 0, momChange: 0 })));
  assert.equal(series.hasAnyData, false);
  assert.equal(series.total, 0);
  assert.deepEqual(series.axis.ticks, [0, 1, 2, 3, 4]);
});

test('click rules: a month with data is selected; anything else clears', () => {
  const points = buildTrendSeries(buildHomeData(rows, none).monthlyTrend).points;
  assert.deepEqual(resolveChartClick({ isTooltipActive: true, activeIndex: '5' }, points), { kind: 'select', month: points[5].month });
  assert.deepEqual(resolveChartClick({ isTooltipActive: true, activeIndex: 5 }, points), { kind: 'select', month: points[5].month });
  assert.deepEqual(resolveChartClick({ isTooltipActive: false, activeIndex: 5 }, points), { kind: 'clear' }); // outside the plot
  assert.deepEqual(resolveChartClick({ isTooltipActive: true, activeIndex: undefined }, points), { kind: 'clear' });
  assert.deepEqual(resolveChartClick({ isTooltipActive: true, activeIndex: 999 }, points), { kind: 'clear' });
  assert.deepEqual(resolveChartClick(undefined, points), { kind: 'clear' });
  const gap = [{ month: '2014-01', hasData: false }];
  assert.deepEqual(resolveChartClick({ isTooltipActive: true, activeIndex: 0 }, gap), { kind: 'clear' }); // a gap is empty space
});

test('axis and tooltip formatting', () => {
  assert.equal(formatAxisCurrency(0), '$0');
  assert.equal(formatAxisCurrency(50000), '$50K');
  assert.equal(formatAxisCurrency(25000), '$25K');
  assert.equal(formatAxisCurrency(2500), '$2.5K');
  assert.equal(formatAxisCurrency(1500000), '$1.5M');
  assert.equal(formatAxisCurrency(250), '$250');
  assert.equal(formatSignedCurrency(3210), '+$3,210.00');
  assert.equal(formatSignedCurrency(-1234.5), '-$1,234.50');
  assert.equal(formatSignedCurrency(0), '$0.00');
  assert.equal(formatSignedCurrency(-0.001), '$0.00');
  assert.equal(formatSignedPercent(35.94), '+35.9%');
  assert.equal(formatSignedPercent(-12.34), '-12.3%');
  assert.equal(formatSignedPercent(0), '0.0%');
  assert.equal(formatSignedPercent(null), '—');
});
