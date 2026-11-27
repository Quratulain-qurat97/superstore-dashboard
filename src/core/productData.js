import { filterRows } from './aggregations.js';
import { CATEGORIES, YEARS } from './constants.js';

function measure(label, callback) {
  return callback();
}

const sum = (rows, key) =>
  rows.reduce((total, row) => total + (row[key] ?? 0), 0);

const margin = (profit, sales) =>
  sales === 0 ? null : (profit / sales) * 100;

function aggregateProducts(rows) {
  const groups = new Map();

  for (const row of rows) {
    const key = JSON.stringify([
      row.productId ?? null,
      row.productName ?? null,
      row.category ?? null,
      row.subCategory ?? null,
    ]);

    if (!groups.has(key)) {
      groups.set(key, {
        productId: row.productId,
        productName: row.productName,
        category: row.category,
        subCategory: row.subCategory,
        sales: 0,
        profit: 0,
        quantity: 0,
        transactionCount: 0,
      });
    }

    const product = groups.get(key);

    product.sales += row.sales ?? 0;
    product.profit += row.profit ?? 0;
    product.quantity += row.quantity ?? 0;
    product.transactionCount += 1;
  }

  return [...groups.values()].map((product) => ({
    ...product,
    profitMargin: margin(product.profit, product.sales),
  }));
}

function buildSubCategoryProfitMargins(rows) {
  const groups = new Map();

  for (const row of rows) {
    const key = row.subCategory;

    if (!groups.has(key)) {
      groups.set(key, {
        subCategory: key,
        category: row.category,
        sales: 0,
        profit: 0,
        transactionCount: 0,
        discountTotal: 0,
      });
    }

    const item = groups.get(key);

    item.sales += row.sales ?? 0;
    item.profit += row.profit ?? 0;
    item.transactionCount += 1;
    item.discountTotal += row.discount ?? 0;
  }

  return [...groups.values()]
    .map((item) => {
      const averageDiscount = item.transactionCount
        ? (item.discountTotal / item.transactionCount) * 100
        : null;

      return {
        subCategory: item.subCategory,
        category: item.category,
        sales: item.sales,
        profit: item.profit,
        transactionCount: item.transactionCount,
        profitMargin: margin(item.profit, item.sales),
        isNegative: item.profit < 0,
        lossMakingSubCategories: item.profit < 0 ? 1 : 0,
        totalSubCategories: 1,
        averageDiscount,
      };
    })
    .sort((a, b) => {
      if (a.profitMargin == null && b.profitMargin == null) {
        return a.subCategory.localeCompare(b.subCategory);
      }

      if (a.profitMargin == null) return 1;
      if (b.profitMargin == null) return -1;

      return (
        b.profitMargin - a.profitMargin ||
        a.subCategory.localeCompare(b.subCategory)
      );
    });
}

function buildDiscountProfitImpact(rows) {
  if (!rows.length) return [];

  const groups = [
    {
      discountGroupKey: 'low',
      discountGroup: 'Discount ≤ 20%',
      profit: 0,
      sales: 0,
      transactionCount: 0,
      discountTotal: 0,
    },
    {
      discountGroupKey: 'high',
      discountGroup: 'Discount > 20%',
      profit: 0,
      sales: 0,
      transactionCount: 0,
      discountTotal: 0,
    },
  ];

  for (const row of rows) {
    const discount = row.discount ?? 0;
    const group = discount > 0.20 ? groups[1] : groups[0];

    group.profit += row.profit ?? 0;
    group.sales += row.sales ?? 0;
    group.transactionCount += 1;
    group.discountTotal += discount;
  }

  return groups.map((group) => ({
    ...group,
    averageDiscount: group.transactionCount
      ? (group.discountTotal / group.transactionCount) * 100
      : 0,
    isNegative: group.profit < 0,
  }));
}

