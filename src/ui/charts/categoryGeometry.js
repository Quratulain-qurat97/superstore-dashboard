// categoryGeometry.js
// Exact Figma geometry of the Product Revenue chart (from Desktop - 1.svg), used for Revenue by Category.
// Card = 660 x 324. Chart box = 660 x 267 at (0, 57) from the card's outer corner.
// All plot numbers are measured from the chart box's top-left corner.

export const CATEGORY_BOX = { height: 267 };

export const CATEGORY_PLOT = {
  left: 66.74, // plot starts here (Figma x=837.74); there is no y axis line in this chart
  rightMargin: 30.9, // plot ends 30.9px before the box's right edge (Figma x=1400.10)
  top: 12.24, // top gridline (Figma y=411.24)
  height: 219.61, // down to the black x axis line (Figma y=630.85)
};
export const CATEGORY_X_AXIS_HEIGHT = CATEGORY_BOX.height - CATEGORY_PLOT.top - CATEGORY_PLOT.height; // 35.15

// y labels: Inter Regular 12.8, right-aligned, baseline 5.14px below its gridline
export const CATEGORY_Y_LABEL = { anchorX: 55.65, baselineOffset: 5.14 };
// x labels: Inter Regular 12.8, centred under the bar, baseline 22.83px below the x axis
export const CATEGORY_X_LABEL = { baselineOffset: 22.83 };

export const BAR_WIDTH = 68; // Figma bar width (67.98) with a 1px white outline

export const CATEGORY_COLORS = {
  Furniture: '#3B82F6',
  'Office Supplies': '#8B5CF6',
  Technology: '#10B981',
};

export const CATEGORY_GRID_COLOR = '#E3E3E8';
export const AXIS_COLOR = '#000000';
export const DIM_OPACITY = 0.35; // unselected bars while a category is selected
