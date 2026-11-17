
// segmentGeometry.js
// Visual dimensions and styling for the Sales by Segment donut chart.

import { DIM_OPACITY } from './categoryGeometry.js';

export const SEGMENT_BOX = {
  height: 267,
};

// Donut dimensions (in pixels).
// Retain DONUT_GEOMETRY for compatibility with SalesBySegmentChart.jsx.
export const DONUT_GEOMETRY = {
  outerRadius: 90,
  innerRadius: 62,
  paddingAngle: 5,
  cornerRadius: 0,
};

// Geometry used by SegmentDonutChart.jsx.
export const DONUT = {
  outerRadius: DONUT_GEOMETRY.outerRadius,
  innerRadius: DONUT_GEOMETRY.innerRadius,
  gap: DONUT_GEOMETRY.paddingAngle,
  centerXOffset: 9.16,
  centerY: 131.88,
  startAngle: 0,
  endAngle: 360,
};

// Leader-line and label positioning.
export const DONUT_LABEL = {
  minY: 10,
  maxY: 257,
  startOffset: 3.8,
  endOffset: 30.4,
  textGap: 4,
  baselineDrop: 4.3,
  fontSize: 14,
};

// Segment colours follow the approved dashboard palette.
export const SEGMENT_COLORS = {
  Consumer: '#3B82F6',
  Corporate: '#8B5CF6',
  'Home Office': '#10B981',
};

export const SEGMENT_LABEL_COLORS = {
  Consumer: '#2563EB',
  Corporate: '#9333EA',
  'Home Office': '#16A34A',
};

export { DIM_OPACITY };
