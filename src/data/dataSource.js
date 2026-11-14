// dataSource.js
// The ONE place that decides where transaction data comes from.
// Everything else (state hooks, pages, charts) asks this module and never cares how it works.
//
// Later, for the MySQL backend, an `apiSource.js` with the same two methods is added and
// exported here instead. The backend must return the agreed dashboard data contract
// (see src/core/homeData.js and scripts/verify.mjs).

import { staticJsonSource } from './staticJsonSource.js';

export const dataSource = staticJsonSource;
