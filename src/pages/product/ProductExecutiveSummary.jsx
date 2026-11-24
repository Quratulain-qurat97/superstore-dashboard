
import styles from './ProductExecutiveSummary.module.css';

import {
  formatCurrency,
  formatInteger,
  formatPercent,
} from '../../core/index.js';

const sum = (items, key) =>
  items.reduce((total, item) => total + (item[key] ?? 0), 0);

const getHighest = (items, key) =>
  [...items].sort((a, b) => b[key] - a[key])[0];

const getLowest = (items, key) =>
  [...items].sort((a, b) => a[key] - b[key])[0];

export default function ProductExecutiveSummary({
  data,
  effective,
}) {
  if (!data) return null;

  const {
    kpis,
    products = [],
    hasAnyData,
    subCategoryProfitMargins = [],
    discountProfitImpact = [],
    salesByCategoryPerYear = [],
  } = data;

  const selectedSubCategory = effective?.subCategory ?? null;
  const selectedCategory = effective?.category ?? null;
  const selectedDiscountGroup = effective?.discountGroup ?? null;

  const totalSales = sum(products, 'sales');
  const totalProfit = sum(products, 'profit');
  const totalTransactions = sum(products, 'transactionCount');

  const selectedSubCategoryData = selectedSubCategory
    ? subCategoryProfitMargins.find(
        (item) => item.subCategory === selectedSubCategory,
      )
    : null;

  const subCategoriesWithMargin = subCategoryProfitMargins.filter(
    (item) =>
      item.profitMargin !== null &&
      Number.isFinite(item.profitMargin),
  );

  const highestMarginSubCategory = getHighest(
    subCategoriesWithMargin,
    'profitMargin',
  );

  const lowestMarginSubCategory = getLowest(
    subCategoriesWithMargin,
    'profitMargin',
  );

  const lossMakingSubCategories = subCategoryProfitMargins
    .filter((item) => item.profit < 0)
    .sort((a, b) => a.profit - b.profit);

  const largestSubCategoryLoss = lossMakingSubCategories[0];

  const lowDiscount = discountProfitImpact.find(
    (item) => item.discountGroupKey === 'low',
  );

  const highDiscount = discountProfitImpact.find(
    (item) => item.discountGroupKey === 'high',
  );

  const discountGroups = discountProfitImpact.filter(
    (item) => item.transactionCount > 0,
  );

  const categoryKeys = salesByCategoryPerYear[0]
    ? Object.keys(salesByCategoryPerYear[0]).filter(
        (key) => key !== 'year',
      )
    : [];

  const categoryTotals = categoryKeys.map((category) => ({
    category,
    sales: sum(salesByCategoryPerYear, category),
  }));

  const highestSalesCategory = getHighest(
    categoryTotals,
    'sales',
  );

  const yearlyLeaders = salesByCategoryPerYear.map((yearData) => {
    const leader = getHighest(
      categoryKeys.map((category) => ({
        category,
        sales: yearData[category] ?? 0,
      })),
      'sales',
    );

    return {
      year: yearData.year,
      ...leader,
    };
  });

  const highestSalesYear = getHighest(
    yearlyLeaders,
    'sales',
  );

  const selectedDiscountLabel =
    selectedDiscountGroup === 'low'
      ? 'Discounts of 20% or less'
      : selectedDiscountGroup === 'high'
        ? 'Discounts above 20%'
        : null;

  return (
    <div className={styles.container}>
      <p className={styles.description}>
        Product profitability, discount impact, and category sales
        findings based on the current dashboard filters and chart
        selections.
      </p>

      {/* 1. Current Product Performance */}
      <section className={styles.insight}>
        <h3 className={styles.insightTitle}>
          1. Current Product Performance
        </h3>

        {hasAnyData ? (
          <>
            <p className={styles.insightText}>
              The selected transactions generated{' '}
              <strong>{formatCurrency(totalSales)}</strong> in sales
              and{' '}
              <strong
                className={
                  totalProfit < 0
                    ? styles.negative
                    : styles.positive
                }
              >
                {formatCurrency(totalProfit)}
              </strong>{' '}
              in profit, with an overall profit margin of{' '}
              <strong
                className={
                  kpis.profitMargin === null
                    ? styles.neutral
                    : kpis.profitMargin < 0
                      ? styles.negative
                      : styles.positive
                }
              >
                {formatPercent(kpis.profitMargin, 2)}
              </strong>.
            </p>

            <p className={styles.insightText}>
              <strong
                className={
                  kpis.lossMakingSubCategories > 0
                    ? styles.negative
                    : styles.neutral
                }
              >
                {formatInteger(kpis.lossMakingSubCategories)} of{' '}
                {formatInteger(kpis.totalSubCategories)}
              </strong>{' '}
              sub-categories recorded negative profit within the
              current KPI filter selection.
            </p>

            {kpis.topSubCategoryName && (
              <p className={styles.insightText}>
                <strong>{kpis.topSubCategoryName}</strong> was the
                top-performing sub-category by total profit,
                generating{' '}
                <strong
                  className={
                    kpis.topSubCategoryProfit < 0
                      ? styles.negative
                      : styles.positive
                  }
                >
                  {formatCurrency(kpis.topSubCategoryProfit)}
                </strong>{' '}
                in profit.
              </p>
            )}

            <p className={styles.insightText}>
              The selection contains{' '}
              <strong>{formatInteger(totalTransactions)}</strong>{' '}
              transactions across{' '}
              <strong>{formatInteger(products.length)}</strong>{' '}
              distinct products. Average transaction discount is{' '}
              <strong>
                {formatPercent(kpis.averageDiscount, 2)}
              </strong>.
            </p>

            {selectedSubCategoryData && (
              <p className={styles.insightText}>
                The selected sub-category is{' '}
                <strong>{selectedSubCategoryData.subCategory}</strong>{' '}
                in {selectedSubCategoryData.category}, with profit of{' '}
                <strong
                  className={
                    selectedSubCategoryData.profit < 0
                      ? styles.negative
                      : styles.positive
                  }
                >
                  {formatCurrency(selectedSubCategoryData.profit)}
                </strong>{' '}
                and a profit margin of{' '}
                <strong
                  className={
                    selectedSubCategoryData.profitMargin < 0
                      ? styles.negative
                      : styles.positive
                  }
                >
                  {formatPercent(
                    selectedSubCategoryData.profitMargin,
                    2,
                  )}
                </strong>.
              </p>
            )}

            {selectedDiscountLabel && (
              <p className={styles.insightText}>
                The current Discount Group selection is{' '}
                <strong>{selectedDiscountLabel}</strong>.
              </p>
            )}

            {selectedCategory && (
              <p className={styles.insightText}>
                The current Category selection is{' '}
                <strong>{selectedCategory}</strong>.
              </p>
            )}

            <p className={styles.insightText}>
              {totalProfit < 0
                ? 'The selected transactions resulted in a net loss.'
                : totalProfit > 0
                  ? 'The selected transactions resulted in a net profit.'
                  : 'The selected transactions generated no net profit or loss.'}
            </p>
          </>
        ) : (
          <p className={styles.empty}>
            No transactions match the current filter selection.
          </p>
        )}
      </section>

      {/* 2. Sub-Category Profitability */}
      <section className={styles.insight}>
        <h3 className={styles.insightTitle}>
          2. Sub-Category Profitability
        </h3>

        <p className={styles.description}>
          This comparison includes all sub-categories while retaining
          the Region, Segment, date, and Discount Group filters.
          Category and Sub-category selections do not restrict these
          chart comparisons.
        </p>

        {subCategoryProfitMargins.length > 0 ? (
          <>
            {highestMarginSubCategory && (
              <p className={styles.insightText}>
                {highestMarginSubCategory.subCategory} recorded the
                highest sub-category profit margin at{' '}
                <strong className={styles.positive}>
                  {formatPercent(
                    highestMarginSubCategory.profitMargin,
                    2,
                  )}
                </strong>.
              </p>
            )}

            {lowestMarginSubCategory && (
              <p className={styles.insightText}>
                {lowestMarginSubCategory.subCategory} recorded the
                lowest sub-category profit margin at{' '}
                <strong
                  className={
                    lowestMarginSubCategory.profitMargin < 0
                      ? styles.negative
                      : styles.neutral
                  }
                >
                  {formatPercent(
                    lowestMarginSubCategory.profitMargin,
                    2,
                  )}
                </strong>.
              </p>
            )}

            <p className={styles.insightText}>
              <strong
                className={
                  lossMakingSubCategories.length > 0
                    ? styles.negative
                    : styles.neutral
                }
              >
                {formatInteger(lossMakingSubCategories.length)} of{' '}
                {formatInteger(subCategoryProfitMargins.length)}
              </strong>{' '}
              sub-categories recorded negative profit.
            </p>

            {largestSubCategoryLoss ? (
              <p className={styles.insightText}>
                {largestSubCategoryLoss.subCategory} in{' '}
                {largestSubCategoryLoss.category} recorded the largest
                sub-category loss at{' '}
                <strong className={styles.negative}>
                  {formatCurrency(
                    Math.abs(largestSubCategoryLoss.profit),
                  )}
                </strong>.
              </p>
            ) : (
              <p className={styles.insightText}>
                No sub-category recorded negative profit under the
                current chart filters.
              </p>
            )}
          </>
        ) : (
          <p className={styles.empty}>
            Sub-category profitability comparisons are unavailable.
          </p>
        )}
      </section>

      {/* 3. Discount Impact */}
      <section className={styles.insight}>
        <h3 className={styles.insightTitle}>
          3. Discount Impact
        </h3>

        <p className={styles.description}>
          Both discount groups are compared using the current Region,
          Category, Segment, and date filters. The selected
          Sub-category and Discount Group do not restrict this chart.
        </p>

        {discountGroups.length > 0 ? (
          <>
            {lowDiscount && lowDiscount.transactionCount > 0 && (
              <p className={styles.insightText}>
                Transactions with discounts of 20% or less generated{' '}
                <strong
                  className={
                    lowDiscount.profit < 0
                      ? styles.negative
                      : styles.positive
                  }
                >
                  {formatCurrency(lowDiscount.profit)}
                </strong>{' '}
                in profit from{' '}
                <strong>{formatCurrency(lowDiscount.sales)}</strong>{' '}
                in sales, with an average discount of{' '}
                <strong>
                  {formatPercent(lowDiscount.averageDiscount, 2)}
                </strong>.
              </p>
            )}

            {highDiscount && highDiscount.transactionCount > 0 && (
              <p className={styles.insightText}>
                Transactions with discounts above 20% generated{' '}
                <strong
                  className={
                    highDiscount.profit < 0
                      ? styles.negative
                      : styles.positive
                  }
                >
                  {formatCurrency(highDiscount.profit)}
                </strong>{' '}
                in profit from{' '}
                <strong>{formatCurrency(highDiscount.sales)}</strong>{' '}
                in sales, with an average discount of{' '}
                <strong>
                  {formatPercent(highDiscount.averageDiscount, 2)}
                </strong>.
              </p>
            )}

            {lowDiscount &&
              highDiscount &&
              lowDiscount.transactionCount > 0 &&
              highDiscount.transactionCount > 0 && (
                <p className={styles.insightText}>
                  The profit difference between the two discount
                  groups is{' '}
                  <strong>
                    {formatCurrency(
                      Math.abs(lowDiscount.profit - highDiscount.profit),
                    )}
                  </strong>.
                </p>
              )}
          </>
        ) : (
          <p className={styles.empty}>
            Discount impact comparisons are unavailable for the
            current filters.
          </p>
        )}
      </section>

      {/* 4. Category Sales Trends */}
      <section className={styles.insight}>
        <h3 className={styles.insightTitle}>
          4. Category Sales Trends
        </h3>

        <p className={styles.description}>
          This comparison includes all categories across 2014–2017.
          It respects Region, Segment, Month, and Discount Group
          filters. Category, Sub-category, and Year filters do not
          restrict this chart. A selected month is compared across
          the same calendar month in every year.
        </p>

        {highestSalesCategory && highestSalesYear ? (
          <>
            <p className={styles.insightText}>
              Across the displayed years, {highestSalesCategory.category}{' '}
              generated the highest combined category sales at{' '}
              <strong>
                {formatCurrency(highestSalesCategory.sales)}
              </strong>.
            </p>

            <p className={styles.insightText}>
              In {highestSalesYear.year}, {highestSalesYear.category}{' '}
              recorded the highest category sales at{' '}
              <strong>
                {formatCurrency(highestSalesYear.sales)}
              </strong>.
            </p>

            <p className={styles.insightText}>
              {yearlyLeaders.map((item) => (
                `${item.year}: ${item.category}`
              )).join(' · ')}{' '}
              recorded the highest sales within each respective year.
            </p>
          </>
        ) : (
          <p className={styles.empty}>
            Category sales comparisons are unavailable for the
            current filters.
          </p>
        )}
      </section>
    </div>
  );
}
