// Customer Top 10 chart geometry.
// Independent of the other Customer Analysis chart geometry files.
// Chart card: 660 × 324.
// Chart box: 660 × 267.

export const CUSTOMER_TOP10_BOX = {
  height: 267,
};

export const CUSTOMER_TOP10_PLOT = {
  left: 155,
  rightMargin: 48,
  top: 12,
  height: 219,
};

export const CUSTOMER_TOP10_X_AXIS_HEIGHT =
  CUSTOMER_TOP10_BOX.height -
  CUSTOMER_TOP10_PLOT.top -
  CUSTOMER_TOP10_PLOT.height;

export const CUSTOMER_TOP10_BAR_SIZE = 13;

export const CUSTOMER_TOP10_COLORS = {
  positive: '#10B981',
  negative: '#EF4444',
};

export const CUSTOMER_TOP10_DIM_OPACITY = 0.35;

export const CUSTOMER_TOP10_GRID_COLOR = '#E3E3E8';
export const CUSTOMER_TOP10_AXIS_COLOR = '#000000';

export const CUSTOMER_TOP10_TEXT = {
  font: '500 12px var(--font-inter)',
  fill: '#000000',
};

export const CUSTOMER_TOP10_VALUE_LABEL = {
  fontSize: 11,
  fontWeight: 600,
  fill: '#000000',
  offset: 6,
};