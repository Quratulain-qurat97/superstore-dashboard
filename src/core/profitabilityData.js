
import {
  sumBy,
  profitMargin,
  filterRows,
  groupBy,
} from './aggregations.js';

import { buildProfitabilityTrendSeries } from './profitabilityTrendSeries.js';
import { buildProfitabilityCategorySeries } from './profitabilityCategorySeries.js';
import { buildProfitabilityDiscountHeatmap } from './profitabilityDiscountHeatmap.js';
import { buildTop10ProductsByNetLoss } from './profitabilityProducts.js';

export function buildProfitabilityData(
  rows,
  effective = {},
  selectedProductId = null,
) {
  // Product selection filters underlying transactions before
  // the other visuals perform their own calculations.
  const selectedRows = selectedProductId
    ? rows.filter((row) => row.productId === selectedProductId)
    : rows;

  // KPI calculations retain their established filter rules.
  const filteredRows = filterRows(selectedRows, {
    region: effective.region ?? null,
    category: effective.category ?? null,
    segment: effective.segment ?? null,
    year: effective.year ?? null,
    month: effective.month ?? null,
    subCategory: effective.subCategory ?? null,
  });

  const totalSales = sumBy(filteredRows, 'sales');
  const totalProfit = sumBy(filteredRows, 'profit');

  const discountedRows = filteredRows.filter(
    (row) => row.discount > 0,
  );

  const discountedSalesProfit = sumBy(discountedRows, 'profit');

  const customerGroups = groupBy(
    filteredRows,
    (row) => row.customerId,
  );

  const lossMakingCustomers = [...customerGroups.values()].filter(
    (customerRows) => sumBy(customerRows, 'profit') < 0,
  ).length;

  const orderGroups = groupBy(
    filteredRows,
    (row) => row.orderId,
  );

  const lossMakingOrders = [...orderGroups.values()].filter(
    (orderRows) => sumBy(orderRows, 'profit') < 0,
  ).length;

  const totalOrders = orderGroups.size;

  // Trend ignores Year and Month.
  const trendRows = filterRows(selectedRows, {
    region: effective.region ?? null,
    category: effective.category ?? null,
    segment: effective.segment ?? null,
    subCategory: effective.subCategory ?? null,
  });

  const profitTrend = buildProfitabilityTrendSeries(trendRows);

  // Category chart retains its own filter exclusions.
  const profitMarginByCategory = buildProfitabilityCategorySeries(
    selectedRows,
    effective,
  );

  // Heatmap retains its own filter exclusions.
  const discountImpactHeatmap = buildProfitabilityDiscountHeatmap(
    selectedRows,
    effective,
  );

  // Top 10 always uses the global filters, not product selection.
  const top10ProductsByNetLoss = buildTop10ProductsByNetLoss(
    rows,
    effective,
  );

  return {
    kpis: {
      profitMargin: profitMargin(totalProfit, totalSales),
      discountedSalesProfit,
      lossMakingCustomers,
      lossMakingOrders,
      totalOrders,
      lossMakingOrdersPercent: profitMargin(
        lossMakingOrders,
        totalOrders,
      ),
    },
    rowCount: filteredRows.length,
    profitTrend,
    profitMarginByCategory,
    discountImpactHeatmap,
    top10ProductsByNetLoss,
  };
}
