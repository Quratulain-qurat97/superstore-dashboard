
// decodeCompactDataset.js
// Rebuilds the exact row objects of data/superstore.json from the compact, dictionary-encoded
// dataset (data/superstore.compact.json). Pure and dependency-free, so the same file is used
// by the browser bundle, the Node scripts and the tests.
//
// COMPACT FORMAT ("superstore-dict-v1")
//   {
//     format:     'superstore-dict-v1',
//     meta:       { ... },           copied verbatim from the canonical file
//     fields:     [17 field names],  the data contract, in row key order
//     dictFields: [12 field names],  the string fields (stored as dictionary indexes)
//     dict:       { <stringField>: [distinct strings, in order of first appearance] },
//     cols:       { <field>: [one value per row] }   // 17 columns, all rowCount long
//   }
//
//   - String field columns hold integer indexes into dict[field]. The integer -1 means null.
//     Valid indexes are 0 .. dict[field].length - 1, so -1 can never collide with one.
//   - Numeric field columns (rowId, sales, quantity, discount, profit) hold the numbers
//     themselves (no scaling, no rounding). JSON null means null.
//   - productId and productName have SEPARATE dictionaries. Nothing is keyed by productId
//     alone, so the 32 Product IDs that carry more than one Product Name stay separate.
//
// The decoder validates the structure and every dictionary index BEFORE it reads any
// dictionary entry. Malformed input throws a CompactDatasetError and nothing is returned.

export const COMPACT_FORMAT = 'superstore-dict-v1';

/** The agreed 17-field data contract, in row key order. */
export const DATASET_FIELDS = Object.freeze([
  'rowId', 'orderId', 'orderDate', 'shipMode', 'customerId', 'customerName',
  'segment', 'state', 'region', 'category', 'subCategory',
  'productId', 'productName',
  'sales', 'quantity', 'discount', 'profit',
]);

/** The string fields: stored as indexes into a per-field dictionary. */
export const DICTIONARY_FIELDS = Object.freeze([
  'orderId', 'orderDate', 'shipMode', 'customerId', 'customerName',
  'segment', 'state', 'region', 'category', 'subCategory',
  'productId', 'productName',
]);

/** The numeric fields: stored as-is. */
export const NUMERIC_FIELDS = Object.freeze(
  DATASET_FIELDS.filter((field) => !DICTIONARY_FIELDS.includes(field)),
);

export class CompactDatasetError extends Error {
  constructor(message) {
    super(`Invalid compact dataset: ${message}`);
    this.name = 'CompactDatasetError';
  }
}

function fail(message) {
  throw new CompactDatasetError(message);
}

