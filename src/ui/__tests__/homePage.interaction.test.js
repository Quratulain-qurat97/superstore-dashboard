
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';

import {
  startHomeApp,
  expectedKpis,
} from './helpers/homeApp.js';

let app;

const REGIONS = ['West', 'East', 'Central', 'South'];
const CATEGORIES = ['Furniture', 'Office Supplies', 'Technology'];
const SEGMENTS = ['Consumer', 'Corporate', 'Home Office'];

const TREND = 'Monthly Sales Trend';
const CATEGORY = 'Sales by Category';
const REGIONAL = 'Regional Performance';
const SEGMENT = 'Sales by Segment';

const NONE_COMBOS = '$2.30M | $286.4K | 5,009 | 793';

const money = (value) => app.core.formatCurrency(value);

before(async () => {
  app = await startHomeApp({ width: 1920, height: 1080 });
});

after(async () => {
  if (app) await app.close();
});

// -------------------------------------------------------------------------------------------------
// Independent calculations from the original transaction data
// -------------------------------------------------------------------------------------------------

const slice = (filters = {}) =>
  app.rows.filter(
    (row) =>
      (!filters.region || row.region === filters.region) &&
      (!filters.category || row.category === filters.category) &&
      (!filters.segment || row.segment === filters.segment) &&
      (!filters.year ||
        row.orderDate.startsWith(String(filters.year))) &&
      (!filters.month ||
        row.orderDate.startsWith(filters.month)),
  );

const total = (filters = {}) =>
  slice(filters).reduce((sum, row) => sum + row.sales, 0);

const categoryRevenue = (filters = {}) =>
  Object.fromEntries(
    CATEGORIES.map((category) => [
      category,
      slice({ ...filters, category: null })
        .filter((row) => row.category === category)
        .reduce((sum, row) => sum + row.sales, 0),
    ]),
  );

const segmentRevenue = (filters = {}) =>
  Object.fromEntries(
    SEGMENTS.map((segment) => [
      segment,
      slice({ ...filters, segment: null })
        .filter((row) => row.segment === segment)
        .reduce((sum, row) => sum + row.sales, 0),
    ]),
  );

const regionalFor = (filters = {}) =>
  Object.fromEntries(
    REGIONS.map((region) => {
      const rows = slice({ ...filters, region });

      return [
        region,
        {
          sales: rows.reduce((sum, row) => sum + row.sales, 0),
          profit: rows.reduce((sum, row) => sum + row.profit, 0),
          count: rows.length,
        },
      ];
    }),
  );

// Coordinates used by the existing chart layout.
const trendX = (index, count) =>
  62.37 +
  (index * (641 - 62.37 - 4.8)) / (count - 1) +
  (index === 0 ? 1 : index === count - 1 ? -1 : 0);

const regionBand = (index) =>
  66.74 + ((index + 0.5) * (660 - 66.74 - 30.9)) / 4;

const barFor = (category) =>
  app.bars().find((bar) => bar.dataset.category === category);

const sliceFor = (segment) =>
  app.slices().find((element) => element.dataset.segment === segment);

const sliceOpacities = () =>
  app.slices().map((element) => element.getAttribute('opacity'));

const regionOpacities = () =>
  REGIONS.map((region) =>
    app.regionBars()
      .filter((bar) => bar.dataset.region === region)
      .map((bar) => bar.getAttribute('opacity')),
  );

const assertNoCallout = (section) => {
  const card = app.cardBy(section);

  assert.ok(card, `chart card "${section}" exists`);

  assert.equal(
    card.querySelector('.callout'),
    null,
    `${section} has no callout`,
  );
};

async function tooltipSales(category) {
  await app.hoverBar(barFor(category));

  const text = app.tooltipText(CATEGORY);

  assert.ok(
    text.includes(category),
    `tooltip names ${category}: "${text}"`,
  );

  const match = /Sales\$([\d,]+\.\d\d)/.exec(text);

  assert.ok(match, `tooltip contains exact sales: "${text}"`);

  return Number(match[1].replace(/,/g, ''));
}

const parseMoney = (text, label) => {
  const match = new RegExp(
    `${label}(-?)\\$([\\d,]+\\.\\d\\d)`,
  ).exec(text);

  assert.ok(match, `"${label}" exists in tooltip "${text}"`);

  return (
    (match[1] ? -1 : 1) *
    Number(match[2].replace(/,/g, ''))
  );
};

