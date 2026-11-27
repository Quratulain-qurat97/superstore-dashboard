// prepare-data.mjs
// Converts "Superstore_Cleaned.csv" into superstore.json for the React dashboard.
// Run:  node prepare-data.mjs Superstore_Cleaned.csv superstore.json
//
// What it does:
//   1. Decodes the file as UTF-8 (stops with an error on invalid UTF-8 bytes)
//   2. Parses CSV, including quoted fields that contain commas
//   3. Keeps only the columns the dashboard needs
//   4. Validates that dates are ISO YYYY-MM-DD (the cleaned CSV already uses this format)
//   5. Keeps Sales / Discount / Profit as full-precision numbers (no rounding)
//   6. Stops with an error if anything looks wrong


import { readFileSync, writeFileSync } from 'node:fs';

const [inputPath = 'Superstore_Cleaned.csv', outputPath = 'superstore.json'] =
  process.argv.slice(2);

const text = new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(inputPath));

function parseCsv(input) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && input[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }

  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

const [header, ...body] = parseCsv(text);
const col = Object.fromEntries(header.map((name, i) => [name.trim(), i]));

const required = [
  'Row ID', 'Order ID', 'Order Date', 'Ship Mode',
  'Customer ID', 'Customer Name', 'Segment', 'State',
  'Region', 'Category', 'Sub-Category', 'Product ID',
  'Product Name', 'Sales', 'Quantity', 'Discount', 'Profit',
];

for (const name of required) {
  if (!(name in col)) {
    throw new Error(`Missing column in CSV: ${name}`);
  }
}

function toIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error(`Bad date: ${value}`);

  const [y, m, d] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));

  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  return value;
}

function toNumber(value, label, rowId) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`Row ${rowId}: ${label} is not a number: "${value}"`);
  }
  return n;
}

const transactions = body.map((r) => {
  const rowId = Number(r[col['Row ID']]);

  return {
    rowId,
    orderId: r[col['Order ID']],
    orderDate: toIsoDate(r[col['Order Date']]),
    shipMode: r[col['Ship Mode']],
    customerId: r[col['Customer ID']],
    customerName: r[col['Customer Name']],
    segment: r[col['Segment']],
    state: r[col['State']],
    region: r[col['Region']],
    category: r[col['Category']],
    subCategory: r[col['Sub-Category']],
    productId: r[col['Product ID']],
    productName: r[col['Product Name']].trim(),
    sales: toNumber(r[col['Sales']], 'Sales', rowId),
    quantity: toNumber(r[col['Quantity']], 'Quantity', rowId),
    discount: toNumber(r[col['Discount']], 'Discount', rowId),
    profit: toNumber(r[col['Profit']], 'Profit', rowId),
  };
});

if (transactions.length !== 9994) {
  throw new Error(`Expected 9,994 rows, got ${transactions.length}`);
}

if (new Set(transactions.map((t) => t.rowId)).size !== transactions.length) {
  throw new Error('Duplicate Row IDs found');
}

if (transactions.some((t) => !t.productId || !t.productName)) {
  throw new Error('Missing product identifiers or names found');
}

const output = {
  meta: {
    source: 'Superstore_Cleaned.csv',
    rowCount: transactions.length,
    dateField: 'orderDate (ISO, from Order Date)',
    firstOrderDate: transactions.reduce(
      (a, t) => (t.orderDate < a ? t.orderDate : a),
      '9999-12-31'
    ),
    lastOrderDate: transactions.reduce(
      (a, t) => (t.orderDate > a ? t.orderDate : a),
      '0000-01-01'
    ),
  },
  transactions,
};

writeFileSync(outputPath, JSON.stringify(output));

console.log(`Wrote ${transactions.length} transactions to ${outputPath}`);
