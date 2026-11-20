
// Guards the assumptions the dashboard relies on.
import test from 'node:test';
import assert from 'node:assert/strict';
import { rows } from './helpers/loadRows.js';
import { REGIONS, CATEGORIES, SEGMENTS, YEARS } from '../constants.js';

test('every row has the 17 agreed field names, including product details', () => {
  const expected = [
    'rowId', 'orderId', 'orderDate', 'shipMode', 'customerId', 'customerName',
    'segment', 'state', 'region', 'category', 'subCategory',
    'productId', 'productName',
    'sales', 'quantity', 'discount', 'profit',
  ];

  for (const row of rows) {
    assert.deepEqual(Object.keys(row), expected);
  }
});

test('product identifiers and names are complete and consistent', () => {
  assert.ok(rows.every((r) => typeof r.productId === 'string' && r.productId.length > 0));
  assert.ok(rows.every((r) => typeof r.productName === 'string' && r.productName.length > 0));
  assert.equal(new Set(rows.map((r) => r.productId)).size, 1862);
});

test('quantity is numeric and positive for every row', () => {
  assert.ok(rows.every((r) => Number.isFinite(r.quantity) && r.quantity > 0));
});

test('Row IDs are unique and dates are ISO', () => {
  assert.equal(new Set(rows.map((r) => r.rowId)).size, rows.length);
  assert.ok(rows.every((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.orderDate)));
});

test('filter value lists match the data exactly', () => {
  assert.deepEqual([...new Set(rows.map((r) => r.region))].sort(), [...REGIONS].sort());
  assert.deepEqual([...new Set(rows.map((r) => r.category))].sort(), [...CATEGORIES].sort());
  assert.deepEqual([...new Set(rows.map((r) => r.segment))].sort(), [...SEGMENTS].sort());
  assert.deepEqual(
    [...new Set(rows.map((r) => Number(r.orderDate.slice(0, 4))))].sort(),
    YEARS
  );
});

test('every row has Sales > 0 (so a month with sales of 0 means "no transactions")', () => {
  assert.ok(rows.every((r) => r.sales > 0));
});
