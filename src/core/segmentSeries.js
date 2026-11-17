
import { SEGMENTS } from './constants.js';

/**
 * Shapes segment sales data for the Revenue by Segment donut chart.
 *
 * @param {Array<{segment:string, sales:number}>} segments
 * @returns {{
 *   segments: Array<{segment:string, sales:number|null, share:number|null, hasData:boolean}>,
 *   slices: Array<{segment:string, sales:number, share:number}>,
 *   total:number,
 *   hasAnyData:boolean
 * }}
 */
export function buildSegmentSeries(segments, order = SEGMENTS) {
  const byName = new Map(segments.map((item) => [item.segment, item]));

  // Always preserve all three segments for calculations and testing.
  const values = order.map((segment) => {
    const found = byName.get(segment);

    return {
      segment,
      sales: found ? found.sales : null,
      hasData: found !== undefined,
    };
  });

  const total = values.reduce(
    (sum, item) => sum + (item.sales ?? 0),
    0,
  );

  const allSegments = values.map((item) => ({
    ...item,
    share:
      item.sales !== null && total > 0
        ? (item.sales / total) * 100
        : null,
  }));

  // Only segments with actual transactions become donut slices.
  const slices = allSegments
    .filter((item) => item.hasData)
    .map(({ segment, sales, share }) => ({
      segment,
      sales,
      share,
    }));

  return {
    segments: allSegments,
    slices,
    total,
    hasAnyData: slices.length > 0,
  };
}