async function regionTooltip(region) {
  await app.hoverChartAt(
    regionBand(REGIONS.indexOf(region)),
    100,
    REGIONAL,
  );

  const text = app.tooltipText(REGIONAL);

  assert.ok(
    text.includes(region),
    `regional tooltip names ${region}: "${text}"`,
  );

  return {
    sales: parseMoney(text, 'Sales'),
    profit: parseMoney(text, 'Profit'),
    text,
  };
}

async function sliceTooltip(segment) {
  await app.hoverBar(sliceFor(segment));

  const text = app.tooltipText(SEGMENT);

  assert.ok(
    text.includes(segment),
    `segment tooltip names ${segment}: "${text}"`,
  );

  return text;
}

const clickSlice = async (segment) => {
  await app.hoverBar(sliceFor(segment));
  await app.tick(30);
  await app.click(sliceFor(segment));
  await app.tick();
};

// ================================================================================================
// Category chart
// ================================================================================================

test('category chart: title, three bars, approved colours, axis labels and no callout', async () => {
  await app.reset();

  const card = app.cardBy(CATEGORY);

  assert.equal(card.querySelector('h2').textContent, CATEGORY);

  assert.deepEqual(
    app.bars().map((bar) => bar.dataset.category),
    CATEGORIES,
  );

  assert.deepEqual(
    app.bars().map((bar) => bar.getAttribute('fill')),
    ['#3B82F6', '#8B5CF6', '#10B981'],
  );

  assert.ok(
    app.bars().every((bar) => bar.getAttribute('opacity') === '1'),
  );

  assert.deepEqual(
    app.axisTickLabels(CATEGORY, 'x'),
    CATEGORIES,
  );

  assertNoCallout(CATEGORY);
});

test('category chart: bar heights are proportional to real revenue', async () => {
  await app.reset();

  const revenue = categoryRevenue({});

  const heights = Object.fromEntries(
    app.bars().map((bar) => [
      bar.dataset.category,
      app.pathBounds(bar).height,
    ]),
  );

  for (const first of CATEGORIES) {
    for (const second of CATEGORIES) {
      const actualRatio = heights[first] / heights[second];
      const expectedRatio = revenue[first] / revenue[second];

      assert.ok(
        Math.abs(actualRatio - expectedRatio) < 1e-3,
        `${first}/${second}: actual ${actualRatio}, expected ${expectedRatio}`,
      );
    }
  }
});

test('category chart: hovering each bar shows exact sales and share', async () => {
  await app.reset();

  const revenue = categoryRevenue({});

  for (const category of CATEGORIES) {
    const actual = await tooltipSales(category);

    assert.ok(
      Math.abs(actual - revenue[category]) < 0.005,
      `${category} sales`,
    );
  }

  await app.hoverBar(barFor('Technology'));

  const text = app.tooltipText(CATEGORY);

  assert.match(text, /\$836,154\.03/);
  assert.match(text, /36\.4%/);
  assert.doesNotMatch(text, /profit/i);
});

test('category chart: Region, Segment and Year filters update category sales', async () => {
  await app.reset();

  const cases = [
    { region: 'West' },
    { segment: 'Corporate' },
    { year: 2016 },
    { region: 'South', segment: 'Home Office' },
    { region: 'East', year: 2014 },
    { region: 'Central', segment: 'Consumer', year: 2017 },
    { region: 'West', segment: 'Corporate', year: 2015 },
  ];

  for (const filters of cases) {
    if (filters.region) {
      await app.pick(0, REGIONS.indexOf(filters.region) + 1);
    }

    if (filters.segment) {
      await app.pick(2, SEGMENTS.indexOf(filters.segment) + 1);
    }

    if (filters.year) {
      await app.pick(3, [2014, 2015, 2016, 2017].indexOf(filters.year) + 1);
    }

    const expected = categoryRevenue(filters);

    for (const category of CATEGORIES) {
      if (expected[category] > 0) {
        const actual = await tooltipSales(category);

        assert.ok(
          Math.abs(actual - expected[category]) < 0.005,
          `${category} ${JSON.stringify(filters)}`,
        );
      }
    }

    assert.equal(
      app.cards().join(' | '),
      expectedKpis(app, filters),
      `KPIs ${JSON.stringify(filters)}`,
    );

    assertNoCallout(CATEGORY);

    await app.reset();
  }
});

