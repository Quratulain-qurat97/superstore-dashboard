
import { filterRows } from './aggregations.js';

const CUSTOMER_YEARS = [2014, 2015, 2016, 2017];

function sum(rows, field) {
  return rows.reduce((total, row) => total + (row[field] ?? 0), 0);
}

function getUniqueCount(rows, field) {
  return new Set(
    rows.map((row) => row[field]).filter((value) => value != null),
  ).size;
}

/**
 * Apply the Customer Analysis global filters.
 * Month is intentionally excluded from this page.
 */
function filterCustomerRows(rows, filters = {}) {
  return filterRows(rows, {
    region: filters.region,
    category: filters.category,
    segment: filters.segment,
    year: filters.year,
    discountGroup: filters.discountGroup,
  });
}

function getCustomerProfitGroups(rows) {
  const customers = new Map();

  for (const row of rows) {
    const current = customers.get(row.customerId) ?? {
      customerId: row.customerId,
      customerName: row.customerName,
      profit: 0,
      sales: 0,
      discountTotal: 0,
      transactionCount: 0,
    };

    current.profit += row.profit ?? 0;
    current.sales += row.sales ?? 0;
    current.discountTotal += row.discount ?? 0;
    current.transactionCount += 1;

    customers.set(row.customerId, current);
  }

  return [...customers.values()];
}

/**
 * Build one cumulative concentration curve.
 *
 * Customers are ranked from highest to lowest value.
 * Each point retains the customer identity so the chart
 * can select that customer when the point is clicked.
 */
function buildConcentrationCurve(customers, field, totalValue) {
  const rankedCustomers = [...customers].sort((a, b) => {
    const difference = b[field] - a[field];

    if (difference !== 0) {
      return difference;
    }

    return String(a.customerName ?? '').localeCompare(
      String(b.customerName ?? ''),
    );
  });

  const customerCount = rankedCustomers.length;

  if (customerCount === 0) {
    return [];
  }

  let cumulativeValue = 0;

  return rankedCustomers.map((customer, index) => {
    cumulativeValue += customer[field];

    return {
      rank: index + 1,
      customerId: customer.customerId,
      customerName: customer.customerName,

      sales: customer.sales,
      profit: customer.profit,

      customerPercentage:
        ((index + 1) / customerCount) * 100,

      cumulativeValue,

      cumulativePercentage:
        totalValue === 0
          ? null
          : (cumulativeValue / totalValue) * 100,
    };
  });
}

/**
 * Build Customer Concentration data.
 *
 * Sales and Profit are ranked independently, from highest
 * to lowest contribution.
 *
 * Both curves use the same customer population and filters.
 * Each point contains customerId for click-based selection.
 */
export function buildCustomerConcentrationData(rows, filters = {}) {
  const filteredRows = filterCustomerRows(rows, filters);

  const customers = getCustomerProfitGroups(
    filteredRows.filter((row) => row.customerId != null),
  );

  const totalSales = sum(filteredRows, 'sales');
  const totalProfit = sum(filteredRows, 'profit');

  const salesCurve = buildConcentrationCurve(
    customers,
    'sales',
    totalSales,
  );

  const profitCurve = buildConcentrationCurve(
    customers,
    'profit',
    totalProfit,
  );

  return {
    customerCount: customers.length,
    totalSales,
    totalProfit,

    salesCurve,
    profitCurve,
  };
}

/**
 * Aggregate sales, profit and distinct orders for each customer.
 * Margin is calculated from aggregated totals.
 */
export function buildCustomerScatterData(rows, filters = {}) {
  const filteredRows = filterCustomerRows(rows, filters);
  const customers = new Map();

  for (const row of filteredRows) {
    const current = customers.get(row.customerId) ?? {
      customerId: row.customerId,
      customerName: row.customerName,
      sales: 0,
      profit: 0,
      orderIds: new Set(),
    };

    current.sales += row.sales ?? 0;
    current.profit += row.profit ?? 0;

    if (row.orderId != null) {
      current.orderIds.add(row.orderId);
    }

    customers.set(row.customerId, current);
  }

  return [...customers.values()].map((customer) => ({
    customerId: customer.customerId,
    customerName: customer.customerName,
    sales: customer.sales,
    profit: customer.profit,
    profitMargin:
      customer.sales === 0
        ? null
        : (customer.profit / customer.sales) * 100,
    orderCount: customer.orderIds.size,
  }));
}

