// The whole Home page in a simulated browser: real transaction data, real Recharts, real mouse and keyboard
// events. Every number shown is compared with an independent calculation from the raw rows.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startHomeApp, expectedKpis } from './helpers/homeApp.js';

let app;
const REGIONS = ['West', 'East', 'Central', 'South'];
const CATEGORIES = ['Furniture', 'Office Supplies', 'Technology'];
const SEGMENTS = ['Consumer', 'Corporate', 'Home Office'];
const NONE_COMBOS = '$2.30M | $286.4K | 5,009 | 793';
const TREND = 'Monthly Sales Trend';
const CATEGORY = 'Revenue by Category';
const money = (n) => app.core.formatCurrency(n);

before(async () => { app = await startHomeApp({ width: 1920, height: 1080 }); });
after(async () => { await app.close(); });

// ---- independent calculations ---------------------------------------------------------------------
const slice = (f) => app.rows.filter((x) => (!f.region || x.region === f.region) && (!f.category || x.category === f.category) && (!f.segment || x.segment === f.segment) && (!f.year || x.orderDate.startsWith(String(f.year))) && (!f.month || x.orderDate.startsWith(f.month)));
const categoryRevenue = (f) => Object.fromEntries(CATEGORIES.map((c) => [c, slice({ ...f, category: null }).filter((x) => x.category === c).reduce((t, x) => t + x.sales, 0)]));
const total = (f) => slice(f).reduce((t, x) => t + x.sales, 0);
// x of the i-th month marker; the first and last are nudged 1px inside the plot, where a real click lands
const trendX = (i, n) => 62.37 + (i * (641 - 62.37 - 4.8)) / (n - 1) + (i === 0 ? 1 : i === n - 1 ? -1 : 0);
const barFor = (category) => app.bars().find((b) => b.dataset.category === category);
/** the exact sales figure the tooltip shows for a bar */
async function tooltipSales(category) {
  await app.hoverBar(barFor(category));
  const text = app.tooltipText(CATEGORY);
  assert.ok(text.includes(category), `tooltip names ${category}: "${text}"`);
  const m = /Sales\$([\d,]+\.\d\d)/.exec(text);
  assert.ok(m, `tooltip shows exact sales: "${text}"`);
  return Number(m[1].replace(/,/g, ''));
}

// ================================================================================================
// Revenue by Category
// ================================================================================================
test('category chart: title, three bars in the approved colours, calculated callout and axis', async () => {
  await app.reset();
  assert.equal(app.cardBy(CATEGORY).querySelector('h2').textContent, 'Revenue by Category');
  assert.deepEqual(app.bars().map((b) => b.dataset.category), CATEGORIES);
  assert.deepEqual(app.bars().map((b) => b.getAttribute('fill')), ['#3B82F6', '#8B5CF6', '#10B981']);
  assert.ok(app.bars().every((b) => b.getAttribute('opacity') === '1'), 'nothing dimmed without a selection');
  assert.equal(app.callout(CATEGORY), '$2.30M');
  assert.equal(app.callout(CATEGORY), app.core.formatCompactCurrency(total({})));
  const labels = app.q('section[aria-label="Revenue by Category"] text').map((t) => t.textContent);
  assert.deepEqual(labels, ['Furniture', 'Office Supplies', 'Technology', '$0', '$200K', '$400K', '$600K', '$800K', '$1M']); // x axis labels are drawn first
});

test('category chart: bar heights are proportional to the real revenue', async () => {
  await app.reset();
  const rev = categoryRevenue({});
  const h = Object.fromEntries(app.bars().map((b) => [b.dataset.category, Number(b.getAttribute('height'))]));
  for (const a of CATEGORIES) for (const b of CATEGORIES) assert.ok(Math.abs(h[a] / h[b] - rev[a] / rev[b]) < 1e-3, `${a}/${b}`);
  assert.ok(Math.abs(h.Technology - (rev.Technology / 1e6) * 219.61) < 0.05, 'Technology bar = $836K on a $0-$1M axis');
});

test('category chart: hovering a bar shows exact sales and its share (revenue, not profit)', async () => {
  await app.reset();
  const rev = categoryRevenue({});
  for (const c of CATEGORIES) assert.ok(Math.abs((await tooltipSales(c)) - rev[c]) < 0.005, c);
  await app.hoverBar(barFor('Technology'));
  assert.match(app.tooltipText(CATEGORY), /\$836,154\.03/);
  assert.match(app.tooltipText(CATEGORY), /36\.4%/);
  assert.doesNotMatch(app.tooltipText(CATEGORY), /profit/i);
});

