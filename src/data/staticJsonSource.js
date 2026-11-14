// staticJsonSource.js
// Today's data source: the bundled superstore.json (generated from Superstore_Cleaned.csv).
// It is loaded with a dynamic import, so Vite puts the 3 MB file in its own chunk and the
// page loads the data asynchronously, exactly like a real API call would.

let cache = null;

async function load() {
  if (!cache) {
    const module = await import('../../data/superstore.json');
    cache = module.default;
  }
  return cache;
}

export const staticJsonSource = {
  /** @returns {Promise<Array<object>>} every transaction row (fields: see data/superstore.json) */
  async getTransactions() {
    return (await load()).transactions;
  },
  /** @returns {Promise<object>} { source, rowCount, firstOrderDate, lastOrderDate, ... } */
  async getMeta() {
    return (await load()).meta;
  },
};
