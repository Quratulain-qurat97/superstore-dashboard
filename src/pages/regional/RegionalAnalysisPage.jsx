
import { useEffect, useMemo, useRef, useState } from 'react';

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

import {
  ACTIONS,
  buildRegionalKpisFromStates,
} from '../../core/index.js';

import { useFilterState } from '../../state/useFilterState.js';
import { useRegionalData } from '../../state/useRegionalData.js';

// Full-width map card, spanning both existing chart columns.
const REGIONAL_MAP_CARD_LAYOUT = {
  ...REGIONAL_CARD_LAYOUT,
  body: {
    ...REGIONAL_CARD_LAYOUT.body,
    height: 273,
  },
};

export default function RegionalAnalysisPage() {
  const { state, dispatch, effective } = useFilterState();

  const {
    data,
    comparisonRegions,
    comparisonStates,
    comparisonAllStates,
    status,
    error,
  } = useRegionalData(effective);

  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedState, setSelectedState] = useState(null);

  // Prevent chart-driven Region updates from clearing their own selection.
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

  // Calculate KPIs using the selected state or region.
  const displayedKpis = useMemo(() => {
    if (!data) return null;

    if (selectedState) {
      const stateData = data.states.filter(
        (item) => item.state === selectedState,
      );

      return buildRegionalKpisFromStates(stateData);
    }

    if (selectedRegion) {
      const selectedStates = data.states.filter(
        (item) => item.region === selectedRegion,
      );

      return buildRegionalKpisFromStates(selectedStates);
    }

    return data.kpis;
  }, [data, selectedRegion, selectedState]);

  // Local region selection takes priority over the global Region filter.
  const highlightedRegion = selectedRegion ?? (
    effective.region !== 'ALL' && effective.region !== 'All'
      ? effective.region
      : null
  );

  // Handle region selection from the Loss Impact chart.
  function handleRegionSelect(region) {
    // Restore the previous Region filter if a state was selected.
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

  // Shared state-selection handler for the state chart and map.
  function handleStateSelect(stateName, region) {
    // Clicking the selected state clears its selection.
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

    // Avoid toggling off a Region that is already selected manually.
    // Also preserve an existing chart selection's original restore value.
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

      <RegionalKpiRow kpis={displayedKpis} />

      {/* Existing chart 1 */}
      <ChartCard
        title="Loss Impact by Region"
        left="var(--content-left)"
        top={342}
        layout={REGIONAL_CARD_LAYOUT}
      >
        {data && (
          <RegionalLossImpactChart
            regions={comparisonRegions}
            selectedRegion={highlightedRegion}
            onRegionSelect={handleRegionSelect}
          />
        )}
      </ChartCard>

      {/* Existing chart 2 */}
      <ChartCard
        title="Loss-Making States"
        left="calc(var(--content-left) + var(--chart-w) + 20px)"
        top={342}
        layout={REGIONAL_CARD_LAYOUT}
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

      {/* Full-width US State Profitability Map */}
      <ChartCard
        title="US State Profitability Map"
        left="var(--content-left)"
        top={686}
        width="calc(var(--chart-w) * 2 + 20px)"
        height={330}
        layout={REGIONAL_MAP_CARD_LAYOUT}
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
          Unable to load Regional Analysis data: {error?.message}
        </p>
      )}
    </>
  );
}
