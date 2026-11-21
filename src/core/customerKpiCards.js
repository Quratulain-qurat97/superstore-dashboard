
import {
  formatCompactCurrency,
  formatCurrency,
  formatInteger,
  formatPercent,
} from './formatters.js';

export function buildCustomerKpiCards(kpis) {
  return [
    {
      id: 'averageSalesPerCustomer',
      label: 'Avg Sales per Customer',
      value: formatCompactCurrency(kpis.averageSalesPerCustomer),
      exact: formatCurrency(kpis.averageSalesPerCustomer),
      numericValue: kpis.averageSalesPerCustomer,
    },
    {
      id: 'averageOrderValue',
      label: 'Avg Order Value',
      value: formatCompactCurrency(kpis.averageOrderValue),
      exact: formatCurrency(kpis.averageOrderValue),
      numericValue: kpis.averageOrderValue,
    },
    {
      id: 'lossMakingCustomers',
      label: 'Loss-Making Customers',
      value: formatInteger(kpis.lossMakingCustomers),
      exact: `${formatInteger(kpis.lossMakingCustomers)} loss-making customers`,
      numericValue: kpis.lossMakingCustomers,
    },
    {
      id: 'customerRetention',
      label: 'Customer Retention',
      value: formatPercent(kpis.customerRetentionRate, 0),
      exact: formatPercent(kpis.customerRetentionRate, 2),
      numericValue: kpis.customerRetentionRate,
    },
  ];
}
