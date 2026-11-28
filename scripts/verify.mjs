
// verify.mjs
// Run: node verify.mjs data/superstore.json
//
// Part 1: compares manually defined reference figures against the dataset.
// Part 2: builds the proposed dashboard data contract and checks
//         that it supports every KPI and chart, with several filter combinations.
//
// This script reads the same dataset used by the dashboard.
// It does not read or modify the README.

import { readFileSync, writeFileSync } from 'node:fs';

const { transactions: rows } = JSON.parse(
  readFileSync(process.argv[2] ?? 'data/superstore.json', 'utf8'),
);

// ----------------------------------------------------------------------------
// Small helpers
// ----------------------------------------------------------------------------
const sum = (list, key) => list.reduce((total, r) => total + r[key], 0);
const margin = (profit, sales) => (sales === 0 ? null : (profit / sales) * 100);
const distinct = (list, key) => new Set(list.map((r) => r[key])).size;

function groupBy(list, keyFn) {
  const map = new Map();

  for (const r of list) {
    const k = keyFn(r);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(r);
  }

  return map;
}

const fmt = (n, d = 2) =>
  n === null
    ? '—'
    : n.toLocaleString('en-US', {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      });

// ----------------------------------------------------------------------------
// PART 1: Reference figures vs actual dataset values
// ----------------------------------------------------------------------------
const byRegion = groupBy(rows, (r) => r.region);
const bySegment = groupBy(rows, (r) => r.segment);
const bySub = groupBy(rows, (r) => r.subCategory);
const byCustomer = groupBy(rows, (r) => r.customerId);
const byShip = groupBy(rows, (r) => r.shipMode);
const byState = groupBy(rows, (r) => r.state);

const S = (list) => sum(list, 'sales');
const P = (list) => sum(list, 'profit');
const M = (list) => margin(P(list), S(list));

const customerStats = (name) => {
  const list = rows.filter((r) => r.customerName === name);
  return { sales: S(list), profit: P(list), margin: M(list) };
};

const states = [...byState.entries()].map(([state, list]) => ({
  state,
  region: list[0].region,
  sales: S(list),
  profit: P(list),
  margin: M(list),
}));

const lossStates = states.filter((s) => s.profit < 0);

const noDisc = rows.filter((r) => r.discount === 0);
const hasDisc = rows.filter((r) => r.discount > 0);

const avg = (list, key) =>
  list.length ? sum(list, key) / list.length : null;

const shipStats = [...byShip.entries()].map(([mode, list]) => ({
  mode,
  avgDiscount: avg(list, 'discount'),
  margin: M(list),
}));

const claims = [];

const add = (section, claim, reference, actual, tol, unit = '') =>
  claims.push({
    section,
    claim,
    reference,
    actual,
    tol,
    unit,
  });

// Q1 Regional
add('Q1 Region', 'West revenue', 725457.82, S(byRegion.get('West')), 0.01, '$');
add('Q1 Region', 'West profit', 108418.45, P(byRegion.get('West')), 0.01, '$');
add('Q1 Region', 'West margin', 14.9448, M(byRegion.get('West')), 0.0001, '%');
add('Q1 Region', 'East margin', 13.4834, M(byRegion.get('East')), 0.0001, '%');
add('Q1 Region', 'Central revenue', 501239.89, S(byRegion.get('Central')), 0.01, '$');
add('Q1 Region', 'Central margin', 7.9216, M(byRegion.get('Central')), 0.0001, '%');
add('Q1 Region', 'South margin', 11.9343, M(byRegion.get('South')), 0.0001, '%');

// Q2 Sub-categories
add('Q2 Sub-category', 'Tables revenue', 206965.53, S(bySub.get('Tables')), 0.01, '$');
add('Q2 Sub-category', 'Tables profit', -17725.48, P(bySub.get('Tables')), 0.01, '$');
add('Q2 Sub-category', 'Tables margin', -8.5645, M(bySub.get('Tables')), 0.0001, '%');
add('Q2 Sub-category', 'Bookcases margin', -3.0228, M(bySub.get('Bookcases')), 0.0001, '%');
add('Q2 Sub-category', 'Supplies margin', -2.5477, M(bySub.get('Supplies')), 0.0001, '%');

