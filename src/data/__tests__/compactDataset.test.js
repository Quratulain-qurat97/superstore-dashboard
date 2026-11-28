// Guards the compact dictionary-encoded dataset format (Stage 1: encoder + decoder only).
// The canonical data/superstore.json is the reference. Nothing here touches the dashboard.
//
// Not covered yet (later stages): comparing against the committed data/superstore.compact.json,
// the staticJsonSource loader, and the production build output.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rows, meta, dataFile } from '../../core/__tests__/helpers/loadRows.js';
import {
  COMPACT_FORMAT,
  DATASET_FIELDS,
  DICTIONARY_FIELDS,
  NUMERIC_FIELDS,
  CompactDatasetError,
  decodeCompactDataset,
} from '../decodeCompactDataset.js';
import { encodeDataset, serializeCompactDataset } from '../../../scripts/compact-codec.mjs';

// ---------------------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------------------

// Written out here (not imported) so the tests also guard the constants in the decoder.
const CONTRACT_FIELDS = [
  'rowId', 'orderId', 'orderDate', 'shipMode', 'customerId', 'customerName',
  'segment', 'state', 'region', 'category', 'subCategory',
  'productId', 'productName',
  'sales', 'quantity', 'discount', 'profit',
];

const canonicalText = readFileSync(dataFile, 'utf8');
const canonical = { meta, transactions: rows }; // same shape as data/superstore.json

// The real pipeline: encode -> file text -> parse (what the browser does) -> decode.
const compact = encodeDataset(canonical);
const compactText = serializeCompactDataset(compact);
const decoded = decodeCompactDataset(JSON.parse(compactText));

const datasetOf = (transactions) => ({
  meta: { ...meta, rowCount: transactions.length },
  transactions,
});
const roundTrip = (dataset) =>
  decodeCompactDataset(JSON.parse(serializeCompactDataset(encodeDataset(dataset))));
const rowWith = (overrides, base = rows[0]) => ({ ...base, ...overrides });

function deepFreeze(value) {
  Object.freeze(value);
  for (const child of Object.values(value)) {
    if (child !== null && typeof child === 'object' && !Object.isFrozen(child)) deepFreeze(child);
  }
  return value;
}

const hasNonAscii = (value) => typeof value === 'string' && /[^\x00-\x7f]/.test(value);
const nonAsciiCells = (list) =>
  list.reduce(
    (count, row) => count + DATASET_FIELDS.filter((field) => hasNonAscii(row[field])).length,
    0,
  );
const nullCells = (list) =>
  list.reduce(
    (count, row) => count + DATASET_FIELDS.filter((field) => row[field] === null).length,
    0,
  );

// A small real-shaped compact dataset (the first 40 real rows) for the corruption tests.
const smallDataset = datasetOf(rows.slice(0, 40));
const smallCompact = encodeDataset(smallDataset);
const clone = () => structuredClone(smallCompact);

// ---------------------------------------------------------------------------------------
// Contract constants
// ---------------------------------------------------------------------------------------

test('the decoder constants match the agreed 17-field contract and are frozen', () => {
  assert.deepEqual(DATASET_FIELDS, CONTRACT_FIELDS);
  assert.ok(Object.isFrozen(DATASET_FIELDS));
  assert.ok(Object.isFrozen(DICTIONARY_FIELDS));
  assert.ok(Object.isFrozen(NUMERIC_FIELDS));
  assert.equal(COMPACT_FORMAT, 'superstore-dict-v1');
});

test('dictionary fields are exactly the string fields and numeric fields the number fields', () => {
  const stringFields = CONTRACT_FIELDS.filter((f) => rows.every((r) => typeof r[f] === 'string'));
  const numberFields = CONTRACT_FIELDS.filter((f) => rows.every((r) => typeof r[f] === 'number'));

  assert.deepEqual([...DICTIONARY_FIELDS], stringFields);
  assert.deepEqual([...NUMERIC_FIELDS], numberFields);
  assert.equal(DICTIONARY_FIELDS.length + NUMERIC_FIELDS.length, 17);
});

// ---------------------------------------------------------------------------------------
// Real data: exact round trip against the canonical dataset
// ---------------------------------------------------------------------------------------

test('decoded real dataset is deeply identical to the canonical data/superstore.json', () => {
  assert.deepStrictEqual(decoded, canonical);
});

test('decoded real dataset re-serializes to the exact canonical file text', () => {
  assert.equal(JSON.stringify(decoded), canonicalText);
});

