
import test from 'node:test';
import assert from 'node:assert/strict';
import { rows } from './helpers/loadRows.js';
import { buildProductData } from '../index.js';

const none = {
  region: null,
  category: null,
  segment: null,
  year: null,
  month: null,
  subCategory: null,
  discountGroup: null,
};

const near = (a, b) => Math.abs(a - b) < 1e-6;
const nearCurrency = (a, b) => Math.abs(a - b) < 0.005;

function productIdentity(product) {
  return JSON.stringify([
    product.productId ?? null,
    product.productName ?? null,
    product.category ?? null,
    product.subCategory ?? null,
  ]);
}

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
  const sales = source.reduce((total, row) => total + row.sales, 0);
  const profit = source.reduce((total, row) => total + row.profit, 0);

  const subCategoryProfits = new Map();

  for (const row of source) {
    subCategoryProfits.set(
      row.subCategory,
      (subCategoryProfits.get(row.subCategory) ?? 0) + row.profit,
    );
  }

  const subCategories = [...subCategoryProfits.entries()];

  const topSubCategory = [...subCategories].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )[0] ?? null;

  const averageDiscount = source.length
    ? source.reduce((total, row) => total + row.discount, 0) /
      source.length *
      100
    : null;

  return {
    profitMargin: sales === 0 ? null : (profit / sales) * 100,
    lossMakingSubCategories: subCategories.filter(
      ([, value]) => value < 0,
    ).length,
    totalSubCategories: subCategories.length,
    topSubCategoryName: topSubCategory?.[0] ?? null,
    topSubCategoryProfit: topSubCategory?.[1] ?? null,
    averageDiscount,
  };
}

test('unfiltered Product Analysis KPIs match independent calculations', () => {
  const actual = buildProductData(rows, none).kpis;
  const expected = independentlyCalculateKpis(rows);

  assert.ok(near(actual.profitMargin, expected.profitMargin));
  assert.equal(
    actual.lossMakingSubCategories,
    expected.lossMakingSubCategories,
  );
  assert.equal(actual.totalSubCategories, expected.totalSubCategories);
  assert.equal(actual.topSubCategoryName, expected.topSubCategoryName);
  assert.ok(
    near(actual.topSubCategoryProfit, expected.topSubCategoryProfit),
  );
  assert.ok(near(actual.averageDiscount, expected.averageDiscount));
});

test('Product Analysis KPIs respond to Region, Segment and Year filters', () => {
  const filters = {
    ...none,
    region: 'West',
    segment: 'Consumer',
    year: 2016,
  };

  const filteredRows = manuallyFilterRows(rows, filters);
  const expected = independentlyCalculateKpis(filteredRows);
  const actual = buildProductData(rows, filters).kpis;

  assert.ok(near(actual.profitMargin, expected.profitMargin));
  assert.equal(
    actual.lossMakingSubCategories,
    expected.lossMakingSubCategories,
  );
  assert.equal(actual.totalSubCategories, expected.totalSubCategories);
  assert.equal(actual.topSubCategoryName, expected.topSubCategoryName);
  assert.ok(
    near(actual.topSubCategoryProfit, expected.topSubCategoryProfit),
  );
  assert.ok(near(actual.averageDiscount, expected.averageDiscount));
});

test('Product Analysis KPIs respond to Month and Sub-Category filters', () => {
  const filters = {
    ...none,
    month: '2016-11',
    subCategory: 'Tables',
  };

  const filteredRows = manuallyFilterRows(rows, filters);
  const expected = independentlyCalculateKpis(filteredRows);
  const actual = buildProductData(rows, filters).kpis;

  assert.ok(near(actual.profitMargin, expected.profitMargin));
  assert.equal(actual.lossMakingSubCategories, expected.lossMakingSubCategories);
  assert.equal(actual.totalSubCategories, expected.totalSubCategories);
  assert.equal(actual.topSubCategoryName, expected.topSubCategoryName);
  assert.ok(
    near(actual.topSubCategoryProfit, expected.topSubCategoryProfit),
  );
  assert.ok(near(actual.averageDiscount, expected.averageDiscount));
});

test('product aggregation produces 1,894 distinct product identities', () => {
  const data = buildProductData(rows, none);

  assert.equal(data.products.length, 1894);

  const uniqueIdentities = new Set(
    data.products.map(productIdentity),
  );

  assert.equal(uniqueIdentities.size, 1894);

  const uniqueIds = new Set(
    data.products.map((product) => product.productId),
  );

  assert.equal(uniqueIds.size, 1862);
});

test('product sales, profit and quantity reconcile to transaction totals', () => {
  const data = buildProductData(rows, none);

  const productSales = data.products.reduce(
    (total, product) => total + product.sales,
    0,
  );

  const productProfit = data.products.reduce(
    (total, product) => total + product.profit,
    0,
  );

  const productQuantity = data.products.reduce(
    (total, product) => total + product.quantity,
    0,
  );

  const transactionSales = rows.reduce(
    (total, row) => total + row.sales,
    0,
  );

  const transactionProfit = rows.reduce(
    (total, row) => total + row.profit,
    0,
  );

  const transactionQuantity = rows.reduce(
    (total, row) => total + row.quantity,
    0,
  );

  assert.ok(near(productSales, transactionSales));
  assert.ok(near(productProfit, transactionProfit));
  assert.equal(productQuantity, transactionQuantity);
});

