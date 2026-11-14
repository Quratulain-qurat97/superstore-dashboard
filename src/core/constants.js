// constants.js
// The fixed lists the dashboard filters and charts are built from.
// Plain data only: no React, no browser APIs.

export const ALL = 'All';

// Display order follows the Home page spec (it is also sales-descending in the data).
export const REGIONS = ['West', 'East', 'Central', 'South'];
export const CATEGORIES = ['Furniture', 'Office Supplies', 'Technology'];
export const SEGMENTS = ['Consumer', 'Corporate', 'Home Office'];
export const YEARS = [2014, 2015, 2016, 2017];

// The three dimensions a chart click can select (month is handled separately).
export const SELECTABLE_DIMENSIONS = ['region', 'category', 'segment'];

// Allowed values for each dropdown dimension.
export const DIMENSION_VALUES = {
  region: REGIONS,
  category: CATEGORIES,
  segment: SEGMENTS,
  year: YEARS,
};