test('category chart: Region, Segment and Year filters change the bars (all combinations checked against the data)', async () => {
  await app.reset();
  const cases = [
    { region: 'West' }, { segment: 'Corporate' }, { year: 2016 },
    { region: 'South', segment: 'Home Office' }, { region: 'East', year: 2014 },
    { region: 'Central', segment: 'Consumer', year: 2017 }, { region: 'West', segment: 'Corporate', year: 2015 },
  ];
  for (const f of cases) {
    if (f.region) await app.pick(0, REGIONS.indexOf(f.region) + 1);
    if (f.segment) await app.pick(2, SEGMENTS.indexOf(f.segment) + 1);
    if (f.year) await app.pick(3, [2014, 2015, 2016, 2017].indexOf(f.year) + 1);
    const rev = categoryRevenue(f);
    for (const c of CATEGORIES) {
      if (rev[c] > 0) assert.ok(Math.abs((await tooltipSales(c)) - rev[c]) < 0.005, `${c} ${JSON.stringify(f)}`);
    }
    assert.equal(app.callout(CATEGORY), app.core.formatCompactCurrency(total(f)), `callout ${JSON.stringify(f)}`);
    assert.equal(app.cards().join(' | '), expectedKpis(app, f), `KPIs ${JSON.stringify(f)}`);
    await app.reset();
  }
});

test('category chart: clicking a bar selects that category, keeps all three bars, and filters everything else', async () => {
  await app.reset();
  const before = categoryRevenue({});
  await app.clickBar(barFor('Technology'));
  assert.equal(app.comboValues()[1], 'Technology', 'the Category dropdown shows the selection');
  assert.equal(app.cards().join(' | '), expectedKpis(app, { category: 'Technology' }));
  assert.deepEqual(app.bars().map((b) => b.getAttribute('opacity')), ['0.35', '0.35', '1'], 'selected bar full, others 35%');
  assert.equal(app.bars().length, 3, 'all three bars stay visible');
  assert.equal(app.callout(CATEGORY), '$2.30M', 'the chart still compares all three categories');
  for (const c of CATEGORIES) assert.ok(Math.abs((await tooltipSales(c)) - before[c]) < 0.005, `${c} unchanged`);
  assert.equal(app.callout(TREND), app.core.formatCompactCurrency(total({ category: 'Technology' })), 'the trend chart follows the category');
});

test('category chart: clicking the selected bar again deselects it and restores the previous dropdown value', async () => {
  await app.reset();
  await app.clickBar(barFor('Furniture'));
  assert.equal(app.comboValues()[1], 'Furniture');
  await app.clickBar(barFor('Furniture'));
  assert.equal(app.comboValues()[1], 'All Categories');
  assert.equal(app.cards().join(' | '), NONE_COMBOS);
  assert.ok(app.bars().every((b) => b.getAttribute('opacity') === '1'));
});

test('category chart: with a dropdown choice already made, deselecting a clicked bar brings that choice back', async () => {
  await app.reset();
  await app.pick(1, 1); // Category dropdown = Furniture
  assert.deepEqual(app.bars().map((b) => b.getAttribute('opacity')), ['1', '0.35', '0.35'], 'the dropdown choice is highlighted too');
  await app.clickBar(barFor('Technology'));
  assert.equal(app.comboValues()[1], 'Technology');
  await app.clickBar(barFor('Technology'));
  assert.equal(app.comboValues()[1], 'Furniture', 'previous dropdown value restored, not "All"');
  assert.equal(app.cards().join(' | '), expectedKpis(app, { category: 'Furniture' }));
});

test('category chart: Escape, empty chart space and the card background all clear a bar selection', async () => {
  await app.reset();
  await app.clickBar(barFor('Office Supplies'));
  await app.press('Escape'); await app.tick();
  assert.equal(app.comboValues()[1], 'All Categories');
  await app.clickBar(barFor('Office Supplies'));
  await app.clickChartAt(8, 100, CATEGORY); // left of the plot: empty chart space
  assert.equal(app.comboValues()[1], 'All Categories', 'empty chart space clears');
  await app.clickBar(barFor('Office Supplies'));
  await app.click(app.cardBy(CATEGORY).querySelector('h2')); await app.tick();
  assert.equal(app.comboValues()[1], 'All Categories', 'card background clears');
  assert.equal(app.cards().join(' | '), NONE_COMBOS);
});

test('category chart: clicking empty space does not reset a dropdown choice made by hand', async () => {
  await app.reset();
  await app.pick(1, 3); // Technology, chosen by hand
  await app.clickChartAt(8, 100, CATEGORY);
  assert.equal(app.comboValues()[1], 'Technology');
  await app.reset();
});