// Q3 Segment
add('Q3 Segment', 'Consumer revenue', 1161401.34, S(bySegment.get('Consumer')), 0.01, '$');
add('Q3 Segment', 'Consumer margin', 11.5481, M(bySegment.get('Consumer')), 0.0001, '%');
add('Q3 Segment', 'Corporate margin', 13.0255, M(bySegment.get('Corporate')), 0.0001, '%');
add('Q3 Segment', 'Home Office margin', 14.0343, M(bySegment.get('Home Office')), 0.0001, '%');

// Q4 Discount (row level)
add('Q4 Discount', 'No-discount avg profit', 66.9003, avg(noDisc, 'profit'), 0.0001, '$');
add('Q4 Discount', 'With-discount avg profit', -6.6572, avg(hasDisc, 'profit'), 0.0001, '$');
add('Q4 Discount', 'No-discount avg sales', 226.7421, avg(noDisc, 'sales'), 0.0001, '$');
add('Q4 Discount', 'With-discount avg sales', 232.7353, avg(hasDisc, 'sales'), 0.0001, '$');
add(
  'Q4 Discount',
  'Swing ("nearly $74")',
  73.5574,
  avg(noDisc, 'profit') - avg(hasDisc, 'profit'),
  0.0001,
  '$',
);

// Q5 Customers
const sean = customerStats('Sean Miller');
const ken = customerStats('Ken Lonsdale');

add('Q5 Customers', 'Sean Miller revenue', 25043.05, sean.sales, 0.01, '$');
add('Q5 Customers', 'Sean Miller profit', -1980.74, sean.profit, 0.01, '$');
add('Q5 Customers', 'Sean Miller margin', -7.9093, sean.margin, 0.0001, '%');
add('Q5 Customers', 'Ken Lonsdale revenue', 14175.23, ken.sales, 0.01, '$');
add('Q5 Customers', 'Ken Lonsdale margin', 5.692, ken.margin, 0.001, '%');
add(
  'Q5 Customers',
  'Tamara Chand margin ("above 46%")',
  46,
  customerStats('Tamara Chand').margin,
  99,
  '%',
);
add(
  'Q5 Customers',
  'Raymond Buch margin ("above 46%")',
  46,
  customerStats('Raymond Buch').margin,
  99,
  '%',
);

// Q7 Ship mode
const ship = Object.fromEntries(shipStats.map((s) => [s.mode, s]));
const shipMargins = shipStats.map((s) => s.margin);

add(
  'Q7 Ship mode',
  'Lowest ship-mode margin',
  12.0812,
  Math.min(...shipMargins),
  0.0001,
  '%',
);
add(
  'Q7 Ship mode',
  'Highest ship-mode margin (First Class)',
  13.9345,
  ship['First Class'].margin,
  0.0001,
  '%',
);
add(
  'Q7 Ship mode',
  'First Class avg discount',
  0.164610,
  ship['First Class'].avgDiscount,
  0.000001,
  '',
);
add(
  'Q7 Ship mode',
  'Standard Class avg discount',
  0.160023,
  ship['Standard Class'].avgDiscount,
  0.000001,
  '',
);
add(
  'Q7 Ship mode',
  'Second Class avg discount',
  0.138895,
  ship['Second Class'].avgDiscount,
  0.000001,
  '',
);
add(
  'Q7 Ship mode',
  'Same Day avg discount',
  0.152394,
  ship['Same Day'].avgDiscount,
  0.000001,
  '',
);

// Q8 States
const texas = states.find((s) => s.state === 'Texas');

