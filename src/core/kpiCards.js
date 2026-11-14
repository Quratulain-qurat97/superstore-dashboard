
// kpiCards.js
// Turns the KPI numbers into the four cards shown on the Home page.
// Everything is calculated from the data (see homeData.js); nothing here is a fixed value.

import { formatCompactCurrency, formatCurrency, formatInteger } from './formatters.js';

/**
 * @param {{ totalSales:number, totalProfit:number, orderCount:number, customerCount:number }} kpis
 * @returns four cards in display order.
 */
export function buildKpiCards(kpis) {
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
      id: 'totalOrders',
      label: 'Total Orders',
      value: formatInteger(kpis.orderCount),
      exact: formatInteger(kpis.orderCount),
      numericValue: kpis.orderCount,
    },
    {
      id: 'totalCustomers',
      label: 'Total Customers',
      value: formatInteger(kpis.customerCount),
      exact: formatInteger(kpis.customerCount),
      numericValue: kpis.customerCount,
    },
  ];
}