test('category chart: a month chosen in the trend chart filters the category bars, and both selections combine', async () => {
  await app.reset();
  await app.clickChartAt(trendX(14, 48)); // March 2015
  const rev = categoryRevenue({ month: '2015-03' });
  for (const c of CATEGORIES) if (rev[c] > 0) assert.ok(Math.abs((await tooltipSales(c)) - rev[c]) < 0.005, c);
  assert.equal(app.callout(CATEGORY), app.core.formatCompactCurrency(total({ month: '2015-03' })));
  await app.clickBar(barFor('Technology'));
  assert.equal(app.cards().join(' | '), expectedKpis(app, { month: '2015-03', category: 'Technology' }));
  assert.equal(app.trendMarkers().length, 48, 'the trend still shows every month');
  await app.press('Escape'); await app.tick();
  assert.equal(app.cards().join(' | '), NONE_COMBOS, 'Escape clears the month and the category together');
});

test('category chart: a category with no sales in the selected slice has no bar, but keeps its label', async () => {
  await app.reset();
  // A completely empty chart cannot be reached through the UI (an empty month shows as a gap in the trend and
  // cannot be selected; every Region x Segment x Year has sales). That safety net is tested in
  // charts.geometry.test.js with an empty series. Here: a slice where only some categories sold.
  let partial = null;
  outer: for (const y of [2014, 2015, 2016, 2017]) for (let m = 1; m <= 12; m++) for (const r of REGIONS) for (const s of SEGMENTS) {
    const f = { region: r, segment: s, year: y, month: `${y}-${String(m).padStart(2, '0')}` };
    const present = CATEGORIES.filter((c) => categoryRevenue(f)[c] > 0).length;
    if (present > 0 && present < 3) { partial = f; break outer; }
  }
  assert.ok(partial, 'the data has slices where some category did not sell');
  await app.pick(0, REGIONS.indexOf(partial.region) + 1);
  await app.pick(2, SEGMENTS.indexOf(partial.segment) + 1);
  await app.pick(3, [2014, 2015, 2016, 2017].indexOf(partial.year) + 1);
  await app.clickChartAt(trendX(Number(partial.month.slice(5)) - 1, 12), 100, TREND);
  await app.tick();
  const expected = CATEGORIES.filter((c) => categoryRevenue(partial)[c] > 0);
  assert.deepEqual(app.bars().map((b) => b.dataset.category), expected, JSON.stringify(partial));
  assert.ok(expected.length < 3);
  assert.ok(!/NaN/.test(app.cardBy(CATEGORY).innerHTML));
  assert.deepEqual(app.q('section[aria-label="Revenue by Category"] text[text-anchor="middle"]').map((t) => t.textContent), CATEGORIES, 'all three labels stay');
  await app.reset();
});

// ================================================================================================
// Regional Performance
// ================================================================================================
const REGIONAL = 'Regional Performance';
const regionalFor = (f) => Object.fromEntries(REGIONS.map((r) => {
  const rows = slice({ ...f, region: r });
  return [r, { sales: rows.reduce((t, x) => t + x.sales, 0), profit: rows.reduce((t, x) => t + x.profit, 0), n: rows.length }];
}));
const regionBand = (i) => 66.74 + ((i + 0.5) * (660 - 66.74 - 30.9)) / 4; // x at the centre of a region's column
const parseMoney = (text, label) => { const m = new RegExp(`${label}(-?)\\$([\\d,]+\\.\\d\\d)`).exec(text); assert.ok(m, `"${label}" in "${text}"`); return (m[1] ? -1 : 1) * Number(m[2].replace(/,/g, '')); };
async function regionTooltip(region) {
  await app.hoverChartAt(regionBand(REGIONS.indexOf(region)), 100, REGIONAL);
  const text = app.tooltipText(REGIONAL);
  assert.ok(text.includes(region), `tooltip names ${region}: "${text}"`);
  return { sales: parseMoney(text, 'Sales'), profit: parseMoney(text, 'Profit'), text };
}
const regionOpacities = () => REGIONS.map((r) => app.regionBars().filter((b) => b.dataset.region === r).map((b) => b.getAttribute('opacity')));

test('regional chart: title, legend, eight bars in the approved colours, no callout, axis and region labels', async () => {
  await app.reset();
  const card = app.cardBy(REGIONAL);
  assert.equal(card.querySelector('h2').textContent, 'Regional Performance');
  assert.match(card.textContent, /Sales/); assert.match(card.textContent, /Profit/);
  const swatches = [...card.querySelectorAll('div > span > span[aria-hidden="true"]')].map((s) => s.style.background);
  assert.deepEqual(swatches.slice(0, 2), ['rgb(59, 130, 246)', 'rgb(16, 185, 129)'], 'legend swatches: Sales blue, Profit green');
  assert.equal(card.querySelectorAll('p').length, 0, 'no callout on this card (Figma has none)');
  // Recharts draws every Sales bar first, then every Profit bar
  assert.deepEqual(app.regionBars().map((b) => b.dataset.region), ['West', 'East', 'Central', 'South', 'West', 'East', 'Central', 'South']);
  assert.deepEqual(app.regionBars().map((b) => b.getAttribute('fill')), [...Array(4).fill('#3B82F6'), ...Array(4).fill('#10B981')]);
  assert.deepEqual(app.regionBars().map((b) => b.getAttribute('data-measure')), [...Array(4).fill('sales'), ...Array(4).fill('profit')]);
  assert.ok(app.regionBars().every((b) => b.getAttribute('opacity') === '1'));
  assert.deepEqual(app.q('section[aria-label="Regional Performance"] text').map((t) => t.textContent), ['West', 'East', 'Central', 'South', '$0', '$200K', '$400K', '$600K', '$800K', '$1M']);
});

