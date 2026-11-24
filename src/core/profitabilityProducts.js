import {
  filterRows,
  groupBy,
  sumBy,
  profitMargin,
} from './aggregations.js';

/**
 * Builds the Top 10 Products by Net Loss.
 *
 * Applies all active global filters before aggregation.
 * Includes only products with negative total profit.
 * Sorts from the greatest net loss to the smallest net loss.
 */
export function buildTop10ProductsByNetLoss(rows, filters = {}) {
  const filteredRows = filterRows(rows, {
    region: filters.region ?? null,
    category: filters.category ?? null,
    segment: filters.segment ?? null,
    year: filters.year ?? null,
    month: filters.month ?? null,
    subCategory: filters.subCategory ?? null,
    discountGroup: filters.discountGroup ?? null,
  });

  const productGroups = groupBy(
    filteredRows,
    (row) => row.productId,
  );

  return [...productGroups.values()]
    .map((productRows) => {
      const firstRow = productRows[0];

      const sales = sumBy(productRows, 'sales');
      const profit = sumBy(productRows, 'profit');

      return {
        productId: firstRow.productId,
        productName: firstRow.productName,
        category: firstRow.category,
        sales,
        profit,
        profitMargin: profitMargin(profit, sales),
      };
    })
    .filter((product) => product.profit < 0)
    .sort(
      (a, b) =>
        a.profit - b.profit ||
        a.productName.localeCompare(b.productName),
    )
    .slice(0, 10);
}