test('category chart: clicking a bar selects its category and filters the other charts', async () => {
  await app.reset();

  const before = categoryRevenue({});

  await app.clickBar(barFor('Technology'));

  assert.equal(app.comboValues()[1], 'Technology');

  assert.equal(
    app.cards().join(' | '),
    expectedKpis(app, { category: 'Technology' }),
  );

  assert.deepEqual(
    app.bars().map((bar) => bar.getAttribute('opacity')),
    ['0.35', '0.35', '1'],
  );

  assert.equal(app.bars().length, 3);

  for (const category of CATEGORIES) {
    const actual = await tooltipSales(category);

    assert.ok(
      Math.abs(actual - before[category]) < 0.005,
      `${category} remains visible for comparison`,
    );
  }

  assertNoCallout(CATEGORY);
  assertNoCallout(TREND);
});

test('category chart: clicking the selected bar again clears the selection', async () => {
  await app.reset();

  await app.clickBar(barFor('Furniture'));

  assert.equal(app.comboValues()[1], 'Furniture');

  await app.clickBar(barFor('Furniture'));

  assert.equal(app.comboValues()[1], 'All Categories');
  assert.equal(app.cards().join(' | '), NONE_COMBOS);

  assert.ok(
    app.bars().every((bar) => bar.getAttribute('opacity') === '1'),
  );
});

test('category chart: deselection restores a previous dropdown choice', async () => {
  await app.reset();

  await app.pick(1, 1);

  assert.deepEqual(
    app.bars().map((bar) => bar.getAttribute('opacity')),
    ['1', '0.35', '0.35'],
  );

  await app.clickBar(barFor('Technology'));
  await app.clickBar(barFor('Technology'));

  assert.equal(app.comboValues()[1], 'Furniture');

  assert.equal(
    app.cards().join(' | '),
    expectedKpis(app, { category: 'Furniture' }),
  );
});

test('category chart: Escape and empty chart space clear a clicked selection', async () => {
  await app.reset();

  await app.clickBar(barFor('Office Supplies'));
  await app.press('Escape');
  await app.tick();

  assert.equal(app.comboValues()[1], 'All Categories');

  await app.clickBar(barFor('Office Supplies'));
  await app.clickChartAt(8, 100, CATEGORY);

  assert.equal(app.comboValues()[1], 'All Categories');
});

test('category chart: empty chart space preserves a manual dropdown choice', async () => {
  await app.reset();

  await app.pick(1, 3);
  await app.clickChartAt(8, 100, CATEGORY);

  assert.equal(app.comboValues()[1], 'Technology');

  await app.reset();
});

test('category chart: a selected month filters the bars and combines with category selection', async () => {
  await app.reset();

  await app.clickChartAt(trendX(14, 48));

  const revenue = categoryRevenue({ month: '2015-03' });

  for (const category of CATEGORIES) {
    if (revenue[category] > 0) {
      const actual = await tooltipSales(category);

      assert.ok(
        Math.abs(actual - revenue[category]) < 0.005,
        category,
      );
    }
  }

  await app.clickBar(barFor('Technology'));

  assert.equal(
    app.cards().join(' | '),
    expectedKpis(app, {
      month: '2015-03',
      category: 'Technology',
    }),
  );

  assert.equal(app.trendMarkers().length, 48);

  await app.press('Escape');
  await app.tick();

  assert.equal(app.cards().join(' | '), NONE_COMBOS);
});