add('Q8 States', 'Loss-making state count', 10, lossStates.length, 0, '');
add('Q8 States', 'Texas revenue', 170188.05, texas.sales, 0.01, '$');
add('Q8 States', 'Texas profit', -25729.36, texas.profit, 0.01, '$');
add('Q8 States', 'Texas margin', -15.1182, texas.margin, 0.0001, '%');

const regionCount = (region) =>
  lossStates.filter((s) => s.region === region).length;

add('Q8 States', 'Central loss-making states', 2, regionCount('Central'), 0, '');
add('Q8 States', 'West loss-making states', 3, regionCount('West'), 0, '');
add('Q8 States', 'South loss-making states', 3, regionCount('South'), 0, '');

// Grade each reference.
// "Above 46%" is an inequality claim, so it is checked separately.
for (const c of claims) {
  if (c.claim.includes('above 46%')) {
    c.status = c.actual > 46 ? 'MATCH' : 'MISMATCH';
    c.diff = null;
  } else {
    c.diff = c.actual - c.reference;
    c.status = Math.abs(c.diff) <= c.tol ? 'MATCH' : 'MISMATCH';
  }
}

// ----------------------------------------------------------------------------
// Statement-level checks
// ----------------------------------------------------------------------------
const months = [...groupBy(rows, (r) => r.orderDate.slice(0, 7)).entries()]
  .map(([month, list]) => ({ month, sales: S(list) }))
  .sort((a, b) => a.month.localeCompare(b.month));

const monthSales = (year, month) =>
  months.find(
    (x) => x.month === `${year}-${String(month).padStart(2, '0')}`,
  ).sales;

const years = [2014, 2015, 2016, 2017];
const everyYear = (fn) => years.every(fn);

const rankInYear = (year, month) =>
  1 +
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter(
    (k) => monthSales(year, k) > monthSales(year, month),
  ).length;

const moms = months.slice(1).map((x, i) => x.sales - months[i].sales);

