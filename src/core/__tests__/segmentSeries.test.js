import test from 'node:test';
import assert from 'node:assert/strict';
import { rows } from './helpers/loadRows.js';
import {
  buildHomeData, buildSegmentSeries, donutLabelPoints, SEGMENTS, REGIONS, CATEGORIES, YEARS,
  formatCurrency, formatPercent, formatCompactCurrency,
} from '../index.js';

const none = { region: null, category: null, segment: null, year: null, month: null };
const near = (a, b) => Math.abs(a - b) < 1e-6;

// The SQL the backend will run for this chart (kept here so the test and the future MySQL query agree):
//   SELECT Segment, SUM(Sales) AS sales
//   FROM sample_superstore
//   WHERE (:region   IS NULL OR Region   = :region)
//     AND (:category IS NULL OR Category = :category)
//     AND (:year     IS NULL OR YEAR(order_date) = :year)
//     AND (:month    IS NULL OR DATE_FORMAT(order_date, '%Y-%m') = :month)
//   GROUP BY Segment;              -- note: NO filter on Segment (the chart compares all three)
function sqlSegments(f) {
  const groups = new Map();
  for (const r of rows) {
    if (f.region && r.region !== f.region) continue;
    if (f.category && r.category !== f.category) continue;
    if (f.year && Number(r.orderDate.slice(0, 4)) !== f.year) continue;
    if (f.month && r.orderDate.slice(0, 7) !== f.month) continue;
    groups.set(r.segment, (groups.get(r.segment) ?? 0) + r.sales);
  }
  return groups;
}
const seriesFor = (f) => buildSegmentSeries(buildHomeData(rows, f).segments);

test('unfiltered segment sales: the verified figures (compare with the SQL above in MySQL)', () => {
  const { segments, total } = seriesFor(none);
  const byName = Object.fromEntries(segments.map((s) => [s.segment, s]));
  // exact values (the data has 4 decimals); Consumer is a half-cent: 1,161,401.3450 displays as .35
  assert.ok(Math.abs(byName.Consumer.sales - 1161401.345) < 1e-4);
  assert.ok(Math.abs(byName.Corporate.sales - 706146.3668) < 1e-4);
  assert.ok(Math.abs(byName['Home Office'].sales - 429653.1485) < 1e-4);
  assert.deepEqual(segments.map((s) => formatCurrency(s.sales)), ['$1,161,401.35', '$706,146.37', '$429,653.15']);
  assert.ok(Math.abs(total - 2297200.86) < 0.005);
  assert.equal(formatPercent(byName.Consumer.share, 2), '50.56%');
  assert.equal(formatPercent(byName.Corporate.share, 2), '30.74%');
  assert.equal(formatPercent(byName['Home Office'].share, 2), '18.70%');
});

test('segments are always Consumer, Corporate, Home Office, in that order', () => {
  assert.deepEqual(seriesFor(none).slices.map((s) => s.segment), ['Consumer', 'Corporate', 'Home Office']);
  assert.deepEqual(seriesFor({ ...none, region: 'South', year: 2014 }).segments.map((s) => s.segment), SEGMENTS);
});

test('all 100 Region x Category x Year combinations equal the SQL GROUP BY result', () => {
  let combos = 0;
  for (const region of [null, ...REGIONS]) for (const category of [null, ...CATEGORIES]) for (const year of [null, ...YEARS]) {
    combos++;
    const sql = sqlSegments({ region, category, year, month: null });
    const { segments, total } = seriesFor({ ...none, region, category, year });
    for (const s of segments) {
      if (sql.has(s.segment)) assert.ok(near(s.sales, sql.get(s.segment)), `${s.segment} ${region}/${category}/${year}`);
      else assert.equal(s.sales, null);
    }
    assert.ok(near(total, [...sql.values()].reduce((t, v) => t + v, 0)));
  }
  assert.equal(combos, 5 * 4 * 5);
});

test('month selection filters segment sales like the SQL does', () => {
  for (const month of ['2014-02', '2015-06', '2016-11', '2017-12']) {
    const sql = sqlSegments({ month });
    for (const s of seriesFor({ ...none, month }).segments) assert.ok(near(s.sales ?? 0, sql.get(s.segment) ?? 0), `${month} ${s.segment}`);
  }
});

test('the Segment filter does NOT remove slices: all three stay, whatever is selected (highlight, not filter)', () => {
  const all = seriesFor(none).segments.map((s) => s.sales);
  for (const segment of SEGMENTS) assert.deepEqual(seriesFor({ ...none, segment }).segments.map((s) => s.sales), all);
});