test('category chart: categories without sales have no bar but retain their axis label', async () => {
  await app.reset();

  let partial = null;

  outer:
  for (const year of [2014, 2015, 2016, 2017]) {
    for (let month = 1; month <= 12; month++) {
      for (const region of REGIONS) {
        for (const segment of SEGMENTS) {
          const filters = {
            region,
            segment,
            year,
            month: `${year}-${String(month).padStart(2, '0')}`,
          };

          const present = CATEGORIES.filter(
            (category) => categoryRevenue(filters)[category] > 0,
          ).length;

          if (present > 0 && present < 3) {
            partial = filters;
            break outer;
          }
        }
      }
    }
  }

  assert.ok(partial, 'data contains a slice with missing categories');

  await app.pick(0, REGIONS.indexOf(partial.region) + 1);
  await app.pick(2, SEGMENTS.indexOf(partial.segment) + 1);
  await app.pick(3, [2014, 2015, 2016, 2017].indexOf(partial.year) + 1);

  await app.clickChartAt(
    trendX(Number(partial.month.slice(5)) - 1, 12),
    100,
    TREND,
  );

  await app.tick();

  const expected = CATEGORIES.filter(
    (category) => categoryRevenue(partial)[category] > 0,
  );

  assert.deepEqual(
    app.bars().map((bar) => bar.dataset.category),
    expected,
  );

  assert.deepEqual(
    app.axisTickLabels(CATEGORY, 'x'),
    CATEGORIES,
  );

  assert.ok(!/NaN/.test(app.cardBy(CATEGORY).innerHTML));

  await app.reset();
});

// ================================================================================================
// Regional Performance
// ================================================================================================

test('regional chart: title, legend, eight bars, axis labels and no callout', async () => {
  await app.reset();

  const card = app.cardBy(REGIONAL);

  assert.equal(card.querySelector('h2').textContent, REGIONAL);

  assert.match(card.textContent, /Sales/);
  assert.match(card.textContent, /Profit/);

  const swatches = [
    ...card.querySelectorAll('div > span > span[aria-hidden="true"]'),
  ].map((element) => element.style.background);

  assert.deepEqual(
    swatches.slice(0, 2),
    ['rgb(59, 130, 246)', 'rgb(16, 185, 129)'],
  );

  assert.deepEqual(
    app.regionBars().map((bar) => bar.dataset.region),
    ['West', 'East', 'Central', 'South', 'West', 'East', 'Central', 'South'],
  );

  assert.deepEqual(
    app.regionBars().map((bar) => bar.getAttribute('fill')),
    [
      ...Array(4).fill('#3B82F6'),
      ...Array(4).fill('#10B981'),
    ],
  );

  assert.deepEqual(
    app.regionBars().map((bar) => bar.dataset.measure),
    [
      ...Array(4).fill('sales'),
      ...Array(4).fill('profit'),
    ],
  );

  assert.deepEqual(
    app.axisTickLabels(REGIONAL, 'x'),
    REGIONS,
  );

  assertNoCallout(REGIONAL);
});

test('regional chart: all regions show exact Sales, Profit and margin', async () => {
  await app.reset();

  const expected = regionalFor({});

  for (const region of REGIONS) {
    const tooltip = await regionTooltip(region);

    assert.ok(
      Math.abs(tooltip.sales - expected[region].sales) < 0.005,
      `${region} sales`,
    );

    assert.ok(
      Math.abs(tooltip.profit - expected[region].profit) < 0.005,
      `${region} profit`,
    );

    assert.match(
      tooltip.text,
      new RegExp(
        `${(expected[region].profit / expected[region].sales * 100).toFixed(1)}%`,
      ),
    );
  }

  const west = await regionTooltip('West');

  assert.match(west.text, /\$725,457\.82/);
  assert.match(west.text, /\$108,418\.45/);
});

test('regional chart: bar heights are proportional to Sales and Profit', async () => {
  await app.reset();

  const expected = regionalFor({});

  const ratios = app.regionBars().map((bar) => {
    const bounds = app.pathBounds(bar);
    const value = expected[bar.dataset.region][bar.dataset.measure];

    return bounds.height / value;
  });

  const average = ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length;

  for (const ratio of ratios) {
    assert.ok(
      Math.abs(ratio - average) < 1e-8,
      'all bars use the same vertical scale',
    );
  }
});

