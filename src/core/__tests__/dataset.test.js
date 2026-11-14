// Guards the assumptions the dashboard relies on.
import test from 'node:test';
import assert from 'node:assert/strict';
import { rows } from './helpers/loadRows.js';
import { REGIONS, CATEGORIES, SEGMENTS, YEARS } from '../constants.js';

test('every row has the 14 agreed field names (structure is unchanged)', () => {
  const expected = [
    'rowId', 'orderId', 'orderDate', 'shipMode', 'customerId', 'customerName',
    'segment', 'state', 'region', 'category', 'subCategory', 'sales', 'discount', 'profit',
  ];
  for (const row of rows) assert.deepEqual(Object.keys(row), expected);
});

test('Row IDs are unique and dates are ISO', () => {
  assert.equal(new Set(rows.map((r) => r.rowId)).size, rows.length);
  assert.ok(rows.every((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.orderDate)));
});

test('filter value lists match the data exactly', () => {
  assert.deepEqual([...new Set(rows.map((r) => r.region))].sort(), [...REGIONS].sort());
  assert.deepEqual([...new Set(rows.map((r) => r.category))].sort(), [...CATEGORIES].sort());
  assert.deepEqual([...new Set(rows.map((r) => r.segment))].sort(), [...SEGMENTS].sort());
  assert.deepEqual([...new Set(rows.map((r) => Number(r.orderDate.slice(0, 4))))].sort(), YEARS);
});

test('every row has Sales > 0 (so a month with sales of 0 means "no transactions")', () => {
  assert.ok(rows.every((r) => r.sales > 0));
});
