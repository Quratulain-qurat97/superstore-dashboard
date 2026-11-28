
 // staticJsonSource.js
// Loads the compact Superstore dataset and decodes it into the existing
// transaction format used by the dashboard.

import { decodeCompactDataset } from './decodeCompactDataset.js';

export function createStaticJsonSource(loadCompact) {
  let cachePromise = null;

  async function load() {
    if (!cachePromise) {
      const pending = Promise.resolve()
        .then(loadCompact)
        .then(decodeCompactDataset)
        .catch((error) => {
          if (cachePromise === pending) {
            cachePromise = null;
          }
          throw error;
        });

      cachePromise = pending;
    }

    return cachePromise;
  }

  return {
    /** @returns {Promise<Array<object>>} every transaction row */
    async getTransactions() {
      return (await load()).transactions;
    },

    /** @returns {Promise<object>} dataset metadata */
    async getMeta() {
      return (await load()).meta;
    },
  };
}

export const staticJsonSource = createStaticJsonSource(async () => {
  const module = await import('../../data/superstore.compact.json');
  return module.default;
});
