
import {
  groupBy,
  sumBy,
  profitMargin,
  filterRows,
} from './aggregations.js';

import { CATEGORIES } from './constants.js';

export function buildSalesCategorySeries(rows, effective = {}) {
  // Apply global filters except Category.
  // This keeps all three categories available for comparison.
  const filteredRows = filterRows(rows, {
    region: effective.region ?? null,
    segment: effective.segment ?? null,
    year: effective.month ? null : (effective.year ?? null),
    month: effective.month ?? null,
  });

  const categories = CATEGORIES.map((category) => {
    const categoryRows = filteredRows.filter(
      (row) => row.category === category,
    );

    const sales = sumBy(categoryRows, 'sales');
    const profit = sumBy(categoryRows, 'profit');

    const subCategories = [
      ...groupBy(categoryRows, (row) => row.subCategory).entries(),
    ]
      .map(([subCategory, subRows]) => {
        const subSales = sumBy(subRows, 'sales');
        const subProfit = sumBy(subRows, 'profit');

        return {
          subCategory,
          sales: subSales,
          profit: subProfit,
          margin: profitMargin(subProfit, subSales),
          isNegative: subProfit < 0,
        };
      })
      .sort((a, b) => a.profit - b.profit);

    return {
      category,
      sales,
      profit,
      margin: profitMargin(profit, sales),
      isNegative: profit < 0,
      subCategories,
      hasData: categoryRows.length > 0,
    };
  });

  return {
    categories,
    totalSales: sumBy(filteredRows, 'sales'),
    totalProfit: sumBy(filteredRows, 'profit'),
    hasAnyData: filteredRows.length > 0,
  };
}
