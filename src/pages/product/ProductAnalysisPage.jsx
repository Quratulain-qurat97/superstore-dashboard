
import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import PageHeader from '../../ui/layout/PageHeader.jsx';
import FilterBar from '../../ui/filters/FilterBar.jsx';

import ProductKpiRow from '../../ui/product/ProductKpiRow.jsx';
import ProductAnalysisCharts from '../../ui/product/ProductAnalysisCharts.jsx';
import ProductExecutiveSummary from './ProductExecutiveSummary.jsx';

import { useFilterState } from '../../state/useFilterState.js';
import { useProductData } from '../../state/useProductData.js';

export default function ProductAnalysisPage() {
  const { updateSummaryContent } = useOutletContext();

  const { state, dispatch, effective } = useFilterState();
  const { data, status, retry } = useProductData(effective);

  const marginSeries = data?.subCategoryProfitMargins ?? [];

  const selectedSubCategory =
    state.subCategorySelection?.value ?? null;

  const selectedDiscountGroup =
    state.discountGroupSelection ?? null;

  const selectedSubCategoryData =
    marginSeries.find(
      (item) => item.subCategory === selectedSubCategory,
    ) ?? null;

  useEffect(() => {
    updateSummaryContent(
      <ProductExecutiveSummary
        data={data}
        effective={effective}
      />,
    );

    return () => updateSummaryContent(null);
  }, [data, effective, updateSummaryContent]);

  useEffect(() => {
    const selection = state.subCategorySelection;
    if (!selection || !data) return;

    const stillAvailable = marginSeries.some(
      (item) => item.subCategory === selection.value,
    );

    if (!stillAvailable) {
      dispatch({
        type: 'SELECT_SUBCATEGORY',
        category: state.dropdowns.category,
        subCategory: selection.value,
      });
    }
  }, [
    data,
    marginSeries,
    state.subCategorySelection,
    state.dropdowns.category,
    dispatch,
  ]);

  function handleSelectSubCategory(category, subCategory) {
    dispatch({ type: 'SELECT_SUBCATEGORY', category, subCategory });
  }

  function handleSelectDiscountGroup(discountGroup) {
    dispatch({ type: 'SELECT_DISCOUNT_GROUP', discountGroup });
  }

  function handleSelectCategory(category) {
    dispatch({
      type: 'SELECT_ITEM',
      dimension: 'category',
      value: category,
    });
  }

  return (
    <>
      <PageHeader
        title="Product Analysis"
        subtitle="Explore product profitability, discount impact, and performance."
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
          <ProductKpiRow
            kpis={data?.kpis ?? null}
            selectedSubCategory={selectedSubCategoryData}
            loading={status === 'loading'}
          />

          <ProductAnalysisCharts
            data={data}
            selectedCategory={effective.category}
            selectedSubCategory={selectedSubCategory}
            onSelectSubCategory={handleSelectSubCategory}
            selectedDiscountGroup={selectedDiscountGroup}
            onSelectDiscountGroup={handleSelectDiscountGroup}
            onSelectCategory={handleSelectCategory}
            loading={status === 'loading'}
          />
        </>
      )}
    </>
  );
}