/**
 * Build Top 10 Customers data.
 *
 * Customers are ranked by total Sales, highest first.
 * Profit determines whether each bar represents a gain or loss.
 *
 * Applies all Customer Analysis global filters.
 * Customer IDs are retained for shared chart selection.
 */
export function buildTop10CustomersData(rows, filters = {}) {
  const filteredRows = filterCustomerRows(rows, filters);

  const customers = getCustomerProfitGroups(
    filteredRows.filter((row) => row.customerId != null),
  );

  return customers
    .map((customer) => ({
      customerId: customer.customerId,
      customerName: customer.customerName,
      sales: customer.sales,
      profit: customer.profit,
      profitMargin:
        customer.sales === 0
          ? null
          : (customer.profit / customer.sales) * 100,
      isProfitable: customer.profit >= 0,
    }))
    .sort((a, b) => {
      if (b.sales !== a.sales) {
        return b.sales - a.sales;
      }

      return String(a.customerName ?? '').localeCompare(
        String(b.customerName ?? ''),
      );
    })
    .slice(0, 10)
    .map((customer, index) => ({
      ...customer,
      rank: index + 1,
    }));
}

/**
 * Build Active Customers by Year data.
 *
 * Always returns all four years, regardless of the selected Year filter.
 * Region, Category, Segment and Discount Group remain applicable.
 *
 * returningCustomers:
 * Customers who were active in the immediately preceding year.
 *
 * newOrReactivatedCustomers:
 * Customers who were not active in the immediately preceding year.
 *
 * Retention:
 * Returning customers / previous year's active customers * 100.
 */
export function buildActiveCustomersByYear(rows, filters = {}) {
  const comparisonFilters = {
    region: filters.region,
    category: filters.category,
    segment: filters.segment,
    discountGroup: filters.discountGroup,
  };

  const yearlyCustomers = new Map();

  for (const year of CUSTOMER_YEARS) {
    const yearRows = filterCustomerRows(rows, {
      ...comparisonFilters,
      year,
    });

    yearlyCustomers.set(
      year,
      new Set(
        yearRows
          .map((row) => row.customerId)
          .filter((customerId) => customerId != null),
      ),
    );
  }

  return CUSTOMER_YEARS.map((year, index) => {
    const currentCustomers = yearlyCustomers.get(year);

    if (index === 0) {
      return {
        year,
        activeCustomers: currentCustomers.size,
        returningCustomers: 0,
        newOrReactivatedCustomers: currentCustomers.size,
        retentionRate: null,
      };
    }

    const previousCustomers = yearlyCustomers.get(year - 1);

    let returningCustomers = 0;

    for (const customerId of currentCustomers) {
      if (previousCustomers.has(customerId)) {
        returningCustomers += 1;
      }
    }

    const newOrReactivatedCustomers =
      currentCustomers.size - returningCustomers;

    return {
      year,
      activeCustomers: currentCustomers.size,
      returningCustomers,
      newOrReactivatedCustomers,
      retentionRate:
        previousCustomers.size === 0
          ? null
          : (returningCustomers / previousCustomers.size) * 100,
    };
  });
}

/**
 * Calculate overall retention for one year.
 * The previous-year cohort is built independently of the Year filter.
 */