const statements = [
  [
    'Q1',
    'West leads in both revenue and margin',
    [...byRegion.keys()].every(
      (r) =>
        r === 'West' ||
        (S(byRegion.get('West')) > S(byRegion.get(r)) &&
          M(byRegion.get('West')) > M(byRegion.get(r))),
    ),
  ],
  [
    'Q1',
    'Central is 3rd in revenue',
    [...byRegion.entries()].sort((a, b) => S(b[1]) - S(a[1]))[2][0] ===
      'Central',
  ],
  [
    'Q1',
    'Central has the lowest margin',
    [...byRegion.keys()].every(
      (r) => r === 'Central' || M(byRegion.get('Central')) < M(byRegion.get(r)),
    ),
  ],
  [
    'Q1',
    'Central has the highest average discount',
    [...byRegion.keys()].every(
      (r) =>
        r === 'Central' ||
        avg(byRegion.get('Central'), 'discount') >
          avg(byRegion.get(r), 'discount'),
    ),
  ],
  [
    'Q2',
    'Exactly three loss-making sub-categories: Tables, Bookcases, Supplies',
    [...bySub.entries()]
      .filter(([, list]) => P(list) < 0)
      .map(([key]) => key)
      .sort()
      .join(',') === 'Bookcases,Supplies,Tables',
  ],
  [
    'Q2',
    'Labels, Envelopes, Paper and Copiers have margins above 37%',
    ['Envelopes', 'Labels', 'Paper', 'Copiers'].every(
      (key) => M(bySub.get(key)) > 37,
    ),
  ],
  [
    'Q3',
    'Consumer has the highest revenue and the lowest margin',
    S(bySegment.get('Consumer')) ===
      Math.max(...[...bySegment.values()].map(S)) &&
      M(bySegment.get('Consumer')) ===
        Math.min(...[...bySegment.values()].map(M)),
  ],
  [
  'Q3',
  'Consumer does not have the highest average discount',
  ['Corporate', 'Home Office'].some(
    (segment) =>
      avg(bySegment.get('Consumer'), 'discount') <
      avg(bySegment.get(segment), 'discount'),
  ),
  ],
  [
    'Q3',
    'Home Office has the smallest revenue and the highest margin',
    S(bySegment.get('Home Office')) ===
      Math.min(...[...bySegment.values()].map(S)) &&
      M(bySegment.get('Home Office')) ===
        Math.max(...[...bySegment.values()].map(M)),
  ],
  [
    'Q5',
    'Sean Miller is the #1 customer by revenue',
    [...byCustomer.values()].sort((a, b) => S(b) - S(a))[0][0].customerName ===
      'Sean Miller',
  ],
  [
    'Q7',
    'First Class has the best ship-mode margin',
    ship['First Class'].margin === Math.max(...shipStats.map((s) => s.margin)),
  ],
  [
    'Q7',
    'First Class has the highest average discount',
    ship['First Class'].avgDiscount ===
      Math.max(...shipStats.map((s) => s.avgDiscount)),
  ],
  [
    'Q6',
    'March is higher than both February and April in every year',
    everyYear(
      (year) =>
        monthSales(year, 3) > monthSales(year, 2) &&
        monthSales(year, 3) > monthSales(year, 4),
    ),
  ],
  [
    'Q6',
    'September is higher than both August and October in every year',
    everyYear(
      (year) =>
        monthSales(year, 9) > monthSales(year, 8) &&
        monthSales(year, 9) > monthSales(year, 10),
    ),
  ],
  [
    'Q6',
    'February is lower than both January and March in 2014, 2015 and 2017',
    [2014, 2015, 2017].every(
      (year) =>
        monthSales(year, 2) < monthSales(year, 1) &&
        monthSales(year, 2) < monthSales(year, 3),
    ),
  ],
  [
    'Q6',
    'October is lower than both September and November in every year',
    everyYear(
      (year) =>
        monthSales(year, 10) < monthSales(year, 9) &&
        monthSales(year, 10) < monthSales(year, 11),
    ),
  ],
  [
    'Q6',
    'Fewer than half of consecutive monthly changes exceed $50,000',
    moms.filter((x) => Math.abs(x) > 50000).length < moms.length / 2,
  ],
];

// ----------------------------------------------------------------------------
// Seasonality detail
// ----------------------------------------------------------------------------
const seasonality = {
  monthlyRankByYear: Object.fromEntries(
    years.map((year) => [
      year,
      Object.fromEntries(
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => [
          month,
          rankInYear(year, month),
        ]),
      ),
    ]),
  ),

  novDecShareOfAnnualSales: Object.fromEntries(
    years.map((year) => [
      year,
      ((monthSales(year, 11) + monthSales(year, 12)) /
        sum(
          months.filter((x) => x.month.startsWith(String(year))),
          'sales',
        )) *
        100,
    ]),
  ),

  marSepShareOfAnnualSales: Object.fromEntries(
    years.map((year) => [
      year,
      ((monthSales(year, 3) + monthSales(year, 9)) /
        sum(
          months.filter((x) => x.month.startsWith(String(year))),
          'sales',
        )) *
        100,
    ]),
  ),

  momChangesOver50k: moms.filter((x) => Math.abs(x) > 50000).length,
  momChangesTotal: moms.length,
  top6Months: [...months]
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 6),
};

// ----------------------------------------------------------------------------
// Order-level discount check
// ----------------------------------------------------------------------------
const orders = [...groupBy(rows, (r) => r.orderId).values()].map((list) => ({
  profit: P(list),
  sales: S(list),
  tier: list.every((r) => r.discount === 0)
    ? 'no discount'
    : list.every((r) => r.discount > 0)
      ? 'all lines discounted'
      : 'mixed',
}));

const orderTiers = Object.fromEntries(
  ['no discount', 'mixed', 'all lines discounted'].map((tier) => {
    const list = orders.filter((o) => o.tier === tier);

    return [
      tier,
      {
        orders: list.length,
        avgProfitPerOrder: avg(list, 'profit'),
        shareLossMaking:
          (list.filter((o) => o.profit < 0).length / list.length) * 100,
      },
    ];
  }),
);

