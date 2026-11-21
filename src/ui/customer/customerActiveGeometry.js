
import {
  REGIONAL_BOX as CUSTOMER_ACTIVE_BOX,
  REGIONAL_PLOT as CUSTOMER_ACTIVE_PLOT,
  REGIONAL_X_AXIS_HEIGHT as CUSTOMER_ACTIVE_X_AXIS_HEIGHT,
  REGIONAL_X_LABEL as CUSTOMER_ACTIVE_X_LABEL,
  REGIONAL_Y_LABEL as CUSTOMER_ACTIVE_Y_LABEL,
  CATEGORY_GRID_COLOR,
  AXIS_COLOR,
  DIM_OPACITY,
} from '../charts/regionalGeometry.js';

export {
  CUSTOMER_ACTIVE_BOX,
  CUSTOMER_ACTIVE_PLOT,
  CUSTOMER_ACTIVE_X_AXIS_HEIGHT,
  CUSTOMER_ACTIVE_X_LABEL,
  CUSTOMER_ACTIVE_Y_LABEL,
  CATEGORY_GRID_COLOR,
  AXIS_COLOR,
  DIM_OPACITY,
};

// One column per year, with two stacked customer groups.
export const BAR_WIDTH = 56;

export const CUSTOMER_COLORS = {
  returning: '#3B82F6',
  newOrReactivated: '#14B8A6',
};

export const CUSTOMER_LABELS = {
  returning: 'Returning Customers',
  newOrReactivated: 'New / Reactivated Customers',
};