test('regional chart: Category, Segment and Year filters update every region', async () => {
  await app.reset();

  const cases = [
    { category: 'Technology' },
    { segment: 'Corporate' },
    { year: 2016 },
    { category: 'Office Supplies', segment: 'Home Office' },
    { category: 'Furniture', year: 2014 },
    { category: 'Technology', segment: 'Consumer', year: 2017 },
  ];

  for (const filters of cases) {
    if (filters.category) {
      await app.pick(1, CATEGORIES.indexOf(filters.category) + 1);
    }

    if (filters.segment) {
      await app.pick(2, SEGMENTS.indexOf(filters.segment) + 1);
    }

    if (filters.year) {
      await app.pick(3, [2014, 2015, 2016, 2017].indexOf(filters.year) + 1);
    }

    const expected = regionalFor(filters);

    for (const region of REGIONS) {
      const tooltip = await regionTooltip(region);

      assert.ok(
        Math.abs(tooltip.sales - expected[region].sales) < 0.005 &&
        Math.abs(tooltip.profit - expected[region].profit) < 0.005,
        `${region} ${JSON.stringify(filters)}`,
      );
    }

    assert.equal(
      app.cards().join(' | '),
      expectedKpis(app, filters),
    );

    await app.reset();
  }
});

test('regional chart: negative Furniture profit is drawn below the zero line', async () => {
  await app.reset();

  await app.pick(1, 1);

  const tooltip = await regionTooltip('Central');

  assert.ok(Math.abs(tooltip.profit - -2871.05) < 0.005);
  assert.match(tooltip.text, /-\$2,871\.05/);
  assert.match(tooltip.text, /-\d+\.\d%/);

  const loss = app.regionBars().find(
    (bar) =>
      bar.dataset.region === 'Central' &&
      bar.dataset.measure === 'profit',
  );

  const gain = app.regionBars().find(
    (bar) =>
      bar.dataset.region === 'West' &&
      bar.dataset.measure === 'profit',
  );

  const lossBounds = app.pathBounds(loss);
  const gainBounds = app.pathBounds(gain);

  assert.ok(
    Math.abs(lossBounds.minY - gainBounds.maxY) < 0.05,
    'negative bar begins at the zero line and extends below it',
  );

  assert.ok(
    app.axisTickLabels(REGIONAL, 'y').some((label) => /^-\$/.test(label)),
    'the vertical axis includes negative currency labels',
  );

  assert.ok(!/NaN/.test(app.cardBy(REGIONAL).innerHTML));

  await app.reset();
});

test('regional chart: clicking a region selects it and filters other charts', async () => {
  await app.reset();

  const before = regionalFor({});

  await app.clickChartAt(regionBand(2), 100, REGIONAL);

  assert.equal(app.comboValues()[0], 'Central');

  assert.equal(
    app.cards().join(' | '),
    expectedKpis(app, { region: 'Central' }),
  );

  assert.deepEqual(
    regionOpacities(),
    [
      ['0.35', '0.35'],
      ['0.35', '0.35'],
      ['1', '1'],
      ['0.35', '0.35'],
    ],
  );

  assert.equal(app.regionBars().length, 8);

  for (const region of REGIONS) {
    const tooltip = await regionTooltip(region);

    assert.ok(
      Math.abs(tooltip.sales - before[region].sales) < 0.005 &&
      Math.abs(tooltip.profit - before[region].profit) < 0.005,
      `${region} remains visible for comparison`,
    );
  }

  assertNoCallout(TREND);
  assertNoCallout(CATEGORY);
});

test('regional chart: clicking the selected region again clears it', async () => {
  await app.reset();

  await app.clickChartAt(regionBand(0), 100, REGIONAL);

  assert.equal(app.comboValues()[0], 'West');

  await app.clickChartAt(regionBand(0), 100, REGIONAL);

  assert.equal(app.comboValues()[0], 'All Regions');
  assert.equal(app.cards().join(' | '), NONE_COMBOS);
});

test('regional chart: deselection restores a previous dropdown choice', async () => {
  await app.reset();

  await app.pick(0, 4);

  await app.clickChartAt(regionBand(1), 100, REGIONAL);
  await app.clickChartAt(regionBand(1), 100, REGIONAL);

  assert.equal(app.comboValues()[0], 'South');

  assert.equal(
    app.cards().join(' | '),
    expectedKpis(app, { region: 'South' }),
  );
});

test('regional chart: Escape and empty chart space clear a region selection', async () => {
  await app.reset();

  await app.clickChartAt(regionBand(3), 100, REGIONAL);
  await app.press('Escape');
  await app.tick();

  assert.equal(app.comboValues()[0], 'All Regions');

  await app.clickChartAt(regionBand(3), 100, REGIONAL);
  await app.clickChartAt(8, 100, REGIONAL);

  assert.equal(app.comboValues()[0], 'All Regions');
});

