
import { useEffect, useMemo, useState } from 'react';

import { dataSource } from '../data/dataSource.js';

import {
  buildSalesData,
  buildSalesCategorySeries,
} from '../core/index.js';

// Loads transactions once, then recalculates Sales Analysis data
// whenever the effective filters change.
export function useSalesData(effective) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    dataSource
      .getTransactions()
      .then((loaded) => {
        if (!cancelled) setRows(loaded);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const data = useMemo(() => {
    if (!rows) return null;

    return {
      ...buildSalesData(rows, effective),

      categorySeries: buildSalesCategorySeries(rows, effective),
    };
  }, [rows, effective]);

  const status = error ? 'error' : rows ? 'ready' : 'loading';

  return { data, status, error };
}