function buildProductKpis(rows) {
  const totalSales = sum(rows, 'sales');
  const totalProfit = sum(rows, 'profit');
  const subCategoryGroups = new Map();

  for (const row of rows) {
    const key = row.subCategory;

    if (!subCategoryGroups.has(key)) {
      subCategoryGroups.set(key, {
        subCategory: key,
        profit: 0,
      });
    }

    subCategoryGroups.get(key).profit += row.profit ?? 0;
  }

  const subCategories = [...subCategoryGroups.values()];

  const lossMakingSubCategories = subCategories.filter(
    (item) => item.profit < 0,
  );

  const topSubCategory =
    [...subCategories].sort(
      (a, b) =>
        b.profit - a.profit ||
        a.subCategory.localeCompare(b.subCategory),
    )[0] ?? null;

  const averageDiscount = rows.length
    ? (
        rows.reduce(
          (total, row) => total + (row.discount ?? 0),
          0,
        ) / rows.length
      ) * 100
    : null;

  return {
    profitMargin: margin(totalProfit, totalSales),
    lossMakingSubCategories: lossMakingSubCategories.length,
    totalSubCategories: subCategories.length,
    topSubCategoryName: topSubCategory?.subCategory ?? null,
    topSubCategoryProfit: topSubCategory?.profit ?? null,
    averageDiscount,
  };
}

/**
 * Chart 4:
 * - Always displays all four years.
 * - Keeps all three category series available for comparison.
 * - Ignores the global Year and Category filters.
 * - Ignores Sub-Category selection.
 * - Respects Region, Segment, Discount Group, and Month.
 * - A selected Month compares that calendar month across every year.
 */
function buildSalesByCategoryPerYear(rows, filters = {}) {
  const filteredRows = filterRows(rows, {
    region: filters.region ?? null,
    segment: filters.segment ?? null,
    discountGroup: filters.discountGroup ?? null,
  });

  const selectedMonthNumber = filters.month
    ? filters.month.slice(5, 7)
    : null;

  const monthFilteredRows = selectedMonthNumber
    ? filteredRows.filter(
        (row) => row.orderDate?.slice(5, 7) === selectedMonthNumber,
      )
    : filteredRows;

  const salesByYear = YEARS.map((year) => {
    const yearRows = monthFilteredRows.filter(
      (row) => row.orderDate?.startsWith(String(year)),
    );

    const yearData = { year };

    for (const category of CATEGORIES) {
      yearData[category] = sum(
        yearRows.filter((row) => row.category === category),
        'sales',
      );
    }

    return yearData;
  });

  return salesByYear;
}

export function buildProductKpiData(rows, filters = {}) {
  const filteredRows = measure(
    'KPI transaction filtering',
    () => filterRows(rows, filters),
  );

  const kpis = measure(
    'KPI calculations',
    () => buildProductKpis(filteredRows),
  );

  const products = measure(
    'KPI product aggregation',
    () => aggregateProducts(filteredRows),
  );

  return {
    kpis,
    products,
    hasAnyData: filteredRows.length > 0,
  };
}

export function buildProductChartData(rows, filters = {}) {
  // Charts 1 and 2 respect Category and Discount Group.
  // Sub-Category remains excluded from aggregation so the chart
  // can retain its existing selection and visual muting behavior.
const chartRows = measure(
  'Chart transaction filtering',
  () =>
    filterRows(rows, {
      ...filters,
      category: null,
      subCategory: null,
    }),
);

  const subCategoryProfitMargins = measure(
    'Chart 1 sub-category aggregation',
    () => buildSubCategoryProfitMargins(chartRows),
  );

  const productSalesProfitMargins = measure(
    'Chart 2 product aggregation',
    () => aggregateProducts(chartRows),
  );

  // Chart 3 respects Category but must retain both discount groups.
  const discountComparisonRows = measure(
    'Chart 3 comparison filtering',
    () =>
      filterRows(rows, {
        ...filters,
        subCategory: null,
        discountGroup: null,
      }),
  );

  const discountProfitImpact = measure(
    'Chart 3 discount profit aggregation',
    () => buildDiscountProfitImpact(discountComparisonRows),
  );

  // Chart 4 has its own filter behavior.
  const salesByCategoryPerYear = measure(
    'Chart 4 sales by category per year aggregation',
    () => buildSalesByCategoryPerYear(rows, filters),
  );

  return {
    subCategoryProfitMargins,
    productSalesProfitMargins,
    discountProfitImpact,
    salesByCategoryPerYear,
  };
}

export function buildProductData(rows, filters = {}) {
  return {
    ...buildProductKpiData(rows, filters),
    ...buildProductChartData(rows, filters),
  };
}