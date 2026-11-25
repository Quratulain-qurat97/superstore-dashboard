
import test from 'node:test';
import assert from 'node:assert/strict';

import { rows } from './helpers/loadRows.js';

import {
  REGIONS,
  buildSalesData,
  buildSalesCategorySeries,
  buildSalesRegionalSeries,
  buildSalesTrendSeries,
} from '../index.js';

const none = {
  region: null,
  category: null,
  segment: null,
  year: null,
  month: null,
  subCategory: null,
  discountGroup: null,
};

const near = (a, b, tolerance = 1e-6) =>
  Math.abs(a - b) < tolerance;

const sum = (source, field) =>
  source.reduce((total, row) => total + row[field], 0);

// Independent filter implementation used as a reference.
function manuallyFilterRows(source, filters = {}) {
  return source.filter((row) => {
    if (filters.region && row.region !== filters.region) return false;
    if (filters.category && row.category !== filters.category) return false;
    if (filters.segment && row.segment !== filters.segment) return false;

    if (
      filters.year &&
      !row.orderDate.startsWith(String(filters.year))
    ) {
      return false;
    }

    if (filters.month && !row.orderDate.startsWith(filters.month)) {
      return false;
    }

    if (
      filters.subCategory &&
      row.subCategory !== filters.subCategory
    ) {
      return false;
    }

    return true;
  });
}

function independentlyCalculateKpis(source) {
  const totalSales = sum(source, 'sales');
  const totalProfit = sum(source, 'profit');

  const states = new Map();

  for (const row of source) {
    states.set(
      row.state,
      (states.get(row.state) ?? 0) + row.profit,
    );
  }

  return {
    totalSales,
    totalProfit,
    profitMargin:
      totalSales === 0 ? null : (totalProfit / totalSales) * 100,
    lossMakingStateCount: [...states.values()].filter(
      (profit) => profit < 0,
    ).length,
    rowCount: source.length,
  };
}

function independentlyCalculateRegions(source) {
  const groups = new Map();

  for (const row of source) {
    const group = groups.get(row.region) ?? {
      sales: 0,
      profit: 0,
    };

    group.sales += row.sales;
    group.profit += row.profit;

    groups.set(row.region, group);
  }

  return groups;
}

// ------------------------------------------------------------
// Sales KPIs
// ------------------------------------------------------------

test('unfiltered Sales KPIs match independent transaction calculations', () => {
  const actual = buildSalesData(rows, none).kpis;
  const expected = independentlyCalculateKpis(rows);

  assert.ok(near(actual.totalSales, expected.totalSales));
  assert.ok(near(actual.totalProfit, expected.totalProfit));
  assert.ok(near(actual.profitMargin, expected.profitMargin));

  assert.equal(
    actual.lossMakingStateCount,
    expected.lossMakingStateCount,
  );

  assert.equal(actual.rowCount, expected.rowCount);
});

test('Sales KPIs respond to all active filters', () => {
  const filters = {
    ...none,
    region: 'West',
    category: 'Furniture',
    segment: 'Consumer',
    year: 2016,
    subCategory: 'Tables',
  };

  const filteredRows = manuallyFilterRows(rows, filters);

  const expected = independentlyCalculateKpis(filteredRows);
  const actual = buildSalesData(rows, filters).kpis;

  assert.ok(near(actual.totalSales, expected.totalSales));
  assert.ok(near(actual.totalProfit, expected.totalProfit));
  assert.ok(near(actual.profitMargin, expected.profitMargin));

  assert.equal(
    actual.lossMakingStateCount,
    expected.lossMakingStateCount,
  );

  assert.equal(actual.rowCount, expected.rowCount);
});

test('Month selection overrides the Year filter for KPI calculations', () => {
  const filters = {
    ...none,
    year: 2016,
    month: '2016-11',
  };

  const filteredRows = manuallyFilterRows(rows, filters);

  const actual = buildSalesData(rows, filters).kpis;
  const expected = independentlyCalculateKpis(filteredRows);

  assert.ok(near(actual.totalSales, expected.totalSales));
  assert.ok(near(actual.totalProfit, expected.totalProfit));
  assert.equal(actual.rowCount, expected.rowCount);
});

test('loss-making state count counts states with negative aggregate profit', () => {
  const data = buildSalesData(rows, none);

  const expected = [...independentlyCalculateRegions(rows).entries()]
    .map(([region, values]) => ({ region, ...values }));

  const stateProfits = new Map();

  for (const row of rows) {
    stateProfits.set(
      row.state,
      (stateProfits.get(row.state) ?? 0) + row.profit,
    );
  }

  assert.equal(
    data.kpis.lossMakingStateCount,
    [...stateProfits.values()].filter((profit) => profit < 0).length,
  );

  assert.equal(data.lossStates.count, data.kpis.lossMakingStateCount);
  assert.equal(data.lossStates.states.length, data.lossStates.count);
  assert.ok(expected.length > 0);
});

// ------------------------------------------------------------
// Monthly year-over-year trend
// ------------------------------------------------------------

