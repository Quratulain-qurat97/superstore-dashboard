
import ChartCard from '../charts/ChartCard.jsx';
import { CUSTOMER_CARD_LAYOUT } from '../charts/cardLayouts.js';

import CustomerSalesProfitMarginCanvasChart from './CustomerSalesProfitMarginCanvasChart.jsx';
import CustomerActiveCustomersChart from './CustomerActiveCustomersChart.jsx';
import CustomerConcentrationChart from './CustomerConcentrationChart.jsx';
import CustomerTop10CustomersChart from './CustomerTop10CustomersChart.jsx';

const LEFT_COLUMN = 'var(--content-left)';

const RIGHT_COLUMN =
  'calc(var(--content-left) + var(--chart-w) + 20px)';

export default function CustomerAnalysisCharts({
  data,
  selectedCustomerId,
  onSelectCustomer,
  selectedYear,
  onSelectYear,
}) {
  return (
    <>
      <ChartCard
        title="Customer Sales vs Profit Margin"
        left={LEFT_COLUMN}
        top={342}
        layout={CUSTOMER_CARD_LAYOUT}
      >
        <CustomerSalesProfitMarginCanvasChart
          series={data?.customerSalesProfitMargins}
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={onSelectCustomer}
        />
      </ChartCard>

      <ChartCard
        title="Active Customers by Year"
        left={RIGHT_COLUMN}
        top={342}
        layout={CUSTOMER_CARD_LAYOUT}
      >
        <CustomerActiveCustomersChart
          series={data?.activeCustomersByYear}
          selectedYear={selectedYear}
          onSelectYear={onSelectYear}
        />
      </ChartCard>

      <ChartCard
        title="Customer Concentration"
        left={LEFT_COLUMN}
        top={680}
        layout={CUSTOMER_CARD_LAYOUT}
      >
        <CustomerConcentrationChart
          series={data?.customerConcentration}
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={onSelectCustomer}
        />
      </ChartCard>

      <ChartCard
        title="Top 10 Customers"
        left={RIGHT_COLUMN}
        top={680}
        layout={CUSTOMER_CARD_LAYOUT}
      >
        <CustomerTop10CustomersChart
          series={data?.top10Customers}
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={onSelectCustomer}
        />
      </ChartCard>
    </>
  );
}
