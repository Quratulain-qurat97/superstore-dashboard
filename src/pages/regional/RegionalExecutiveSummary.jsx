
import styles from './RegionalExecutiveSummary.module.css';

import {
  buildRegionalKpisFromStates,
  formatCurrency,
  formatInteger,
  formatPercent,
} from '../../core/index.js';

function summarizeStates(states = []) {
  const sales = states.reduce(
    (total, state) => total + state.sales,
    0,
  );

  const profit = states.reduce(
    (total, state) => total + state.profit,
    0,
  );

  return {
    sales,
    profit,
    margin: sales === 0 ? null : (profit / sales) * 100,
  };
}

export default function RegionalExecutiveSummary({
  comparisonRegions = [],
  comparisonAllStates = [],
  selectedRegion,
  selectedState,
  effective,
}) {
  const selectedStateData = comparisonAllStates.find(
    (state) => state.state === selectedState,
  );

  const hasSelectedState = Boolean(selectedState);

  const globalRegion = effective?.region;

  const activeRegion =
    selectedStateData?.region ??
    selectedRegion ??
    (
      globalRegion &&
      globalRegion !== 'ALL' &&
      globalRegion !== 'All'
        ? globalRegion
        : null
    );

  let selectedStates = comparisonAllStates;

  if (hasSelectedState) {
    selectedStates = selectedStateData
      ? [selectedStateData]
      : [];
  } else if (activeRegion) {
    selectedStates = comparisonAllStates.filter(
      (state) => state.region === activeRegion,
    );
  }

  const selectedPerformance = summarizeStates(selectedStates);
  const selectedKpis = buildRegionalKpisFromStates(selectedStates);

  const lossMakingStates = comparisonAllStates.filter(
    (state) => state.profit < 0,
  );

  const totalStateLosses = lossMakingStates.reduce(
    (total, state) => total + Math.abs(state.profit),
    0,
  );

  const largestStateLoss = [...lossMakingStates].sort(
    (a, b) => a.profit - b.profit,
  )[0];

  const regionsWithData = comparisonRegions.filter(
    (region) =>
      region.sales !== null &&
      region.profit !== null,
  );

  const highestProfitRegion = [...regionsWithData].sort(
    (a, b) => b.profit - a.profit,
  )[0];

  const lowestProfitRegion = [...regionsWithData].sort(
    (a, b) => a.profit - b.profit,
  )[0];

  const highestMarginRegion = [...regionsWithData]
    .filter((region) => region.margin !== null)
    .sort((a, b) => b.margin - a.margin)[0];

  const lowestMarginRegion = [...regionsWithData]
    .filter((region) => region.margin !== null)
    .sort((a, b) => a.margin - b.margin)[0];

  const regionsWithLossImpact = regionsWithData.filter(
    (region) =>
      region.lossImpact !== null &&
      Number.isFinite(region.lossImpact),
  );

  const highestLossImpactRegion = [...regionsWithLossImpact].sort(
    (a, b) => b.lossImpact - a.lossImpact,
  )[0];

  const lowestLossImpactRegion = [...regionsWithLossImpact].sort(
    (a, b) => a.lossImpact - b.lossImpact,
  )[0];

  const selectedLabel = selectedStateData
    ? selectedStateData.state
    : hasSelectedState
      ? selectedState
      : activeRegion
        ? activeRegion
        : 'All regions';

  const hasSelectedData = selectedStates.length > 0;

  return (
    <div className={styles.container}>
      <p className={styles.description}>
        Regional and state-level profitability findings based on
        the current dashboard filters and chart selections.
      </p>

      {/* 1. Current Selection */}
      <section className={styles.insight}>
        <h3 className={styles.insightTitle}>
          1. Current Selection Performance
        </h3>

        {hasSelectedData ? (
          <>
            <p className={styles.insightText}>
              {selectedLabel} generated{' '}
              <strong>
                {formatCurrency(selectedPerformance.sales)}
              </strong>{' '}
              in sales and{' '}
              <strong
                className={
                  selectedPerformance.profit < 0
                    ? styles.negative
                    : styles.positive
                }
              >
                {formatCurrency(selectedPerformance.profit)}
              </strong>{' '}
              in profit, with a profit margin of{' '}
              <strong
                className={
                  selectedPerformance.margin === null
                    ? styles.neutral
                    : selectedPerformance.margin < 0
                      ? styles.negative
                      : styles.positive
                }
              >
                {formatPercent(selectedPerformance.margin, 2)}
              </strong>.
            </p>

            <p className={styles.insightText}>
              The selected scope contains{' '}
              <strong>
                {formatInteger(selectedKpis.lossMakingStateCount)}
              </strong>{' '}
              loss-making states, with combined losses of{' '}
              <strong className={styles.negative}>
                {formatCurrency(selectedKpis.totalStateLosses)}
              </strong>.
            </p>

            <p className={styles.insightText}>
              Loss impact is{' '}
              <strong>
                {selectedKpis.lossImpact === null
                  ? 'N/A'
                  : formatPercent(selectedKpis.lossImpact, 2)}
              </strong>
              . The worst state is{' '}
              <strong>
                {selectedKpis.worstStateName ?? 'N/A'}
              </strong>
              {' '}with profit of{' '}
              <strong
                className={
                  selectedKpis.worstStateProfit === null
                    ? styles.neutral
                    : selectedKpis.worstStateProfit < 0
                      ? styles.negative
                      : styles.positive
                }
              >
                {selectedKpis.worstStateProfit === null
                  ? 'N/A'
                  : formatCurrency(selectedKpis.worstStateProfit)}
              </strong>.
            </p>

            {selectedStateData && (
              <p className={styles.insightText}>
                This state belongs to the {selectedStateData.region}{' '}
                region.
              </p>
            )}
          </>
        ) : (
          <p className={styles.empty}>
            No state data is available for the current selection.
          </p>
        )}
      </section>

      {/* 2. Regional Profitability */}
      <section className={styles.insight}>
        <h3 className={styles.insightTitle}>
          2. Regional Profitability
        </h3>

        <p className={styles.description}>
          All regions are compared using the current Category,
          Sub-category, Segment, and date filters. The Region filter
          and local chart selections do not restrict this comparison.
        </p>

        {highestProfitRegion ? (
          <p className={styles.insightText}>
            {highestProfitRegion.region} recorded the highest
            regional profit at{' '}
            <strong className={styles.positive}>
              {formatCurrency(highestProfitRegion.profit)}
            </strong>.
          </p>
        ) : (
          <p className={styles.empty}>
            Regional profit comparisons are unavailable.
          </p>
        )}

        {lowestProfitRegion &&
          lowestProfitRegion.region !== highestProfitRegion?.region && (
            <p className={styles.insightText}>
              {lowestProfitRegion.region} recorded the lowest
              regional profit at{' '}
              <strong
                className={
                  lowestProfitRegion.profit < 0
                    ? styles.negative
                    : styles.neutral
                }
              >
                {formatCurrency(lowestProfitRegion.profit)}
              </strong>.
            </p>
          )}

        {highestMarginRegion && lowestMarginRegion && (
          <p className={styles.insightText}>
            Regional profit margins ranged from{' '}
            <strong>
              {formatPercent(lowestMarginRegion.margin, 2)}
            </strong>{' '}
            in {lowestMarginRegion.region} to{' '}
            <strong>
              {formatPercent(highestMarginRegion.margin, 2)}
            </strong>{' '}
            in {highestMarginRegion.region}.
          </p>
        )}
      </section>

      {/* 3. Regional Loss Impact */}
      <section className={styles.insight}>
        <h3 className={styles.insightTitle}>
          3. Regional Loss Impact
        </h3>

        {highestLossImpactRegion ? (
          <>
            <p className={styles.insightText}>
              {highestLossImpactRegion.region} recorded the highest
              loss impact at{' '}
              <strong>
                {formatPercent(highestLossImpactRegion.lossImpact, 2)}
              </strong>
              , with state-level losses of{' '}
              <strong className={styles.negative}>
                {formatCurrency(highestLossImpactRegion.lossAmount)}
              </strong>.
            </p>

            {lowestLossImpactRegion &&
              lowestLossImpactRegion.region !==
                highestLossImpactRegion.region && (
                <p className={styles.insightText}>
                  {lowestLossImpactRegion.region} recorded the lowest
                  loss impact at{' '}
                  <strong>
                    {formatPercent(
                      lowestLossImpactRegion.lossImpact,
                      2,
                    )}
                  </strong>.
                </p>
              )}
          </>
        ) : (
          <p className={styles.empty}>
            Regional loss impact cannot be compared for the current
            filters.
          </p>
        )}
      </section>

      {/* 4. State-Level Losses */}
      <section className={styles.insight}>
        <h3 className={styles.insightTitle}>
          4. State-Level Losses
        </h3>

        {comparisonAllStates.length > 0 ? (
          <>
            <p className={styles.insightText}>
              <strong className={styles.negative}>
                {lossMakingStates.length} of{' '}
                {comparisonAllStates.length}
              </strong>{' '}
              states recorded negative profit, with combined
              losses totaling{' '}
              <strong className={styles.negative}>
                {formatCurrency(totalStateLosses)}
              </strong>.
            </p>

            {largestStateLoss && (
              <p className={styles.insightText}>
                {largestStateLoss.state} in the{' '}
                {largestStateLoss.region} region recorded the largest
                state-level loss at{' '}
                <strong className={styles.negative}>
                  {formatCurrency(Math.abs(largestStateLoss.profit))}
                </strong>.
              </p>
            )}
          </>
        ) : (
          <p className={styles.empty}>
            No state-level data is available for the current filters.
          </p>
        )}
      </section>
    </div>
  );
}