test('monthly trend always contains twelve calendar months', () => {
  const data = buildSalesData(rows, none);

  assert.equal(data.monthlyTrend.length, 12);

  assert.deepEqual(
    data.monthlyTrend.map((item) => item.monthNumber),
    Array.from({ length: 12 }, (_, index) => index + 1),
  );
});

test('monthly trend compares selected year with the previous year', () => {
  const selectedYear = 2017;

  const trend = buildSalesTrendSeries(rows, selectedYear);

  assert.equal(trend.length, 12);

  for (const item of trend) {
    const month = String(item.monthNumber).padStart(2, '0');

    const currentRows = rows.filter(
      (row) => row.orderDate.startsWith(`${selectedYear}-${month}`),
    );

    const previousRows = rows.filter(
      (row) => row.orderDate.startsWith(`${selectedYear - 1}-${month}`),
    );

    const expectedSales = sum(currentRows, 'sales');
    const expectedPreviousSales = sum(previousRows, 'sales');

    assert.ok(near(item.sales, expectedSales));
    assert.ok(near(item.previousSales, expectedPreviousSales));
    assert.ok(
      near(
        item.difference,
        expectedSales - expectedPreviousSales,
      ),
    );
  }
});

test('monthly trend ignores Year and Month but respects other filters', () => {
  const filters = {
    ...none,
    region: 'West',
    category: 'Furniture',
    segment: 'Consumer',
    subCategory: 'Tables',
    year: 2016,
    month: '2016-11',
  };

  const data = buildSalesData(rows, filters);

  const trendRows = manuallyFilterRows(rows, {
    ...filters,
    year: null,
    month: null,
  });

  const expected = buildSalesTrendSeries(trendRows, 2016);

  assert.equal(data.monthlyTrend.length, 12);

  for (let index = 0; index < 12; index++) {
    assert.ok(
      near(data.monthlyTrend[index].sales, expected[index].sales),
    );

    assert.ok(
      near(
        data.monthlyTrend[index].previousSales,
        expected[index].previousSales,
      ),
    );
  }
});

test('2014 monthly trend has no previous-year comparison', () => {
  const trend = buildSalesTrendSeries(rows, 2014);

  assert.equal(trend.length, 12);

  for (const item of trend) {
    assert.equal(item.previousSales, null);
    assert.equal(item.previousMonthKey, null);
    assert.equal(item.difference, null);
    assert.equal(item.percentageChange, null);
  }
});

// ------------------------------------------------------------
// Regional sales contribution and profitability
// ------------------------------------------------------------

test('regional comparison preserves all four regions in the correct order', () => {
  const data = buildSalesData(rows, none);
  const series = buildSalesRegionalSeries(data.regions);

  assert.deepEqual(
    series.bars.map((bar) => bar.region),
    REGIONS,
  );

  assert.equal(series.bars.length, 4);
  assert.equal(series.hasAnyData, true);
});

test('regional Sales and Profit reconcile to the transaction totals', () => {
  const data = buildSalesData(rows, none);
  const series = buildSalesRegionalSeries(data.regions);

  assert.ok(near(series.totalSales, sum(rows, 'sales')));
  assert.ok(near(series.totalProfit, sum(rows, 'profit')));

  assert.ok(
    near(
      series.bars.reduce((total, bar) => total + bar.sales, 0),
      series.totalSales,
    ),
  );

  assert.ok(
    near(
      series.bars.reduce((total, bar) => total + bar.profit, 0),
      series.totalProfit,
    ),
  );
});

test('regional comparison ignores the selected Region filter', () => {
  const all = buildSalesData(rows, none).regions;

  for (const region of REGIONS) {
    const filtered = buildSalesData(rows, {
      ...none,
      region,
    }).regions;

    assert.deepEqual(filtered, all);
  }
});

test('regional comparison respects Category, Segment, Year and Month filters', () => {
  const filters = {
    ...none,
    category: 'Furniture',
    segment: 'Consumer',
    year: 2016,
    month: '2016-11',
  };

  const filteredRows = manuallyFilterRows(rows, filters);

  const expected = independentlyCalculateRegions(filteredRows);
  const actual = buildSalesData(rows, filters).regions;

  assert.equal(actual.length, expected.size);

  for (const region of actual) {
    const expectedRegion = expected.get(region.region);

    assert.ok(expectedRegion);

    assert.ok(near(region.sales, expectedRegion.sales));
    assert.ok(near(region.profit, expectedRegion.profit));

    assert.ok(
      near(
        region.margin,
        (expectedRegion.profit / expectedRegion.sales) * 100,
      ),
    );
  }
});

test('regional sales contribution adds up to 100%', () => {
  const data = buildSalesData(rows, none);
  const series = buildSalesRegionalSeries(data.regions);

  const contribution = series.bars.reduce(
    (total, bar) => total + bar.salesContribution,
    0,
  );

  assert.ok(near(contribution, 100));
});

