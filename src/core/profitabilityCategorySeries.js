// Shapes category profit-margin data for the Profit Margin by Category chart.
// Pure calculations, no drawing.

import {
  filterRows,
  groupBy,
  sumBy,
  profitMargin,
} from './aggregations.js';

import { CATEGORIES } from './constants.js';
import { niceAxis } from './chartScale.js';

export const PROFITABILITY_CATEGORY_AXIS_INTERVALS = 5;

/**
 * Builds aggregate profit margins for all three categories.
 *
 * Applies Region, Segment, Year, Month and Sub-category filters.
 * Deliberately excludes Category so all three categories remain visible.
 *
 * Margin = SUM(Profit) / SUM(Sales) * 100.
 */
export function buildProfitabilityCategorySeries(rows, effective = {}) {
  const filteredRows = filterRows(rows, {
    region: effective.region ?? null,
    segment: effective.segment ?? null,
    year: effective.year ?? null,
    month: effective.month ?? null,
    subCategory: effective.subCategory ?? null,
  });

  const categoryGroups = groupBy(
    filteredRows,
    (row) => row.category,
  );

  const bars = CATEGORIES.map((category) => {
    const categoryRows = categoryGroups.get(category) ?? [];

    if (categoryRows.length === 0) {
      return {
        category,
        sales: null,
        profit: null,
        margin: null,
        hasData: false,
        isNegative: false,
      };
    }

    const sales = sumBy(categoryRows, 'sales');
    const profit = sumBy(categoryRows, 'profit');
    const margin = profitMargin(profit, sales);

    return {
      category,
      sales,
      profit,
      margin,
      hasData: margin !== null,
      isNegative: margin !== null && margin < 0,
    };
  });

  const values = bars
    .filter((bar) => bar.margin !== null)
    .map((bar) => Math.abs(bar.margin));

  const maxMargin = values.length ? Math.max(...values) : 0;

  const totalSales = sumBy(filteredRows, 'sales');
  const totalProfit = sumBy(filteredRows, 'profit');

  return {
    bars,
    totalSales,
    totalProfit,
    overallMargin: profitMargin(totalProfit, totalSales),
    hasAnyData: values.length > 0,
    axis: niceAxis(
      maxMargin,
      PROFITABILITY_CATEGORY_AXIS_INTERVALS,
    ),
  };
}