test('decoding the in-memory compact object (no JSON text step) also matches the canonical', () => {
  assert.deepStrictEqual(decodeCompactDataset(compact), canonical);
});

test('all 9,994 rows are preserved in the exact original order', () => {
  assert.equal(decoded.transactions.length, 9994);
  assert.equal(decoded.transactions.length, rows.length);
  assert.equal(decoded.meta.rowCount, 9994);

  for (let i = 0; i < rows.length; i++) {
    assert.equal(decoded.transactions[i].rowId, rows[i].rowId, `row ${i}: rowId / order differs`);
    assert.equal(decoded.transactions[i].orderId, rows[i].orderId, `row ${i}: orderId differs`);
  }
});

test('every decoded row has the 17 field names in the contract key order', () => {
  for (let i = 0; i < decoded.transactions.length; i++) {
    assert.deepEqual(Object.keys(decoded.transactions[i]), CONTRACT_FIELDS, `row ${i}`);
  }
});

test('every cell keeps its exact value and JavaScript type (strings ===, numbers Object.is)', () => {
  for (let i = 0; i < rows.length; i++) {
    for (const field of CONTRACT_FIELDS) {
      const expected = rows[i][field];
      const actual = decoded.transactions[i][field];

      assert.equal(typeof actual, typeof expected, `row ${i} ${field}: type differs`);
      assert.ok(Object.is(actual, expected), `row ${i} ${field}: ${actual} !== ${expected}`);
    }
  }
});

test('non-ASCII text in the real data survives the encode, file-bytes and decode round trip', () => {
  const bytes = Buffer.from(compactText, 'utf8');
  const textFromBytes = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  const fromBytes = decodeCompactDataset(JSON.parse(textFromBytes));

  assert.deepStrictEqual(fromBytes, canonical);
  assert.equal(nonAsciiCells(fromBytes.transactions), nonAsciiCells(rows));
});

test('the real data has the same number of null cells before and after (currently none)', () => {
  const nullMarkers =
    DICTIONARY_FIELDS.reduce((n, f) => n + compact.cols[f].filter((v) => v === -1).length, 0) +
    NUMERIC_FIELDS.reduce((n, f) => n + compact.cols[f].filter((v) => v === null).length, 0);

  assert.equal(nullMarkers, nullCells(rows));
  assert.equal(nullCells(decoded.transactions), nullCells(rows));
});

// ---------------------------------------------------------------------------------------
// Compact structure
// ---------------------------------------------------------------------------------------

test('the compact object has the documented top-level shape and no product table', () => {
  assert.deepEqual(Object.keys(compact), ['format', 'meta', 'fields', 'dictFields', 'dict', 'cols']);
  assert.equal(compact.format, COMPACT_FORMAT);
  assert.deepEqual(compact.fields, CONTRACT_FIELDS);
  assert.deepEqual(compact.dictFields, [...DICTIONARY_FIELDS]);
  assert.deepEqual(Object.keys(compact.dict), [...DICTIONARY_FIELDS]);
  assert.deepEqual(Object.keys(compact.cols), CONTRACT_FIELDS);

  for (const field of CONTRACT_FIELDS) {
    assert.equal(compact.cols[field].length, 9994, `column ${field}`);
  }
});

test('the three-row example from the approved plan is produced exactly', () => {
  const example = encodeDataset(datasetOf(rows.slice(0, 3)));

  assert.deepStrictEqual(example.dict, {
    orderId: ['CA-2016-152156', 'CA-2016-138688'],
    orderDate: ['2016-11-08', '2016-06-12'],
    shipMode: ['Second Class'],
    customerId: ['CG-12520', 'DV-13045'],
    customerName: ['Claire Gute', 'Darrin Van Huff'],
    segment: ['Consumer', 'Corporate'],
    state: ['Kentucky', 'California'],
    region: ['South', 'West'],
    category: ['Furniture', 'Office Supplies'],
    subCategory: ['Bookcases', 'Chairs', 'Labels'],
    productId: ['FUR-BO-10001798', 'FUR-CH-10000454', 'OFF-LA-10000240'],
    productName: [
      'Bush Somerset Collection Bookcase',
      'Hon Deluxe Fabric Upholstered Stacking Chairs, Rounded Back',
      'Self-Adhesive Address Labels for Typewriters by Universal',
    ],
  });
  assert.deepStrictEqual(example.cols, {
    rowId: [1, 2, 3],
    orderId: [0, 0, 1],
    orderDate: [0, 0, 1],
    shipMode: [0, 0, 0],
    customerId: [0, 0, 1],
    customerName: [0, 0, 1],
    segment: [0, 0, 1],
    state: [0, 0, 1],
    region: [0, 0, 1],
    category: [0, 0, 1],
    subCategory: [0, 1, 2],
    productId: [0, 1, 2],
    productName: [0, 1, 2],
    sales: [261.96, 731.94, 14.62],
    quantity: [2, 3, 2],
    discount: [0, 0, 0],
    profit: [41.9136, 219.582, 6.8714],
  });
});

