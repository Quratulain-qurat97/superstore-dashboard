import { useEffect, useMemo, useState } from 'react';
import { dataSource } from '../data/dataSource.js';
import { buildHomeData } from '../core/index.js';

// Loads the transactions once, then recalculates everything the Home page shows whenever the
// effective filters change. Returns { data, status } where status is 'loading' | 'ready' | 'error'.
export function useHomeData(effective) {
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

  const data = useMemo(() => (rows ? buildHomeData(rows, effective) : null), [rows, effective]);
  const status = error ? 'error' : rows ? 'ready' : 'loading';
  return { data, status, error };
}
