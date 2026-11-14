// regionalGeometry.js
// Geometry of the Regional Performance chart. It sits in the bottom-left card and uses the same plot
// area, gridlines, axis labels and bar styling as the approved Figma Product Revenue chart
// (see categoryGeometry.js). Only the grouped-bar sizes and the colours below are specific to it.

export {
  CATEGORY_BOX as REGIONAL_BOX,
  CATEGORY_PLOT as REGIONAL_PLOT,
  CATEGORY_X_AXIS_HEIGHT as REGIONAL_X_AXIS_HEIGHT,
  CATEGORY_Y_LABEL as REGIONAL_Y_LABEL,
  CATEGORY_X_LABEL as REGIONAL_X_LABEL,
  CATEGORY_GRID_COLOR,
  AXIS_COLOR,
  DIM_OPACITY,
} from './categoryGeometry.js';

// Two bars per region. Figma's single bar is 68px wide; a pair of 36px bars with a 4px gap is a
// 76px group, which keeps the same visual weight in each of the four columns.
export const BAR_WIDTH = 36;
export const BAR_GAP = 4;

export const MEASURE_COLORS = {
  sales: '#3B82F6',
  profit: '#10B981',
};
export const MEASURE_LABELS = { sales: 'Sales', profit: 'Profit' };
