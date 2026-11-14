// Renders each chart in a simulated browser and compares every marker, bar, gridline, axis line and
// label position with the coordinates measured from the Figma SVG (Desktop - 1.svg).
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { installDom } from './helpers/domEnv.js';

let vite, React, act, createRoot, core, Trend, Category, Regional, Donut, root;

before(async () => {
  installDom();
  vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
  React = await import('react');
  act = React.act;
  ({ createRoot } = await import('react-dom/client'));
  core = await vite.ssrLoadModule('/src/core/index.js');
  Trend = (await vite.ssrLoadModule('/src/ui/charts/MonthlyTrendChart.jsx')).default;
  Category = (await vite.ssrLoadModule('/src/ui/charts/CategoryRevenueChart.jsx')).default;
  Regional = (await vite.ssrLoadModule('/src/ui/charts/RegionalPerformanceChart.jsx')).default;
  Donut = (await vite.ssrLoadModule('/src/ui/charts/SegmentDonutChart.jsx')).default;
});
after(async () => { if (root) await act(async () => root.unmount()); await vite.close(); });

async function mount(label, element) {
  if (root) await act(async () => root.unmount());
  const host = document.getElementById('root');
  host.innerHTML = '';
  root = createRoot(host);
  await act(async () => { root.render(React.createElement('section', { 'aria-label': label }, element)); });
  await act(async () => { await new Promise((r) => setTimeout(r, 120)); });
  return host;
}
const attrs = (el) => Object.fromEntries([...el.attributes].map((a) => [a.name, a.value]));
const lines = (host) => [...host.querySelectorAll('line')].map((l) => { const a = attrs(l); return { x1: +a.x1, y1: +a.y1, x2: +a.x2, y2: +a.y2, stroke: a.stroke }; });
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: got ${a}, expected ${b} (+-${tol})`);

// ---------------------------------------------------------------------------------------------
// Monthly Sales Trend. Chart box origin in the Figma = (96, 399). Marker centres are the Figma ellipses.
// ---------------------------------------------------------------------------------------------
const FIGMA_MARKERS = [[158.37, 426.31], [210.54, 412.67], [262.70, 462.14], [314.87, 461.98], [367.04, 474.23], [419.20, 429.10], [471.37, 454.30], [523.54, 462.91], [575.70, 413.75], [627.87, 422.59], [680.04, 443.37], [732.20, 418.25]];

test('Monthly Sales Trend: markers, ticks, gridlines, axes and labels sit on the Figma coordinates', async () => {
  const values = FIGMA_MARKERS.map(([, cy]) => ((606.9 - cy) / 201.6) * 200);
  const months = FIGMA_MARKERS.map((_, i) => `2016-${String(i + 1).padStart(2, '0')}`);
  const monthlyTrend = months.map((m, i) => ({ month: m, sales: values[i], prevSales: i ? values[i - 1] : null, momChange: i ? values[i] - values[i - 1] : null }));
  const series = { ...core.buildTrendSeries(monthlyTrend), axis: { step: 50, max: 200, ticks: [0, 50, 100, 150, 200] } };
  const host = await mount('Monthly Sales Trend', React.createElement(Trend, { series, selectedMonth: null, onSelectMonth() {}, onClearMonth() {} }));

  const markers = [...host.querySelectorAll('ellipse')].map(attrs);
  assert.equal(markers.length, 12);
  markers.forEach((m, i) => {
    near(+m.cx, FIGMA_MARKERS[i][0] - 96, 0.05, `marker ${i} x`);
    near(+m.cy, FIGMA_MARKERS[i][1] - 399, 0.05, `marker ${i} y`);
    assert.equal(m.rx, '2.88'); assert.equal(m.ry, '3.78'); assert.equal(m.fill, '#ffffff'); assert.equal(m.stroke, '#2563EB'); assert.equal(m['stroke-width'], '2');
  });

  const L = lines(host);
  // five y ticks, 5.76 long, ending at the axis (x=62.37)
  const yTicks = L.filter((l) => l.y1 === l.y2 && l.x2 <= 62.38 && l.x1 >= 56 && l.stroke === '#000000').map((l) => l.y1).sort((a, b) => a - b);
  [6.3, 56.7, 107.1, 157.5, 207.9].forEach((y, i) => near(yTicks[i], y, 0.02, `y tick ${i}`));
  // twelve x ticks, 7.56 long, from the x axis line downwards
  const xTicks = L.filter((l) => l.x1 === l.x2 && l.y1 >= 207.8 && l.stroke === '#000000');
  assert.equal(xTicks.length, 12);
  xTicks.forEach((t) => near(Math.abs(t.y2 - t.y1), 7.56, 0.02, 'x tick length'));
  // grid: five horizontal and twelve vertical #CCCCCC lines
  assert.equal(L.filter((l) => l.stroke === '#CCCCCC' && l.y1 === l.y2).length, 5);
  assert.equal(L.filter((l) => l.stroke === '#CCCCCC' && l.x1 === l.x2).length, 12);
  // y labels: right-aligned at x=51.81, the top label 5.29px lower than the rule
  const yl = [...host.querySelectorAll('text')].filter((t) => !t.getAttribute('transform')).map((t) => ({ ...attrs(t), text: t.textContent }));
  assert.deepEqual(yl.map((t) => t.text), ['$0', '$50', '$100', '$150', '$200']);
  yl.forEach((t) => near(+t.x, 51.81, 0.01, 'y label x'));
  near(+yl[0].y, 207.9 + 2.25, 0.02, 'label 0'); near(+yl[3].y, 56.7 + 2.25, 0.02, 'label 150'); near(+yl[4].y, 6.3 + 2.25 + 5.29, 0.02, 'top label quirk');
  // x labels: rotate -40.19, skewX 9.61, ending just under each tick
  const xl = [...host.querySelectorAll('text[transform]')];
  assert.equal(xl.length, 12);
  assert.ok(xl.every((t) => /rotate\(-40\.19\) skewX\(9\.61\)/.test(t.getAttribute('transform'))));
  assert.equal(xl[0].textContent, 'Jan 2016');
  // area: gradient from the highest point to the baseline, 12% fill, stops as in Figma
  const grad = host.querySelector('linearGradient');
  near(+grad.getAttribute('y2'), 207.9, 0.01, 'gradient end'); near(+grad.getAttribute('y1'), 412.633 - 399, 0.05, 'gradient start = the highest point (Figma y1 = 412.633)');
  assert.deepEqual([...grad.querySelectorAll('stop')].map((s) => [s.getAttribute('offset'), s.getAttribute('stop-color'), s.getAttribute('stop-opacity')]), [['0.6', '#199BEA', null], ['1', '#ffffff', '0.5']]);
  const area = [...host.querySelectorAll('path')].map(attrs).find((p) => (p.fill || '').startsWith('url('));
  assert.equal(area['fill-opacity'], '0.12');
});

// ---------------------------------------------------------------------------------------------
// Revenue by Category. Chart box origin in the Figma = (771, 399). Bars use the Figma heights.
// ---------------------------------------------------------------------------------------------
test('Revenue by Category: bars, gridlines, x axis and labels sit on the Figma coordinates', async () => {
  const heights = [55, 85, 120]; // Figma's Mobile / Speaker / Laptop bars (units: px of a 219.61px plot = $1M)
  const sales = heights.map((h) => (h / 219.61) * 1e6);
  const series = core.buildCategorySeries(core.CATEGORIES.map((category, i) => ({ category, sales: sales[i] })));
  assert.deepEqual(series.axis.ticks, [0, 200000, 400000, 600000, 800000, 1000000]);
  const host = await mount('Revenue by Category', React.createElement(Category, { series, selectedCategory: null, onSelectCategory() {}, onClearCategory() {} }));

  const rects = [...host.querySelectorAll('rect[data-category]')].map(attrs);
  assert.deepEqual(rects.map((r) => r['data-category']), ['Furniture', 'Office Supplies', 'Technology']);
  const plotLeft = 66.74, plotW = 660 - 66.74 - 30.9, bottom = 231.85;
  rects.forEach((r, i) => {
    near(+r.height, heights[i], 0.05, `bar ${i} height`);
    near(+r.y, bottom - heights[i], 0.05, `bar ${i} top`);
    near(+r.width, 68, 0.01, `bar ${i} width`);
    // Recharts rounds a bar's offset inside its band to a whole pixel (0.27px here); Figma's own bars are
    // up to 0.8px off their band centres, so 0.5px is the tolerance.
    near(+r.x + +r.width / 2, plotLeft + ((i + 0.5) * plotW) / 3, 0.5, `bar ${i} centre`);
    assert.equal(r.stroke, '#ffffff'); assert.equal(r['stroke-width'], '1');
  });
  assert.deepEqual(rects.map((r) => r.fill), ['#3B82F6', '#8B5CF6', '#10B981']);

  const L = lines(host);
  const grid = L.filter((l) => l.stroke === '#E3E3E8');
  assert.equal(grid.length, 6, 'six horizontal #E3E3E8 gridlines');
  assert.ok(grid.every((l) => l.y1 === l.y2), 'no vertical gridlines');
  const ys = grid.map((l) => l.y1).sort((a, b) => a - b);
  ys.forEach((y, i) => near(y, 12.24 + i * (219.61 / 5), 0.02, `gridline ${i}`));
  grid.forEach((l) => { near(l.x1, plotLeft, 0.02, 'gridline start'); near(l.x2, 660 - 30.9, 0.02, 'gridline end'); });
  const axis = L.filter((l) => l.stroke === '#000000');
  assert.equal(axis.length, 1, 'only the x axis line is black: no y axis line, no tick marks');
  near(axis[0].y1, bottom, 0.02, 'x axis line');

  const yl = [...host.querySelectorAll('text')].filter((t) => !t.getAttribute('text-anchor') || t.getAttribute('text-anchor') === 'end').map((t) => ({ ...attrs(t), text: t.textContent }));
  assert.deepEqual(yl.map((t) => t.text), ['$0', '$200K', '$400K', '$600K', '$800K', '$1M']);
  yl.forEach((t, i) => { near(+t.x, 55.65, 0.01, 'y label x'); near(+t.y, bottom - i * (219.61 / 5) + 5.14, 0.03, `y label ${i}`); });
  const xl = [...host.querySelectorAll('text[text-anchor="middle"]')].map((t) => ({ ...attrs(t), text: t.textContent }));
  assert.deepEqual(xl.map((t) => t.text), ['Furniture', 'Office Supplies', 'Technology']);
  xl.forEach((t, i) => { near(+t.y, bottom + 22.83, 0.02, 'x label baseline'); near(+t.x, plotLeft + ((i + 0.5) * plotW) / 3, 0.05, 'x label centre'); });
});

test('Revenue by Category: a category without sales has no bar but keeps its label; dimming follows the selection', async () => {
  const series = core.buildCategorySeries([{ category: 'Furniture', sales: 100000 }, { category: 'Technology', sales: 300000 }]);
  let host = await mount('Revenue by Category', React.createElement(Category, { series, selectedCategory: 'Technology', onSelectCategory() {}, onClearCategory() {} }));
  const rects = [...host.querySelectorAll('rect[data-category]')];
  assert.deepEqual(rects.map((r) => r.dataset.category), ['Furniture', 'Technology']);
  assert.deepEqual(rects.map((r) => r.getAttribute('opacity')), ['0.35', '1']);
  assert.deepEqual([...host.querySelectorAll('text[text-anchor="middle"]')].map((t) => t.textContent), ['Furniture', 'Office Supplies', 'Technology']);
  assert.ok(!/NaN/.test(host.innerHTML));
  host = await mount('Revenue by Category', React.createElement(Category, { series: core.buildCategorySeries([]), selectedCategory: null, onSelectCategory() {}, onClearCategory() {} }));
  assert.match(host.textContent, /No data for this selection/);
  assert.equal(host.querySelectorAll('rect[data-category]').length, 0);
});

// ---------------------------------------------------------------------------------------------
// Regional Performance: same plot area as the Figma Product Revenue chart (origin of the chart box = (0,0) here).
// ---------------------------------------------------------------------------------------------
const PLOT = { left: 66.74, right: 660 - 30.9, top: 12.24, height: 219.61, bottom: 231.85 };
const mountRegional = (series, selectedRegion = null) => mount('Regional Performance', React.createElement(Regional, { series, selectedRegion, onSelectRegion() {}, onClearRegion() {} }));
const regionRects = (host) => [...host.querySelectorAll('rect[data-region]')].map((r) => ({ ...attrs(r), region: r.dataset.region, measure: r.dataset.measure }));

test('Regional Performance: Sales and Profit bars, gridlines, zero line, legend colours and labels (no losses)', async () => {
  const series = core.buildRegionSeries(core.REGIONS.map((region, i) => ({ region, sales: [725457.82, 678781.24, 501239.89, 391721.91][i], profit: [108418.45, 91522.78, 39706.36, 46749.43][i], margin: 0 })));
  assert.deepEqual(series.axis.ticks, [0, 200000, 400000, 600000, 800000, 1000000]);
  const host = await mountRegional(series);
  const rects = regionRects(host);
  assert.equal(rects.length, 8, 'two bars per region');
  // Recharts draws every Sales bar first, then every Profit bar
  assert.deepEqual(rects.map((r) => r.region), ['West', 'East', 'Central', 'South', 'West', 'East', 'Central', 'South']);
  assert.deepEqual(rects.map((r) => r.measure), [...Array(4).fill('sales'), ...Array(4).fill('profit')]);
  assert.deepEqual(rects.map((r) => r.fill), [...Array(4).fill('#3B82F6'), ...Array(4).fill('#10B981')]);
  const band = (PLOT.right - PLOT.left) / 4;
  rects.forEach((r) => {
    const bar = series.bars.find((b) => b.region === r.region);
    const value = bar[r.measure];
    near(+r.height, (value / 1e6) * PLOT.height, 0.05, `${r.region} ${r.measure} height`);
    near(+r.y, PLOT.bottom - (value / 1e6) * PLOT.height, 0.05, `${r.region} ${r.measure} top`);
    near(+r.width, 36, 0.01, 'bar width');
    assert.equal(r.stroke, '#ffffff'); assert.equal(r['stroke-width'], '1');
  });
  for (let i = 0; i < 4; i++) {
    const region = core.REGIONS[i];
    const sales = rects.find((r) => r.region === region && r.measure === 'sales');
    const profit = rects.find((r) => r.region === region && r.measure === 'profit');
    near((+sales.x + +profit.x + +profit.width) / 2, PLOT.left + (i + 0.5) * band, 0.6, `group ${i} is centred in its column`); // Recharts rounds offsets to whole pixels
    near(+profit.x - (+sales.x + +sales.width), 4, 0.6, `group ${i} gap`);
  }
  const L = lines(host);
  const grid = L.filter((l) => l.stroke === '#E3E3E8');
  assert.equal(grid.length, 6);
  grid.map((l) => l.y1).sort((a, b) => a - b).forEach((y, i) => near(y, PLOT.top + i * (PLOT.height / 5), 0.02, `gridline ${i}`));
  const zero = L.filter((l) => l.stroke === '#000000');
  assert.equal(zero.length, 1, 'one black line: the zero / x axis line');
  near(zero[0].y1, PLOT.bottom, 0.02, 'zero line at the bottom of the plot');
  const texts = [...host.querySelectorAll('text')].map((t) => ({ ...attrs(t), text: t.textContent }));
  assert.deepEqual(texts.filter((t) => t['text-anchor'] === 'middle').map((t) => t.text), ['West', 'East', 'Central', 'South']);
  texts.filter((t) => t['text-anchor'] === 'middle').forEach((t, i) => { near(+t.y, PLOT.bottom + 22.83, 0.02, 'region label baseline'); near(+t.x, PLOT.left + (i + 0.5) * band, 0.05, 'region label centre'); });
  const yl = texts.filter((t) => t['text-anchor'] === 'end');
  assert.deepEqual(yl.map((t) => t.text), ['$0', '$200K', '$400K', '$600K', '$800K', '$1M']);
  yl.forEach((t, i) => near(+t.y, PLOT.bottom - i * (PLOT.height / 5) + 5.14, 0.03, `y label ${i}`));
});

test('Regional Performance: a loss draws a bar BELOW the zero line, and the zero line moves up', async () => {
  const series = core.buildRegionSeries([
    { region: 'West', sales: 100000, profit: 20000, margin: 20 }, { region: 'East', sales: 90000, profit: 15000, margin: 16 },
    { region: 'Central', sales: 163797.0, profit: -2871.05, margin: -1.75 }, { region: 'South', sales: 80000, profit: 9000, margin: 11 },
  ]);
  const { axis } = series;
  assert.ok(axis.min < 0);
  const host = await mountRegional(series);
  const rects = regionRects(host);
  const yPx = (v) => PLOT.top + ((axis.max - v) / (axis.max - axis.min)) * PLOT.height;
  const zeroLine = lines(host).filter((l) => l.stroke === '#000000');
  assert.equal(zeroLine.length, 1);
  near(zeroLine[0].y1, yPx(0), 0.02, 'zero line');
  assert.ok(zeroLine[0].y1 < PLOT.bottom - 1, 'zero is above the bottom of the plot');
  const loss = rects.find((r) => r.region === 'Central' && r.measure === 'profit');
  near(+loss.y, yPx(0), 0.05, 'a loss bar starts at the zero line');
  near(+loss.height, (2871.05 / (axis.max - axis.min)) * PLOT.height, 0.05, 'and hangs down by its size');
  assert.ok(+loss.height > 0);
  const gain = rects.find((r) => r.region === 'West' && r.measure === 'profit');
  near(+gain.y + +gain.height, yPx(0), 0.05, 'a gain bar ends at the zero line');
  const gridY = lines(host).filter((l) => l.stroke === '#E3E3E8').map((l) => l.y1).sort((a, b) => a - b);
  assert.equal(gridY.length, axis.ticks.length);
  assert.ok([...host.querySelectorAll('text')].some((t) => /^-\$/.test(t.textContent)), 'the axis shows a negative label');
  assert.ok(!/NaN/.test(host.innerHTML));
});

test('Regional Performance: regions without data have no bars but keep their labels; dimming follows the selection; empty slice shows a message', async () => {
  const series = core.buildRegionSeries([{ region: 'West', sales: 100, profit: 10, margin: 10 }, { region: 'South', sales: 50, profit: 5, margin: 10 }]);
  let host = await mountRegional(series, 'South');
  const rects = regionRects(host);
  assert.deepEqual(rects.map((r) => r.region), ['West', 'South', 'West', 'South']);
  assert.deepEqual(rects.map((r) => r.opacity), ['0.35', '1', '0.35', '1'], 'West (not selected) dimmed, South (selected) full, for Sales then Profit');
  assert.deepEqual([...host.querySelectorAll('text[text-anchor="middle"]')].map((t) => t.textContent), ['West', 'East', 'Central', 'South']);
  host = await mountRegional(core.buildRegionSeries([]));
  assert.match(host.textContent, /No data for this selection/);
  assert.equal(regionRects(host).length, 0);
  assert.ok(!/NaN/.test(host.innerHTML));
});

// ---------------------------------------------------------------------------------------------
// Revenue by Segment donut. Ring centre = (width / 2 + 9.16, 131.88), radii 107.5 / 71.3, 5px white outline,
// starting at 3 o'clock and running clockwise (measured from the Figma donut).
// ---------------------------------------------------------------------------------------------
const RING = { outer: 107.5, inner: 71.3, cy: 131.88, dx: 9.16 };
const mountDonut = (series, selectedSegment = null) => mount('Revenue by Segment', React.createElement(Donut, { series, selectedSegment, onSelectSegment() {}, onClearSegment() {} }));
const numbers = (d) => (d.match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/g) || []).map(Number);
const sliceOf = (host, segment) => host.querySelector(`g[data-segment="${segment}"]`);
/** clockwise angle (degrees from 3 o'clock) of a point around the ring centre */
const clockwise = (x, y, cx) => ((Math.atan2(y - RING.cy, x - cx) * 180) / Math.PI + 360) % 360;
const SEGMENT_SERIES = () => core.buildSegmentSeries([
  { segment: 'Consumer', sales: 1161401.345 }, { segment: 'Corporate', sales: 706146.3668 }, { segment: 'Home Office', sales: 429653.1485 },
]);

test('Revenue by Segment: three ring slices in the approved colours, with Figma radii, white outline and clockwise sweep from 3 o\'clock', async () => {
  const series = SEGMENT_SERIES();
  const host = await mountDonut(series);
  const cx = 660 / 2 + RING.dx;
  const groups = [...host.querySelectorAll('g[data-segment]')];
  assert.deepEqual(groups.map((g) => g.dataset.segment), ['Consumer', 'Corporate', 'Home Office']);
  const paths = groups.map((g) => g.querySelector('path'));
  assert.deepEqual(paths.map((p) => p.getAttribute('fill')), ['#3B82F6', '#8B5CF6', '#10B981']);
  assert.ok(paths.every((p) => p.getAttribute('stroke') === '#ffffff' && p.getAttribute('stroke-width') === '5'));
  assert.ok(groups.every((g) => g.getAttribute('opacity') === '1'));
  let angle = 0;
  paths.forEach((path, i) => {
    const n = numbers(path.getAttribute('d'));
    // M x,y A R,R,0,large,sweep,x2,y2 L x3,y3 A r,r,0,large,sweep,x4,y4 Z
    const [mx, my, R1, , , , , ex, ey, lx, ly, R2] = [n[0], n[1], n[2], n[3], n[4], n[5], n[6], n[7], n[8], n[9], n[10], n[11]];
    near(R1, RING.outer, 0.001, `slice ${i} outer radius`);
    near(R2, RING.inner, 0.001, `slice ${i} inner radius`);
    near(Math.hypot(mx - cx, my - RING.cy), RING.outer, 0.01, `slice ${i} outer start is on the ring`);
    near(Math.hypot(lx - cx, ly - RING.cy), RING.inner, 0.01, `slice ${i} inner edge is on the inner ring`);
    near(clockwise(mx, my, cx), angle % 360, 0.05, `slice ${i} starts where the previous one ended`);
    angle += (series.slices[i].share / 100) * 360;
    near(clockwise(ex, ey, cx), angle % 360, 0.05, `slice ${i} ends at the cumulative share`);
  });
  near(angle, 360, 1e-9, 'the three slices fill the ring');
  near(clockwise(...numbers(paths[0].getAttribute('d')).slice(0, 2), cx), 0, 0.05, 'first slice starts at 3 o\'clock');
});

test('Revenue by Segment: leader lines start 3.8px and end 30.4px outside the ring; labels are in the dark shade of each colour', async () => {
  const series = SEGMENT_SERIES();
  const host = await mountDonut(series);
  const cx = 660 / 2 + RING.dx;
  const r = (x, y) => Math.hypot(x - cx, y - RING.cy);
  const labels = [...host.querySelectorAll('g[data-label]')];
  assert.deepEqual(labels.map((g) => g.dataset.label), ['Consumer', 'Corporate', 'Home Office']);
  assert.deepEqual(labels.map((g) => g.querySelector('line').getAttribute('stroke')), ['#2563EB', '#9333EA', '#16A34A']);
  assert.deepEqual(labels.map((g) => g.querySelector('text').textContent), ['Consumer $1.16M', 'Corporate $706.1K', 'Home Office $429.7K']);
  labels.forEach((g) => {
    const l = Object.fromEntries(['x1', 'y1', 'x2', 'y2'].map((k) => [k, +g.querySelector('line').getAttribute(k)]));
    const t = g.querySelector('text');
    near(r(l.x1, l.y1), RING.outer + 3.8, 0.01, `${g.dataset.label} leader start`);
    assert.ok(r(l.x2, l.y2) <= RING.outer + 30.4 + 0.01 && r(l.x2, l.y2) >= RING.outer + 3.8 + 6 - 0.01, `${g.dataset.label} leader length`);
    assert.ok(l.y2 >= 10 - 1e-9 && l.y2 <= 257 + 1e-9, `${g.dataset.label} stays inside the chart box`);
    assert.equal(t.getAttribute('text-anchor'), l.x2 >= cx ? 'start' : 'end');
    near(+t.getAttribute('x'), l.x2 + (l.x2 >= cx ? 4 : -4), 0.01, 'text sits 4px beyond the leader');
    near(+t.getAttribute('y'), l.y2 + 4.3, 0.01, 'text is centred on the leader end');
    const hex = g.querySelector('line').getAttribute('stroke'); // the browser reports colours as rgb(r, g, b)
    const rgb = `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
    assert.equal(t.style.fill, rgb, 'label text has the same colour as its leader line');
  });
  // the leader points the way the slice faces: the label is on the slice's side of the donut
  const first = labels[0].querySelector('line');
  assert.ok(+first.getAttribute('y2') > RING.cy, 'Consumer (3 o\'clock to about 9 o\'clock, mid-angle straight down) is labelled below the ring');
});

