
// segmentGeometry.js
// Visual dimensions and styling for the Sales by Segment donut chart.

import { DIM_OPACITY } from './categoryGeometry.js';

export const SEGMENT_BOX = {
  height: 267,
};

// Donut dimensions (in pixels).
export const DONUT_GEOMETRY = {
  outerRadius: 96,
  innerRadius: 58,
  paddingAngle: 5,
  cornerRadius: 0,
};

// Colors follow the approved dashboard palette.
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