const anyDiscountOrders = orders.filter((o) => o.tier !== 'no discount');

const discountBands = Object.fromEntries(
  [
    ['0%', (r) => r.discount === 0],
    ['>0 to 20%', (r) => r.discount > 0 && r.discount <= 0.2],
    ['>20 to 40%', (r) => r.discount > 0.2 && r.discount <= 0.4],
    ['>40%', (r) => r.discount > 0.4],
  ].map(([label, fn]) => {
    const list = rows.filter(fn);

    return [
      label,
      {
        rows: list.length,
        avgProfitPerRow: avg(list, 'profit'),
      },
    ];
  }),
);

// ----------------------------------------------------------------------------
// PART 2: Dashboard data contract
// ----------------------------------------------------------------------------
// query = { region, segment, category, year }
// null or missing means "All".
//
// Rule: each chart that highlights a dimension ignores that dimension's filter.

const REGIONS = ['Central', 'East', 'South', 'West'];
const SEGMENTS = ['Consumer', 'Corporate', 'Home Office'];
const CATEGORIES = ['Furniture', 'Office Supplies', 'Technology'];

function selectRows(query, ignore = null) {
  return rows.filter(
    (r) =>
      (ignore === 'region' || !query.region || r.region === query.region) &&
      (ignore === 'segment' || !query.segment || r.segment === query.segment) &&
      (ignore === 'category' ||
        !query.category ||
        r.category === query.category) &&
      (!query.year || r.orderDate.startsWith(String(query.year))),
  );
}

function monthsInPeriod(year) {
  const list = [];

  for (const y of year ? [year] : [2014, 2015, 2016, 2017]) {
    for (let m = 1; m <= 12; m++) {
      list.push(`${y}-${String(m).padStart(2, '0')}`);
    }
  }

  return list;
}

function buildContract(query = {}) {
  const q = {
    region: query.region ?? null,
    segment: query.segment ?? null,
    category: query.category ?? null,
    year: query.year ?? null,
  };

  const all = selectRows(q);

  // Loss-making states: aggregate profit per state and keep states below zero.
  const stateRows = [...groupBy(all, (r) => r.state).entries()].map(
    ([state, list]) => ({
      state,
      region: list[0].region,
      sales: S(list),
      profit: P(list),
      margin: M(list),
    }),
  );

  const losing = stateRows
    .filter((s) => s.profit < 0)
    .sort((a, b) => b.sales - a.sales);

  // Monthly trend, zero-filled so the chart axis is continuous.
  const monthMap = new Map(
    [...groupBy(all, (r) => r.orderDate.slice(0, 7)).entries()].map(
      ([key, list]) => [key, S(list)],
    ),
  );

  const monthlyTrend = monthsInPeriod(q.year).map((month, i, arr) => {
    const salesValue = monthMap.get(month) ?? 0;
    const prev = i === 0 ? null : (monthMap.get(arr[i - 1]) ?? 0);

    return {
      month,
      sales: salesValue,
      prevSales: prev,
      momChange: prev === null ? null : salesValue - prev,
    };
  });

  const breakdown = (list, keyFn, extra = () => ({})) =>
    [...groupBy(list, keyFn).entries()].map(([key, listForKey]) => ({
      key,
      sales: S(listForKey),
      profit: P(listForKey),
      margin: M(listForKey),
      ...extra(listForKey),
    }));

  const regionRows = selectRows(q, 'region');
  const segmentRows = selectRows(q, 'segment');
  const categoryRows = selectRows(q, 'category');

  const noD = all.filter((r) => r.discount === 0);
  const hasD = all.filter((r) => r.discount > 0);

  const tier = (list) => ({
    rowCount: list.length,
    avgSales: avg(list, 'sales'),
    avgProfit: avg(list, 'profit'),
  });

  return {
    query: q,

    kpis: {
      totalSales: S(all),
      totalProfit: P(all),
      profitMargin: M(all),
      orderCount: distinct(all, 'orderId'),
      customerCount: distinct(all, 'customerId'),
      rowCount: all.length,
    },

    lossStates: {
      count: losing.length,
      stateCount: stateRows.length,
      totalProfit: P(
        losing.flatMap((s) => all.filter((r) => r.state === s.state)),
      ),
      states: losing,
    },

    monthlyTrend,

    regions: breakdown(regionRows, (r) => r.region, (list) => ({
      orderCount: distinct(list, 'orderId'),
    }))
      .map(({ key, ...rest }) => ({ region: key, ...rest }))
      .sort((a, b) => b.sales - a.sales),

    segments: breakdown(segmentRows, (r) => r.segment, (list) => ({
      orderCount: distinct(list, 'orderId'),
      customerCount: distinct(list, 'customerId'),
    }))
      .map(({ key, ...rest }) => ({ segment: key, ...rest }))
      .sort((a, b) => b.margin - a.margin),

    categories: breakdown(categoryRows, (r) => r.category).map(
      ({ key, ...rest }) => ({ category: key, ...rest }),
    ),

    subCategories: [
      ...groupBy(
        categoryRows,
        (r) => `${r.category}|${r.subCategory}`,
      ).entries(),
    ]
      .map(([key, list]) => {
        const [category, subCategory] = key.split('|');

        return {
          category,
          subCategory,
          sales: S(list),
          profit: P(list),
          margin: M(list),
        };
      })
      .sort((a, b) => b.margin - a.margin),

    discountImpact: {
      noDiscount: tier(noD),
      withDiscount: tier(hasD),
      profitDifferencePerRow:
        noD.length && hasD.length
          ? avg(noD, 'profit') - avg(hasD, 'profit')
          : null,
    },
  };
}