// ---------------------------------------------------------------------------------------
// Product identity (Product ID + Product Name + Category + Sub-Category)
// ---------------------------------------------------------------------------------------

const compositeKey = (r) =>
  JSON.stringify([r.productId, r.productName, r.category, r.subCategory]);

function namesById(list) {
  const byId = new Map();
  for (const r of list) {
    if (!byId.has(r.productId)) byId.set(r.productId, new Map());
    const counts = byId.get(r.productId);
    counts.set(compositeKey(r), (counts.get(compositeKey(r)) ?? 0) + 1);
  }
  return byId;
}

test('real data: the 32 conflicting Product IDs and 1,894 composite identities are preserved', () => {
  const before = namesById(rows);
  const after = namesById(decoded.transactions);

  const conflicting = (map) => [...map].filter(([, counts]) => counts.size > 1);
  assert.equal(conflicting(before).length, 32);
  assert.equal(conflicting(after).length, 32);
  assert.equal(after.size, 1862);
  assert.equal(new Set(decoded.transactions.map(compositeKey)).size, 1894);
  assert.equal(new Set(rows.map(compositeKey)).size, 1894);

  // Every Product ID keeps exactly the same identities with exactly the same row counts.
  assert.deepStrictEqual(after, before);
});

test('real data: FUR-FU-10004848 keeps both of its Product Names', () => {
  const clockRows = decoded.transactions.filter((r) => r.productId === 'FUR-FU-10004848');
  const counts = new Map();
  for (const r of clockRows) counts.set(r.productName, (counts.get(r.productName) ?? 0) + 1);

  assert.deepEqual(
    [...counts].sort(),
    [
      ['DAX Solid Wood Frames', 3],
      ['Howard Miller 13-3/4" Diameter Brushed Chrome Round Wall Clock', 9],
    ],
  );
});

test('synthetic: one Product ID with several names / sub-categories is never merged', () => {
  const dataset = datasetOf([
    rowWith({ productId: 'X-1', productName: 'Alpha', category: 'Furniture', subCategory: 'Chairs' }),
    rowWith({ productId: 'X-1', productName: 'Beta', category: 'Furniture', subCategory: 'Chairs' }),
    rowWith({ productId: 'X-1', productName: 'Alpha', category: 'Technology', subCategory: 'Phones' }),
    rowWith({ productId: 'X-2', productName: 'Alpha', category: 'Furniture', subCategory: 'Chairs' }),
  ]);

  const result = roundTrip(dataset);
  assert.deepStrictEqual(result, dataset);
  assert.equal(new Set(result.transactions.map(compositeKey)).size, 4);
  assert.equal(new Set(result.transactions.map((r) => r.productId)).size, 2);
});

// ---------------------------------------------------------------------------------------
// Nulls, falsy values, precision and Unicode (synthetic datasets)
// ---------------------------------------------------------------------------------------

test('null is preserved for every one of the 17 fields', () => {
  const list = rows.slice(0, 40).map((r) => ({ ...r }));
  CONTRACT_FIELDS.forEach((field, i) => {
    list[i][field] = null;
    list[i + 20][field] = null;
  });
  list[39].orderId = null;
  list[39].sales = null;
  const dataset = datasetOf(list);

  const result = roundTrip(dataset);
  assert.deepStrictEqual(result, dataset);
  assert.equal(nullCells(result.transactions), 36);
  for (const r of result.transactions) assert.deepEqual(Object.keys(r), CONTRACT_FIELDS);
});

test('null uses -1 in string columns and JSON null in numeric columns, never a valid index', () => {
  const dataset = datasetOf([
    rowWith({ state: 'Kentucky', sales: 10 }),
    rowWith({ state: null, sales: null }),
    rowWith({ state: 'Kentucky', sales: 0 }),
    rowWith({ state: null, sales: 5 }),
  ]);
  const encoded = encodeDataset(dataset);

  assert.deepEqual(encoded.dict.state, ['Kentucky']);
  assert.deepEqual(encoded.cols.state, [0, -1, 0, -1]);
  assert.deepEqual(encoded.cols.sales, [10, null, 0, 5]);
  assert.ok(encoded.dict.state.every((entry) => typeof entry === 'string'));
  assert.deepStrictEqual(roundTrip(dataset), dataset);
});