test('regional chart: all four regions show exact Sales, Profit and margin in the tooltip', async () => {
  await app.reset();
  const expected = regionalFor({});
  for (const region of REGIONS) {
    const t = await regionTooltip(region);
    assert.ok(Math.abs(t.sales - expected[region].sales) < 0.005, `${region} sales`);
    assert.ok(Math.abs(t.profit - expected[region].profit) < 0.005, `${region} profit`);
    assert.match(t.text, new RegExp(`${(expected[region].profit / expected[region].sales * 100).toFixed(1)}%`), `${region} margin`);
  }
  const west = await regionTooltip('West');
  assert.match(west.text, /\$725,457\.82/); assert.match(west.text, /\$108,418\.45/);
});

test('regional chart: bar heights are proportional to the real Sales and Profit', async () => {
  await app.reset();
  const expected = regionalFor({});
  const h = (r, m) => Number(app.regionBars().find((b) => b.dataset.region === r && b.dataset.measure === m).getAttribute('height'));
  for (const r of REGIONS) {
    assert.ok(Math.abs(h(r, 'sales') - (expected[r].sales / 1e6) * 219.61) < 0.05, `${r} sales`);
    assert.ok(Math.abs(h(r, 'profit') - (expected[r].profit / 1e6) * 219.61) < 0.05, `${r} profit`);
    assert.ok(h(r, 'profit') < h(r, 'sales'), 'profit is smaller than sales, so the two measures are not confused');
  }
});

test('regional chart: Category, Segment and Year filters change the bars (checked against the data for every region)', async () => {
  await app.reset();
  const cases = [{ category: 'Technology' }, { segment: 'Corporate' }, { year: 2016 }, { category: 'Office Supplies', segment: 'Home Office' }, { category: 'Furniture', year: 2014 }, { category: 'Technology', segment: 'Consumer', year: 2017 }];
  for (const f of cases) {
    if (f.category) await app.pick(1, CATEGORIES.indexOf(f.category) + 1);
    if (f.segment) await app.pick(2, SEGMENTS.indexOf(f.segment) + 1);
    if (f.year) await app.pick(3, [2014, 2015, 2016, 2017].indexOf(f.year) + 1);
    const expected = regionalFor(f);
    for (const region of REGIONS) {
      const t = await regionTooltip(region);
      assert.ok(Math.abs(t.sales - expected[region].sales) < 0.005 && Math.abs(t.profit - expected[region].profit) < 0.005, `${region} ${JSON.stringify(f)}`);
    }
    assert.equal(app.cards().join(' | '), expectedKpis(app, f), `KPIs ${JSON.stringify(f)}`);
    await app.reset();
  }
});

test('regional chart: a loss-making slice (Furniture) shows a negative Profit for Central, drawn below the zero line', async () => {
  await app.reset();
  await app.pick(1, 1); // Category = Furniture
  const t = await regionTooltip('Central');
  assert.ok(Math.abs(t.profit - -2871.05) < 0.005);
  assert.match(t.text, /-\$2,871\.05/);
  assert.match(t.text, /-\d+\.\d%/, 'negative margin');
  const loss = app.regionBars().find((b) => b.dataset.region === 'Central' && b.dataset.measure === 'profit');
  const gain = app.regionBars().find((b) => b.dataset.region === 'West' && b.dataset.measure === 'profit');
  const zeroY = Number(gain.getAttribute('y')) + Number(gain.getAttribute('height'));
  assert.ok(Math.abs(Number(loss.getAttribute('y')) - zeroY) < 0.05, 'the loss bar hangs from the zero line');
  assert.ok(app.q('section[aria-label="Regional Performance"] text').some((x) => /^-\$/.test(x.textContent)), 'the axis extends below zero and labels it with a minus sign');
  assert.ok(!/NaN/.test(app.cardBy(REGIONAL).innerHTML));
  await app.reset();
});

