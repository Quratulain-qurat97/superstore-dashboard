
import { useCallback, useEffect, useMemo, useState } from 'react';

import { dataSource } from '../data/dataSource.js';
import { buildHomeData } from '../core/index.js';

// Loads transactions, then recalculates everything the Home page shows
// whenever the effective filters change.
export function useHomeData(effective) {
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

  const data = useMemo(
    () => (rows ? buildHomeData(rows, effective) : null),
    [rows, effective],
  );

  const status = error ? 'error' : rows ? 'ready' : 'loading';

  return { data, status, error, retry };
}