test('empty string, 0 and other falsy-looking values stay distinct from null', () => {
  const dataset = datasetOf([
    rowWith({ state: '', discount: 0, quantity: 0, orderId: 'x' }),
    rowWith({ state: null, discount: null, quantity: null, orderId: null }),
    rowWith({ state: ' ', discount: 0.0, orderId: '0' }),
  ]);
  const result = roundTrip(dataset);

  assert.deepStrictEqual(result, dataset);
  assert.equal(result.transactions[0].state, '');
  assert.equal(result.transactions[1].state, null);
  assert.equal(result.transactions[0].discount, 0);
  assert.equal(result.transactions[1].discount, null);
  assert.equal(result.transactions[2].state, ' ');
  assert.equal(result.transactions[2].orderId, '0');
});

test('numeric precision survives the JSON text round trip exactly (Object.is)', () => {
  const values = [
    0.1 + 0.2, 41.9136, 219.582, 6.8714, 1e21, 1e-7, -1e-7, 5e-324,
    Number.MAX_SAFE_INTEGER, Number.MAX_VALUE, -Number.MAX_VALUE, 123456789.12345679,
    2297200.860299955, -98246.74070000023,
  ];
  const dataset = datasetOf(values.map((v, i) => rowWith({ rowId: i + 1, sales: v, profit: -v })));
  const result = roundTrip(dataset);

  values.forEach((v, i) => {
    assert.ok(Object.is(result.transactions[i].sales, v), `sales ${v}`);
    assert.ok(Object.is(result.transactions[i].profit, -v), `profit ${-v}`);
  });
  assert.deepStrictEqual(result, dataset);
});

test('Unicode, escapes and special strings survive exactly', () => {
  const strings = [
    'Café', 'Zoë', '日本語', '😀', 'e\u0301', 'He said "hi"', 'back\\slash', 'line\nbreak',
    'tab\t', '\u2028\u2029', '\ud800', '__proto__', 'constructor', 'toString', ' padded ', '',
  ];
  const dataset = datasetOf(
    strings.map((s, i) =>
      rowWith({ rowId: i + 1, customerName: s, productName: s, state: s, subCategory: s }),
    ),
  );

  assert.deepStrictEqual(roundTrip(dataset), dataset);

  const bytes = Buffer.from(serializeCompactDataset(encodeDataset(dataset)), 'utf8');
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  assert.deepStrictEqual(decodeCompactDataset(JSON.parse(text)), dataset);
});

test('an empty dataset round-trips', () => {
  assert.deepStrictEqual(roundTrip(datasetOf([])), datasetOf([]));
});

// ---------------------------------------------------------------------------------------
// Determinism and purity
// ---------------------------------------------------------------------------------------

test('encoding is deterministic: repeated encodes give byte-identical text', () => {
  const again = serializeCompactDataset(encodeDataset(canonical));
  const fresh = serializeCompactDataset(encodeDataset(JSON.parse(canonicalText)));

  assert.equal(again, compactText);
  assert.equal(fresh, compactText);
});

test('encode(decode(compact)) reproduces the compact text exactly', () => {
  const reencoded = serializeCompactDataset(encodeDataset(decodeCompactDataset(JSON.parse(compactText))));
  assert.equal(reencoded, compactText);
});

test('the compact text is a single line with no trailing newline, like the canonical file', () => {
  assert.ok(!/[\r\n]/.test(compactText));
  assert.ok(!/[\r\n]/.test(canonicalText));
});

test('the encoder does not mutate its input (deep-frozen real data)', () => {
  const frozen = deepFreeze(structuredClone(canonical));
  assert.equal(serializeCompactDataset(encodeDataset(frozen)), compactText);
  assert.deepStrictEqual(frozen, canonical);
});

test('the decoder does not mutate its input (deep-frozen real compact data)', () => {
  const frozen = deepFreeze(JSON.parse(compactText));
  assert.deepStrictEqual(decodeCompactDataset(frozen), canonical);
  assert.deepStrictEqual(frozen, JSON.parse(compactText));
});

// ---------------------------------------------------------------------------------------
// Decoder: malformed input must be rejected, never partially decoded
// ---------------------------------------------------------------------------------------

