
// Customer Concentration chart geometry.
// Uses the approved 660 × 324 chart-card dimensions
// and the same plot proportions as the existing Figma charts.

export const CUSTOMER_CONCENTRATION_BOX = {
  height: 267,
};

export const CUSTOMER_CONCENTRATION_PLOT = {
  left: 66.74,
  rightMargin: 30.9,
  top: 12.24,
  height: 219.61,
};

export const CUSTOMER_CONCENTRATION_X_AXIS_HEIGHT =
  CUSTOMER_CONCENTRATION_BOX.height -
  CUSTOMER_CONCENTRATION_PLOT.top -
  CUSTOMER_CONCENTRATION_PLOT.height;

export const CUSTOMER_CONCENTRATION_Y_LABEL = {
  anchorX: 55.65,
  baselineOffset: 5.14,
};

export const CUSTOMER_CONCENTRATION_X_LABEL = {
  baselineOffset: 22.83,
};

export const CUSTOMER_CONCENTRATION_COLORS = {
  sales: '#3B82F6',
  profit: '#10B981',
};

export const CUSTOMER_CONCENTRATION_LABELS = {
  sales: 'Sales',
  profit: 'Profit',
};

export const CUSTOMER_CONCENTRATION_GRID_COLOR = '#E3E3E8';
export const CUSTOMER_CONCENTRATION_AXIS_COLOR = '#000000';
export const CUSTOMER_CONCENTRATION_DIM_OPACITY = 0.35;