test('regional chart: empty chart space preserves a manual dropdown choice', async () => {
  await app.reset();

  await app.pick(0, 2);
  await app.clickChartAt(8, 100, REGIONAL);

  assert.equal(app.comboValues()[0], 'East');

  await app.reset();
});

test('regional chart: month and region selections combine and clear together', async () => {
  await app.reset();

  await app.clickChartAt(trendX(14, 48));

  await app.clickChartAt(regionBand(0), 100, REGIONAL);

  assert.equal(
    app.cards().join(' | '),
    expectedKpis(app, {
      month: '2015-03',
      region: 'West',
    }),
  );

  assert.equal(app.trendMarkers().length, 48);

  await app.press('Escape');
  await app.tick();

  assert.equal(app.cards().join(' | '), NONE_COMBOS);
});

// ================================================================================================
// Segment donut chart
// ================================================================================================

test('segment chart: title, three slices, colours, currency labels and no callout', async () => {
  await app.reset();

  const card = app.cardBy(SEGMENT);

  assert.equal(card.querySelector('h2').textContent, SEGMENT);

  assert.deepEqual(
    app.slices().map((element) => element.dataset.segment),
    SEGMENTS,
  );

  assert.deepEqual(
    app.slices().map((element) => element.getAttribute('fill')),
    ['#3B82F6', '#8B5CF6', '#10B981'],
  );

  assert.ok(
    sliceOpacities().every((opacity) => opacity === '1'),
  );

  const revenue = segmentRevenue({});

  assert.deepEqual(
    app.sliceLabels().map((group) => group.dataset.label),
    SEGMENTS,
  );

  assert.deepEqual(
    app.sliceLabels().map((group) => group.querySelector('text').textContent),
    SEGMENTS.map((segment) =>
      app.core.formatCompactCurrency(revenue[segment]),
    ),
  );

  assertNoCallout(SEGMENT);
});

test('segment chart: each slice shows exact Sales and share in the tooltip', async () => {
  await app.reset();

  const revenue = segmentRevenue({});
  const totalSales = Object.values(revenue).reduce((sum, value) => sum + value, 0);

  for (const segment of SEGMENTS) {
    const text = await sliceTooltip(segment);

    assert.ok(
      text.includes(money(revenue[segment])),
      `${segment} exact sales`,
    );

    assert.ok(
      text.includes(
        `${((revenue[segment] / totalSales) * 100).toFixed(1)}%`,
      ),
      `${segment} share`,
    );

    assert.doesNotMatch(text, /profit/i);
  }

  const consumer = await sliceTooltip('Consumer');

  assert.match(consumer, /\$1,161,401\.35/);
  assert.match(consumer, /50\.6%/);
});

test('segment chart: Region, Category and Year filters update the slices', async () => {
  await app.reset();

  const cases = [
    { region: 'West' },
    { category: 'Furniture' },
    { year: 2016 },
    { region: 'South', category: 'Technology' },
    { region: 'East', year: 2014 },
    { region: 'Central', category: 'Office Supplies', year: 2017 },
  ];

  for (const filters of cases) {
    if (filters.region) {
      await app.pick(0, REGIONS.indexOf(filters.region) + 1);
    }

    if (filters.category) {
      await app.pick(1, CATEGORIES.indexOf(filters.category) + 1);
    }

    if (filters.year) {
      await app.pick(3, [2014, 2015, 2016, 2017].indexOf(filters.year) + 1);
    }

    const expected = segmentRevenue(filters);

    for (const segment of SEGMENTS) {
      if (expected[segment] > 0) {
        const text = await sliceTooltip(segment);

        assert.ok(
          text.includes(money(expected[segment])),
          `${segment} ${JSON.stringify(filters)}`,
        );
      }
    }

    assert.equal(
      app.cards().join(' | '),
      expectedKpis(app, filters),
    );

    assert.deepEqual(
      app.sliceLabels().map((group) => group.dataset.label),
      SEGMENTS.filter((segment) => expected[segment] > 0),
    );

    await app.reset();
  }
});

