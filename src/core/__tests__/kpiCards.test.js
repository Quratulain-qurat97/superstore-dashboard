import test from 'node:test';
import assert from 'node:assert/strict';
import { rows } from './helpers/loadRows.js';
import { buildHomeData, buildKpiCards, getEffectiveFilters, initialFilterState } from '../index.js';

const none = { region: null, category: null, segment: null, year: null, month: null };

test('the four KPI cards, in the agreed order, with the right labels', () => {
  const cards = buildKpiCards(buildHomeData(rows, none).kpis);
  assert.deepEqual(cards.map((c) => c.label), ['Total Sales', 'Total Profit', 'Total Orders', 'Total Customers']);
  assert.deepEqual(cards.map((c) => c.id), ['totalSales', 'totalProfit', 'totalOrders', 'totalCustomers']);
});

test('unfiltered baseline displays as $2.30M, $286.4K, 5,009 and 793', () => {
  const cards = buildKpiCards(buildHomeData(rows, getEffectiveFilters(initialFilterState())).kpis);
  assert.deepEqual(cards.map((c) => c.value), ['$2.30M', '$286.4K', '5,009', '793']);
  assert.deepEqual(cards.map((c) => c.exact), ['$2,297,200.86', '$286,397.02', '5,009', '793']);
});

test('values follow the filters (recomputed from the transactions, not fixed)', () => {
  const west = buildHomeData(rows, { ...none, region: 'West' }).kpis;
  const cards = buildKpiCards(west);
  const brute = rows.filter((r) => r.region === 'West');
  assert.equal(cards[2].exact, String(new Set(brute.map((r) => r.orderId)).size).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  assert.notEqual(cards[0].value, '$2.30M');
});

test('negative profit shows a minus sign, empty selections show zeros', () => {
  const negative = buildKpiCards({ totalSales: 5000, totalProfit: -17725.48, orderCount: 3, customerCount: 2 });
  assert.equal(negative[1].value, '-$17.7K');
  assert.equal(negative[1].exact, '-$17,725.48');
  const empty = buildKpiCards(buildHomeData(rows, { ...none, year: 2015, month: '2016-03' }).kpis);
  assert.deepEqual(empty.map((c) => c.value), ['$0', '$0', '0', '0']);
});