test('missing regions use null values instead of fabricated zeros', () => {
  const series = buildSalesRegionalSeries([
    {
      region: 'West',
      sales: 100,
      profit: 20,
      margin: 20,
    },
    {
      region: 'South',
      sales: 50,
      profit: -10,
      margin: -20,
    },
  ]);

  const missing = series.bars.filter((bar) => !bar.hasData);

  assert.equal(missing.length, 2);

  for (const bar of missing) {
    assert.equal(bar.sales, null);
    assert.equal(bar.profit, null);
    assert.equal(bar.salesContribution, null);
    assert.equal(bar.margin, null);
    assert.equal(bar.isNegativeMargin, false);
  }
});

test('regional chart correctly identifies negative profit margins', () => {
  const series = buildSalesRegionalSeries([
    {
      region: 'West',
      sales: 100,
      profit: 20,
    },
    {
      region: 'East',
      sales: 100,
      profit: -20,
    },
  ]);

  const west = series.bars.find((bar) => bar.region === 'West');
  const east = series.bars.find((bar) => bar.region === 'East');

  assert.equal(west.isNegativeMargin, false);
  assert.equal(east.isNegativeMargin, true);
  assert.ok(near(east.margin, -20));
});

// ------------------------------------------------------------
// Category and sub-category profitability
// ------------------------------------------------------------

test('category series always contains all three categories', () => {
  const series = buildSalesCategorySeries(rows, none);

  assert.deepEqual(
    series.categories.map((item) => item.category),
    ['Furniture', 'Office Supplies', 'Technology'],
  );

  assert.equal(series.categories.length, 3);
});

test('category series reconciles with its independently filtered transactions', () => {
  const filters = {
    ...none,
    region: 'West',
    segment: 'Consumer',
    year: 2016,
  };

  const filteredRows = manuallyFilterRows(rows, filters);
  const series = buildSalesCategorySeries(rows, filters);

  assert.ok(near(series.totalSales, sum(filteredRows, 'sales')));
  assert.ok(near(series.totalProfit, sum(filteredRows, 'profit')));

  assert.equal(series.hasAnyData, filteredRows.length > 0);

  assert.ok(
    near(
      series.categories.reduce((total, item) => total + item.sales, 0),
      series.totalSales,
    ),
  );

  assert.ok(
    near(
      series.categories.reduce((total, item) => total + item.profit, 0),
      series.totalProfit,
    ),
  );
});

test('category series ignores Category and Sub-category selections', () => {
  const all = buildSalesCategorySeries(rows, none);

  const selected = buildSalesCategorySeries(rows, {
    ...none,
    category: 'Furniture',
    subCategory: 'Tables',
  });

  assert.deepEqual(selected, all);
});

test('category and sub-category profitability use weighted margins', () => {
  const series = buildSalesCategorySeries(rows, none);

  for (const category of series.categories) {
    if (category.sales === 0) {
      assert.equal(category.margin, null);
    } else {
      assert.ok(
        near(
          category.margin,
          (category.profit / category.sales) * 100,
        ),
      );
    }

    assert.equal(category.isNegative, category.profit < 0);

    for (const subCategory of category.subCategories) {
      if (subCategory.sales === 0) {
        assert.equal(subCategory.margin, null);
      } else {
        assert.ok(
          near(
            subCategory.margin,
            (subCategory.profit / subCategory.sales) * 100,
          ),
        );
      }

      assert.equal(
        subCategory.isNegative,
        subCategory.profit < 0,
      );
    }
  }
});

test('category sub-category profit values are sorted from lowest to highest', () => {
  const series = buildSalesCategorySeries(rows, none);

  for (const category of series.categories) {
    for (let index = 1; index < category.subCategories.length; index++) {
      assert.ok(
        category.subCategories[index - 1].profit <=
          category.subCategories[index].profit,
      );
    }
  }
});

// ------------------------------------------------------------
// Empty input
// ------------------------------------------------------------

test('empty input produces safe Sales Analysis results', () => {
  const data = buildSalesData([], none);
  const categorySeries = buildSalesCategorySeries([], none);
  const trend = buildSalesTrendSeries([], 2017);
  const regionalSeries = buildSalesRegionalSeries([]);

  assert.equal(data.kpis.totalSales, 0);
  assert.equal(data.kpis.totalProfit, 0);
  assert.equal(data.kpis.profitMargin, null);
  assert.equal(data.kpis.lossMakingStateCount, 0);
  assert.equal(data.kpis.rowCount, 0);

  assert.deepEqual(data.regions, []);
  assert.deepEqual(data.lossStates.states, []);
  assert.equal(data.lossStates.count, 0);

  assert.equal(categorySeries.hasAnyData, false);
  assert.equal(categorySeries.totalSales, 0);
  assert.equal(categorySeries.totalProfit, 0);

  assert.equal(regionalSeries.hasAnyData, false);
  assert.equal(regionalSeries.totalSales, 0);
  assert.equal(regionalSeries.totalProfit, 0);

  assert.equal(trend.length, 12);

  assert.ok(
    !/NaN|Infinity/.test(
      JSON.stringify({
        data,
        categorySeries,
        trend,
        regionalSeries,
      }),
    ),
  );
});
