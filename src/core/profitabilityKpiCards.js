
import {
  formatCompactCurrency,
  formatCurrency,
  formatPercent,
  formatInteger,
} from './formatters.js';

export function buildProfitabilityKpiCards(kpis) {
  return [
    {
      id: 'profitMargin',
      label: 'Profit Margin',
      value: formatPercent(kpis.profitMargin),
      exact: formatPercent(kpis.profitMargin),
      numericValue: kpis.profitMargin,
    },
    {
      id: 'discountedSalesProfit',
      label: 'Discounted Sales Profit',
      value: formatCompactCurrency(kpis.discountedSalesProfit),
      exact: formatCurrency(kpis.discountedSalesProfit),
      numericValue: kpis.discountedSalesProfit,
    },
    {
      id: 'lossMakingCustomers',
      label: 'Loss-Making Customers',
      value: formatInteger(kpis.lossMakingCustomers),
      exact: `${formatInteger(kpis.lossMakingCustomers)} loss-making customers`,
      numericValue: kpis.lossMakingCustomers,
    },
    {
      id: 'lossMakingOrders',
      label: 'Loss-Making Orders',
      value: formatInteger(kpis.lossMakingOrders),
      exact: `${formatInteger(kpis.lossMakingOrders)} of ${formatInteger(kpis.totalOrders)} orders (${formatPercent(kpis.lossMakingOrdersPercent)})`,
      numericValue: kpis.lossMakingOrders,
      supportingText: `${formatPercent(kpis.lossMakingOrdersPercent)} of filtered orders`,
    },
  ];
}
