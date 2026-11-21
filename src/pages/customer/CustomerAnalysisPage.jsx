
import { useEffect, useState } from 'react';

import PageHeader from '../../ui/layout/PageHeader.jsx';
import FilterBar from '../../ui/filters/FilterBar.jsx';
import CustomerKpiRow from '../../ui/customer/CustomerKpiRow.jsx';
import CustomerAnalysisCharts from '../../ui/customer/CustomerAnalysisCharts.jsx';

import { ACTIONS, ALL } from '../../core/index.js';
import { useFilterState } from '../../state/useFilterState.js';
import { useCustomerData } from '../../state/useCustomerData.js';

export default function CustomerAnalysisPage() {
  const { state, dispatch, effective } = useFilterState();

  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const { data, status, error } = useCustomerData(
    effective,
    selectedCustomerId,
  );

  // Clear the selected customer whenever a global filter changes.
  useEffect(() => {
    setSelectedCustomerId(null);
  }, [effective]);

  // Toggle customer selection across all Customer Analysis charts.
  const handleSelectCustomer = (customerId) => {
    setSelectedCustomerId((currentId) =>
      currentId != null &&
      String(currentId) === String(customerId)
        ? null
        : customerId,
    );
  };

  // A chart click updates the existing global Year dropdown.
  const handleSelectYear = (year) => {
    const isAlreadySelected =
      String(state.dropdowns.year) === String(year);

    dispatch({
      type: ACTIONS.SET_DROPDOWN,
      dimension: 'year',
      value: isAlreadySelected ? ALL : year,
    });
  };

  return (
    <>
      <PageHeader
        title="Customer Analysis"
        subtitle="Explore customer value, retention, and profitability."
      />

      <FilterBar state={state} dispatch={dispatch} />

      <CustomerKpiRow
        kpis={data ? data.displayedKpis : null}
      />

      <CustomerAnalysisCharts
        data={data}
        selectedCustomerId={selectedCustomerId}
        onSelectCustomer={handleSelectCustomer}
        selectedYear={effective.year}
        onSelectYear={handleSelectYear}
      />

      {status === 'error' && (
        <p role="alert">
          Unable to load Customer Analysis data: {error?.message}
        </p>
      )}
    </>
  );
}