test('regional chart: clicking a region selects it, keeps all four regions, and filters everything else', async () => {
  await app.reset();
  const before = regionalFor({});
  await app.clickChartAt(regionBand(2), 100, REGIONAL); // Central
  assert.equal(app.comboValues()[0], 'Central', 'the Region dropdown shows the selection');
  assert.equal(app.cards().join(' | '), expectedKpis(app, { region: 'Central' }));
  assert.deepEqual(regionOpacities(), [['0.35', '0.35'], ['0.35', '0.35'], ['1', '1'], ['0.35', '0.35']], 'selected region full, others 35%');
  assert.equal(app.regionBars().length, 8, 'all four regions stay visible');
  for (const region of REGIONS) {
    const t = await regionTooltip(region);
    assert.ok(Math.abs(t.sales - before[region].sales) < 0.005 && Math.abs(t.profit - before[region].profit) < 0.005, `${region} unchanged`);
  }
  assert.equal(app.callout(TREND), app.core.formatCompactCurrency(total({ region: 'Central' })), 'the trend chart follows the region');
  assert.equal(app.callout(CATEGORY), app.core.formatCompactCurrency(total({ region: 'Central' })), 'and so does the category chart');
});

test('regional chart: clicking the selected region again deselects it and restores the previous dropdown value', async () => {
  await app.reset();
  await app.clickChartAt(regionBand(0), 100, REGIONAL);
  assert.equal(app.comboValues()[0], 'West');
  await app.clickChartAt(regionBand(0), 100, REGIONAL);
  assert.equal(app.comboValues()[0], 'All Regions');
  assert.equal(app.cards().join(' | '), NONE_COMBOS);
  assert.ok(app.regionBars().every((b) => b.getAttribute('opacity') === '1'));
});

test('regional chart: with a dropdown choice already made, deselecting a clicked region brings that choice back', async () => {
  await app.reset();
  await app.pick(0, 4); // Region dropdown = South
  assert.deepEqual(regionOpacities(), [['0.35', '0.35'], ['0.35', '0.35'], ['0.35', '0.35'], ['1', '1']], 'the dropdown choice is highlighted too');
  await app.clickChartAt(regionBand(1), 100, REGIONAL); // East
  assert.equal(app.comboValues()[0], 'East');
  await app.clickChartAt(regionBand(1), 100, REGIONAL);
  assert.equal(app.comboValues()[0], 'South', 'previous dropdown value restored, not "All"');
  assert.equal(app.cards().join(' | '), expectedKpis(app, { region: 'South' }));
});

test('regional chart: Escape, empty chart space and the card background all clear a region selection', async () => {
  await app.reset();
  await app.clickChartAt(regionBand(3), 100, REGIONAL);
  await app.press('Escape'); await app.tick();
  assert.equal(app.comboValues()[0], 'All Regions');
  await app.clickChartAt(regionBand(3), 100, REGIONAL);
  await app.clickChartAt(8, 100, REGIONAL); // left of the plot
  assert.equal(app.comboValues()[0], 'All Regions', 'empty chart space clears');
  await app.clickChartAt(regionBand(3), 100, REGIONAL);
  await app.click(app.cardBy(REGIONAL).querySelector('h2')); await app.tick();
  assert.equal(app.comboValues()[0], 'All Regions', 'card background clears');
  assert.equal(app.cards().join(' | '), NONE_COMBOS);
});

test('regional chart: clicking empty space does not reset a dropdown choice made by hand', async () => {
  await app.reset();
  await app.pick(0, 2); // East, by hand
  await app.clickChartAt(8, 100, REGIONAL);
  assert.equal(app.comboValues()[0], 'East');
  await app.reset();
});

test('regional chart: a month chosen in the trend chart filters the regional bars, and combines with a region click', async () => {
  await app.reset();
  await app.clickChartAt(trendX(14, 48)); // March 2015
  const expected = regionalFor({ month: '2015-03' });
  for (const region of REGIONS) {
    if (expected[region].n === 0) continue;
    const t = await regionTooltip(region);
    assert.ok(Math.abs(t.sales - expected[region].sales) < 0.005 && Math.abs(t.profit - expected[region].profit) < 0.005, region);
  }
  await app.clickChartAt(regionBand(0), 100, REGIONAL);
  assert.equal(app.cards().join(' | '), expectedKpis(app, { month: '2015-03', region: 'West' }));
  assert.equal(app.trendMarkers().length, 48, 'the trend still shows every month');
  await app.press('Escape'); await app.tick();
  assert.equal(app.cards().join(' | '), NONE_COMBOS, 'Escape clears the month and the region together');
});

test('regional chart: every chart selection at once (region, category, month) combines correctly and clears together', async () => {
  await app.reset();
  await app.clickChartAt(trendX(20, 48)); // September 2015
  await app.clickBar(barFor('Technology'));
  await app.clickChartAt(regionBand(1), 100, REGIONAL); // East
  assert.equal(app.cards().join(' | '), expectedKpis(app, { month: '2015-09', category: 'Technology', region: 'East' }));
  assert.deepEqual(app.comboValues().slice(0, 2), ['East', 'Technology']);
  await app.press('Escape'); await app.tick();
  assert.equal(app.cards().join(' | '), NONE_COMBOS);
  assert.deepEqual(app.comboValues(), ['All Regions', 'All Categories', 'All Segments', 'All Years']);
});

