
// segmentSeries.js
// Shapes the segment sales data for the Sales by Segment donut chart.
// Pure calculations only: no React or drawing.

import { SEGMENTS } from './constants.js';

/**
 * @param {Array<{segment:string, sales:number}>} segments
 *        Segment data from buildHomeData(), already filtered by
 *        Region, Category, Year and Month, but NOT by Segment.
 *
 * @returns {{
 *   slices: Array<{segment:string, sales:number|null, share:number|null, hasData:boolean}>,
 *   total:number,
 *   hasAnyData:boolean
 * }}
 *
 * Segments always follow the fixed order:
 * Consumer, Corporate, Home Office.
 * Missing segments receive null values rather than fabricated zeros.
 */
export function buildSegmentSeries(segments, order = SEGMENTS) {
  const byName = new Map(segments.map((item) => [item.segment, item]));

  const raw = order.map((segment) => {
    const found = byName.get(segment);
    return {
      segment,
      sales: found ? found.sales : null,
    };
  });

  const values = raw
    .filter((item) => item.sales !== null)
    .map((item) => item.sales);

  const total = values.reduce((sum, value) => sum + value, 0);

  return {
    slices: raw.map((item) => ({
      ...item,
      hasData: item.sales !== null,
      share:
        item.sales !== null && total > 0
          ? (item.sales / total) * 100
          : null,
    })),
    total,
    hasAnyData: values.length > 0,
  };
}