test('segment chart: clicking a slice selects it and filters other charts', async () => {
  await app.reset();

  const before = segmentRevenue({});

  await clickSlice('Corporate');

  assert.equal(app.comboValues()[2], 'Corporate');

  assert.equal(
    app.cards().join(' | '),
    expectedKpis(app, { segment: 'Corporate' }),
  );

  assert.deepEqual(
    sliceOpacities(),
    ['0.35', '1', '0.35'],
  );

  assert.equal(app.slices().length, 3);

  for (const segment of SEGMENTS) {
    const text = await sliceTooltip(segment);

    assert.ok(
      text.includes(money(before[segment])),
      `${segment} remains visible for comparison`,
    );
  }

  assertNoCallout(TREND);
  assertNoCallout(CATEGORY);

  const regional = regionalFor({ segment: 'Corporate' });

  for (const region of REGIONS) {
    const tooltip = await regionTooltip(region);

    assert.ok(
      Math.abs(tooltip.sales - regional[region].sales) < 0.005 &&
      Math.abs(tooltip.profit - regional[region].profit) < 0.005,
      `${region} reflects the segment selection`,
    );
  }
});

test('segment chart: clicking the selected slice again clears it', async () => {
  await app.reset();

  await clickSlice('Consumer');

  assert.equal(app.comboValues()[2], 'Consumer');

  await clickSlice('Consumer');

  assert.equal(app.comboValues()[2], 'All Segments');
  assert.equal(app.cards().join(' | '), NONE_COMBOS);

  assert.ok(
    sliceOpacities().every((opacity) => opacity === '1'),
  );
});

test('segment chart: deselection restores a previous dropdown choice', async () => {
  await app.reset();

  await app.pick(2, 2);

  await clickSlice('Home Office');
  await clickSlice('Home Office');

  assert.equal(app.comboValues()[2], 'Corporate');

  assert.equal(
    app.cards().join(' | '),
    expectedKpis(app, { segment: 'Corporate' }),
  );
});

test('segment chart: Escape and empty chart space clear a slice selection', async () => {
  await app.reset();

  await clickSlice('Home Office');
  await app.press('Escape');
  await app.tick();

  assert.equal(app.comboValues()[2], 'All Segments');

  await clickSlice('Home Office');
  await app.clickChartAt(8, 100, SEGMENT);

  assert.equal(app.comboValues()[2], 'All Segments');
});

test('segment chart: empty chart space preserves a manual dropdown choice', async () => {
  await app.reset();

  await app.pick(2, 3);
  await app.clickChartAt(8, 100, SEGMENT);

  assert.equal(app.comboValues()[2], 'Home Office');

  await app.reset();
});

test('segment chart: month and segment selections combine and clear together', async () => {
  await app.reset();

  await app.clickChartAt(trendX(14, 48));

  const revenue = segmentRevenue({ month: '2015-03' });

  for (const segment of SEGMENTS) {
    if (revenue[segment] > 0) {
      const text = await sliceTooltip(segment);

      assert.ok(
        text.includes(money(revenue[segment])),
        segment,
      );
    }
  }

  await clickSlice('Consumer');

  assert.equal(
    app.cards().join(' | '),
    expectedKpis(app, {
      month: '2015-03',
      segment: 'Consumer',
    }),
  );

  await app.press('Escape');
  await app.tick();

  assert.equal(app.cards().join(' | '), NONE_COMBOS);
});

test('segment chart: segments without sales have no slice and no label', async () => {
  await app.reset();

  let partial = null;

  outer:
  for (const year of [2014, 2015, 2016, 2017]) {
    for (let month = 1; month <= 12; month++) {
      for (const region of REGIONS) {
        for (const category of CATEGORIES) {
          const filters = {
            region,
            category,
            year,
            month: `${year}-${String(month).padStart(2, '0')}`,
          };

          const present = SEGMENTS.filter(
            (segment) => segmentRevenue(filters)[segment] > 0,
          ).length;

          if (present > 0 && present < 3) {
            partial = filters;
            break outer;
          }
        }
      }
    }
  }

  assert.ok(partial, 'data contains a slice with missing segments');

  await app.pick(0, REGIONS.indexOf(partial.region) + 1);
  await app.pick(1, CATEGORIES.indexOf(partial.category) + 1);
  await app.pick(3, [2014, 2015, 2016, 2017].indexOf(partial.year) + 1);

  await app.clickChartAt(
    trendX(Number(partial.month.slice(5)) - 1, 12),
    100,
    TREND,
  );

  await app.tick();

  const expected = SEGMENTS.filter(
    (segment) => segmentRevenue(partial)[segment] > 0,
  );

  assert.deepEqual(
    app.slices().map((element) => element.dataset.segment),
    expected,
  );

  assert.deepEqual(
    app.sliceLabels().map((group) => group.dataset.label),
    expected,
  );

  assert.ok(expected.length < 3);
  assert.ok(!/NaN/.test(app.cardBy(SEGMENT).innerHTML));

  await app.reset();
});