function show(value) {
  return typeof value === 'string' ? JSON.stringify(value) : String(value);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sameList(actual, expected) {
  if (!Array.isArray(actual) || actual.length !== expected.length) return false;

  for (let i = 0; i < expected.length; i++) {
    if (actual[i] !== expected[i]) return false;
  }

  return true;
}

function hasExactKeys(object, expected) {
  const actual = Object.keys(object);

  return (
    actual.length === expected.length &&
    expected.every((key) =>
      Object.prototype.hasOwnProperty.call(object, key),
    )
  );
}

// Checks everything that must hold before a single dictionary entry is read.
// Returns the row count.
function validate(compact) {
  if (!isPlainObject(compact)) fail('input is not an object');

  if (compact.format !== COMPACT_FORMAT) {
    fail(`unknown format ${show(compact.format)}`);
  }

  if (!sameList(compact.fields, DATASET_FIELDS)) {
    fail('"fields" differs from the 17-field data contract');
  }

  if (!sameList(compact.dictFields, DICTIONARY_FIELDS)) {
    fail('"dictFields" differs from the data contract');
  }

  const { meta, dict, cols } = compact;

  if (!isPlainObject(meta)) fail('"meta" is missing');

  const rowCount = meta.rowCount;

  if (!Number.isInteger(rowCount) || rowCount < 0) {
    fail(`meta.rowCount is not a non-negative integer (${show(rowCount)})`);
  }

  if (!isPlainObject(dict)) fail('"dict" is missing');
  if (!isPlainObject(cols)) fail('"cols" is missing');

  for (const field of DICTIONARY_FIELDS) {
  if (!Object.prototype.hasOwnProperty.call(dict, field)) {
    fail(`dictionary ${field} is missing`);
  }
}

for (const field of DATASET_FIELDS) {
  if (!Object.prototype.hasOwnProperty.call(cols, field)) {
    fail(`column ${field} is missing`);
  }
}

if (!hasExactKeys(dict, DICTIONARY_FIELDS)) {
  fail('"dict" contains unexpected fields');
}

if (!hasExactKeys(cols, DATASET_FIELDS)) {
  fail('"cols" contains unexpected fields');
}

  for (const field of DATASET_FIELDS) {
    const column = cols[field];

    if (!Array.isArray(column)) {
      fail(`column ${field} is missing`);
    }

    if (column.length !== rowCount) {
      fail(
        `column ${field} has ${column.length} values but meta.rowCount is ${rowCount}`,
      );
    }
  }

  for (const field of DICTIONARY_FIELDS) {
    const entries = dict[field];

    if (!Array.isArray(entries)) {
      fail(`dictionary ${field} is missing`);
    }

    for (let k = 0; k < entries.length; k++) {
      if (typeof entries[k] !== 'string') {
        fail(
          `dictionary ${field} entry ${k} is not a string (${show(entries[k])})`,
        );
      }
    }

    const column = cols[field];
    const size = entries.length;

    for (let i = 0; i < rowCount; i++) {
      const index = column[i];

      // -1 is the null marker; everything else must be a real dictionary position.
      if (!(Number.isInteger(index) && index >= -1 && index < size)) {
        fail(
          `column ${field} row ${i}: index ${show(index)} is not -1 or 0..${size - 1}`,
        );
      }
    }
  }

  for (const field of NUMERIC_FIELDS) {
    const column = cols[field];

    for (let i = 0; i < rowCount; i++) {
      const value = column[i];

      if (
        value !== null &&
        (
          typeof value !== 'number' ||
          !Number.isFinite(value) ||
          Object.is(value, -0)
        )
      ) {
        fail(
          `column ${field} row ${i}: ${show(value)} is not a valid finite number or null`,
        );
      }
    }
  }

  return rowCount;
}

/**
 * @param {object} compact The parsed contents of data/superstore.compact.json.
 * @returns {{ meta: object, transactions: Array<object> }} The same shape as data/superstore.json.
 * @throws {CompactDatasetError} If the input is malformed.
 */
export function decodeCompactDataset(compact) {
  const rowCount = validate(compact);
  const { meta, dict, cols } = compact;

  const colRowId = cols.rowId;
  const colOrderId = cols.orderId;
  const colOrderDate = cols.orderDate;
  const colShipMode = cols.shipMode;
  const colCustomerId = cols.customerId;
  const colCustomerName = cols.customerName;
  const colSegment = cols.segment;
  const colState = cols.state;
  const colRegion = cols.region;
  const colCategory = cols.category;
  const colSubCategory = cols.subCategory;
  const colProductId = cols.productId;
  const colProductName = cols.productName;
  const colSales = cols.sales;
  const colQuantity = cols.quantity;
  const colDiscount = cols.discount;
  const colProfit = cols.profit;

  const dictOrderId = dict.orderId;
  const dictOrderDate = dict.orderDate;
  const dictShipMode = dict.shipMode;
  const dictCustomerId = dict.customerId;
  const dictCustomerName = dict.customerName;
  const dictSegment = dict.segment;
  const dictState = dict.state;
  const dictRegion = dict.region;
  const dictCategory = dict.category;
  const dictSubCategory = dict.subCategory;
  const dictProductId = dict.productId;
  const dictProductName = dict.productName;

  // The row literal fixes key order to the data contract and gives every row
  // the same object shape. Validation guarantees every dictionary index is safe.
  const transactions = [];
  let k;

  for (let i = 0; i < rowCount; i++) {
    transactions.push({
      rowId: colRowId[i],
      orderId: (k = colOrderId[i]) < 0 ? null : dictOrderId[k],
      orderDate: (k = colOrderDate[i]) < 0 ? null : dictOrderDate[k],
      shipMode: (k = colShipMode[i]) < 0 ? null : dictShipMode[k],
      customerId: (k = colCustomerId[i]) < 0 ? null : dictCustomerId[k],
      customerName: (k = colCustomerName[i]) < 0 ? null : dictCustomerName[k],
      segment: (k = colSegment[i]) < 0 ? null : dictSegment[k],
      state: (k = colState[i]) < 0 ? null : dictState[k],
      region: (k = colRegion[i]) < 0 ? null : dictRegion[k],
      category: (k = colCategory[i]) < 0 ? null : dictCategory[k],
      subCategory: (k = colSubCategory[i]) < 0 ? null : dictSubCategory[k],
      productId: (k = colProductId[i]) < 0 ? null : dictProductId[k],
      productName: (k = colProductName[i]) < 0 ? null : dictProductName[k],
      sales: colSales[i],
      quantity: colQuantity[i],
      discount: colDiscount[i],
      profit: colProfit[i],
    });
  }

  return { meta, transactions };
}
