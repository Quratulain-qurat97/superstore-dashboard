
import { useEffect, useMemo } from 'react';

import PageHeader from '../../ui/layout/PageHeader.jsx';
import FilterBar from '../../ui/filters/FilterBar.jsx';
import ChartCard from '../../ui/charts/ChartCard.jsx';
import SalesKpiRow from '../../ui/sales/SalesKpiRow.jsx';

import MonthlySalesTrendChart from '../../ui/sales/MonthlySalesTrendChart.jsx';
import SalesRegionalChart from '../../ui/sales/SalesRegionalChart.jsx';
import SalesCategoryProfitabilityChart from '../../ui/sales/SalesCategoryProfitabilityChart.jsx';

import {
  TREND_CARD_LAYOUT,
  REGIONAL_CARD_LAYOUT,
  SALES_CATEGORY_CARD_LAYOUT,
} from '../../ui/charts/cardLayouts.js';

import {
  ACTIONS,
  buildSalesRegionalSeries,
  hasActiveSelections,
} from '../../core/index.js';

import { useFilterState } from '../../state/useFilterState.js';
import { useSalesData } from '../../state/useSalesData.js';

export default function SalesAnalysisPage() {
  const { state, dispatch, effective } = useFilterState();
  const { data } = useSalesData(effective);

  const regionalSeries = useMemo(
    () => (data ? buildSalesRegionalSeries(data.regions) : null),
    [data],
  );

  const categorySeries = data?.categorySeries ?? null;

  const clearRegion = () =>
    dispatch({
      type: ACTIONS.CLEAR_SELECTION,
      dimension: 'region',
    });

  const clearCategory = () =>
    dispatch({
      type: ACTIONS.CLEAR_SELECTION,
      dimension: 'category',
    });

  const anySelection = hasActiveSelections(state);

  useEffect(() => {
    if (!anySelection) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        dispatch({ type: ACTIONS.CLEAR_ALL_SELECTIONS });
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [anySelection, dispatch]);

  return (
    <>
      <PageHeader
        title="Sales Analysis"
        subtitle="Explore sales performance, trends, and profitability."
      />

      <FilterBar state={state} dispatch={dispatch} />

      <SalesKpiRow kpis={data ? data.kpis : null} />

      <ChartCard
        title="Monthly Sales Trend"
        left="var(--content-left)"
        top={342}
        layout={TREND_CARD_LAYOUT}
      >
        {data && data.monthlyTrend.length > 0 && (
          <MonthlySalesTrendChart
            series={data.monthlyTrend}
            selectedYear={data.selectedYear}
            selectedMonth={state.month}
            onSelectMonth={(month) =>
              dispatch({
                type: ACTIONS.SELECT_MONTH,
                month,
              })
            }
          />
        )}
      </ChartCard>

      <ChartCard
        title="Regional Sales Contribution & Profitability"
        left="calc(var(--content-left) + var(--chart-w) + 20px)"
        top={342}
        layout={REGIONAL_CARD_LAYOUT}
        onBackgroundClick={clearRegion}
      >
        {regionalSeries && (
          <SalesRegionalChart
            series={regionalSeries}
            selectedRegion={effective.region}
            onSelectRegion={(region) =>
              dispatch({
                type: ACTIONS.SELECT_ITEM,
                dimension: 'region',
                value: region,
              })
            }
          />
        )}
      </ChartCard>

      <ChartCard
        title="Category & Sub-Category Profitability"
        left="var(--content-left)"
        top={680}
        width="calc(var(--chart-w) + var(--chart-w) + 20px)"
        layout={SALES_CATEGORY_CARD_LAYOUT}
        onBackgroundClick={clearCategory}
      >
        {categorySeries && (
          <SalesCategoryProfitabilityChart
            series={categorySeries}
            selectedCategory={effective.category}
            selectedSubCategory={effective.subCategory}
            onSelectSubCategory={(category, subCategory) =>
              dispatch({
                type: ACTIONS.SELECT_SUBCATEGORY,
                category,
                subCategory,
              })
            }
          />
        )}
      </ChartCard>
    </>
  );
}
