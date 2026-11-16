
import {
  formatCompactCurrency,
  formatCurrency,
  formatPercent,
  formatInteger,
} from './formatters.js';

export function buildSalesKpiCards(kpis) {
  return [
    {
      id: 'totalSales',
      label: 'Total Sales',
      value: formatCompactCurrency(kpis.totalSales),
      exact: formatCurrency(kpis.totalSales),
      numericValue: kpis.totalSales,
    },
    {
      id: 'totalProfit',
      label: 'Total Profit',
      value: formatCompactCurrency(kpis.totalProfit),
      exact: formatCurrency(kpis.totalProfit),
      numericValue: kpis.totalProfit,
    },
    {
      id: 'profitMargin',
      label: 'Profit Margin',
      value: formatPercent(kpis.profitMargin),
      exact: formatPercent(kpis.profitMargin),
      numericValue: kpis.profitMargin,
    },
    {
      id: 'lossMakingStates',
      label: 'Loss-Making States',
      value: formatInteger(kpis.lossMakingStateCount),
      exact: `${formatInteger(kpis.lossMakingStateCount)} loss-making states`,
      numericValue: kpis.lossMakingStateCount,
    },
  ];
}
