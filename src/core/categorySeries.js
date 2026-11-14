// categorySeries.js
// Shapes the category revenue data for the Revenue by Category bar chart. Pure maths, no drawing.

import { CATEGORIES } from './constants.js';
import { niceAxis } from './chartScale.js';

// Figma's Product Revenue axis has 5 steps ($0, $200K ... $1M), so this chart uses 5 intervals.
export const CATEGORY_AXIS_INTERVALS = 5;

/**
 * @param {Array<{category:string, sales:number}>} categories  the `categories` section of the dashboard
 *        data contract (revenue = SUM(Sales) per category, already filtered by Region, Segment, Year
 *        and Month but NOT by Category, so the three categories can always be compared)
 * @returns {{
 *   bars: Array<{category:string, sales:number|null, hasData:boolean, share:number|null}>,
 *   total:number, maxSales:number, hasAnyData:boolean, axis:{step:number,max:number,ticks:number[]}
 * }}
 *
 * Bars are always in the fixed order Furniture, Office Supplies, Technology. A category with no
 * transactions in the current selection gets `sales: null` (no bar), never a made-up zero.
 * `share` is the category's percentage of the three categories' combined revenue.
 */
export function buildCategorySeries(categories, order = CATEGORIES) {
  const byName = new Map(categories.map((c) => [c.category, c]));
  const raw = order.map((category) => {
    const found = byName.get(category);
    return { category, sales: found ? found.sales : null };
  });
  const values = raw.filter((b) => b.sales !== null).map((b) => b.sales);
  const total = values.reduce((t, v) => t + v, 0);
  const maxSales = values.length ? Math.max(...values) : 0;
  return {
    bars: raw.map((b) => ({
      ...b,
      hasData: b.sales !== null,
      share: b.sales !== null && total > 0 ? (b.sales / total) * 100 : null,
    })),
    total,
    maxSales,
    hasAnyData: values.length > 0,
    axis: niceAxis(maxSales, CATEGORY_AXIS_INTERVALS),
  };
}
