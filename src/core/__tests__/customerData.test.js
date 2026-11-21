
import test from 'node:test';
import assert from 'node:assert/strict';

import { rows } from './helpers/loadRows.js';
import {
  buildActiveCustomersByYear,
  buildCustomerConcentrationData,
  buildCustomerKpiData,
  buildCustomerScatterData,
} from '../index.js';

const none = {
  region: null,
  category: null,
  segment: null,
  year: null,
  discountGroup: null,
};

const near = (a, b) => Math.abs(a - b) < 1e-6;

function manuallyFilterRows(source, filters = {}) {
  return source.filter((row) => {
    if (filters.region && row.region !== filters.region) return false;
    if (filters.category && row.category !== filters.category) return false;
    if (filters.segment && row.segment !== filters.segment) return false;

    if (
      filters.year &&
      !row.orderDate.startsWith(String(filters.year))
    ) {
      return false;
    }

    if (
      filters.discountGroup === 'high' &&
      row.discount <= 0.20
    ) {
      return false;
    }

    if (
      filters.discountGroup === 'low' &&
      row.discount > 0.20
    ) {
      return false;
    }

    return true;
  });
}

function independentlyCalculateKpis(source, allRows, filters = {}) {
  const totalSales = source.reduce(
    (total, row) => total + row.sales,
    0,
  );

  const customerIds = new Set(
    source.map((row) => row.customerId),
  );

  const orderIds = new Set(
    source.map((row) => row.orderId),
  );

  const customerProfits = new Map();

  for (const row of source) {
    customerProfits.set(
      row.customerId,
      (customerProfits.get(row.customerId) ?? 0) + row.profit,
    );
  }

  const lossMakingCustomers = [...customerProfits.values()]
    .filter((profit) => profit < 0).length;

  const retentionYear = filters.year ?? 2017;

  let customerRetentionRate = null;

  if (retentionYear > 2014 && retentionYear <= 2017) {
    const comparisonFilters = {
      region: filters.region,
      category: filters.category,
      segment: filters.segment,
      discountGroup: filters.discountGroup,
    };

    const previousRows = manuallyFilterRows(allRows, {
      ...comparisonFilters,
      year: retentionYear - 1,
    });

    const currentRows = manuallyFilterRows(allRows, {
      ...comparisonFilters,
      year: retentionYear,
    });

    const previousCustomers = new Set(
      previousRows.map((row) => row.customerId),
    );

    const currentCustomers = new Set(
      currentRows.map((row) => row.customerId),
    );

    if (previousCustomers.size > 0) {
      let returningCustomers = 0;

      for (const customerId of previousCustomers) {
        if (currentCustomers.has(customerId)) {
          returningCustomers += 1;
        }
      }

      customerRetentionRate =
        (returningCustomers / previousCustomers.size) * 100;
    }
  }

  return {
    averageSalesPerCustomer:
      customerIds.size === 0
        ? null
        : totalSales / customerIds.size,

    averageOrderValue:
      orderIds.size === 0
        ? null
        : totalSales / orderIds.size,

    lossMakingCustomers,

    customerRetentionRate,
  };
}