// ----------------------------------------------------------------------------
// Contract checks
// ----------------------------------------------------------------------------
const checks = [];

const check = (name, pass, detail = '') =>
  checks.push({ name, pass: Boolean(pass), detail });

const close = (a, b) => Math.abs(a - b) < 1e-6;

const finiteOrNull = (v) =>
  v === null || (typeof v === 'number' && Number.isFinite(v));

const noNaN = (obj) =>
  JSON.stringify(obj, (k, v) =>
    typeof v === 'number' && !Number.isFinite(v) ? '__NAN__' : v,
  ).includes('__NAN__') === false;

const testQueries = [
  { name: 'All filters', query: {} },
  { name: 'Region = Central', query: { region: 'Central' } },
  {
    name: 'Category = Furniture, Year = 2016',
    query: { category: 'Furniture', year: 2016 },
  },
  {
    name: 'Segment = Corporate, Region = West, Category = Technology, Year = 2017',
    query: {
      segment: 'Corporate',
      region: 'West',
      category: 'Technology',
      year: 2017,
    },
  },
  {
    name: 'Empty selection (category that does not exist)',
    query: { category: 'Nonexistent' },
  },
];

let sampleContract = null;

for (const t of testQueries) {
  const c = buildContract(t.query);

  if (t.name === 'All filters') sampleContract = c;

  const label = (s) => `[${t.name}] ${s}`;
  const empty = c.kpis.rowCount === 0;

  // Every KPI and chart has a source.
  check(
    label('KPI Total Sales = kpis.totalSales'),
    finiteOrNull(c.kpis.totalSales),
  );

  check(
    label('KPI Total Profit = kpis.totalProfit'),
    finiteOrNull(c.kpis.totalProfit),
  );

  check(
    label('KPI Profit Margin = kpis.profitMargin (null when no sales)'),
    empty
      ? c.kpis.profitMargin === null
      : close(
          c.kpis.profitMargin,
          (c.kpis.totalProfit / c.kpis.totalSales) * 100,
        ),
  );

  check(
    label('KPI Loss-Making States = lossStates.count / stateCount'),
    Number.isInteger(c.lossStates.count) &&
      Number.isInteger(c.lossStates.stateCount) &&
      c.lossStates.count === c.lossStates.states.length,
  );

  check(label('No NaN/Infinity anywhere in the contract'), noNaN(c));

  check(
    label('Monthly trend zero-filled to full period (48 or 12 months)'),
    c.monthlyTrend.length === (c.query.year ? 12 : 48),
  );

  check(
    label('Monthly trend sums to Total Sales'),
    close(sum(c.monthlyTrend, 'sales'), c.kpis.totalSales),
  );

  // Highlight, do not filter: breakdown charts ignore their own dimension.
  if (!empty) {
    const sliceWithoutRegion = S(selectRows(c.query, 'region'));
    const sliceWithoutSegment = S(selectRows(c.query, 'segment'));
    const sliceWithoutCategory = S(selectRows(c.query, 'category'));

    check(
      label('Regions chart sums to the slice that ignores the Region filter'),
      close(sum(c.regions, 'sales'), sliceWithoutRegion),
    );

    check(
      label('Segments chart sums to the slice that ignores the Segment filter'),
      close(sum(c.segments, 'sales'), sliceWithoutSegment),
    );

    check(
      label('Sub-categories chart sums to the slice that ignores the Category filter'),
      close(sum(c.subCategories, 'sales'), sliceWithoutCategory),
    );

    check(
      label('Categories chips sum to the same slice as sub-categories'),
      close(sum(c.categories, 'sales'), sliceWithoutCategory),
    );

    if (c.query.region) {
      check(
        label('Regions chart still shows all 4 regions when a region is selected'),
        c.regions.length === 4,
      );
    }

    if (c.query.category) {
      check(
        label('Sub-category chart still shows all 17 when a category is selected'),
        c.subCategories.length === 17,
      );
    }

    check(
      label('Discount tiers row counts add up to kpis.rowCount'),
      c.discountImpact.noDiscount.rowCount +
        c.discountImpact.withDiscount.rowCount ===
        c.kpis.rowCount,
    );
  } else {
    // Sub-categories/categories ignore the Category filter,
    // so they correctly stay populated for this empty selection.
    check(
      label(
        'Empty selection: zero KPIs, null margin, no loss states, null discount difference, no region/segment bars',
      ),
      c.kpis.totalSales === 0 &&
        c.kpis.profitMargin === null &&
        c.lossStates.count === 0 &&
        c.lossStates.stateCount === 0 &&
        c.discountImpact.profitDifferencePerRow === null &&
        c.regions.length === 0 &&
        c.segments.length === 0,
    );
  }
}

