// aggregations.js
// Small, pure helpers for summing, counting and grouping transaction rows.
// Sums always use full precision; rounding only ever happens when a value is displayed.

/** Sum one numeric field over all rows. */
export const sumBy = (rows, key) => rows.reduce((total, row) => total + row[key], 0);

/** Count distinct values of a field (e.g. distinct Order IDs). NOT the same as counting rows. */
export const countDistinct = (rows, key) => new Set(rows.map((row) => row[key])).size;

/** Profit margin % = SUM(profit) / SUM(sales) x 100. Never an average of row margins. */
export const profitMargin = (profit, sales) => (sales === 0 ? null : (profit / sales) * 100);

/** Group rows into a Map: key -> array of rows (keys appear in order of first occurrence). */
export function groupBy(rows, keyFn) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return groups;
}

/**
 * Keep the rows that match every criterion that is set.
 * A criterion of null/undefined means "no restriction".
 * `year` is a number (2016); `month` is 'YYYY-MM'. Both match against orderDate ('YYYY-MM-DD').
 */
export function filterRows(rows, { region, category, segment, year, month } = {}) {
  const yearPrefix = year ? String(year) : null;
  return rows.filter(
    (row) =>
      (!region || row.region === region) &&
      (!category || row.category === category) &&
      (!segment || row.segment === segment) &&
      (!yearPrefix || row.orderDate.startsWith(yearPrefix)) &&
      (!month || row.orderDate.startsWith(month)),
  );
}
