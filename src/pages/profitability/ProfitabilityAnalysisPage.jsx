
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import PageHeader from '../../ui/layout/PageHeader.jsx';
import FilterBar from '../../ui/filters/FilterBar.jsx';
import ProfitabilityKpiRow from '../../ui/profitability/ProfitabilityKpiRow.jsx';
import ProfitabilityAnalysisCharts from '../../ui/profitability/ProfitabilityAnalysisCharts.jsx';
import ProfitabilityExecutiveSummary from './ProfitabilityExecutiveSummary.jsx';

import { useFilterState } from '../../state/useFilterState.js';
import { useProfitabilityData } from '../../state/useProfitabilityData.js';

export default function ProfitabilityAnalysisPage() {
  const { updateSummaryContent } = useOutletContext();

  const { state, dispatch, effective } = useFilterState();

  // Product selection belongs only to this page.
  const [selectedProductId, setSelectedProductId] = useState(null);

  const { data, status, retry } = useProfitabilityData(
    effective,
    selectedProductId,
  );

  useEffect(() => {
    updateSummaryContent(
      <ProfitabilityExecutiveSummary
        data={data}
        selectedProductId={selectedProductId}
      />,
    );

    return () => updateSummaryContent(null);
  }, [data, selectedProductId, updateSummaryContent]);

  const handleProductSelect = (productId) => {
    setSelectedProductId((currentId) =>
      currentId === productId ? null : productId,
    );
  };

  return (
    <>
      <PageHeader
        title="Profitability Analysis"
        subtitle="Explore profit performance, discount impact, and loss-making customers and orders."
      />

      <FilterBar state={state} dispatch={dispatch} />

      {status === 'error' ? (
        <div role="alert">
          Unable to load dashboard data. Please refresh the page and try again.
          {' '}
          <button type="button" onClick={retry}>
            Retry
          </button>
        </div>
      ) : (
        <>
          <ProfitabilityKpiRow kpis={data ? data.kpis : null} />

          <ProfitabilityAnalysisCharts
            profitTrend={data ? data.profitTrend : []}
            profitMarginByCategory={
              data ? data.profitMarginByCategory : null
            }
            discountImpactHeatmap={
              data ? data.discountImpactHeatmap : null
            }
            top10ProductsByNetLoss={
              data ? data.top10ProductsByNetLoss : []
            }
            selectedProductId={selectedProductId}
            onSelectProduct={handleProductSelect}
            selectedYear={effective.year}
            selectedMonth={effective.month}
            selectedCategory={effective.category}
            dispatch={dispatch}
          />
        </>
      )}
    </>
  );
}