test('the chart total matches the Total Sales KPI when no Segment is chosen; a chosen segment equals its own slice', () => {
  const f = { ...none, region: 'East', year: 2015 };
  const series = seriesFor(f);
  assert.ok(near(series.total, buildHomeData(rows, f).kpis.totalSales));
  for (const s of series.segments) assert.ok(near(buildHomeData(rows, { ...f, segment: s.segment }).kpis.totalSales, s.sales));
});

test('shares add up to 100% and sales (revenue) is not profit', () => {
  const series = seriesFor({ ...none, category: 'Technology' });
  assert.ok(Math.abs(series.slices.reduce((t, s) => t + s.share, 0) - 100) < 1e-9);
  const consumerProfit = rows.filter((r) => r.segment === 'Consumer').reduce((t, r) => t + r.profit, 0);
  assert.ok(Math.abs(seriesFor(none).slices[0].sales - consumerProfit) > 100000);
});

test('tooltip and label text come from the numbers', () => {
  const [consumer] = seriesFor(none).slices;
  assert.equal(formatCurrency(consumer.sales), '$1,161,401.35');
  assert.equal(formatCompactCurrency(consumer.sales), '$1.16M');
});

test('a segment with no transactions has no slice (null), never a made-up zero', () => {
  const series = buildSegmentSeries([{ segment: 'Consumer', sales: 300 }, { segment: 'Home Office', sales: 100 }]);
  assert.deepEqual(series.segments.map((s) => s.hasData), [true, false, true]);
  assert.deepEqual(series.slices.map((s) => s.segment), ['Consumer', 'Home Office']);
  assert.equal(series.segments[1].sales, null);
  assert.equal(series.segments[1].share, null);
  assert.ok(Math.abs(series.slices[0].share - 75) < 1e-9);
  assert.ok(!/NaN/.test(JSON.stringify(series)));
});

test('a selection with a single segment is a full ring (100%)', () => {
  const series = buildSegmentSeries([{ segment: 'Corporate', sales: 42 }]);
  assert.deepEqual(series.slices, [{ segment: 'Corporate', sales: 42, share: 100 }]);
});

test('a selection with no sales at all: no slices, no NaN', () => {
  const series = buildSegmentSeries([]);
  assert.equal(series.hasAnyData, false);
  assert.equal(series.total, 0);
  assert.deepEqual(series.slices, []);
  assert.deepEqual(series.segments.map((s) => s.sales), [null, null, null]);
  assert.ok(!/NaN/.test(JSON.stringify(series)));
});

// ---- label placement ---------------------------------------------------------------------------
const G = { cx: 339.16, cy: 131.88, outerRadius: 107.5, minY: 10, maxY: 257 };

test('label leader: starts 3.8px outside the ring and ends 30.4px outside it (Figma), text beyond the end', () => {
  const p = donutLabelPoints({ ...G, midAngle: -30 }); // lower right
  const r = (pt) => Math.hypot(pt.x - G.cx, pt.y - G.cy);
  assert.ok(Math.abs(r(p.start) - 111.3) < 1e-6);
  assert.ok(Math.abs(r(p.end) - 137.9) < 1e-6);
  assert.equal(p.anchor, 'start');
  assert.ok(Math.abs(p.textX - (p.end.x + 4)) < 1e-9);
  assert.ok(p.end.x > G.cx && p.end.y > G.cy);
});

test('label side: right half anchors the text at its start, left half at its end', () => {
  assert.equal(donutLabelPoints({ ...G, midAngle: 20 }).anchor, 'start');   // upper right
  assert.equal(donutLabelPoints({ ...G, midAngle: -150 }).anchor, 'end');   // lower left
  assert.equal(donutLabelPoints({ ...G, midAngle: 140 }).anchor, 'end');    // upper left
  const left = donutLabelPoints({ ...G, midAngle: 180 });
  assert.ok(left.textX < left.end.x);
});

test('label stays inside the chart: a slice pointing straight down or up gets a shorter leader', () => {
  for (const midAngle of [-90, -91, -89, 90, 91, 89]) {
    const p = donutLabelPoints({ ...G, midAngle });
    assert.ok(p.end.y <= G.maxY + 1e-9 && p.end.y >= G.minY - 1e-9, `angle ${midAngle}: y ${p.end.y}`);
    assert.ok(Math.hypot(p.end.x - G.cx, p.end.y - G.cy) >= 107.5 + 3.8 + 6 - 1e-9, 'still a visible leader');
  }
  assert.ok(donutLabelPoints({ ...G, midAngle: -90 }).end.y < G.cy + 107.5 + 30.4, 'shortened at the bottom');
});

test('label geometry is finite for every angle', () => {
  for (let a = -360; a <= 360; a += 7) {
    const p = donutLabelPoints({ ...G, midAngle: a });
    for (const v of [p.start.x, p.start.y, p.end.x, p.end.y, p.textX]) assert.ok(Number.isFinite(v), `angle ${a}`);
  }
});
