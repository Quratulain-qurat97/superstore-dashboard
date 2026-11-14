// trendGeometry.js
// Exact Figma geometry of the Sales Trend chart (from Desktop - 1.svg), in pixels.
// Card = 660 x 324. Chart box = 641 x 252 at (5, 57) from the card's outer corner (see cardLayouts.js).
// All plot numbers below are measured from the chart box's top-left corner.

export const CHART_BOX = { height: 252 };

export const PLOT = {
  left: 62.37, // the y axis line (Figma x=158.373)
  rightMargin: 4.8, // plot ends 4.8px before the box's right edge (Figma x=732.202)
  top: 6.3, // top gridline (Figma y=405.3)
  height: 201.6, // down to the x axis line (Figma y=606.9)
};
export const X_AXIS_HEIGHT = CHART_BOX.height - PLOT.top - PLOT.height; // 44.1: room for tick + labels

export const TICK_LENGTH = { x: 7.56, y: 5.76 };

// y labels: Inter Regular 12, right-aligned, baseline 2.25px below the tick. Figma sets its top
// label ("200") 5.29px lower than the others; that quirk is kept for the top tick.
export const Y_LABEL = { anchorX: 51.81, baselineOffset: 2.25, topTickExtraOffset: 5.29 };

// markers: hollow ellipses 5.76 x 7.56 (rx 2.88, ry 3.78), white fill, 2px #2563EB stroke
export const MARKER = { rx: 2.88, ry: 3.78 };
export const MARKER_EMPHASIS = { rx: 3.6, ry: 4.72 }; // selected / hovered (25% larger)

// month labels use the rotated style Figma uses for its Performance Metrics axis:
// rotate(-40.19deg) skewX(9.61deg), set so the end of the label sits just under its tick
export const X_LABEL = { rotate: -40.19, skew: 9.61, dx: 2.4, dy: 6.0 };

export const COLORS = {
  line: '#2563EB',
  grid: '#CCCCCC',
  axis: '#000000',
  gradientTop: '#199BEA', // gradient: solid #199BEA to 60%, then to white @ 50% opacity
  fillOpacity: 0.12,
};

export const DIM_OPACITY = 0.35; // unselected markers while a month is selected
