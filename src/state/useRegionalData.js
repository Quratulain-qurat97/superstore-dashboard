
import { useCallback, useEffect, useMemo, useState } from 'react';

import { dataSource } from '../data/dataSource.js';
import { buildRegionalData } from '../core/index.js';

export function useRegionalData(effective) {
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

  // Main dataset: respects all four global filters.
  const data = useMemo(() => {
    if (!rows) return null;

    return buildRegionalData(rows, effective);
  }, [rows, effective]);

  // Comparison dataset: ignores only the global Region filter.
  const comparisonData = useMemo(() => {
    if (!rows) return null;

    return buildRegionalData(rows, {
      ...effective,
      region: null,
    });
  }, [rows, effective]);

  const comparisonRegions = comparisonData?.regions ?? [];

  // Only loss-making states (used by the existing chart).
  const comparisonStates = comparisonData?.lossMakingStates ?? [];

  // All states (used by the new profitability map).
  const comparisonAllStates = comparisonData?.states ?? [];

  const status = error ? 'error' : rows ? 'ready' : 'loading';

  return {
    data,
    comparisonRegions,
    comparisonStates,
    comparisonAllStates,
    status,
    error,
    retry,
  };
}
