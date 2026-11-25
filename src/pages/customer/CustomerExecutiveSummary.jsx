
import {
  formatCurrency,
  formatInteger,
  formatPercent,
} from '../../core/formatters.js';

import styles from './CustomerExecutiveSummary.module.css';

const formatMoney = (value) =>
  value == null ? '—' : formatCurrency(value);

const formatCount = (value) =>
  value == null ? '—' : formatInteger(value);

const formatRate = (value) =>
  value == null ? '—' : formatPercent(value, 1);

const getCustomerName = (customer) =>
  customer?.customerName ?? 'Unknown customer';

function getHighest(items, field) {
  if (!items?.length) return null;

  return items.reduce(
    (best, item) =>
      best == null ||
      (item[field] ?? -Infinity) > (best[field] ?? -Infinity)
        ? item
        : best,
    null,
  );
}

function getLowest(items, field) {
  if (!items?.length) return null;

  return items.reduce(
    (worst, item) =>
      worst == null ||
      (item[field] ?? Infinity) < (worst[field] ?? Infinity)
        ? item
        : worst,
    null,
  );
}

function getValueClass(value) {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value >= 0
  ) {
    return '';
  }

  return styles.negativeValue;
}

function Insight({
  label,
  value,
  numericValue,
  detail,
  detailNumericValue,
}) {
  return (
    <div className={styles.insight}>
      <span className={styles.insightLabel}>{label}</span>

      <strong
        className={`${styles.insightValue} ${getValueClass(numericValue)}`}
      >
        {value}
      </strong>

      {detail && (
        <p
          className={`${styles.insightDetail} ${getValueClass(detailNumericValue)}`}
        >
          {detail}
        </p>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {children}
    </section>
  );
}

function Narrative({ children }) {
  return <p className={styles.narrative}>{children}</p>;
}

export default function CustomerExecutiveSummary({ data }) {
  if (!data || !data.hasAnyData) {
    return (
      <div className={styles.emptyState}>
        No customer data is available for the selected filters.
      </div>
    );
  }

  const {
    kpis,
    displayedKpis,
    selectedCustomerData,
    customerSalesProfitMargins = [],
    activeCustomersByYear = [],
    customerConcentration,
    top10Customers = [],
  } = data;

  const isCustomerSelected = selectedCustomerData != null;

  const selectedCustomer = isCustomerSelected
    ? customerSalesProfitMargins.find(
        (customer) =>
          String(customer.customerId) ===
          String(selectedCustomerData.customerId),
      )
    : null;

  const totalCustomers = customerConcentration?.customerCount ?? 0;
  const totalSales = customerConcentration?.totalSales ?? 0;
  const totalProfit = customerConcentration?.totalProfit ?? 0;

  const top10Sales = top10Customers.reduce(
    (sum, customer) => sum + (customer.sales ?? 0),
    0,
  );

  const top10SalesShare =
    totalSales !== 0 ? (top10Sales / totalSales) * 100 : null;

  const highestSalesCustomer = getHighest(
    customerSalesProfitMargins,
    'sales',
  );

  const highestProfitCustomer = getHighest(
    customerSalesProfitMargins,
    'profit',
  );

  const lowestProfitCustomer = getLowest(
    customerSalesProfitMargins,
    'profit',
  );

  const validRetentionYears = activeCustomersByYear.filter(
    (item) => item.retentionRate != null,
  );

  const strongestRetention = getHighest(
    validRetentionYears,
    'retentionRate',
  );

  const weakestRetention = getLowest(
    validRetentionYears,
    'retentionRate',
  );

  const highestActiveYear = getHighest(
    activeCustomersByYear,
    'activeCustomers',
  );

  const lowestActiveYear = getLowest(
    activeCustomersByYear,
    'activeCustomers',
  );

  const lossMakingShare =
    totalCustomers > 0
      ? (kpis.lossMakingCustomers / totalCustomers) * 100
      : null;

  const retentionChange =
    strongestRetention && weakestRetention
      ? strongestRetention.retentionRate - weakestRetention.retentionRate
      : null;

  const activeCustomerChange =
    highestActiveYear && lowestActiveYear
      ? highestActiveYear.activeCustomers - lowestActiveYear.activeCustomers
      : null;

  return (
    <div className={styles.summary}>
      <Section title="Customer Performance">
        {isCustomerSelected && selectedCustomer ? (
          <>
            <p className={styles.context}>
              Selected customer:{' '}
              <strong>{selectedCustomer.customerName}</strong>
            </p>

            <div className={styles.insightGrid}>
              <Insight
                label="Total Customer Sales"
                value={formatMoney(selectedCustomer.sales)}
                numericValue={selectedCustomer.sales}
              />

              <Insight
                label="Customer Profit"
                value={formatMoney(selectedCustomer.profit)}
                numericValue={selectedCustomer.profit}
              />

              <Insight
                label="Profit Margin"
                value={formatRate(selectedCustomer.profitMargin)}
                numericValue={selectedCustomer.profitMargin}
              />

              <Insight
                label="Orders"
                value={formatCount(selectedCustomer.orderCount)}
                numericValue={selectedCustomer.orderCount}
              />
            </div>

            <Insight
              label="Average Order Value"
              value={formatMoney(displayedKpis?.averageOrderValue)}
              numericValue={displayedKpis?.averageOrderValue}
            />

            <Insight
              label="Customer Retention"
              value={formatRate(displayedKpis?.customerRetentionRate)}
              numericValue={displayedKpis?.customerRetentionRate}
            />

            <Narrative>
              {selectedCustomer.profit > 0
                ? `${selectedCustomer.customerName} is a profitable customer, generating ${formatMoney(selectedCustomer.profit)} in profit from ${formatMoney(selectedCustomer.sales)} in sales.`
                : selectedCustomer.profit < 0
                  ? `${selectedCustomer.customerName} is currently loss-making, with ${formatMoney(selectedCustomer.profit)} in profit against ${formatMoney(selectedCustomer.sales)} in sales. This customer relationship may warrant a closer review of its order economics.`
                  : `${selectedCustomer.customerName} is currently at break-even, with no net profit from ${formatMoney(selectedCustomer.sales)} in sales.`}
              {' '}
              {selectedCustomer.profitMargin != null
                ? `The customer's profit margin is ${formatRate(selectedCustomer.profitMargin)} across ${formatCount(selectedCustomer.orderCount)} ${selectedCustomer.orderCount === 1 ? 'order' : 'orders'}.`
                : 'Profit margin cannot be calculated for this customer.'}
              {' '}
              {displayedKpis?.customerRetentionRate == null
                ? 'There is no eligible previous-year activity to calculate this customer’s retention.'
                : displayedKpis.customerRetentionRate === 100
                  ? 'The customer was retained from the previous year.'
                  : displayedKpis.customerRetentionRate === 0
                    ? 'The customer was not active in the current year after being active in the previous year.'
                    : `The customer's retention result is ${formatRate(displayedKpis.customerRetentionRate)}.`}
            </Narrative>
          </>
        ) : (
          <>
            <div className={styles.insightGrid}>
              <Insight
                label="Total Customers"
                value={formatCount(totalCustomers)}
                numericValue={totalCustomers}
              />

              <Insight
                label="Total Sales"
                value={formatMoney(totalSales)}
                numericValue={totalSales}
              />

              <Insight
                label="Average Sales per Customer"
                value={formatMoney(kpis?.averageSalesPerCustomer)}
                numericValue={kpis?.averageSalesPerCustomer}
              />

              <Insight
                label="Average Order Value"
                value={formatMoney(kpis?.averageOrderValue)}
                numericValue={kpis?.averageOrderValue}
              />

              <Insight
                label="Loss-Making Customers"
                value={formatCount(kpis?.lossMakingCustomers)}
                numericValue={kpis?.lossMakingCustomers}
              />

              <Insight
                label="Customer Retention"
                value={formatRate(kpis?.customerRetentionRate)}
                numericValue={kpis?.customerRetentionRate}
              />
            </div>

            <Narrative>
              {totalCustomers > 0
                ? `Across ${formatCount(totalCustomers)} customers, the business generated ${formatMoney(totalSales)} in sales and ${formatMoney(totalProfit)} in total profit.`
                : 'No customer records are available for this selection.'}
              {' '}
              {lossMakingShare != null
                ? `${formatRate(lossMakingShare)} of customers are loss-making (${formatCount(kpis.lossMakingCustomers)} customers), indicating that positive overall profit does not mean every customer relationship is profitable.`
                : ''}
            </Narrative>
          </>
        )}
      </Section>

      <Section title="Customer Retention">
        <div className={styles.insightGrid}>
          <Insight
            label="Strongest Retention Year"
            value={
              strongestRetention
                ? `${strongestRetention.year}: ${formatRate(strongestRetention.retentionRate)}`
                : '—'
            }
            numericValue={strongestRetention?.retentionRate}
          />

          <Insight
            label="Weakest Retention Year"
            value={
              weakestRetention
                ? `${weakestRetention.year}: ${formatRate(weakestRetention.retentionRate)}`
                : '—'
            }
            numericValue={weakestRetention?.retentionRate}
          />

          <Insight
            label="Most Active Year"
            value={
              highestActiveYear
                ? `${highestActiveYear.year}: ${formatCount(highestActiveYear.activeCustomers)} customers`
                : '—'
            }
            numericValue={highestActiveYear?.activeCustomers}
          />

          <Insight
            label="Fewest Active Customers"
            value={
              lowestActiveYear
                ? `${lowestActiveYear.year}: ${formatCount(lowestActiveYear.activeCustomers)} customers`
                : '—'
            }
            numericValue={lowestActiveYear?.activeCustomers}
          />
        </div>

        <Narrative>
          {strongestRetention && weakestRetention
            ? `Retention was highest in ${strongestRetention.year} at ${formatRate(strongestRetention.retentionRate)}, compared with ${formatRate(weakestRetention.retentionRate)} in ${weakestRetention.year}, a difference of ${retentionChange.toFixed(1)} percentage points.`
            : 'Retention comparisons are unavailable because there are not enough eligible years.'}
          {' '}
          {highestActiveYear && lowestActiveYear
            ? `The active customer base ranged from ${formatCount(lowestActiveYear.activeCustomers)} customers in ${lowestActiveYear.year} to ${formatCount(highestActiveYear.activeCustomers)} in ${highestActiveYear.year}, a difference of ${formatCount(activeCustomerChange)} customers.`
            : ''}
        </Narrative>
      </Section>

      <Section title="Customer Concentration">
        <div className={styles.insightGrid}>
          <Insight
            label="Top 10 Customers' Sales Share"
            value={formatRate(top10SalesShare)}
            numericValue={top10SalesShare}
            detail="Combined sales of the ten highest-sales customers as a share of total sales."
          />

          <Insight
            label="Total Customer Profit"
            value={formatMoney(totalProfit)}
            numericValue={totalProfit}
          />

          <Insight
            label="Highest-Profit Customer"
            value={getCustomerName(highestProfitCustomer)}
            detail={
              highestProfitCustomer
                ? formatMoney(highestProfitCustomer.profit)
                : '—'
            }
            detailNumericValue={highestProfitCustomer?.profit}
          />
        </div>

        <Narrative>
          {top10SalesShare != null
            ? `The ten highest-sales customers contribute ${formatRate(top10SalesShare)} of total sales. The remaining sales come from customers outside this top ten; this metric alone does not show how evenly those sales are distributed.`
            : 'Customer sales concentration cannot be calculated for this selection.'}
          {' '}
          {highestProfitCustomer
            ? `${getCustomerName(highestProfitCustomer)} contributes the highest individual customer profit at ${formatMoney(highestProfitCustomer.profit)}.`
            : ''}
        </Narrative>
      </Section>

      <Section title="Top Customer Insights">
        <div className={styles.insightGrid}>
          <Insight
            label="Highest-Sales Customer"
            value={getCustomerName(highestSalesCustomer)}
            detail={
              highestSalesCustomer
                ? formatMoney(highestSalesCustomer.sales)
                : '—'
            }
            detailNumericValue={highestSalesCustomer?.sales}
          />

          <Insight
            label="Highest-Profit Customer"
            value={getCustomerName(highestProfitCustomer)}
            detail={
              highestProfitCustomer
                ? formatMoney(highestProfitCustomer.profit)
                : '—'
            }
            detailNumericValue={highestProfitCustomer?.profit}
          />

          <Insight
            label="Lowest-Profit Customer"
            value={getCustomerName(lowestProfitCustomer)}
            detail={
              lowestProfitCustomer
                ? formatMoney(lowestProfitCustomer.profit)
                : '—'
            }
            detailNumericValue={lowestProfitCustomer?.profit}
          />
        </div>

        <Narrative>
          {highestSalesCustomer && highestProfitCustomer
            ? `${getCustomerName(highestSalesCustomer)} generates the most sales (${formatMoney(highestSalesCustomer.sales)}), while ${getCustomerName(highestProfitCustomer)} contributes the most profit (${formatMoney(highestProfitCustomer.profit)}). The sales leader is not necessarily the most profitable customer.`
            : 'There is not enough customer data to compare sales and profit leaders.'}
          {' '}
          {lowestProfitCustomer && lowestProfitCustomer.profit < 0
            ? `${getCustomerName(lowestProfitCustomer)} records the largest customer loss at ${formatMoney(lowestProfitCustomer.profit)}. This customer may warrant a closer review of order-level profitability.`
            : 'No loss-making customer was identified in the current selection.'}
        </Narrative>
      </Section>
    </div>
  );
}