// ================================================================================================
// Revenue by Segment (donut)
// ================================================================================================
const SEGMENT = 'Revenue by Segment';
const segmentRevenue = (f) => Object.fromEntries(SEGMENTS.map((sg) => [sg, slice({ ...f, segment: null }).filter((x) => x.segment === sg).reduce((t, x) => t + x.sales, 0)]));
const sliceFor = (segment) => app.slices().find((g) => g.dataset.segment === segment);
const sliceOpacities = () => app.slices().map((g) => g.getAttribute('opacity'));
/** hover a slice and return its tooltip text */
async function sliceTooltip(segment) {
  await app.hoverBar(sliceFor(segment));
  const text = app.tooltipText(SEGMENT);
  assert.ok(text.includes(segment), `tooltip names ${segment}: "${text}"`);
  return text;
}
const clickSlice = async (segment) => { await app.hoverBar(sliceFor(segment)); await app.tick(30); await app.click(sliceFor(segment)); await app.tick(); };

test('segment chart: title, three slices in the approved colours, leader labels, no callout, nothing hard-coded', async () => {
  await app.reset();
  const card = app.cardBy(SEGMENT);
  assert.equal(card.querySelector('h2').textContent, 'Revenue by Segment');
  assert.equal(card.querySelectorAll('p').length, 0, 'no callout on this card (Figma has none)');
  assert.deepEqual(app.slices().map((g) => g.dataset.segment), SEGMENTS);
  assert.deepEqual(app.slices().map((g) => g.querySelector('path').getAttribute('fill')), ['#3B82F6', '#8B5CF6', '#10B981']);
  assert.ok(sliceOpacities().every((o) => o === '1'), 'nothing dimmed without a selection');
  assert.deepEqual(app.sliceLabels().map((g) => g.querySelector('text').textContent), ['Consumer $1.16M', 'Corporate $706.1K', 'Home Office $429.7K']);
  assert.deepEqual(app.sliceLabels().map((g) => g.querySelector('line').getAttribute('stroke')), ['#2563EB', '#9333EA', '#16A34A']);
});

test('segment chart: each slice shows exact Sales and its share of total sales in the tooltip (revenue, not profit)', async () => {
  await app.reset();
  const rev = segmentRevenue({});
  const totalSales = Object.values(rev).reduce((t, v) => t + v, 0);
  for (const sg of SEGMENTS) {
    const text = await sliceTooltip(sg);
    assert.ok(text.includes(money(rev[sg])), `${sg} exact sales ${money(rev[sg])} in "${text}"`);
    assert.ok(text.includes(`${((rev[sg] / totalSales) * 100).toFixed(1)}%`), `${sg} share`);
    assert.doesNotMatch(text, /profit/i);
  }
  const consumer = await sliceTooltip('Consumer');
  assert.match(consumer, /\$1,161,401\.35/, 'the half-cent case rounds up, like MySQL ROUND');
  assert.match(consumer, /50\.6%/);
});

test('segment chart: Region, Category and Year filters change the slices (checked against the data for every segment)', async () => {
  await app.reset();
  const cases = [{ region: 'West' }, { category: 'Furniture' }, { year: 2016 }, { region: 'South', category: 'Technology' }, { region: 'East', year: 2014 }, { region: 'Central', category: 'Office Supplies', year: 2017 }];
  for (const f of cases) {
    if (f.region) await app.pick(0, REGIONS.indexOf(f.region) + 1);
    if (f.category) await app.pick(1, CATEGORIES.indexOf(f.category) + 1);
    if (f.year) await app.pick(3, [2014, 2015, 2016, 2017].indexOf(f.year) + 1);
    const rev = segmentRevenue(f);
    for (const sg of SEGMENTS) if (rev[sg] > 0) assert.ok((await sliceTooltip(sg)).includes(money(rev[sg])), `${sg} ${JSON.stringify(f)}`);
    assert.equal(app.cards().join(' | '), expectedKpis(app, f), `KPIs ${JSON.stringify(f)}`);
    assert.deepEqual(app.sliceLabels().map((g) => g.dataset.label), SEGMENTS.filter((sg) => rev[sg] > 0));
    await app.reset();
  }
});