// Can any valid filter combination produce zero rows?
// 4 regions x 3 segments x 3 categories x 4 years + All options.
let emptyCombos = 0;
let totalCombos = 0;

for (const region of [null, ...REGIONS]) {
  for (const segment of [null, ...SEGMENTS]) {
    for (const category of [null, ...CATEGORIES]) {
      for (const year of [null, 2014, 2015, 2016, 2017]) {
        totalCombos++;

        if (selectRows({ region, segment, category, year }).length === 0) {
          emptyCombos++;
        }
      }
    }
  }
}

check(
  `Every valid filter combination returns rows (${totalCombos} combinations tested)`,
  emptyCombos === 0,
  `${emptyCombos} empty`,
);

const all = sampleContract;

check('[All filters] 4 regions', all.regions.length === 4);
check('[All filters] 3 segments', all.segments.length === 3);
check('[All filters] 3 categories', all.categories.length === 3);
check('[All filters] 17 sub-categories', all.subCategories.length === 17);
check('[All filters] 10 loss-making states', all.lossStates.count === 10);

check(
  '[All filters] Region=Central gives exactly 2 loss-making states (Texas, Illinois)',
  (() => {
    const c = buildContract({ region: 'Central' });

    return (
      c.lossStates.count === 2 &&
      c.lossStates.states.map((s) => s.state).sort().join(',') ===
        'Illinois,Texas'
    );
  })(),
);