function independentlyAggregateCustomers(source) {
  const customers = new Map();

  for (const row of source) {
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

  return customers;
}

// --------------------------------------------------
// Independent Active Customers by Year calculation
// --------------------------------------------------

function independentlyCalculateActiveCustomers(
  allRows,
  filters = {},
) {
  const comparisonFilters = {
    region: filters.region,
    category: filters.category,
    segment: filters.segment,
    discountGroup: filters.discountGroup,
  };

  const years = [2014, 2015, 2016, 2017];

  const yearlyCustomers = new Map();

  for (const year of years) {
    const yearRows = manuallyFilterRows(allRows, {
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

  return years.map((year, index) => {
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

    const returningCustomers = [...currentCustomers].filter(
      (customerId) => previousCustomers.has(customerId),
    ).length;

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

// --------------------------------------------------
// Independent Customer Concentration calculation
// --------------------------------------------------

function independentlyCalculateConcentration(source, field) {
  const customers = independentlyAggregateCustomers(source);

  const ranked = [...customers.values()].sort((a, b) => {
    const difference = b[field] - a[field];

    if (difference !== 0) return difference;

    return String(a.customerName ?? '').localeCompare(
      String(b.customerName ?? ''),
    );
  });

  const total = source.reduce(
    (sum, row) => sum + (row[field] ?? 0),
    0,
  );

  let cumulativeValue = 0;

  return ranked.map((customer, index) => {
    cumulativeValue += customer[field];

    return {
      customerId: customer.customerId,
      customerName: customer.customerName,
      rank: index + 1,
      customerPercentage:
        ((index + 1) / ranked.length) * 100,
      cumulativeValue,
      cumulativePercentage:
        total === 0
          ? null
          : (cumulativeValue / total) * 100,
    };
  });
}

// --------------------------------------------------
// Customer Analysis KPI tests
// --------------------------------------------------

test('unfiltered Customer Analysis KPIs match independent calculations', () => {
  const actual = buildCustomerKpiData(rows, none).kpis;
  const expected = independentlyCalculateKpis(rows, rows, none);

  assert.ok(
    near(
      actual.averageSalesPerCustomer,
      expected.averageSalesPerCustomer,
    ),
  );

  assert.ok(
    near(actual.averageOrderValue, expected.averageOrderValue),
  );

  assert.equal(
    actual.lossMakingCustomers,
    expected.lossMakingCustomers,
  );

  assert.ok(
    near(
      actual.customerRetentionRate,
      expected.customerRetentionRate,
    ),
  );
});

test('Customer Analysis benchmark values match the validated dataset', () => {
  const actual = buildCustomerKpiData(rows, none).kpis;

  assert.equal(Math.round(actual.averageSalesPerCustomer), 2897);
  assert.equal(Math.round(actual.averageOrderValue), 459);
  assert.equal(actual.lossMakingCustomers, 155);
});

test('Customer Analysis KPIs respond to Region, Segment and Year filters', () => {
  const filters = {
    ...none,
    region: 'West',
    segment: 'Consumer',
    year: 2016,
  };

  const filteredRows = manuallyFilterRows(rows, filters);

  const expected = independentlyCalculateKpis(
    filteredRows,
    rows,
    filters,
  );

  const actual = buildCustomerKpiData(rows, filters).kpis;

  assert.ok(
    near(
      actual.averageSalesPerCustomer,
      expected.averageSalesPerCustomer,
    ),
  );

  assert.ok(
    near(actual.averageOrderValue, expected.averageOrderValue),
  );

  assert.equal(
    actual.lossMakingCustomers,
    expected.lossMakingCustomers,
  );

  assert.ok(
    near(
      actual.customerRetentionRate,
      expected.customerRetentionRate,
    ),
  );
});

test('Customer Analysis KPIs respond to the Discount Group filter', () => {
  const filters = {
    ...none,
    discountGroup: 'high',
  };

  const filteredRows = manuallyFilterRows(rows, filters);

  const expected = independentlyCalculateKpis(
    filteredRows,
    rows,
    filters,
  );

  const actual = buildCustomerKpiData(rows, filters).kpis;

  assert.ok(
    near(
      actual.averageSalesPerCustomer,
      expected.averageSalesPerCustomer,
    ),
  );

  assert.ok(
    near(actual.averageOrderValue, expected.averageOrderValue),
  );

  assert.equal(
    actual.lossMakingCustomers,
    expected.lossMakingCustomers,
  );

  assert.ok(
    near(
      actual.customerRetentionRate,
      expected.customerRetentionRate,
    ),
  );
});

test('Retention uses the selected year and its immediately preceding year', () => {
  for (const year of [2015, 2016, 2017]) {
    const filters = { ...none, year };

    const filteredRows = manuallyFilterRows(rows, filters);

    const expected = independentlyCalculateKpis(
      filteredRows,
      rows,
      filters,
    );

    const actual = buildCustomerKpiData(rows, filters).kpis;

    assert.ok(
      near(
        actual.customerRetentionRate,
        expected.customerRetentionRate,
      ),
      `Retention for ${year} should match the previous-year cohort`,
    );
  }
});

test('Retention is unavailable for 2014 because there is no prior year', () => {
  const actual = buildCustomerKpiData(rows, {
    ...none,
    year: 2014,
  }).kpis;

  assert.equal(actual.customerRetentionRate, null);
});

test('empty input produces safe Customer Analysis KPI values', () => {
  const data = buildCustomerKpiData([], none);

  assert.equal(data.hasAnyData, false);
  assert.equal(data.kpis.averageSalesPerCustomer, null);
  assert.equal(data.kpis.averageOrderValue, null);
  assert.equal(data.kpis.lossMakingCustomers, 0);
  assert.equal(data.kpis.customerRetentionRate, null);

  assert.ok(!/NaN|Infinity/.test(JSON.stringify(data)));
});

test('Customer Analysis retains the previous-year cohort when Year is selected', () => {
  const filters = {
    ...none,
    year: 2017,
  };

  const actual = buildCustomerKpiData(rows, filters).kpis;

  const expected = independentlyCalculateKpis(
    manuallyFilterRows(rows, filters),
    rows,
    filters,
  );

  assert.ok(
    near(
      actual.customerRetentionRate,
      expected.customerRetentionRate,
    ),
  );
});

// --------------------------------------------------
// Customer Sales vs Profit Margin scatter data tests
// --------------------------------------------------

test('Customer scatter contains all 793 customers without filters', () => {
  const actual = buildCustomerScatterData(rows, none);

  assert.equal(actual.length, 793);

  const customerIds = new Set(
    actual.map((customer) => customer.customerId),
  );

  assert.equal(customerIds.size, 793);

  for (const customer of actual) {
    assert.ok(Number.isFinite(customer.sales));
    assert.ok(Number.isFinite(customer.profit));

    assert.ok(
      customer.profitMargin === null ||
      Number.isFinite(customer.profitMargin),
    );

    assert.ok(Number.isInteger(customer.orderCount));
    assert.ok(customer.orderCount >= 0);
  }
});

test('Customer scatter aggregates sales and profit before calculating margin', () => {
  const actual = buildCustomerScatterData(rows, none);

  const expectedCustomers = independentlyAggregateCustomers(rows);

  assert.equal(actual.length, expectedCustomers.size);

  for (const customer of actual) {
    const expected = expectedCustomers.get(customer.customerId);

    assert.ok(expected, `Customer ${customer.customerId} should exist`);

    assert.equal(customer.customerName, expected.customerName);
    assert.ok(near(customer.sales, expected.sales));
    assert.ok(near(customer.profit, expected.profit));

    const expectedMargin =
      expected.sales === 0
        ? null
        : (expected.profit / expected.sales) * 100;

    if (expectedMargin === null) {
      assert.equal(customer.profitMargin, null);
    } else {
      assert.ok(near(customer.profitMargin, expectedMargin));
    }

    assert.equal(customer.orderCount, expected.orderIds.size);
  }
});

test('Customer scatter counts distinct orders rather than transaction rows', () => {
  const actual = buildCustomerScatterData(rows, none);

  const expectedCustomers = independentlyAggregateCustomers(rows);

  for (const customer of actual) {
    const expected = expectedCustomers.get(customer.customerId);

    assert.equal(
      customer.orderCount,
      expected.orderIds.size,
    );
  }
});

test('Customer scatter responds to all five supported global filters', () => {
  const filters = {
    region: 'West',
    category: 'Furniture',
    segment: 'Consumer',
    year: 2016,
    discountGroup: 'high',
  };

  const filteredRows = manuallyFilterRows(rows, filters);

  const actual = buildCustomerScatterData(rows, filters);

  const expectedCustomers =
    independentlyAggregateCustomers(filteredRows);

  assert.equal(actual.length, expectedCustomers.size);

  for (const customer of actual) {
    const expected = expectedCustomers.get(customer.customerId);

    assert.ok(
      expected,
      `Unexpected customer ${customer.customerId}`,
    );

    assert.ok(near(customer.sales, expected.sales));
    assert.ok(near(customer.profit, expected.profit));

    const expectedMargin =
      expected.sales === 0
        ? null
        : (expected.profit / expected.sales) * 100;

    if (expectedMargin === null) {
      assert.equal(customer.profitMargin, null);
    } else {
      assert.ok(near(customer.profitMargin, expectedMargin));
    }

    assert.equal(
      customer.orderCount,
      expected.orderIds.size,
    );
  }
});

// --------------------------------------------------
// Active Customers by Year chart data tests
// --------------------------------------------------

test('Active Customers by Year returns all four years in order', () => {
  const actual = buildActiveCustomersByYear(rows, none);

  assert.deepEqual(
    actual.map((item) => item.year),
    [2014, 2015, 2016, 2017],
  );
});

test('Active customer counts match validated dataset benchmarks', () => {
  const actual = buildActiveCustomersByYear(rows, none);

  assert.deepEqual(
    actual.map((item) => item.activeCustomers),
    [595, 573, 638, 693],
  );
});

test('Active Customers by Year matches independent calculations', () => {
  const actual = buildActiveCustomersByYear(rows, none);

  const expected = independentlyCalculateActiveCustomers(
    rows,
    none,
  );

  assert.deepEqual(actual, expected);
});

test('Returning and new/reactivated customers add up to active customers', () => {
  const actual = buildActiveCustomersByYear(rows, none);

  for (const item of actual) {
    assert.equal(
      item.returningCustomers + item.newOrReactivatedCustomers,
      item.activeCustomers,
      `Customer segments should add up for ${item.year}`,
    );
  }
});

test('Retention uses the previous year active customer cohort', () => {
  const actual = buildActiveCustomersByYear(rows, none);

  for (const item of actual) {
    if (item.year === 2014) {
      assert.equal(item.retentionRate, null);
      continue;
    }

    const previousYear = actual.find(
      (previous) => previous.year === item.year - 1,
    );

    const expected =
      previousYear.activeCustomers === 0
        ? null
        : (item.returningCustomers / previousYear.activeCustomers) * 100;

    if (expected === null) {
      assert.equal(item.retentionRate, null);
    } else {
      assert.ok(
        near(item.retentionRate, expected),
        `Retention for ${item.year} should use the previous year's customers`,
      );
    }
  }
});

test('Active Customers by Year ignores the selected Year filter', () => {
  const unfiltered = buildActiveCustomersByYear(rows, none);

  const yearFiltered = buildActiveCustomersByYear(rows, {
    ...none,
    year: 2016,
  });

  assert.deepEqual(yearFiltered, unfiltered);
});

test('Active Customers by Year respects Region, Category, Segment and Discount Group', () => {
  const filters = {
    region: 'West',
    category: 'Furniture',
    segment: 'Consumer',
    year: 2016,
    discountGroup: 'high',
  };

  const actual = buildActiveCustomersByYear(rows, filters);

  const expected = independentlyCalculateActiveCustomers(
    rows,
    filters,
  );

  assert.deepEqual(actual, expected);
});

test('Active Customers by Year handles empty input safely', () => {
  const actual = buildActiveCustomersByYear([], none);

  assert.equal(actual.length, 4);

  for (const item of actual) {
    assert.equal(item.activeCustomers, 0);
    assert.equal(item.returningCustomers, 0);
    assert.equal(item.newOrReactivatedCustomers, 0);
    assert.equal(item.retentionRate, null);
  }
});

// --------------------------------------------------
// Customer Concentration chart data tests
// --------------------------------------------------

test('Customer Concentration returns independent Sales and Profit curves', () => {
  const actual = buildCustomerConcentrationData(rows, none);

  const expectedSales = independentlyCalculateConcentration(
    rows,
    'sales',
  );

  const expectedProfit = independentlyCalculateConcentration(
    rows,
    'profit',
  );

  assert.equal(actual.customerCount, 793);
  assert.equal(actual.salesCurve.length, 793);
  assert.equal(actual.profitCurve.length, 793);

  assert.equal(
    actual.totalSales,
    rows.reduce((total, row) => total + row.sales, 0),
  );

  assert.equal(
    actual.totalProfit,
    rows.reduce((total, row) => total + row.profit, 0),
  );

  for (let i = 0; i < actual.customerCount; i += 1) {
    const salesPoint = actual.salesCurve[i];
    const expectedSalesPoint = expectedSales[i];

    const profitPoint = actual.profitCurve[i];
    const expectedProfitPoint = expectedProfit[i];

    assert.equal(salesPoint.customerId, expectedSalesPoint.customerId);
    assert.equal(salesPoint.rank, i + 1);

    assert.ok(
      near(
        salesPoint.customerPercentage,
        expectedSalesPoint.customerPercentage,
      ),
    );

    assert.ok(
      near(
        salesPoint.cumulativeValue,
        expectedSalesPoint.cumulativeValue,
      ),
    );

    assert.ok(
      near(
        salesPoint.cumulativePercentage,
        expectedSalesPoint.cumulativePercentage,
      ),
    );

    assert.equal(profitPoint.customerId, expectedProfitPoint.customerId);
    assert.equal(profitPoint.rank, i + 1);

    assert.ok(
      near(
        profitPoint.customerPercentage,
        expectedProfitPoint.customerPercentage,
      ),
    );

    assert.ok(
      near(
        profitPoint.cumulativeValue,
        expectedProfitPoint.cumulativeValue,
      ),
    );

    assert.ok(
      near(
        profitPoint.cumulativePercentage,
        expectedProfitPoint.cumulativePercentage,
      ),
    );
  }
});

test('Customer Concentration ranks Sales and Profit independently', () => {
  const actual = buildCustomerConcentrationData(rows, none);

  const salesRanking = actual.salesCurve.map(
    (point) => point.customerId,
  );

  const profitRanking = actual.profitCurve.map(
    (point) => point.customerId,
  );

  assert.equal(new Set(salesRanking).size, 793);
  assert.equal(new Set(profitRanking).size, 793);

  assert.notDeepEqual(
    salesRanking,
    profitRanking,
    'Sales and Profit should have independent customer rankings',
  );
});

test('Customer Concentration cumulative customer percentages increase to 100%', () => {
  const actual = buildCustomerConcentrationData(rows, none);

  for (const curve of [actual.salesCurve, actual.profitCurve]) {
    for (let i = 1; i < curve.length; i += 1) {
      assert.ok(
        curve[i].customerPercentage >
          curve[i - 1].customerPercentage,
      );
    }

    assert.ok(
      near(curve.at(-1).customerPercentage, 100),
    );
  }
});

test('Customer Concentration cumulative values match their totals', () => {
  const actual = buildCustomerConcentrationData(rows, none);

  assert.ok(
    near(
      actual.salesCurve.at(-1).cumulativeValue,
      actual.totalSales,
    ),
  );

  assert.ok(
    near(
      actual.profitCurve.at(-1).cumulativeValue,
      actual.totalProfit,
    ),
  );

  assert.ok(
    near(actual.salesCurve.at(-1).cumulativePercentage, 100),
  );

  assert.ok(
    near(actual.profitCurve.at(-1).cumulativePercentage, 100),
  );
});

test('Customer Concentration responds to all five global filters', () => {
  const filters = {
    region: 'West',
    category: 'Furniture',
    segment: 'Consumer',
    year: 2016,
    discountGroup: 'high',
  };

  const filteredRows = manuallyFilterRows(rows, filters);

  const actual = buildCustomerConcentrationData(rows, filters);

  const expectedSales = independentlyCalculateConcentration(
    filteredRows,
    'sales',
  );

  const expectedProfit = independentlyCalculateConcentration(
    filteredRows,
    'profit',
  );

  assert.equal(actual.customerCount, expectedSales.length);
  assert.equal(actual.customerCount, expectedProfit.length);

  assert.deepEqual(
    actual.salesCurve.map((point) => point.customerId),
    expectedSales.map((point) => point.customerId),
  );

  assert.deepEqual(
    actual.profitCurve.map((point) => point.customerId),
    expectedProfit.map((point) => point.customerId),
  );

  assert.ok(
    near(
      actual.totalSales,
      filteredRows.reduce((total, row) => total + row.sales, 0),
    ),
  );

  assert.ok(
    near(
      actual.totalProfit,
      filteredRows.reduce((total, row) => total + row.profit, 0),
    ),
  );
});

test('Customer Concentration handles empty input safely', () => {
  const actual = buildCustomerConcentrationData([], none);

  assert.equal(actual.customerCount, 0);
  assert.equal(actual.totalSales, 0);
  assert.equal(actual.totalProfit, 0);
  assert.deepEqual(actual.salesCurve, []);
  assert.deepEqual(actual.profitCurve, []);

  assert.ok(!/NaN|Infinity/.test(JSON.stringify(actual)));
});
