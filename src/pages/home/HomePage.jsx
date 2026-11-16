
import { useEffect, useMemo } from 'react';

import PageHeader from '../../ui/layout/PageHeader.jsx';
import FilterBar from '../../ui/filters/FilterBar.jsx';
import KpiRow from '../../ui/kpi/KpiRow.jsx';
import ChartCard from '../../ui/charts/ChartCard.jsx';
import MonthlyTrendChart from '../../ui/charts/MonthlyTrendChart.jsx';
import CategoryRevenueChart from '../../ui/charts/CategoryRevenueChart.jsx';
import RegionalPerformanceChart from '../../ui/charts/RegionalPerformanceChart.jsx';
import RegionalLegend from '../../ui/charts/RegionalLegend.jsx';
import SalesBySegmentChart from '../../ui/charts/SalesBySegmentChart.jsx';

import {
  CATEGORY_CARD_LAYOUT,
  REGIONAL_CARD_LAYOUT,
  TREND_CARD_LAYOUT,
  SEGMENT_CARD_LAYOUT,
} from '../../ui/charts/cardLayouts.js';

import {
  ACTIONS,
  buildCategorySeries,
  buildRegionSeries,
  buildSegmentSeries,
  buildTrendSeries,
  formatCompactCurrency,
  hasActiveSelections,
} from '../../core/index.js';

import { useFilterState } from '../../state/useFilterState.js';
import { useHomeData } from '../../state/useHomeData.js';

// The Overview page displays key metrics, trends, and four interactive charts.
export default function HomePage() {
  const { state, dispatch, effective } = useFilterState();
  const { data } = useHomeData(effective);

  // Prepare chart data from the filtered dashboard data.
  const trend = useMemo(() => (data ? buildTrendSeries(data.monthlyTrend) : null), [data]);
  const categories = useMemo(() => (data ? buildCategorySeries(data.categories) : null), [data]);
  const regions = useMemo(() => (data ? buildRegionSeries(data.regions) : null), [data]);

  // Prepare segment sales data for the donut chart.
  const segments = useMemo(
    () => (data ? buildSegmentSeries(data.segments) : null),
    [data],
  );

  // Clear individual chart selections and restore their previous dropdown values.
  const clearCategory = () => dispatch({ type: ACTIONS.CLEAR_SELECTION, dimension: 'category' });
  const clearRegion = () => dispatch({ type: ACTIONS.CLEAR_SELECTION, dimension: 'region' });
  const clearSegment = () => dispatch({ type: ACTIONS.CLEAR_SELECTION, dimension: 'segment' });

  // Escape clears every chart selection.
  const anySelection = hasActiveSelections(state);

  useEffect(() => {
    if (!anySelection) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        dispatch({ type: ACTIONS.CLEAR_ALL_SELECTIONS });
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [anySelection, dispatch]);

  return (
    <>
      <PageHeader title="Overview" subtitle="Key metrics, trends, and insights at a glance." />
      <FilterBar state={state} dispatch={dispatch} />
      <KpiRow kpis={data ? data.kpis : null} />

      {/* Monthly Sales Trend */}
      <ChartCard
        title="Monthly Sales Trend"
        left="var(--content-left)"
        top={342}
        layout={TREND_CARD_LAYOUT}
        onBackgroundClick={() => dispatch({ type: ACTIONS.CLEAR_MONTH })}
      >
        {trend && (
          <MonthlyTrendChart
            series={trend}
            selectedMonth={state.month}
            onSelectMonth={(month) => dispatch({ type: ACTIONS.SELECT_MONTH, month })}
            onClearMonth={() => dispatch({ type: ACTIONS.CLEAR_MONTH })}
          />
        )}
      </ChartCard>

      {/* Sales by Category */}
      <ChartCard
        title="Sales by Category"
        left="calc(var(--content-left) + var(--chart-w) + 20px)"
        top={342}
        layout={CATEGORY_CARD_LAYOUT}
        onBackgroundClick={clearCategory}
      >
        {categories && (
          <CategoryRevenueChart
            series={categories}
            selectedCategory={effective.category}
            onSelectCategory={(category) =>
              dispatch({ type: ACTIONS.SELECT_ITEM, dimension: 'category', value: category })
            }
            onClearCategory={clearCategory}
          />
        )}
      </ChartCard>

      {/* Regional Performance */}
      <ChartCard
        title="Regional Performance"
        left="var(--content-left)"
        top={680}
        layout={REGIONAL_CARD_LAYOUT}
        legend={<RegionalLegend />}
        onBackgroundClick={clearRegion}
      >
        {regions && (
          <RegionalPerformanceChart
            series={regions}
            selectedRegion={effective.region}
            onSelectRegion={(region) =>
              dispatch({ type: ACTIONS.SELECT_ITEM, dimension: 'region', value: region })
            }
            onClearRegion={clearRegion}
          />
        )}
      </ChartCard>

      {/* Sales by Segment - Checkpoint 5C */}
      <ChartCard
        title="Sales by Segment"
        left="calc(var(--content-left) + var(--chart-w) + 20px)"
        top={680}
        layout={SEGMENT_CARD_LAYOUT}
        onBackgroundClick={clearSegment}
      >
        {segments && (
          <SalesBySegmentChart
            series={segments}
            selectedSegment={effective.segment}
            onSelectSegment={(segment) =>
              dispatch({ type: ACTIONS.SELECT_ITEM, dimension: 'segment', value: segment })
            }
            onClearSegment={clearSegment}
          />
        )}
      </ChartCard>
    </>
  );
}
