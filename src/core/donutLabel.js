// donutLabel.js
// Where a donut slice's leader line and label go. Pure geometry.
//
// Angles follow Recharts: degrees, 0 = 3 o'clock; the donut runs clockwise from 3 o'clock, so a slice's
// mid-angle is negative (e.g. -45 points to the lower right).

const RAD = Math.PI / 180;

/**
 * @param {{ cx:number, cy:number, midAngle:number, outerRadius:number, minY:number, maxY:number,
 *           startOffset?:number, endOffset?:number, textGap?:number }} g
 *   The leader starts `startOffset` outside the ring and ends `endOffset` outside it (Figma: 3.8 and 30.4).
 *   If that would push the end point above `minY` or below `maxY` (the chart's top and bottom), the leader
 *   is shortened so the label stays inside the chart.
 * @returns {{ start:{x:number,y:number}, end:{x:number,y:number}, textX:number, anchor:'start'|'end' }}
 *   The label text sits `textGap` beyond the end point, on the side facing away from the donut.
 */
export function donutLabelPoints({ cx, cy, midAngle, outerRadius, minY, maxY, startOffset = 3.8, endOffset = 30.4, textGap = 4 }) {
  const dx = Math.cos(-midAngle * RAD);
  const dy = Math.sin(-midAngle * RAD);
  let endRadius = outerRadius + endOffset;
  if (dy > 1e-9) endRadius = Math.min(endRadius, (maxY - cy) / dy);
  if (dy < -1e-9) endRadius = Math.min(endRadius, (cy - minY) / -dy);
  endRadius = Math.max(endRadius, outerRadius + startOffset + 6); // never shorter than a visible stub
  const startRadius = outerRadius + startOffset;
  const end = { x: cx + endRadius * dx, y: cy + endRadius * dy };
  const rightSide = end.x >= cx;
  return {
    start: { x: cx + startRadius * dx, y: cy + startRadius * dy },
    end,
    textX: end.x + (rightSide ? textGap : -textGap),
    anchor: rightSide ? 'start' : 'end',
  };
}
