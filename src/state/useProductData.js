import { useEffect, useMemo, useState } from 'react';
import { dataSource } from '../data/dataSource.js';

import {
  buildProductKpiData,
  buildProductChartData,
} from '../core/index.js';

export function useProductData(effective) {
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

  const kpiData = useMemo(() => {
    if (!rows) return null;

    return buildProductKpiData(rows, effective);
  }, [rows, effective]);

  const chartFilters = useMemo(
    () => ({
      region: effective.region,
      category: effective.category,
      segment: effective.segment,
      year: effective.year,
      month: effective.month,
      discountGroup: effective.discountGroup,
    }),
    [
      effective.region,
      effective.category,
      effective.segment,
      effective.year,
      effective.month,
      effective.discountGroup,
    ],
  );

  const chartData = useMemo(() => {
    if (!rows) return null;

    return buildProductChartData(rows, chartFilters);
  }, [rows, chartFilters]);

  const data = useMemo(() => {
    if (!kpiData || !chartData) return null;

    return {
      ...kpiData,
      ...chartData,
    };
  }, [kpiData, chartData]);

  const status = error ? 'error' : rows ? 'ready' : 'loading';

  return {
    data,
    status,
    error,
  };
}