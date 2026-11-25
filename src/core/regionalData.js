
import {
  sumBy,
  groupBy,
  filterRows,
  profitMargin,
} from './aggregations.js';

/**
 * Calculates Regional Analysis KPIs from aggregated state records.
 */
export function buildRegionalKpisFromStates(states = []) {
  const lossMakingStates = states.filter(
    (state) => state.profit < 0,
  );

  const profitableStates = states.filter(
    (state) => state.profit > 0,
  );

  const totalStateLosses = Math.abs(
    sumBy(lossMakingStates, 'profit'),
  );

  const totalProfitableStateProfit = sumBy(
    profitableStates,
    'profit',
  );

  const worstState = states.length > 0
    ? states.reduce((worst, state) =>
        state.profit < worst.profit ? state : worst,
      )
    : null;

  return {
    lossMakingStateCount: lossMakingStates.length,
    totalStateLosses,
    lossImpact: totalProfitableStateProfit === 0
      ? null
      : (totalStateLosses / totalProfitableStateProfit) * 100,
    worstStateProfit: worstState?.profit ?? null,
    worstStateName: worstState?.state ?? null,
  };
}

/**
 * Builds state-level and region-level profitability data
 * using the currently effective global filters.
 */
export function buildRegionalData(rows, effective = {}) {
  const filteredRows = filterRows(rows, {
    region: effective.region ?? null,
    category: effective.category ?? null,
    segment: effective.segment ?? null,
    year: effective.month
      ? null
      : (effective.year ?? null),
    month: effective.month ?? null,
    subCategory: effective.subCategory ?? null,
  });

  const states = [...groupBy(
    filteredRows,
    (row) => row.state,
  ).entries()]
    .map(([state, stateRows]) => {
      const sales = sumBy(stateRows, 'sales');
      const profit = sumBy(stateRows, 'profit');

      return {
        state,
        region: stateRows[0].region,
        sales,
        profit,
        margin: profitMargin(profit, sales),
      };
    })
    .sort((a, b) => a.profit - b.profit);

  const regions = [...groupBy(
    filteredRows,
    (row) => row.region,
  ).entries()]
    .map(([region, regionRows]) => {
      const sales = sumBy(regionRows, 'sales');
      const profit = sumBy(regionRows, 'profit');

      const regionStates = states.filter(
        (state) => state.region === region,
      );

      const regionLosses = regionStates.filter(
        (state) => state.profit < 0,
      );

      const regionProfitableStates = regionStates.filter(
        (state) => state.profit > 0,
      );

      const lossAmount = Math.abs(
        sumBy(regionLosses, 'profit'),
      );

      const profitableStateProfit = sumBy(
        regionProfitableStates,
        'profit',
      );

      return {
        region,
        sales,
        profit,
        margin: profitMargin(profit, sales),
        stateCount: regionStates.length,
        lossMakingStateCount: regionLosses.length,
        lossAmount,
        profitableStateProfit,
        lossImpact: profitableStateProfit === 0
          ? null
          : (lossAmount / profitableStateProfit) * 100,
      };
    })

    .sort((a, b) => {
      if (a.lossImpact === null && b.lossImpact === null) return 0;
      if (a.lossImpact === null) return 1;
      if (b.lossImpact === null) return -1;

      return b.lossImpact - a.lossImpact;
    });

  const kpis = buildRegionalKpisFromStates(states);

  return {
    states,
    regions,
    lossMakingStates: states.filter(
      (state) => state.profit < 0,
    ),
    kpis,
    totalStateCount: states.length,
    totalSales: sumBy(states, 'sales'),
    totalProfit: sumBy(states, 'profit'),
  };
}
