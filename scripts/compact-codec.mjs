// compact-codec.mjs
// Encodes the canonical dataset ({ meta, transactions }, as in data/superstore.json) into the
// compact dictionary-encoded format described in src/data/decodeCompactDataset.js.
//
// Build-time and test-time only: nothing under src/ imports this file, so it never reaches
// the production bundle. The format constants come from the decoder, so the two cannot drift.
//
// The encoder is strict and fails closed. It throws instead of guessing when it meets a value
// it cannot represent exactly:
//   - a row whose keys are not exactly the 17 contract fields, in contract order
//   - a string field that is neither a string nor null
//   - a numeric field that is neither a finite number nor null (NaN, +-Infinity and -0 are
//     rejected: JSON cannot carry them exactly, and -0 would silently come back as 0)
//   - undefined (JSON cannot carry it, and a missing value would break the 17-field contract)
//
// Output is deterministic: dictionaries are built in order of first appearance, the keys are
// created in a fixed order, and there are no timestamps or locale-dependent operations.
// The encoder never mutates its input.

import {
  COMPACT_FORMAT,
  DATASET_FIELDS,
  DICTIONARY_FIELDS,
  NUMERIC_FIELDS,
} from '../src/data/decodeCompactDataset.js';

const DICTIONARY_SET = new Set(DICTIONARY_FIELDS);

function describe(value) {
  if (value === null) return 'null';
  if (typeof value === 'string') return `string ${JSON.stringify(value)}`;
  if (typeof value === 'number') return Object.is(value, -0) ? 'number -0' : `number ${value}`;
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function assertContractKeys(row, rowIndex) {
  if (row === null || typeof row !== 'object' || Array.isArray(row)) {
    throw new Error(`row ${rowIndex}: expected an object, got ${describe(row)}`);
  }

  const keys = Object.keys(row);
  const matches =
    keys.length === DATASET_FIELDS.length &&
    keys.every((key, position) => key === DATASET_FIELDS[position]);

  if (!matches) {
    const missing = DATASET_FIELDS.filter((field) => !keys.includes(field));
    const extra = keys.filter((key) => !DATASET_FIELDS.includes(key));
    const detail = missing.length || extra.length
      ? `missing [${missing.join(', ')}], unexpected [${extra.join(', ')}]`
      : 'same fields in a different order';
    throw new Error(`row ${rowIndex}: keys differ from the 17-field contract (${detail})`);
  }
}

/**
 * @param {{ meta: object, transactions: Array<object> }} dataset the canonical dataset
 * @returns {object} the compact dataset (a plain object; see serializeCompactDataset)
 */
export function encodeDataset(dataset) {
  if (dataset === null || typeof dataset !== 'object' || Array.isArray(dataset)) {
    throw new Error('dataset must be an object with "meta" and "transactions"');
  }

  const { meta, transactions } = dataset;
  if (meta === null || typeof meta !== 'object' || Array.isArray(meta)) {
    throw new Error('dataset.meta must be an object');
  }
  if (!Array.isArray(transactions)) {
    throw new Error('dataset.transactions must be an array');
  }
  if (meta.rowCount !== transactions.length) {
    throw new Error(
      `meta.rowCount (${describe(meta.rowCount)}) does not match the ${transactions.length} transactions`,
    );
  }

  const indexByValue = {};
  const dict = {};
  const cols = {};

  for (const field of DICTIONARY_FIELDS) {
    indexByValue[field] = new Map();
    dict[field] = [];
  }
  for (const field of DATASET_FIELDS) {
    cols[field] = [];
  }

  transactions.forEach((row, rowIndex) => {
    assertContractKeys(row, rowIndex);

    for (const field of DATASET_FIELDS) {
      const value = row[field];

      if (DICTIONARY_SET.has(field)) {
        if (value === null) {
          cols[field].push(-1);
          continue;
        }
        if (typeof value !== 'string') {
          throw new Error(
            `row ${rowIndex} field ${field}: expected a string or null, got ${describe(value)}`,
          );
        }

        let index = indexByValue[field].get(value);
        if (index === undefined) {
          index = dict[field].length;
          indexByValue[field].set(value, index);
          dict[field].push(value);
        }
        cols[field].push(index);
      } else {
        if (
          value !== null &&
          (typeof value !== 'number' || !Number.isFinite(value) || Object.is(value, -0))
        ) {
          throw new Error(
            `row ${rowIndex} field ${field}: expected a finite number (not -0) or null, got ${describe(value)}`,
          );
        }
        cols[field].push(value);
      }
    }
  });

  return {
    format: COMPACT_FORMAT,
    meta,
    fields: [...DATASET_FIELDS],
    dictFields: [...DICTIONARY_FIELDS],
    dict,
    cols,
  };
}

/**
 * The one place that turns a compact dataset into file text: plain JSON.stringify, one line,
 * no trailing newline (the same convention as data/superstore.json).
 */
export function serializeCompactDataset(compact) {
  return JSON.stringify(compact);
}

// NUMERIC_FIELDS is re-exported so scripts and tests can share the field lists from one place.
export { COMPACT_FORMAT, DATASET_FIELDS, DICTIONARY_FIELDS, NUMERIC_FIELDS };