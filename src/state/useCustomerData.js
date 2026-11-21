
import { useEffect, useMemo, useState } from 'react';

import { dataSource } from '../data/dataSource.js';
import {
  buildActiveCustomersByYear,
  buildCustomerConcentrationData,
  buildCustomerKpiData,
  buildCustomerScatterData,
  buildSelectedCustomerKpiData,
  buildTop10CustomersData,
} from '../core/index.js';

// Loads transactions once and recalculates data when filters or
// the selected customer change.
export function useCustomerData(effective, selectedCustomerId = null) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

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
  }, []);

  // Chart 1: Rebuild scatter data only when transactions or
  // global filters change. Customer selection must not recreate
  // this array or reset chart zoom.
  const customerSalesProfitMargins = useMemo(() => {
    if (!rows) {
      return null;
    }

    return buildCustomerScatterData(rows, effective);
  }, [rows, effective]);

  // Chart 2: Always contains all four years.
  // Its calculation ignores the selected Year filter internally.
  const activeCustomersByYear = useMemo(() => {
    if (!rows) {
      return null;
    }

    return buildActiveCustomersByYear(rows, effective);
  }, [rows, effective]);

  // Chart 3: Sales and Profit concentration curves.
  // Customer selection does not rebuild these rankings.
  const customerConcentration = useMemo(() => {
    if (!rows) {
      return null;
    }

    return buildCustomerConcentrationData(rows, effective);
  }, [rows, effective]);

  // Chart 4: Top 10 customers ranked by Sales.
  // Customer selection does not rebuild or reorder this list.
  const top10Customers = useMemo(() => {
    if (!rows) {
      return null;
    }

    return buildTop10CustomersData(rows, effective);
  }, [rows, effective]);

  // Calculate KPIs independently from chart data.
  const data = useMemo(() => {
    if (!rows) {
      return null;
    }

    const globalKpiData = buildCustomerKpiData(rows, effective);

    const selectedCustomerData = selectedCustomerId == null
      ? null
      : buildSelectedCustomerKpiData(
          rows,
          selectedCustomerId,
          effective,
        );

    return {
      ...globalKpiData,

      customerSalesProfitMargins,
      activeCustomersByYear,
      customerConcentration,
      top10Customers,

      selectedCustomerData,

      displayedKpis:
        selectedCustomerData?.kpis ?? globalKpiData.kpis,
    };
  }, [
    rows,
    effective,
    selectedCustomerId,
    customerSalesProfitMargins,
    activeCustomersByYear,
    customerConcentration,
    top10Customers,
  ]);

  const status = error ? 'error' : rows ? 'ready' : 'loading';

  return { data, status, error };
}