test('Revenue by Segment: the ring stays centred in a wider card (centre = width / 2 + 9.16)', async () => {
  globalThis.__boxWidth = { 'Revenue by Segment': 900 };
  try {
    const host = await mountDonut(SEGMENT_SERIES());
    const n = numbers(host.querySelector('g[data-segment="Consumer"] path').getAttribute('d'));
    near(n[0], 900 / 2 + RING.dx + RING.outer, 0.01, 'the first slice starts at the right edge of a ring centred at 459.16');
    assert.equal(host.querySelector('svg').getAttribute('width'), '900');
  } finally { delete globalThis.__boxWidth; }
});

test('Revenue by Segment: dimming follows the selection; a missing segment has no slice and no label; a single segment is a full ring', async () => {
  let host = await mountDonut(SEGMENT_SERIES(), 'Corporate');
  assert.deepEqual([...host.querySelectorAll('g[data-segment]')].map((g) => g.getAttribute('opacity')), ['0.35', '1', '0.35']);
  assert.equal(host.querySelectorAll('g[data-label]').length, 3, 'labels stay readable at full strength');

  host = await mountDonut(core.buildSegmentSeries([{ segment: 'Consumer', sales: 300 }, { segment: 'Home Office', sales: 100 }]));
  assert.deepEqual([...host.querySelectorAll('g[data-segment]')].map((g) => g.dataset.segment), ['Consumer', 'Home Office']);
  assert.deepEqual([...host.querySelectorAll('g[data-label]')].map((g) => g.dataset.label), ['Consumer', 'Home Office']);
  assert.ok(!/NaN/.test(host.innerHTML));

  host = await mountDonut(core.buildSegmentSeries([{ segment: 'Corporate', sales: 42 }]));
  assert.equal(host.querySelectorAll('g[data-segment]').length, 1);
  assert.ok(!/NaN/.test(host.innerHTML), 'a 100% slice draws without invalid numbers');
  assert.equal(host.querySelector('g[data-label] text').textContent, 'Corporate $42');
});

test('Revenue by Segment: no sales at all shows a message and no slices', async () => {
  const host = await mountDonut(core.buildSegmentSeries([]));
  assert.match(host.textContent, /No data for this selection/);
  assert.equal(host.querySelectorAll('g[data-segment]').length, 0);
  assert.equal(host.querySelectorAll('g[data-label]').length, 0);
  assert.ok(!/NaN/.test(host.innerHTML));
});
