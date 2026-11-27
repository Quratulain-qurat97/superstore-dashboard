
import { useCallback, useEffect, useMemo, useState } from 'react';

import { dataSource } from '../data/dataSource.js';
import { buildProfitabilityData } from '../core/index.js';

// Loads transactions once, then recalculates data when filters
// or the locally selected product change.
export function useProfitabilityData(effective, selectedProductId = null) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setRows(null);
    setError(null);
    setRetryCount((count) => count + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    dataSource
      .getTransactions()
      .then((loaded) => {
        if (!cancelled) {
          setRows(loaded);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  const data = useMemo(() => {
    if (!rows) return null;

    return buildProfitabilityData(
      rows,
      effective,
      selectedProductId,
    );
  }, [rows, effective, selectedProductId]);

  const status = error ? 'error' : rows ? 'ready' : 'loading';

  return { data, status, error, retry };
}
