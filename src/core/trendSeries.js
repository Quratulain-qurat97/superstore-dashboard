// trendSeries.js
// Shapes the monthly sales data for the Monthly Sales Trend chart. Pure maths, no drawing.

import { niceAxis } from './chartScale.js';

/**
 * @param {Array<{month:string, sales:number, prevSales:number|null, momChange:number|null}>} monthlyTrend
 *        the `monthlyTrend` section of the dashboard data contract (every month in the period)
 * @returns {{
 *   points: Array<{month:string, sales:number|null, hasData:boolean, prevSales:number|null,
 *                  momChange:number|null, momPercent:number|null}>,
 *   total:number, maxSales:number, hasAnyData:boolean,
 *   axis:{step:number,max:number,ticks:number[]}, labelStep:number
 * }}
 *
 * A month with no transactions has sales of 0 in the contract (every transaction has Sales > 0).
 * Such a month becomes `sales: null` here, so the chart shows a GAP instead of a made-up zero.
 */
export function buildTrendSeries(monthlyTrend) {
  const points = monthlyTrend.map((m) => {
    const hasData = m.sales !== 0;
    // The change versus the previous month is only meaningful when that month had sales too.
    const comparable = hasData && m.prevSales !== null && m.prevSales > 0;
    return {
      month: m.month,
      sales: hasData ? m.sales : null,
      hasData,
      prevSales: m.prevSales,
      momChange: comparable ? m.momChange : null,
      momPercent: comparable ? (m.momChange / m.prevSales) * 100 : null,
    };
  });
  const sales = points.filter((p) => p.hasData).map((p) => p.sales);
  const maxSales = sales.length ? Math.max(...sales) : 0;
  return {
    points,
    total: sales.reduce((t, v) => t + v, 0),
    maxSales,
    hasAnyData: sales.length > 0,
    axis: niceAxis(maxSales),
    // 12 months: label every month. 48 months: label every 3rd (Jan, Apr, Jul, Oct).
    labelStep: points.length > 12 ? 3 : 1,
  };
}

/**
 * What a click on the chart should do. `chartState` is what Recharts reports for the click.
 * A click on a month that has data selects it; a click anywhere else (outside the plot, or on a
 * month with no data) clears the month selection.
 * @returns {{kind:'select', month:string} | {kind:'clear'}}
 */
export function resolveChartClick(chartState, points) {
  const index = chartState && chartState.isTooltipActive ? Number(chartState.activeIndex) : NaN;
  const point = Number.isInteger(index) ? points[index] : undefined;
  return point && point.hasData ? { kind: 'select', month: point.month } : { kind: 'clear' };
}