const lastRow = smallDataset.transactions.length - 1;
const malformed = [
  ['index equal to the dictionary size', (c) => { c.cols.state[5] = c.dict.state.length; }, /column state row 5/],
  ['index far past the dictionary', (c) => { c.cols.state[5] = 1e9; }, /column state row 5/],
  ['index -2 (only -1 means null)', (c) => { c.cols.state[5] = -2; }, /column state row 5/],
  ['fractional index', (c) => { c.cols.state[5] = 1.5; }, /column state row 5/],
  ['string index', (c) => { c.cols.state[5] = '1'; }, /column state row 5/],
  ['JSON null in a string-field column (null must be -1)', (c) => { c.cols.state[5] = null; }, /column state row 5/],
  ['undefined index', (c) => { c.cols.region[3] = undefined; }, /column region row 3/],
  ['NaN index', (c) => { c.cols.region[3] = NaN; }, /column region row 3/],
  ['Infinity index', (c) => { c.cols.region[3] = Infinity; }, /column region row 3/],
  ['bad index in the very last row', (c) => { c.cols.category[lastRow] = 99; }, new RegExp(`column category row ${lastRow}`)],
  ['numeric cell is a string', (c) => { c.cols.sales[7] = '12.5'; }, /column sales row 7/],
  ['numeric cell is undefined', (c) => { c.cols.profit[7] = undefined; }, /column profit row 7/],
  ['numeric cell is NaN', (c) => { c.cols.discount[7] = NaN; }, /column discount row 7/],
  ['numeric cell is Infinity', (c) => { c.cols.quantity[7] = Infinity; }, /column quantity row 7/],
  ['numeric cell is a boolean', (c) => { c.cols.rowId[7] = true; }, /column rowId row 7/],
  ['bad numeric cell in the very last row', (c) => { c.cols.profit[lastRow] = 'x'; }, new RegExp(`column profit row ${lastRow}`)],
  ['column too short', (c) => { c.cols.segment.pop(); }, /column segment has 39 values/],
  ['column too long', (c) => { c.cols.segment.push(0); }, /column segment has 41 values/],
  ['column missing', (c) => { delete c.cols.category; }, /column category is missing/],
  ['column is not an array', (c) => { c.cols.sales = { 0: 1 }; }, /column sales is missing/],
  ['numeric column missing', (c) => { delete c.cols.profit; }, /column profit is missing/],
  ['dictionary entry is a number', (c) => { c.dict.shipMode[0] = 5; }, /dictionary shipMode entry 0/],
  ['dictionary entry is null (null is only -1)', (c) => { c.dict.shipMode[0] = null; }, /dictionary shipMode entry 0/],
  ['dictionary missing', (c) => { delete c.dict.state; }, /dictionary state is missing/],
  ['dictionary is not an array', (c) => { c.dict.state = {}; }, /dictionary state is missing/],
  ['dict missing entirely', (c) => { delete c.dict; }, /"dict" is missing/],
  ['dict is an array', (c) => { c.dict = []; }, /"dict" is missing/],
  ['cols missing entirely', (c) => { delete c.cols; }, /"cols" is missing/],
  ['meta.rowCount too small', (c) => { c.meta.rowCount = 39; }, /meta\.rowCount is 39/],
  ['meta.rowCount too large', (c) => { c.meta.rowCount = 41; }, /meta\.rowCount is 41/],
  ['meta.rowCount not an integer', (c) => { c.meta.rowCount = 40.5; }, /meta\.rowCount/],
  ['meta.rowCount negative', (c) => { c.meta.rowCount = -1; }, /meta\.rowCount/],
  ['meta.rowCount a string', (c) => { c.meta.rowCount = '40'; }, /meta\.rowCount/],
  ['meta missing', (c) => { delete c.meta; }, /"meta" is missing/],
  ['meta is null', (c) => { c.meta = null; }, /"meta" is missing/],
  ['unknown format', (c) => { c.format = 'superstore-dict-v2'; }, /unknown format/],
  ['format missing', (c) => { delete c.format; }, /unknown format/],
  ['fields reordered', (c) => { [c.fields[0], c.fields[1]] = [c.fields[1], c.fields[0]]; }, /"fields" differs/],
  ['fields has an extra name', (c) => { c.fields.push('extra'); }, /"fields" differs/],
  ['fields missing a name', (c) => { c.fields.pop(); }, /"fields" differs/],
  ['fields renamed', (c) => { c.fields[3] = 'shippingMode'; }, /"fields" differs/],
  ['fields is not an array', (c) => { c.fields = 'rowId'; }, /"fields" differs/],
  ['dictFields shortened', (c) => { c.dictFields.pop(); }, /"dictFields" differs/],
  ['dictFields missing', (c) => { delete c.dictFields; }, /"dictFields" differs/],
];