// ----------------------------------------------------------------------------
// Output
// ----------------------------------------------------------------------------
const results = {
  dataset: {
    rows: rows.length,
    distinctOrders: distinct(rows, 'orderId'),
    distinctCustomers: distinct(rows, 'customerId'),
    distinctStates: distinct(rows, 'state'),
    totalSales: S(rows),
    totalProfit: P(rows),
    overallMargin: M(rows),
    averageDiscount: avg(rows, 'discount'),
  },

  claims,
  statements: statements.map(([section, statement, pass]) => ({
    section,
    statement,
    pass,
  })),

  seasonality,
  orderLevelDiscount: orderTiers,
  anyDiscountOrderAvgProfit: avg(anyDiscountOrders, 'profit'),
  discountBands,

  lossStates: [...lossStates].sort((a, b) => b.sales - a.sales),

  extra: {
    rowLevelDiscount: {
      noDiscount: {
        rows: noDisc.length,
        avgSales: avg(noDisc, 'sales'),
        avgProfit: avg(noDisc, 'profit'),
      },
      withDiscount: {
        rows: hasDisc.length,
        avgSales: avg(hasDisc, 'sales'),
        avgProfit: avg(hasDisc, 'profit'),
      },
    },

    shipModes: shipStats.map((s) => ({
      ...s,
      rows: byShip.get(s.mode).length,
      sales: S(byShip.get(s.mode)),
      profit: P(byShip.get(s.mode)),
    })),

    regions: [...byRegion.entries()].map(([region, list]) => ({
      region,
      sales: S(list),
      profit: P(list),
      margin: M(list),
      avgDiscount: avg(list, 'discount'),
    })),

    segments: [...bySegment.entries()].map(([segment, list]) => ({
      segment,
      sales: S(list),
      profit: P(list),
      margin: M(list),
      avgDiscount: avg(list, 'discount'),
    })),

    subCategories: [...bySub.entries()]
      .map(([sub, list]) => ({
        sub,
        category: list[0].category,
        sales: S(list),
        profit: P(list),
        margin: M(list),
      }))
      .sort((a, b) => b.margin - a.margin),

    top10Customers: [...byCustomer.values()]
      .map((list) => ({
        name: list[0].customerName,
        sales: S(list),
        profit: P(list),
        margin: M(list),
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10),
  },

  contractChecks: checks,
};

writeFileSync('verification-results.json', JSON.stringify(results, null, 2));
writeFileSync('contract-sample.json', JSON.stringify(sampleContract, null, 2));

// ----------------------------------------------------------------------------
// Console summary
// ----------------------------------------------------------------------------
console.log('\nDATASET', results.dataset);

console.log('\nREFERENCE FIGURES VS ACTUAL');

for (const c of claims) {
  const d =
    c.diff === null ? '' : ` (diff ${fmt(c.diff)})`;

  console.log(
    `${c.status === 'MATCH' ? 'OK      ' : 'MISMATCH'}  ` +
      `${c.section.padEnd(16)} ` +
      `${c.claim.padEnd(44)} ` +
      `Reference ${String(c.reference).padStart(9)}  ` +
      `actual ${fmt(c.actual, 4).padStart(14)}${d}`,
  );
}

console.log('\nREFERENCE STATEMENTS');

for (const s of results.statements) {
  console.log(
    `${s.pass ? 'TRUE ' : 'FALSE'}  ${s.section}  ${s.statement}`,
  );
}

console.log(
  '\nCONTRACT CHECKS:',
  checks.filter((c) => c.pass).length,
  'passed,',
  checks.filter((c) => !c.pass).length,
  'failed of',
  checks.length,
);

for (const c of checks.filter((x) => !x.pass)) {
  console.log('FAILED:', c.name, c.detail);
}