test('segment chart: clicking a slice selects it, keeps all three slices, and filters the KPIs and the other charts', async () => {
  await app.reset();
  const before = segmentRevenue({});
  await clickSlice('Corporate');
  assert.equal(app.comboValues()[2], 'Corporate', 'the Segment dropdown shows the selection');
  assert.equal(app.cards().join(' | '), expectedKpis(app, { segment: 'Corporate' }));
  assert.deepEqual(sliceOpacities(), ['0.35', '1', '0.35'], 'selected slice full, others 35%');
  assert.equal(app.slices().length, 3, 'all three slices stay visible');
  for (const sg of SEGMENTS) assert.ok((await sliceTooltip(sg)).includes(money(before[sg])), `${sg} unchanged`);
  assert.equal(app.callout(TREND), app.core.formatCompactCurrency(total({ segment: 'Corporate' })), 'the trend chart follows the segment');
  assert.equal(app.callout(CATEGORY), app.core.formatCompactCurrency(total({ segment: 'Corporate' })), 'and the category chart');
  const regional = regionalFor({ segment: 'Corporate' });
  for (const region of REGIONS) {
    const t = await regionTooltip(region);
    assert.ok(Math.abs(t.sales - regional[region].sales) < 0.005 && Math.abs(t.profit - regional[region].profit) < 0.005, `regional chart follows the segment: ${region}`);
  }
});

test('segment chart: clicking the selected slice again deselects it and restores the previous dropdown value', async () => {
  await app.reset();
  await clickSlice('Consumer');
  assert.equal(app.comboValues()[2], 'Consumer');
  await clickSlice('Consumer');
  assert.equal(app.comboValues()[2], 'All Segments');
  assert.equal(app.cards().join(' | '), NONE_COMBOS);
  assert.ok(sliceOpacities().every((o) => o === '1'));
});

test('segment chart: with a dropdown choice already made, deselecting a clicked slice brings that choice back', async () => {
  await app.reset();
  await app.pick(2, 2); // Segment dropdown = Corporate
  assert.deepEqual(sliceOpacities(), ['0.35', '1', '0.35'], 'the dropdown choice is highlighted too');
  await clickSlice('Home Office');
  assert.equal(app.comboValues()[2], 'Home Office');
  await clickSlice('Home Office');
  assert.equal(app.comboValues()[2], 'Corporate', 'previous dropdown value restored, not "All"');
  assert.equal(app.cards().join(' | '), expectedKpis(app, { segment: 'Corporate' }));
});

test('segment chart: Escape, empty chart space and the card background all clear a slice selection', async () => {
  await app.reset();
  await clickSlice('Home Office');
  await app.press('Escape'); await app.tick();
  assert.equal(app.comboValues()[2], 'All Segments');
  await clickSlice('Home Office');
  await app.clickChartAt(8, 100, SEGMENT); // far left of the ring: empty chart space
  assert.equal(app.comboValues()[2], 'All Segments', 'empty chart space clears');
  await clickSlice('Home Office');
  await app.click(app.cardBy(SEGMENT).querySelector('h2')); await app.tick();
  assert.equal(app.comboValues()[2], 'All Segments', 'card background clears');
  assert.equal(app.cards().join(' | '), NONE_COMBOS);
});

test('segment chart: clicking empty space does not reset a dropdown choice made by hand', async () => {
  await app.reset();
  await app.pick(2, 3); // Home Office, by hand
  await app.clickChartAt(8, 100, SEGMENT);
  assert.equal(app.comboValues()[2], 'Home Office');
  await app.reset();
});

test('segment chart: a month chosen in the trend chart filters the slices, and every selection combines and clears together', async () => {
  await app.reset();
  await app.clickChartAt(trendX(14, 48)); // March 2015
  const rev = segmentRevenue({ month: '2015-03' });
  for (const sg of SEGMENTS) if (rev[sg] > 0) assert.ok((await sliceTooltip(sg)).includes(money(rev[sg])), sg);
  await clickSlice('Consumer');
  assert.equal(app.cards().join(' | '), expectedKpis(app, { month: '2015-03', segment: 'Consumer' }));
  await app.clickBar(barFor('Technology'));
  await app.clickChartAt(regionBand(0), 100, REGIONAL); // West
  assert.equal(app.cards().join(' | '), expectedKpis(app, { month: '2015-03', segment: 'Consumer', category: 'Technology', region: 'West' }));
  assert.deepEqual(app.comboValues().slice(0, 3), ['West', 'Technology', 'Consumer']);
  const monthsWithSales = new Set(slice({ region: 'West', category: 'Technology', segment: 'Consumer' }).map((x) => x.orderDate.slice(0, 7))).size;
  assert.equal(app.trendMarkers().length, monthsWithSales, 'the trend still shows every month that has sales in this slice (the rest are gaps)');
  assert.ok(monthsWithSales < 48, 'this slice has empty months, so the gaps are exercised');
  await app.press('Escape'); await app.tick();
  assert.equal(app.cards().join(' | '), NONE_COMBOS);
  assert.deepEqual(app.comboValues(), ['All Regions', 'All Categories', 'All Segments', 'All Years']);
});

