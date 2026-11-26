
import {
  sumBy,
  countDistinct,
  profitMargin,
  groupBy,
  filterRows,
} from './aggregations.js';

import { filtersForVisual } from './filters.js';
import { YEARS } from './constants.js';

const twoDigits = (n) => String(n).padStart(2, '0');

export function monthsInPeriod(year) {
  const months = [];

  for (const y of year ? [year] : YEARS) {
    for (let m = 1; m <= 12; m++) {
      months.push(`${y}-${twoDigits(m)}`);
    }
  }

  return months;
}

export function buildHomeData(rows, effective) {
  const query = {
    region: effective.region ?? null,
    segment: effective.segment ?? null,
    category: effective.category ?? null,
    year: effective.year ?? null,
    month: effective.month ?? null,
  };

  const rowsFor = (visual) =>
    filterRows(rows, filtersForVisual(visual, query));

  // --------------------------------------------------
  // KPI calculations
  // --------------------------------------------------

  const kpiRows = rowsFor('kpis');

  const totalSales = sumBy(kpiRows, 'sales');
  const totalProfit = sumBy(kpiRows, 'profit');

  const kpis = {
    totalSales,
    totalProfit,
    profitMargin: profitMargin(totalProfit, totalSales),
    orderCount: countDistinct(kpiRows, 'orderId'),
    customerCount: countDistinct(kpiRows, 'customerId'),
    rowCount: kpiRows.length,
  };

  // --------------------------------------------------
  // Monthly sales trend
  // --------------------------------------------------

  const trendRows = rowsFor('monthlyTrend');

  const salesByMonth = new Map(
    [...groupBy(
      trendRows,
      (row) => row.orderDate.slice(0, 7),
    ).entries()].map(([month, list]) => [
      month,
      sumBy(list, 'sales'),
    ]),
  );

  const monthlyTrend = monthsInPeriod(query.year).map(
    (month, index, all) => {
      const sales = salesByMonth.get(month) ?? 0;

      const prevSales =
        index === 0
          ? null
          : salesByMonth.get(all[index - 1]) ?? 0;

      return {
        month,
        sales,
        prevSales,
        momChange:
          prevSales === null
            ? null
            : sales - prevSales,
      };
    },
  );

  // --------------------------------------------------
  // Shared category, region and segment aggregations
  // --------------------------------------------------

  const breakdown = (list, keyFn, extra = () => ({})) =>
    [...groupBy(list, keyFn).entries()].map(
      ([key, group]) => {
        const sales = sumBy(group, 'sales');
        const profit = sumBy(group, 'profit');

        return {
          key,
          sales,
          profit,
          margin: profitMargin(profit, sales),
          ...extra(group),
        };
      },
    );

  const categories = breakdown(
    rowsFor('categories'),
    (row) => row.category,
  ).map(({ key, ...rest }) => ({
    category: key,
    ...rest,
  }));

  // Calculate regional rows once and reuse them.
  const regionRows = rowsFor('regions');

  const regions = breakdown(
    regionRows,
    (row) => row.region,
    (group) => ({
      orderCount: countDistinct(group, 'orderId'),
    }),
  )
    .map(({ key, ...rest }) => ({
      region: key,
      ...rest,
    }))
    .sort((a, b) => b.sales - a.sales);

  const segments = breakdown(
    rowsFor('segments'),
    (row) => row.segment,
    (group) => ({
      orderCount: countDistinct(group, 'orderId'),
      customerCount: countDistinct(group, 'customerId'),
    }),
  )
    .map(({ key, ...rest }) => ({
      segment: key,
      ...rest,
    }))
    .sort((a, b) => b.margin - a.margin);

  // --------------------------------------------------
  // Executive Summary: Region/category profitability
  // --------------------------------------------------

  const summaryQuery = {
    ...query,
    subCategory: effective.subCategory ?? null,
  };

  const regionCategoryRows = filterRows(rows, summaryQuery);

  const regionCategoryProfitability = [
    ...groupBy(
      regionCategoryRows,
      (row) => `${row.region}|||${row.category}`,
    ).entries(),
  ]
    .map(([key, group]) => {
      const [region, category] = key.split('|||');

      const sales = sumBy(group, 'sales');
      const profit = sumBy(group, 'profit');

      return {
        region,
        category,
        sales,
        profit,
        margin: profitMargin(profit, sales),
        orderCount: countDistinct(group, 'orderId'),
        customerCount: countDistinct(group, 'customerId'),
        isNegative: profit < 0,
      };
    })
    .sort((a, b) => a.profit - b.profit);

  // --------------------------------------------------
  // Executive Summary: Yearly performance
  // --------------------------------------------------

  // Ignore Year and Month to retain historical comparison.
  // Respect Region, Category, Segment and Sub-category.
  const yearlyRows = filterRows(rows, {
    region: query.region,
    category: query.category,
    segment: query.segment,
    subCategory: effective.subCategory ?? null,
  });

  const yearlyPerformance = [
    ...groupBy(
      yearlyRows,
      (row) => row.orderDate.slice(0, 4),
    ).entries(),
  ]
    .map(([year, group]) => {
      const sales = sumBy(group, 'sales');
      const profit = sumBy(group, 'profit');

      return {
        year: Number(year),
        sales,
        profit,
        margin: profitMargin(profit, sales),
        orderCount: countDistinct(group, 'orderId'),
      };
    })
    .sort((a, b) => a.year - b.year);

  // --------------------------------------------------
  // Executive Summary: Regional customer reach
  // --------------------------------------------------

  const regionalCustomerCounts = [
    ...groupBy(
      regionRows,
      (row) => row.region,
    ).entries(),
  ].map(([region, group]) => ({
    region,
    customerCount: countDistinct(group, 'customerId'),
  }));

  return {
    query,
    kpis,
    monthlyTrend,
    categories,
    regions,
    segments,
    regionCategoryProfitability,
    yearlyPerformance,
    regionalCustomerCounts,
  };
}