test('the untouched small compact dataset decodes (baseline for the corruption tests)', () => {
  assert.deepStrictEqual(decodeCompactDataset(clone()), smallDataset);
});

for (const [name, corrupt, pattern] of malformed) {
  test(`decoder rejects: ${name}`, () => {
    const broken = clone();
    corrupt(broken);

    assert.throws(
      () => decodeCompactDataset(broken),
      (error) => error instanceof CompactDatasetError && pattern.test(error.message),
    );
  });
}

for (const [name, input] of [
  ['null', null], ['undefined', undefined], ['a number', 42], ['a string', 'text'],
  ['true', true], ['an array', []], ['an empty object', {}],
]) {
  test(`decoder rejects non-dataset input: ${name}`, () => {
    assert.throws(() => decodeCompactDataset(input), CompactDatasetError);
  });
}

test('decoder error messages start with a stable prefix and use the CompactDatasetError name', () => {
  const broken = clone();
  broken.cols.state[5] = -2;

  assert.throws(
    () => decodeCompactDataset(broken),
    (error) =>
      error.name === 'CompactDatasetError' && error.message.startsWith('Invalid compact dataset: '),
  );
});

// ---------------------------------------------------------------------------------------
// Encoder: fails closed on anything it cannot represent exactly
// ---------------------------------------------------------------------------------------

const encoderRejects = [
  ['NaN in a numeric field', rowWith({ sales: NaN }), /row 0 field sales/],
  ['Infinity in a numeric field', rowWith({ profit: Infinity }), /row 0 field profit/],
  ['-Infinity in a numeric field', rowWith({ profit: -Infinity }), /row 0 field profit/],
  ['-0 in a numeric field', rowWith({ discount: -0 }), /row 0 field discount.*-0/],
  ['a string in a numeric field', rowWith({ quantity: '2' }), /row 0 field quantity/],
  ['a boolean in a numeric field', rowWith({ rowId: true }), /row 0 field rowId/],
  ['undefined in a numeric field', rowWith({ sales: undefined }), /row 0 field sales/],
  ['a number in a string field', rowWith({ state: 5 }), /row 0 field state/],
  ['a boolean in a string field', rowWith({ segment: true }), /row 0 field segment/],
  ['undefined in a string field', rowWith({ region: undefined }), /row 0 field region/],
  ['an object in a string field', rowWith({ category: {} }), /row 0 field category/],
  ['an extra key', { ...rows[0], extra: 1 }, /row 0: keys differ.*unexpected \[extra\]/],
  ['a missing key', (({ rowId, ...rest }) => rest)(rows[0]), /row 0: keys differ.*missing \[rowId\]/],
  ['reordered keys', Object.fromEntries(Object.entries(rows[0]).reverse()), /row 0: keys differ.*different order/],
  ['a null row', null, /row 0: expected an object/],
  ['an array as a row', [], /row 0: expected an object/],
];

for (const [name, badRow, pattern] of encoderRejects) {
  test(`encoder rejects: ${name}`, () => {
    assert.throws(() => encodeDataset(datasetOf([badRow])), pattern);
  });
}

test('encoder reports the index of the offending row', () => {
  const dataset = datasetOf([rows[0], rows[1], rowWith({ sales: NaN }, rows[2])]);
  assert.throws(() => encodeDataset(dataset), /row 2 field sales/);
});

test('encoder rejects datasets with a bad shape or a rowCount that does not match', () => {
  assert.throws(() => encodeDataset(null), /dataset must be an object/);
  assert.throws(() => encodeDataset([]), /dataset must be an object/);
  assert.throws(() => encodeDataset({ transactions: [] }), /dataset\.meta must be an object/);
  assert.throws(() => encodeDataset({ meta: null, transactions: [] }), /dataset\.meta must be an object/);
  assert.throws(() => encodeDataset({ meta: { rowCount: 0 } }), /transactions must be an array/);
  assert.throws(
    () => encodeDataset({ meta: { ...meta, rowCount: 3 }, transactions: rows.slice(0, 2) }),
    /meta\.rowCount/,
  );
  assert.throws(
    () => encodeDataset({ meta: { ...meta, rowCount: undefined }, transactions: [] }),
    /meta\.rowCount/,
  );
});