test('segment chart: a segment with no sales in the selected slice has no slice and no label', async () => {
  await app.reset();
  let partial = null;
  outer: for (const y of [2014, 2015, 2016, 2017]) for (let m = 1; m <= 12; m++) for (const r of REGIONS) for (const c of CATEGORIES) {
    const f = { region: r, category: c, year: y, month: `${y}-${String(m).padStart(2, '0')}` };
    const present = SEGMENTS.filter((sg) => segmentRevenue(f)[sg] > 0).length;
    if (present > 0 && present < 3) { partial = f; break outer; }
  }
  assert.ok(partial, 'the data has slices where some segment did not sell');
  await app.pick(0, REGIONS.indexOf(partial.region) + 1);
  await app.pick(1, CATEGORIES.indexOf(partial.category) + 1);
  await app.pick(3, [2014, 2015, 2016, 2017].indexOf(partial.year) + 1);
  await app.clickChartAt(trendX(Number(partial.month.slice(5)) - 1, 12), 100, TREND);
  await app.tick();
  const expected = SEGMENTS.filter((sg) => segmentRevenue(partial)[sg] > 0);
  assert.deepEqual(app.slices().map((g) => g.dataset.segment), expected, JSON.stringify(partial));
  assert.deepEqual(app.sliceLabels().map((g) => g.dataset.label), expected);
  assert.ok(expected.length < 3);
  assert.ok(!/NaN/.test(app.cardBy(SEGMENT).innerHTML));
  await app.reset();
});

// ================================================================================================
// Monthly Sales Trend (checkpoint 4) keeps working next to the new chart
// ================================================================================================
test('trend chart: 48 markers, calculated callout, hover tooltip, click cross-filters the KPIs and clears again', async () => {
  await app.reset();
  assert.equal(app.trendMarkers().length, 48);
  assert.equal(app.callout(TREND), '$2.30M');
  await app.hoverChartAt(trendX(14, 48));
  assert.match(app.tooltipText(), /March 2015/);
  assert.match(app.tooltipText(), /vs previous month/);
  await app.clickChartAt(trendX(14, 48));
  assert.equal(app.cards().join(' | '), expectedKpis(app, { month: '2015-03' }));
  assert.equal(app.trendMarkers().filter((m) => m.getAttribute('opacity') === '0.35').length, 47);
  await app.clickChartAt(trendX(14, 48));
  assert.equal(app.cards().join(' | '), NONE_COMBOS);
});

test('trend chart: dropdown filters and a Year that drops the selected month', async () => {
  await app.reset();
  await app.pick(0, 1);
  assert.equal(app.callout(TREND), app.core.formatCompactCurrency(total({ region: 'West' })));
  await app.pick(3, 3);
  assert.equal(app.trendMarkers().length, 12);
  await app.clickChartAt(trendX(2, 12));
  assert.equal(app.cards().join(' | '), expectedKpis(app, { region: 'West', year: 2016, month: '2016-03' }));
  await app.pick(3, 2);
  assert.ok(app.trendMarkers().every((m) => m.getAttribute('opacity') === '1'), 'month cleared when the year changes');
  await app.reset();
});

// ================================================================================================
// Layout
// ================================================================================================
test('layout: the content starts further from the sidebar, with no component narrower than in Figma', async () => {
  await app.reset();
  const root = () => document.getElementById('root').firstElementChild.firstElementChild;
  assert.equal(root().style.getPropertyValue('--canvas-w'), '1920px', 'a wide window gives the canvas its full width');
  assert.ok(!root().style.transform, 'nothing is scaled in a large window');
  // at the design size every component is exactly as wide as in Figma
  await app.resize(1460, 1024);
  assert.equal(root().style.getPropertyValue('--canvas-w'), '1460px');
  assert.ok(!root().style.transform);
  // narrower than the design: scaled to fit, without any overflow
  await app.resize(1280, 800);
  assert.ok(parseFloat(root().parentElement.style.width) <= 1280 && parseFloat(root().parentElement.style.height) <= 800);
  await app.resize(1920, 1080);
});

test('earlier checkpoints are intact: header, profile, six nav items, four dropdowns, four KPI cards', async () => {
  await app.reset();
  assert.equal(document.querySelector('h1').textContent, 'Overview');
  assert.ok(document.body.textContent.includes('Qurat Ul Ain Tariq'));
  assert.equal(app.q('nav li > *').map((e) => e.style.top).join(), '205px,340px,475px,610px,745px,880px');
  assert.equal(app.q('nav a').length, 1);
  assert.equal(app.q('nav button[aria-disabled="true"]').length, 5);
  assert.equal(app.q('[role="combobox"]').length, 4);
  assert.equal(app.cards().join(' | '), NONE_COMBOS);
  assert.equal(app.q('article svg').map((t) => t.style.right).join(), '15px,15px,14px,14px');
  assert.equal(app.q('article').map((a) => a.style.borderRadius).join(), '20px,25px,25px,25px');
});
