
import {
  sumBy,
  profitMargin,
  groupBy,
  filterRows,
} from './aggregations.js';

import { buildSalesTrendSeries } from './salesTrendSeries.js';

export function buildSalesData(rows, effective = {}) {
  const query = {
    region: effective.region ?? null,
    category: effective.category ?? null,
    segment: effective.segment ?? null,
    year: effective.month ? null : (effective.year ?? null),
    month: effective.month ?? null,
    subCategory: effective.subCategory ?? null,
  };

  // KPI calculations respect every active filter.
  const kpiRows = filterRows(rows, query);

  const totalSales = sumBy(kpiRows, 'sales');
  const totalProfit = sumBy(kpiRows, 'profit');

  const states = [...groupBy(kpiRows, (row) => row.state).entries()]
    .map(([state, stateRows]) => {
      const sales = sumBy(stateRows, 'sales');
      const profit = sumBy(stateRows, 'profit');

      return {
        state,
        sales,
        profit,
        margin: profitMargin(profit, sales),
      };
    })
    .sort((a, b) => a.profit - b.profit);

  const lossMakingStates = states.filter(
    (state) => state.profit < 0,
  );

  const lossStates = {
    count: lossMakingStates.length,
    stateCount: states.length,
    totalProfit: sumBy(lossMakingStates, 'profit'),
    states: lossMakingStates,
  };

  const kpis = {
    totalSales,
    totalProfit,
    profitMargin: profitMargin(totalProfit, totalSales),
    lossMakingStateCount: lossStates.count,
    rowCount: kpiRows.length,
  };

  const selectedYear = Number(effective.year) || 2017;

  // Trend ignores Year and Month for the year-over-year comparison,
  // but respects Region, Category, Segment, and Sub-category.
  const trendRows = filterRows(rows, {
    region: query.region,
    category: query.category,
    segment: query.segment,
    subCategory: query.subCategory,
  });

  const monthlyTrend = buildSalesTrendSeries(
    trendRows,
    selectedYear,
  );

  // Regional chart ignores Region to keep all regions comparable.
  // It still respects the selected Sub-category.
  const regionalRows = filterRows(rows, {
    category: query.category,
    segment: query.segment,
    year: effective.month ? null : query.year,
    month: query.month,
    subCategory: query.subCategory,
  });

  const regions = [...groupBy(regionalRows, (row) => row.region).entries()]
    .map(([region, regionRows]) => {
      const sales = sumBy(regionRows, 'sales');
      const profit = sumBy(regionRows, 'profit');

      return {
        region,
        sales,
        profit,
        margin: profitMargin(profit, sales),
      };
    });

  return {
    query,
    kpis,
    lossStates,
    selectedYear,
    monthlyTrend,
    regions,
  };
}
