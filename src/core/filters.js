// filters.js
// The filter state machine for the Home page. Pure functions, easy to test.
//
// There are two ways to filter, and they stay in sync:
//   * the four dropdowns (region, category, segment, year)
//   * clicking a chart element (region, category, segment, or a month)
//
// Rules (agreed with the project owner):
//   1. Clicking a chart element sets the matching dropdown to that value, so the screen
//      never shows two conflicting filters. The dropdown's previous value is remembered.
//   2. Clicking the selected element again, pressing Escape, or clicking empty chart space
//      restores the remembered dropdown value (not necessarily "All").
//   3. Manually changing a dropdown replaces any chart selection for that dimension.
//   4. A month selection has no dropdown. It is stored separately and is cleared when the
//      Year dropdown changes to a year that does not contain it.
//   5. Each breakdown chart HIGHLIGHTS its own dimension and filters by the others,
//      so comparisons stay visible. Year filters every chart.

import { ALL, DIMENSION_VALUES, SELECTABLE_DIMENSIONS } from './constants.js';

export const ACTIONS = {
  SET_DROPDOWN: 'SET_DROPDOWN',
  SELECT_ITEM: 'SELECT_ITEM',
  CLEAR_SELECTION: 'CLEAR_SELECTION',
  SELECT_MONTH: 'SELECT_MONTH',
  CLEAR_MONTH: 'CLEAR_MONTH',
  CLEAR_ALL_SELECTIONS: 'CLEAR_ALL_SELECTIONS',
};

export const initialFilterState = () => ({
  dropdowns: { region: ALL, category: ALL, segment: ALL, year: ALL },
  // When a chart click is active for a dimension: { restoreTo: <previous dropdown value> }
  selections: { region: null, category: null, segment: null },
  month: null, // 'YYYY-MM' or null
});

const isValidValue = (dimension, value) =>
  value === ALL || (DIMENSION_VALUES[dimension] ?? []).includes(value);

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

function withDropdown(state, dimension, value, selection) {
  return {
    ...state,
    dropdowns: { ...state.dropdowns, [dimension]: value },
    selections: { ...state.selections, [dimension]: selection },
  };
}

export function filterReducer(state, action) {
  switch (action.type) {
    // The user picked a value in a dropdown.
    case ACTIONS.SET_DROPDOWN: {
      const { dimension, value } = action;
      if (!(dimension in state.dropdowns) || !isValidValue(dimension, value)) return state;
      const next =
        dimension === 'year'
          ? { ...state, dropdowns: { ...state.dropdowns, year: value } }
          : withDropdown(state, dimension, value, null); // manual change replaces any chart selection
      // A month that is outside the newly chosen year can no longer be selected.
      if (dimension === 'year' && next.month && value !== ALL && !next.month.startsWith(String(value))) {
        return { ...next, month: null };
      }
      return next;
    }

    // The user clicked a region / category / segment element in a chart.
    case ACTIONS.SELECT_ITEM: {
      const { dimension, value } = action;
      if (!SELECTABLE_DIMENSIONS.includes(dimension) || !isValidValue(dimension, value) || value === ALL) {
        return state;
      }
      const current = state.dropdowns[dimension];
      const selection = state.selections[dimension];

      // Clicking the item that is already effective = deselect it.
      if (current === value) {
        return withDropdown(state, dimension, selection ? selection.restoreTo : ALL, null);
      }
      const restoreTo = selection ? selection.restoreTo : current;
      // Clicking back to the value the dropdown had before is the same as clearing.
      if (value === restoreTo) return withDropdown(state, dimension, value, null);
      return withDropdown(state, dimension, value, { restoreTo });
    }

    // Escape / click on empty chart space for one dimension.
    case ACTIONS.CLEAR_SELECTION: {
      const { dimension } = action;
      const selection = state.selections[dimension];
      if (!selection) return state;
      return withDropdown(state, dimension, selection.restoreTo, null);
    }

    // The user clicked a month in the trend chart.
    case ACTIONS.SELECT_MONTH: {
      const { month } = action;
      if (!MONTH_PATTERN.test(month)) return state;
      const year = state.dropdowns.year;
      if (year !== ALL && !month.startsWith(String(year))) return state; // outside the Year filter
      return { ...state, month: state.month === month ? null : month };
    }

    case ACTIONS.CLEAR_MONTH:
      return state.month ? { ...state, month: null } : state;

    // Escape: clear every chart selection (dropdowns go back to their remembered values).
    case ACTIONS.CLEAR_ALL_SELECTIONS: {
      let next = state;
      for (const dimension of SELECTABLE_DIMENSIONS) {
        next = filterReducer(next, { type: ACTIONS.CLEAR_SELECTION, dimension });
      }
      return next.month ? { ...next, month: null } : next;
    }

    default:
      return state;
  }
}

/** Does any chart selection (not a plain dropdown choice) exist right now? */
export const hasActiveSelections = (state) =>
  Boolean(state.month) || SELECTABLE_DIMENSIONS.some((d) => state.selections[d]);

/** The filter values that actually apply: dropdown + chart selections combined. null = "All". */
export function getEffectiveFilters(state) {
  const orNull = (value) => (value === ALL ? null : value);
  return {
    region: orNull(state.dropdowns.region),
    category: orNull(state.dropdowns.category),
    segment: orNull(state.dropdowns.segment),
    year: orNull(state.dropdowns.year),
    month: state.month ?? null,
  };
}

// Which filters each visual applies. The rest are ignored (highlight, don't filter).
export const VISUAL_FILTER_KEYS = {
  kpis: ['region', 'category', 'segment', 'year', 'month'],
  monthlyTrend: ['region', 'category', 'segment', 'year'], // month is highlighted, not applied
  categories: ['region', 'segment', 'year', 'month'],
  regions: ['category', 'segment', 'year', 'month'],
  segments: ['region', 'category', 'year', 'month'],
};

/** Reduce the effective filters to just the ones a given visual should apply. */
export function filtersForVisual(visual, effective) {
  const keys = VISUAL_FILTER_KEYS[visual];
  if (!keys) throw new Error(`Unknown visual: ${visual}`);
  return {
    region: keys.includes('region') ? effective.region : null,
    category: keys.includes('category') ? effective.category : null,
    segment: keys.includes('segment') ? effective.segment : null,
    year: keys.includes('year') ? effective.year : null,
    month: keys.includes('month') ? effective.month : null,
  };
}