function calculateRetention(rows, year, filters = {}) {
  if (!CUSTOMER_YEARS.includes(year) || year === 2014) {
    return null;
  }

  const comparisonFilters = {
    region: filters.region,
    category: filters.category,
    segment: filters.segment,
    discountGroup: filters.discountGroup,
  };

  const previousYearRows = filterCustomerRows(rows, {
    ...comparisonFilters,
    year: year - 1,
  });

  const currentYearRows = filterCustomerRows(rows, {
    ...comparisonFilters,
    year,
  });

  const previousCustomers = new Set(
    previousYearRows.map((row) => row.customerId),
  );

  const currentCustomers = new Set(
    currentYearRows.map((row) => row.customerId),
  );

  if (previousCustomers.size === 0) {
    return null;
  }

  let returningCustomers = 0;

  for (const customerId of previousCustomers) {
    if (currentCustomers.has(customerId)) {
      returningCustomers += 1;
    }
  }

  return (returningCustomers / previousCustomers.size) * 100;
}

/**
 * Calculate whether one customer returned in the comparison year.
 *
 * Returns:
 * 100 = active in both years
 * 0 = active in previous year, absent in current year
 * null = not part of the previous-year cohort or no comparison available
 */
function calculateSelectedCustomerRetention(
  rows,
  customerId,
  year,
  filters = {},
) {
  if (
    !CUSTOMER_YEARS.includes(year) ||
    year === 2014 ||
    customerId == null
  ) {
    return null;
  }

  const comparisonFilters = {
    region: filters.region,
    category: filters.category,
    segment: filters.segment,
    discountGroup: filters.discountGroup,
  };

  const previousYearRows = filterCustomerRows(rows, {
    ...comparisonFilters,
    year: year - 1,
  });

  const currentYearRows = filterCustomerRows(rows, {
    ...comparisonFilters,
    year,
  });

  const wasActivePreviously = previousYearRows.some(
    (row) => row.customerId === customerId,
  );

  if (!wasActivePreviously) {
    return null;
  }

  const isActiveCurrently = currentYearRows.some(
    (row) => row.customerId === customerId,
  );

  return isActiveCurrently ? 100 : 0;
}

/**
 * Build the four overall Customer Analysis KPI values.
 */
export function buildCustomerKpiData(rows, filters = {}) {
  const filteredRows = filterCustomerRows(rows, filters);
  const totalSales = sum(filteredRows, 'sales');

  const distinctCustomers = getUniqueCount(
    filteredRows,
    'customerId',
  );

  const distinctOrders = getUniqueCount(
    filteredRows,
    'orderId',
  );

  const customerGroups = getCustomerProfitGroups(filteredRows);

  const lossMakingCustomers = customerGroups.filter(
    (customer) => customer.profit < 0,
  ).length;

  const retentionYear = filters.year ?? 2017;

  return {
    hasAnyData: filteredRows.length > 0,
    kpis: {
      averageSalesPerCustomer:
        distinctCustomers === 0
          ? null
          : totalSales / distinctCustomers,

      averageOrderValue:
        distinctOrders === 0
          ? null
          : totalSales / distinctOrders,

      lossMakingCustomers,

      customerRetentionRate: calculateRetention(
        rows,
        retentionYear,
        filters,
      ),
    },
  };
}

/**
 * Build the four KPI values for one selected customer.
 */
export function buildSelectedCustomerKpiData(
  rows,
  customerId,
  filters = {},
) {
  if (customerId == null) {
    return null;
  }

  const filteredRows = filterCustomerRows(rows, filters);

  const customerRows = filteredRows.filter(
    (row) => row.customerId === customerId,
  );

  if (customerRows.length === 0) {
    return null;
  }

  const sales = sum(customerRows, 'sales');
  const profit = sum(customerRows, 'profit');
  const orderCount = getUniqueCount(customerRows, 'orderId');

  const retentionYear = filters.year ?? 2017;

  return {
    customerId,
    customerName: customerRows[0].customerName,
    kpis: {
      averageSalesPerCustomer: sales,

      averageOrderValue:
        orderCount === 0
          ? null
          : sales / orderCount,

      lossMakingCustomers: profit < 0 ? 1 : 0,

      customerRetentionRate: calculateSelectedCustomerRetention(
        rows,
        customerId,
        retentionYear,
        filters,
      ),
    },
  };
}