test('Chart 1 aggregates sub-category profit margins', () => {
  const data = buildProductData(rows, none);
  const chartData = data.subCategoryProfitMargins;

  assert.equal(chartData.length, 17);

  for (const item of chartData) {
    assert.ok(item.subCategory);
    assert.ok(Number.isFinite(item.sales));
    assert.ok(Number.isFinite(item.profit));
    assert.ok(Number.isFinite(item.profitMargin));
    assert.equal(item.isNegative, item.profit < 0);
    assert.equal(item.totalSubCategories, 1);
  }

  const totalSales = chartData.reduce(
    (total, item) => total + item.sales,
    0,
  );

  const totalProfit = chartData.reduce(
    (total, item) => total + item.profit,
    0,
  );

  assert.ok(near(totalSales, rows.reduce(
    (total, row) => total + row.sales,
    0,
  )));

  assert.ok(near(totalProfit, rows.reduce(
    (total, row) => total + row.profit,
    0,
  )));
});

test('Chart 2 aggregates 1,894 distinct product identities', () => {
  const data = buildProductData(rows, none);
  const chartData = data.productSalesProfitMargins;

  assert.equal(chartData.length, 1894);

  const uniqueIdentities = new Set(
    chartData.map(productIdentity),
  );

  assert.equal(uniqueIdentities.size, 1894);

  const uniqueIds = new Set(
    chartData.map((product) => product.productId),
  );

  assert.equal(uniqueIds.size, 1862);

  for (const product of chartData) {
    assert.ok(Number.isFinite(product.sales));
    assert.ok(Number.isFinite(product.profit));
    assert.ok(Number.isFinite(product.quantity));

    if (product.sales === 0) {
      assert.equal(product.profitMargin, null);
    } else {
      assert.ok(
        near(
          product.profitMargin,
          (product.profit / product.sales) * 100,
        ),
      );
    }
  }
});

test('Chart 3 preserves both discount comparison groups', () => {
  const data = buildProductData(rows, none);
  const chartData = data.discountProfitImpact;

  assert.equal(chartData.length, 2);

  const lowDiscount = chartData.find(
    (item) => item.discountGroupKey === 'low',
  );

  const highDiscount = chartData.find(
    (item) => item.discountGroupKey === 'high',
  );

  assert.ok(lowDiscount);
  assert.ok(highDiscount);

  assert.equal(lowDiscount.discountGroup, 'Discount ≤ 20%');
  assert.equal(highDiscount.discountGroup, 'Discount > 20%');

  const expectedLowRows = rows.filter((row) => row.discount <= 0.20);
  const expectedHighRows = rows.filter((row) => row.discount > 0.20);

  assert.equal(lowDiscount.transactionCount, expectedLowRows.length);
  assert.equal(highDiscount.transactionCount, expectedHighRows.length);

  assert.ok(
    near(
      lowDiscount.profit,
      expectedLowRows.reduce((total, row) => total + row.profit, 0),
    ),
  );

  assert.ok(
    near(
      highDiscount.profit,
      expectedHighRows.reduce((total, row) => total + row.profit, 0),
    ),
  );

  assert.equal(lowDiscount.isNegative, lowDiscount.profit < 0);
  assert.equal(highDiscount.isNegative, highDiscount.profit < 0);
});

test('Chart 4 always contains all four years and three category series', () => {
  const data = buildProductData(rows, none);
  const chartData = data.salesByCategoryPerYear;

  assert.deepEqual(
    chartData.map((item) => item.year),
    [2014, 2015, 2016, 2017],
  );

  const categories = ['Furniture', 'Office Supplies', 'Technology'];

  for (const yearData of chartData) {
    for (const category of categories) {
      assert.ok(Number.isFinite(yearData[category]));
    }
  }
});

test('Chart 4 compares the selected calendar month across all four years', () => {
  const filters = {
    ...none,
    region: 'West',
    segment: 'Consumer',
    year: 2016,
    category: 'Furniture',
    subCategory: 'Tables',
    month: '2016-11',
  };

  const data = buildProductData(rows, filters);
  const chartData = data.salesByCategoryPerYear;

  const expectedRows = rows.filter((row) => (
    row.region === 'West' &&
    row.segment === 'Consumer' &&
    row.orderDate.slice(5, 7) === '11'
  ));

  assert.deepEqual(
    chartData.map((item) => item.year),
    [2014, 2015, 2016, 2017],
  );

  for (const yearData of chartData) {
    for (const category of ['Furniture', 'Office Supplies', 'Technology']) {
      const expectedSales = expectedRows
        .filter((row) => (
          row.orderDate.startsWith(String(yearData.year)) &&
          row.category === category
        ))
        .reduce((total, row) => total + row.sales, 0);

      assert.ok(
        near(yearData[category], expectedSales),
        `${yearData.year} ${category} sales should match the selected month`,
      );
    }
  }
});

test('empty input produces safe results for the current Product Analysis model', () => {
  const data = buildProductData([], none);

  assert.equal(data.hasAnyData, false);
  assert.deepEqual(data.products, []);

  assert.equal(data.kpis.profitMargin, null);
  assert.equal(data.kpis.lossMakingSubCategories, 0);
  assert.equal(data.kpis.totalSubCategories, 0);
  assert.equal(data.kpis.topSubCategoryName, null);
  assert.equal(data.kpis.topSubCategoryProfit, null);
  assert.equal(data.kpis.averageDiscount, null);

  assert.deepEqual(data.subCategoryProfitMargins, []);
  assert.deepEqual(data.productSalesProfitMargins, []);
  assert.deepEqual(data.discountProfitImpact, []);

  assert.deepEqual(
    data.salesByCategoryPerYear,
    [
      { year: 2014, Furniture: 0, 'Office Supplies': 0, Technology: 0 },
      { year: 2015, Furniture: 0, 'Office Supplies': 0, Technology: 0 },
      { year: 2016, Furniture: 0, 'Office Supplies': 0, Technology: 0 },
      { year: 2017, Furniture: 0, 'Office Supplies': 0, Technology: 0 },
    ],
  );

  assert.ok(!/NaN|Infinity/.test(JSON.stringify(data)));
});
