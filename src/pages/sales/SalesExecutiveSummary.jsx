
import styles from './SalesExecutiveSummary.module.css';

import {
  formatCurrency,
  formatPercent,
  formatSignedPercent,
} from '../../core/index.js';

export default function SalesExecutiveSummary({ data }) {
  if (!data) return null;

  const {
    kpis,
    monthlyTrend = [],
    regions = [],
    lossStates,
    categorySeries,
    selectedYear,
  } = data;

  // Monthly performance
  const monthsWithData = monthlyTrend.filter(
    (month) => month.sales > 0,
  );

  const highestSalesMonth = [...monthsWithData].sort(
    (a, b) => b.sales - a.sales,
  )[0];

  const lowestSalesMonth = [...monthsWithData].sort(
    (a, b) => a.sales - b.sales,
  )[0];

  const comparableMonths = monthlyTrend.filter(
    (month) =>
      month.percentageChange !== null &&
      Number.isFinite(month.percentageChange),
  );

  const largestIncrease = [...comparableMonths]
    .filter((month) => month.percentageChange > 0)
    .sort((a, b) => b.percentageChange - a.percentageChange)[0];

  const largestDecrease = [...comparableMonths]
    .filter((month) => month.percentageChange < 0)
    .sort((a, b) => a.percentageChange - b.percentageChange)[0];

  // Regional performance
  const regionsWithData = regions.filter(
    (region) =>
      region.sales !== null &&
      region.sales !== undefined,
  );

  const highestSalesRegion = [...regionsWithData].sort(
    (a, b) => b.sales - a.sales,
  )[0];

  const lowestMarginRegion = [...regionsWithData]
    .filter((region) => region.margin !== null)
    .sort((a, b) => a.margin - b.margin)[0];

  // Category and sub-category profitability
  const categoriesWithData = (
    categorySeries?.categories ?? []
  ).filter((category) => category.hasData);

  const categoriesWithMargin = categoriesWithData.filter(
    (category) => category.margin !== null,
  );

  const highestMarginCategory = [...categoriesWithMargin].sort(
    (a, b) => b.margin - a.margin,
  )[0];

  const lowestMarginCategory = [...categoriesWithMargin].sort(
    (a, b) => a.margin - b.margin,
  )[0];

  const subCategories = categoriesWithData.flatMap((category) =>
    category.subCategories.map((subCategory) => ({
      ...subCategory,
      category: category.category,
    })),
  );

  const lossMakingSubCategories = subCategories
    .filter((subCategory) => subCategory.profit < 0)
    .sort((a, b) => a.profit - b.profit);

  const largestSubCategoryLoss = lossMakingSubCategories[0];

  // State-level losses
  const lossMakingStates = lossStates?.states ?? [];

  const largestStateLoss = [...lossMakingStates].sort(
    (a, b) => a.profit - b.profit,
  )[0];

  const hasSalesData = kpis.rowCount > 0;

  return (
    <div className={styles.container}>
      <p className={styles.description}>
        Key sales and profitability findings based on the current
        dashboard filters.
      </p>

      {/* 1. Overall Sales Performance */}
      <section className={styles.insight}>
        <h3 className={styles.insightTitle}>
          1. Overall Sales Performance
        </h3>

        {hasSalesData ? (
          <>
            <p className={styles.insightText}>
              The selected transactions generated{' '}
              <strong>{formatCurrency(kpis.totalSales)}</strong> in
              sales and{' '}
              <strong>{formatCurrency(kpis.totalProfit)}</strong> in
              profit, representing a profit margin of{' '}
              <strong
                className={
                  kpis.profitMargin < 0
                    ? styles.negative
                    : styles.positive
                }
              >
                {formatPercent(kpis.profitMargin, 2)}
              </strong>.
            </p>

            <p className={styles.insightText}>
              {kpis.totalProfit < 0
                ? 'The selected transactions resulted in a net loss.'
                : kpis.totalProfit > 0
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

      {/* 2. Monthly Sales Trend */}
      <section className={styles.insight}>
        <h3 className={styles.insightTitle}>
          2. Monthly Sales Trend
        </h3>

        {highestSalesMonth && lowestSalesMonth ? (
          <>
            <p className={styles.insightText}>
              In {selectedYear}, {highestSalesMonth.month} recorded
              the highest monthly sales at{' '}
              <strong>
                {formatCurrency(highestSalesMonth.sales)}
              </strong>
              , while {lowestSalesMonth.month} recorded the lowest at{' '}
              <strong>
                {formatCurrency(lowestSalesMonth.sales)}
              </strong>.
            </p>

            {largestIncrease && (
              <p className={styles.insightText}>
                Compared with the same month in {selectedYear - 1},
                sales in {largestIncrease.month} increased by{' '}
                <strong className={styles.positive}>
                  {formatSignedPercent(
                    largestIncrease.percentageChange,
                  ).replace('+', '')}
                </strong>.
              </p>
            )}

            {largestDecrease && (
              <p className={styles.insightText}>
                Compared with the same month in {selectedYear - 1},
                sales in {largestDecrease.month} decreased by{' '}
                <strong className={styles.negative}>
                  {formatSignedPercent(
                    largestDecrease.percentageChange,
                  ).replace('-', '')}
                </strong>.
              </p>
            )}

            {!largestIncrease && !largestDecrease && (
              <p className={styles.empty}>
                No non-zero year-over-year percentage changes are
                available for this selection.
              </p>
            )}
          </>
        ) : (
          <p className={styles.empty}>
            Monthly sales comparisons are unavailable for the current
            selection.
          </p>
        )}
      </section>

      {/* 3. Regional Performance */}
      <section className={styles.insight}>
        <h3 className={styles.insightTitle}>
          3. Regional Performance
        </h3>

        <p className={styles.description}>
          This comparison includes all regions while retaining the
          other applicable dashboard filters. The selected Region
          filter does not affect this chart.
        </p>

        {highestSalesRegion ? (
          <p className={styles.insightText}>
            {highestSalesRegion.region} recorded the highest regional
            sales at{' '}
            <strong>
              {formatCurrency(highestSalesRegion.sales)}
            </strong>.
          </p>
        ) : (
          <p className={styles.empty}>
            No regional sales data is available for this selection.
          </p>
        )}

        {lowestMarginRegion ? (
          <p className={styles.insightText}>
            {lowestMarginRegion.region} recorded the lowest regional
            profit margin at{' '}
            <strong
              className={
                lowestMarginRegion.margin < 0
                  ? styles.negative
                  : styles.neutral
              }
            >
              {formatPercent(lowestMarginRegion.margin, 2)}
            </strong>.
          </p>
        ) : (
          <p className={styles.empty}>
            Regional profit margins cannot be compared for this
            selection.
          </p>
        )}
      </section>

      {/* 4. Category Profitability */}
      <section className={styles.insight}>
        <h3 className={styles.insightTitle}>
          4. Category Profitability
        </h3>

        <p className={styles.description}>
          This comparison includes all categories and sub-categories
          while retaining the other applicable dashboard filters.
          The selected Category and Sub-category filters do not affect
          this chart.
        </p>

        {highestMarginCategory ? (
          <p className={styles.insightText}>
            {highestMarginCategory.category} recorded the highest
            category profit margin at{' '}
            <strong className={styles.positive}>
              {formatPercent(highestMarginCategory.margin, 2)}
            </strong>.
          </p>
        ) : (
          <p className={styles.empty}>
            Category profit margins are unavailable for this
            selection.
          </p>
        )}

        {lowestMarginCategory && (
          <p className={styles.insightText}>
            {lowestMarginCategory.category} recorded the lowest
            category profit margin at{' '}
            <strong
              className={
                lowestMarginCategory.margin < 0
                  ? styles.negative
                  : styles.neutral
              }
            >
              {formatPercent(lowestMarginCategory.margin, 2)}
            </strong>.
          </p>
        )}

        {largestSubCategoryLoss ? (
          <p className={styles.insightText}>
            {largestSubCategoryLoss.subCategory} in{' '}
            {largestSubCategoryLoss.category} recorded the largest
            sub-category loss at{' '}
            <strong className={styles.negative}>
              {formatCurrency(Math.abs(largestSubCategoryLoss.profit))}
            </strong>.
          </p>
        ) : (
          <p className={styles.insightText}>
            No sub-category recorded a negative profit under the
            current filters.
          </p>
        )}
      </section>

      {/* 5. Loss-Making States */}
      <section className={styles.insight}>
        <h3 className={styles.insightTitle}>
          5. Loss-Making States
        </h3>

        {lossStates?.count > 0 ? (
          <>
            <p className={styles.insightText}>
              <strong className={styles.negative}>
                {lossStates.count} of {lossStates.stateCount}
              </strong>{' '}
              states recorded negative profit, with combined losses
              totaling{' '}
              <strong className={styles.negative}>
                {formatCurrency(Math.abs(lossStates.totalProfit))}
              </strong>.
            </p>

            {largestStateLoss && (
              <p className={styles.insightText}>
                {largestStateLoss.state} recorded the largest
                state-level loss at{' '}
                <strong className={styles.negative}>
                  {formatCurrency(Math.abs(largestStateLoss.profit))}
                </strong>.
              </p>
            )}
          </>
        ) : (
          <p className={styles.insightText}>
            No states recorded negative profit under the current
            filters.
          </p>
        )}
      </section>
    </div>
  );
}
