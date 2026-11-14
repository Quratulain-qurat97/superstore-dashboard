// homeData.js
// Builds everything the Home page shows from the transaction rows and the effective filters.
//
// The output follows the agreed dashboard data contract (same section names and fields as
// contract-sample.json). The only addition is the optional `query.month`.
// When `month` is null the results are identical to the original contract.
//
// NOTE FOR THE FUTURE BACKEND: it must return this same shape.

import { sumBy, countDistinct, profitMargin, groupBy, filterRows } from './aggregations.js';
import { filtersForVisual } from './filters.js';
import { YEARS } from './constants.js';

const twoDigits = (n) => String(n).padStart(2, '0');

/** All 'YYYY-MM' months in the period (one year if a year is set, otherwise all years). */
export function monthsInPeriod(year) {
  const months = [];
  for (const y of year ? [year] : YEARS) {
    for (let m = 1; m <= 12; m++) months.push(`${y}-${twoDigits(m)}`);
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
  const rowsFor = (visual) => filterRows(rows, filtersForVisual(visual, query));

  // ---- KPIs -----------------------------------------------------------------------------
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

  // ---- Monthly trend (every month in the period, zero where there were no transactions) --
  const trendRows = rowsFor('monthlyTrend');
  const salesByMonth = new Map(
    [...groupBy(trendRows, (r) => r.orderDate.slice(0, 7)).entries()].map(([m, list]) => [m, sumBy(list, 'sales')]),
  );
  const monthlyTrend = monthsInPeriod(query.year).map((month, i, all) => {
    const sales = salesByMonth.get(month) ?? 0;
    const prevSales = i === 0 ? null : salesByMonth.get(all[i - 1]) ?? 0;
    return { month, sales, prevSales, momChange: prevSales === null ? null : sales - prevSales };
  });

  // ---- Breakdown charts ------------------------------------------------------------------
  const breakdown = (list, keyFn, extra = () => ({})) =>
    [...groupBy(list, keyFn).entries()].map(([key, group]) => {
      const sales = sumBy(group, 'sales');
      const profit = sumBy(group, 'profit');
      return { key, sales, profit, margin: profitMargin(profit, sales), ...extra(group) };
    });

  const categories = breakdown(rowsFor('categories'), (r) => r.category).map(({ key, ...rest }) => ({
    category: key,
    ...rest,
  }));

  const regions = breakdown(rowsFor('regions'), (r) => r.region, (g) => ({ orderCount: countDistinct(g, 'orderId') }))
    .map(({ key, ...rest }) => ({ region: key, ...rest }))
    .sort((a, b) => b.sales - a.sales);

  const segments = breakdown(
    rowsFor('segments'),
    (r) => r.segment,
    (g) => ({ orderCount: countDistinct(g, 'orderId'), customerCount: countDistinct(g, 'customerId') }),
  )
    .map(({ key, ...rest }) => ({ segment: key, ...rest }))
    .sort((a, b) => b.margin - a.margin);

  return { query, kpis, monthlyTrend, categories, regions, segments };
}
