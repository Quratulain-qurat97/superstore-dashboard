
import { REGIONS } from './constants.js';
import { sumBy, profitMargin } from './aggregations.js';

export function buildSalesRegionalSeries(regions, order = REGIONS) {
  const byName = new Map(regions.map((region) => [region.region, region]));

  const totalSales = sumBy(regions, 'sales');

  const bars = order.map((region) => {
    const found = byName.get(region);

    if (!found) {
      return {
        region,
        sales: null,
        profit: null,
        salesContribution: null,
        margin: null,
        isNegativeMargin: false,
        hasData: false,
      };
    }

    const margin = profitMargin(found.profit, found.sales);

    return {
      region,
      sales: found.sales,
      profit: found.profit,
      salesContribution:
        totalSales === 0 ? null : (found.sales / totalSales) * 100,
      margin,
      isNegativeMargin: margin !== null && margin < 0,
      hasData: true,
    };
  });

  return {
    bars,
    totalSales,
    totalProfit: sumBy(regions, 'profit'),
    hasAnyData: bars.some((bar) => bar.hasData),
  };
}
