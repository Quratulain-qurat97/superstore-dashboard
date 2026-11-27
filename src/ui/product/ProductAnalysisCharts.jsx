
import ChartCard from '../charts/ChartCard.jsx';
import { PRODUCT_CARD_LAYOUT } from '../charts/cardLayouts.js';

import ProductProfitMarginChart from './ProductProfitMarginChart.jsx';
import ProductSalesProfitMarginCanvasChart from './ProductSalesProfitMarginCanvasChart.jsx';
import ProductDiscountProfitChart from './ProductDiscountProfitChart.jsx';
import ProductSalesByCategoryPerYearChart from './ProductSalesByCategoryPerYearChart.jsx';

export default function ProductAnalysisCharts({
  data,
  selectedCategory,
  selectedSubCategory,
  onSelectSubCategory,
  selectedDiscountGroup,
  onSelectDiscountGroup,
  onSelectCategory,
  loading = false,
}) {
  return (
    <>
      <ChartCard
        title="Profit Margin by Sub-Category"
        left="var(--content-left)"
        top={342}
        layout={PRODUCT_CARD_LAYOUT}
        loading={loading}
      >
        <ProductProfitMarginChart
          series={data?.subCategoryProfitMargins}
          selectedCategory={selectedCategory}
          selectedSubCategory={selectedSubCategory}
          onSelectSubCategory={onSelectSubCategory}
        />
      </ChartCard>

      <ChartCard
        title="Sales vs. Profit Margin"
        left="calc(var(--content-left) + var(--chart-w) + 20px)"
        top={342}
        layout={PRODUCT_CARD_LAYOUT}
        loading={loading}
      >
        <ProductSalesProfitMarginCanvasChart
          series={data?.productSalesProfitMargins}
          selectedCategory={selectedCategory}
          selectedSubCategory={selectedSubCategory}
          onSelectSubCategory={onSelectSubCategory}
        />
      </ChartCard>

      <ChartCard
        title="Where Discounts Cost Profit"
        left="var(--content-left)"
        top={680}
        layout={PRODUCT_CARD_LAYOUT}
        loading={loading}
      >
        <ProductDiscountProfitChart
          series={data?.discountProfitImpact}
          selectedDiscountGroup={selectedDiscountGroup}
          onSelectDiscountGroup={onSelectDiscountGroup}
        />
      </ChartCard>

      <ChartCard
        title="Sales by Category per Year"
        left="calc(var(--content-left) + var(--chart-w) + 20px)"
        top={680}
        layout={PRODUCT_CARD_LAYOUT}
        loading={loading}
      >
        <ProductSalesByCategoryPerYearChart
          series={data?.salesByCategoryPerYear}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
      </ChartCard>
    </>
  );
}
