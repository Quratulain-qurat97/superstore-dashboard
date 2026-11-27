
import { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import PageHeader from '../../ui/layout/PageHeader.jsx';
import FilterBar from '../../ui/filters/FilterBar.jsx';
import ChartCard from '../../ui/charts/ChartCard.jsx';

import {
  REGIONAL_CARD_LAYOUT,
} from '../../ui/charts/cardLayouts.js';

import RegionalKpiRow from '../../ui/regional/RegionalKpiRow.jsx';
import RegionalLossImpactChart from '../../ui/regional/RegionalLossImpactChart.jsx';
import RegionalLossMakingStatesChart from '../../ui/regional/RegionalLossMakingStatesChart.jsx';
import USStateProfitabilityMap from '../../ui/regional/USStateProfitabilityMap.jsx';
import RegionalExecutiveSummary from './RegionalExecutiveSummary.jsx';

import {
  ACTIONS,
  buildRegionalKpisFromStates,
} from '../../core/index.js';

import { useFilterState } from '../../state/useFilterState.js';
import { useRegionalData } from '../../state/useRegionalData.js';

const REGIONAL_MAP_CARD_LAYOUT = {
  ...REGIONAL_CARD_LAYOUT,
  body: {
    ...REGIONAL_CARD_LAYOUT.body,
    height: 273,
  },
};

export default function RegionalAnalysisPage() {
  const { updateSummaryContent } = useOutletContext();

  const { state, dispatch, effective } = useFilterState();

  const {
    data,
    comparisonRegions,
    comparisonStates,
    comparisonAllStates,
    status,
    retry,
  } = useRegionalData(effective);

  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedState, setSelectedState] = useState(null);

  const internalRegionUpdate = useRef(false);

  // Clear local chart selections when the user manually changes Region.
  useEffect(() => {
    if (internalRegionUpdate.current) {
      internalRegionUpdate.current = false;
      return;
    }

    setSelectedRegion(null);
    setSelectedState(null);
  }, [effective.region]);

  // Calculate KPIs using the complete comparison dataset for local selections.
  const displayedKpis = useMemo(() => {
    if (!data) return null;

    if (selectedState) {
      const stateData = comparisonAllStates.filter(
        (item) => item.state === selectedState,
      );

      return buildRegionalKpisFromStates(stateData);
    }

    if (selectedRegion) {
      const selectedStates = comparisonAllStates.filter(
        (item) => item.region === selectedRegion,
      );

      return buildRegionalKpisFromStates(selectedStates);
    }

    return data.kpis;
  }, [
    data,
    comparisonAllStates,
    selectedRegion,
    selectedState,
  ]);

  // Local region selection takes priority over the global Region filter.
  const highlightedRegion = selectedRegion ?? (
    effective.region !== 'ALL' && effective.region !== 'All'
      ? effective.region
      : null
  );

  // Update the shared Executive Summary.
  useEffect(() => {
    if (!data) {
      updateSummaryContent(null);
      return undefined;
    }

    updateSummaryContent(
      <RegionalExecutiveSummary
        comparisonRegions={comparisonRegions}
        comparisonAllStates={comparisonAllStates}
        selectedRegion={selectedRegion}
        selectedState={selectedState}
        effective={effective}
      />,
    );

    return () => updateSummaryContent(null);
  }, [
    data,
    comparisonRegions,
    comparisonAllStates,
    selectedRegion,
    selectedState,
    effective,
    updateSummaryContent,
  ]);

  // Handle region selection from the Loss Impact chart.
  function handleRegionSelect(region) {
    if (selectedState && state.selections.region) {
      internalRegionUpdate.current = true;

      dispatch({
        type: ACTIONS.CLEAR_SELECTION,
        dimension: 'region',
      });
    }

    setSelectedState(null);

    setSelectedRegion((current) =>
      current === region ? null : region,
    );
  }

  // Shared state-selection handler for the chart and map.
  function handleStateSelect(stateName, region) {
    if (selectedState === stateName) {
      setSelectedState(null);

      if (state.selections.region) {
        internalRegionUpdate.current = true;

        dispatch({
          type: ACTIONS.CLEAR_SELECTION,
          dimension: 'region',
        });
      }

      return;
    }

    setSelectedRegion(null);
    setSelectedState(stateName);

    if (state.dropdowns.region !== region) {
      internalRegionUpdate.current = true;

      dispatch({
        type: ACTIONS.SELECT_ITEM,
        dimension: 'region',
        value: region,
      });
    }
  }

  return (
    <>
      <PageHeader
        title="Regional Analysis"
        subtitle="Explore regional performance and state-level profitability."
      />

      <FilterBar state={state} dispatch={dispatch} />

      <RegionalKpiRow
        kpis={displayedKpis}
        loading={status === 'loading'}
      />

      <ChartCard
        title="Loss Impact by Region"
        left="var(--content-left)"
        top={342}
        layout={REGIONAL_CARD_LAYOUT}
        loading={status === 'loading'}
      >
        {data && (
          <RegionalLossImpactChart
            regions={comparisonRegions}
            selectedRegion={highlightedRegion}
            onRegionSelect={handleRegionSelect}
          />
        )}
      </ChartCard>

      <ChartCard
        title="Loss-Making States"
        left="calc(var(--content-left) + var(--chart-w) + 20px)"
        top={342}
        layout={REGIONAL_CARD_LAYOUT}
        loading={status === 'loading'}
      >
        {data && (
          <RegionalLossMakingStatesChart
            states={comparisonStates}
            selectedRegion={highlightedRegion}
            selectedState={selectedState}
            onStateSelect={handleStateSelect}
          />
        )}
      </ChartCard>

      <ChartCard
        title="US State Profitability Map"
        left="var(--content-left)"
        top={686}
        width="calc(var(--chart-w) * 2 + 20px)"
        height={330}
        layout={REGIONAL_MAP_CARD_LAYOUT}
        loading={status === 'loading'}
      >
        {data && (
          <USStateProfitabilityMap
            states={comparisonAllStates}
            selectedRegion={highlightedRegion}
            selectedState={selectedState}
            onStateSelect={handleStateSelect}
          />
        )}
      </ChartCard>

      {status === 'error' && (
        <p role="alert">
          Unable to load dashboard data. Please refresh the page and try again.
          {' '}
          <button type="button" onClick={retry}>
            Retry
          </button>
        </p>
      )}
    </>
  );
}
