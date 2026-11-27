import ChartCard from '../charts/ChartCard.jsx';
import ProfitTrendOverTimeChart from './ProfitTrendOverTimeChart.jsx';
import ProfitMarginByCategoryChart from './ProfitMarginByCategoryChart.jsx';
import DiscountImpactHeatmapChart from './DiscountImpactHeatmapChart.jsx';
import Top10ProductsByNetLossChart from './Top10ProductsByNetLossChart.jsx';

import { ACTIONS } from '../../core/index.js';

const PROFITABILITY_CARD_LAYOUT = {
  titleLeft: 16.11,
  titleTop: 14.78,
  body: { left: 5, top: 50, right: 14, height: 274 },
};

export default function ProfitabilityAnalysisCharts({
  profitTrend,
  profitMarginByCategory,
  discountImpactHeatmap,
  top10ProductsByNetLoss,
  selectedProductId,
  onSelectProduct,
  selectedYear,
  selectedMonth,
  selectedCategory,
  dispatch,
  loading = false,
}) {
  const clearCategory = () =>
    dispatch({
      type: ACTIONS.CLEAR_SELECTION,
      dimension: 'category',
    });

  return (
    <>
      <ChartCard
        title="Profit Trend Over Time"
        left="var(--content-left)"
        top={342}
        layout={PROFITABILITY_CARD_LAYOUT}
        loading={loading}
      >
        <ProfitTrendOverTimeChart
          series={profitTrend}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          dispatch={dispatch}
        />
      </ChartCard>

      <ChartCard
        title="Profit Margin by Category"
        left="calc(var(--content-left) + var(--chart-w) + 20px)"
        top={342}
        layout={PROFITABILITY_CARD_LAYOUT}
        onBackgroundClick={clearCategory}
        loading={loading}
      >
        {profitMarginByCategory && (
          <ProfitMarginByCategoryChart
            series={profitMarginByCategory}
            selectedCategory={selectedCategory}
            onSelectCategory={(category) =>
              dispatch({
                type: ACTIONS.SELECT_ITEM,
                dimension: 'category',
                value: category,
              })
            }
            onClearCategory={clearCategory}
          />
        )}
      </ChartCard>

      <ChartCard
        title="Discount Impact Heatmap"
        left="var(--content-left)"
        top={680}
        layout={PROFITABILITY_CARD_LAYOUT}
        loading={loading}
      >
        {discountImpactHeatmap && (
          <DiscountImpactHeatmapChart
            data={discountImpactHeatmap}
            selectedCategory={selectedCategory}
          />
        )}
      </ChartCard>

      <ChartCard
        title="Top 10 Products by Net Loss"
        left="calc(var(--content-left) + var(--chart-w) + 20px)"
        top={680}
        layout={PROFITABILITY_CARD_LAYOUT}
        loading={loading}
      >
        <Top10ProductsByNetLossChart
          products={top10ProductsByNetLoss}
          selectedProductId={selectedProductId}
          onProductSelect={onSelectProduct}
        />
      </ChartCard>
    </>
  );
}