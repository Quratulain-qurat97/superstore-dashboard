// regionSeries.js
// Shapes the regional data for the Regional Performance grouped bar chart (Sales and Profit per region).
// Pure maths, no drawing.

import { REGIONS } from './constants.js';
import { niceAxisRange } from './chartScale.js';

export const REGION_AXIS_INTERVALS = 5;

/**
 * @param {Array<{region:string, sales:number, profit:number, margin:number|null}>} regions
 *        the `regions` section of the dashboard data contract: SUM(Sales) and SUM(Profit) per region,
 *        already filtered by Category, Segment, Year and Month but NOT by Region, so the four regions
 *        can always be compared
 * @returns {{
 *   bars: Array<{region:string, sales:number|null, profit:number|null, margin:number|null, hasData:boolean}>,
 *   totalSales:number, totalProfit:number, hasAnyData:boolean,
 *   axis:{step:number, min:number, max:number, ticks:number[]}
 * }}
 *
 * Regions are always in the fixed order West, East, Central, South. A region with no transactions in the
 * current selection has `sales: null` and `profit: null` (no bars), never made-up zeros. Profit is the
 * sum of the transactions' profit (it can be negative); the margin is SUM(profit) / SUM(sales).
 */
export function buildRegionSeries(regions, order = REGIONS) {
  const byName = new Map(regions.map((r) => [r.region, r]));
  const bars = order.map((region) => {
    const found = byName.get(region);
    return found
      ? { region, sales: found.sales, profit: found.profit, margin: found.margin, hasData: true }
      : { region, sales: null, profit: null, margin: null, hasData: false };
  });
  const present = bars.filter((b) => b.hasData);
  const values = present.flatMap((b) => [b.sales, b.profit]);
  return {
    bars,
    totalSales: present.reduce((t, b) => t + b.sales, 0),
    totalProfit: present.reduce((t, b) => t + b.profit, 0),
    hasAnyData: present.length > 0,
    axis: niceAxisRange(values.length ? Math.min(...values) : 0, values.length ? Math.max(...values) : 0, REGION_AXIS_INTERVALS),
  };
}

/**
 * What a click on the chart should do. `chartState` is what Recharts reports for the click.
 * A click inside a region's column (where that region has bars) selects it; a click anywhere else
 * (outside the plot, or on a column with no data) clears the region selection.
 * @returns {{kind:'select', region:string} | {kind:'clear'}}
 */
export function resolveRegionClick(chartState, bars) {
  const index = chartState && chartState.isTooltipActive ? Number(chartState.activeIndex) : NaN;
  const bar = Number.isInteger(index) ? bars[index] : undefined;
  return bar && bar.hasData ? { kind: 'select', region: bar.region } : { kind: 'clear' };
}