// ================================================================================================
// Monthly Sales Trend
// ================================================================================================

test('trend chart: 48 markers, tooltip, month selection and Escape clearing', async () => {
  await app.reset();

  assert.equal(app.trendMarkers().length, 48);
  assertNoCallout(TREND);

  await app.hoverChartAt(trendX(14, 48));

  const tooltip = app.tooltipText(TREND);

  assert.match(tooltip, /March 2015/);
  assert.match(tooltip, /Sales/);
  assert.match(tooltip, /vs previous month/);

  await app.clickChartAt(trendX(14, 48));

  assert.equal(
    app.cards().join(' | '),
    expectedKpis(app, { month: '2015-03' }),
  );

  assert.equal(
    app.trendMarkers().filter(
      (marker) => marker.getAttribute('opacity') === '0.35',
    ).length,
    47,
  );

  await app.press('Escape');
  await app.tick();

  assert.equal(app.cards().join(' | '), NONE_COMBOS);
});

test('trend chart: dropdown filters update the trend and changing year clears an incompatible month', async () => {
  await app.reset();

  await app.pick(0, 1);

  assert.equal(
    app.cards().join(' | '),
    expectedKpis(app, { region: 'West' }),
  );

  await app.pick(3, 3);

  assert.equal(app.trendMarkers().length, 12);

  await app.clickChartAt(trendX(2, 12));

  assert.equal(
    app.cards().join(' | '),
    expectedKpis(app, {
      region: 'West',
      year: 2016,
      month: '2016-03',
    }),
  );

  await app.pick(3, 2);

  assert.ok(
    app.trendMarkers().every(
      (marker) => marker.getAttribute('opacity') === '1',
    ),
    'month selection is cleared when the year changes',
  );

  await app.reset();
});

// ================================================================================================
// Layout and existing page structure
// ================================================================================================

test('layout: content sizing responds to wide, design and narrow viewports', async () => {
  await app.reset();

  const root = () =>
    document.getElementById('root').firstElementChild.firstElementChild;

  assert.equal(
    root().style.getPropertyValue('--canvas-w'),
    '1920px',
  );

  assert.ok(!root().style.transform);

  await app.resize(1460, 1024);

  assert.equal(
    root().style.getPropertyValue('--canvas-w'),
    '1460px',
  );

  assert.ok(!root().style.transform);

  await app.resize(1280, 800);

  assert.ok(
    parseFloat(root().parentElement.style.width) <= 1280 &&
    parseFloat(root().parentElement.style.height) <= 800,
  );

  await app.resize(1920, 1080);
});

test('existing checkpoints: header, navigation, dropdowns and KPI cards remain intact', async () => {
  await app.reset();

  assert.equal(
    document.querySelector('h1').textContent,
    'Overview',
  );

  const navItems = app.q(
    'nav[aria-label="Pages"] li',
  );

  assert.equal(
    navItems.length,
    6,
    'sidebar contains six navigation items',
  );

  assert.ok(
    navItems.every((item) =>
      item.querySelector('a, button'),
    ),
    'every navigation item contains a link or button',
  );

  assert.equal(
    app.q('nav[aria-label="Pages"] a').length,
    6,
    'sidebar contains six active navigation links',
  );


  assert.equal(
    app.q('[role="combobox"]').length,
    4,
  );

  assert.equal(
    app.cards().join(' | '),
    NONE_COMBOS,
  );

  assert.equal(
    app.q('article svg').map((element) => element.style.right).join(),
    '15px,15px,14px,14px',
  );

  assert.equal(
    app.q('article').map((element) => element.style.borderRadius).join(),
    '20px,25px,25px,25px',
  );
});
