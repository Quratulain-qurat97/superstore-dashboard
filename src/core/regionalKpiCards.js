
import {
  formatCompactCurrency,
  formatCurrency,
  formatInteger,
  formatPercent,
} from './formatters.js';

/**
 * Converts Regional Analysis KPI calculations into display-ready cards.
 * All rounding and display formatting are handled by formatters.js.
 */
export function buildRegionalKpiCards(kpis) {
  return [
    {
      id: 'lossMakingStates',
      label: 'Loss-Making States',
      value: formatInteger(kpis.lossMakingStateCount),
      exact: `${formatInteger(kpis.lossMakingStateCount)} loss-making states`,
      numericValue: kpis.lossMakingStateCount,
    },
    {
      id: 'totalStateLosses',
      label: 'Total State Losses',
      value: formatCompactCurrency(kpis.totalStateLosses),
      exact: formatCurrency(kpis.totalStateLosses),
      numericValue: kpis.totalStateLosses,
    },
    {
      id: 'lossImpact',
      label: 'Loss Impact',
      value: formatPercent(kpis.lossImpact, 2),
      exact: formatPercent(kpis.lossImpact, 2),
      numericValue: kpis.lossImpact,
    },
    {
      id: 'worstStateProfit',
      label: 'Worst State Profit',
      value: formatCompactCurrency(kpis.worstStateProfit),
      exact: kpis.worstStateProfit === null
        ? 'No state data available'
        : `${kpis.worstStateName}: ${formatCurrency(kpis.worstStateProfit)}`,
      numericValue: kpis.worstStateProfit,
      supportingText: kpis.worstStateName ?? 'No state data',
    },
  ];
}
