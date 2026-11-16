
import { ALL, DIMENSION_VALUES, SELECTABLE_DIMENSIONS, CATEGORIES } from './constants.js';

export const ACTIONS = {
  SET_DROPDOWN: 'SET_DROPDOWN',
  SELECT_ITEM: 'SELECT_ITEM',
  SELECT_SUBCATEGORY: 'SELECT_SUBCATEGORY',
  CLEAR_SELECTION: 'CLEAR_SELECTION',
  SELECT_MONTH: 'SELECT_MONTH',
  CLEAR_MONTH: 'CLEAR_MONTH',
  CLEAR_ALL_SELECTIONS: 'CLEAR_ALL_SELECTIONS',
};

export const initialFilterState = () => ({
  dropdowns: { region: ALL, category: ALL, segment: ALL, year: ALL },
  selections: { region: null, category: null, segment: null },
  subCategorySelection: null,
  month: null,
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
    case ACTIONS.SET_DROPDOWN: {
      const { dimension, value } = action;

      if (!(dimension in state.dropdowns) || !isValidValue(dimension, value)) {
        return state;
      }

      let next =
        dimension === 'year'
          ? { ...state, dropdowns: { ...state.dropdowns, year: value } }
          : withDropdown(state, dimension, value, null);

      // A manual Category change replaces any sub-category chart selection.
      if (dimension === 'category') {
        next = { ...next, subCategorySelection: null };
      }

      if (
        dimension === 'year' &&
        next.month &&
        value !== ALL &&
        !next.month.startsWith(String(value))
      ) {
        return { ...next, month: null };
      }

      return next;
    }

    case ACTIONS.SELECT_ITEM: {
      const { dimension, value } = action;

      if (
        !SELECTABLE_DIMENSIONS.includes(dimension) ||
        !isValidValue(dimension, value) ||
        value === ALL
      ) {
        return state;
      }

      // A Category chart selection replaces a sub-category selection.
      const baseState =
        dimension === 'category'
          ? { ...state, subCategorySelection: null }
          : state;

      const current = baseState.dropdowns[dimension];
      const selection = baseState.selections[dimension];

      if (current === value) {
        return withDropdown(
          baseState,
          dimension,
          selection ? selection.restoreTo : ALL,
          null,
        );
      }

      const restoreTo = selection ? selection.restoreTo : current;

      if (value === restoreTo) {
        return withDropdown(baseState, dimension, value, null);
      }

      return withDropdown(baseState, dimension, value, { restoreTo });
    }

    // Clicking an individual sub-category filters by that exact sub-category.
    case ACTIONS.SELECT_SUBCATEGORY: {
      const { category, subCategory } = action;

      if (
        !CATEGORIES.includes(category) ||
        typeof subCategory !== 'string' ||
        !subCategory.trim()
      ) {
        return state;
      }

      const currentSelection = state.subCategorySelection;

      // Clicking the already-selected sub-category clears that selection.
      if (
        currentSelection?.value === subCategory &&
        state.dropdowns.category === category
      ) {
        return {
          ...state,
          dropdowns: {
            ...state.dropdowns,
            category: currentSelection.restoreTo,
          },
          selections: {
            ...state.selections,
            category: currentSelection.previousCategorySelection,
          },
          subCategorySelection: null,
        };
      }

      // Preserve the original category value when switching between sub-categories.
      const restoreTo =
        currentSelection?.restoreTo ??
        state.selections.category?.restoreTo ??
        state.dropdowns.category;

      const previousCategorySelection =
        currentSelection?.previousCategorySelection ??
        state.selections.category ??
        null;

      return {
        ...state,
        dropdowns: {
          ...state.dropdowns,
          category,
        },
        selections: {
          ...state.selections,
          category: { restoreTo },
        },
        subCategorySelection: {
          value: subCategory,
          restoreTo,
          previousCategorySelection,
        },
      };
    }

    case ACTIONS.CLEAR_SELECTION: {
      const { dimension } = action;

      if (dimension === 'category' && state.subCategorySelection) {
        return {
          ...state,
          dropdowns: {
            ...state.dropdowns,
            category: state.subCategorySelection.restoreTo,
          },
          selections: {
            ...state.selections,
            category: null,
          },
          subCategorySelection: null,
        };
      }

      const selection = state.selections[dimension];

      if (!selection) return state;

      return withDropdown(
        state,
        dimension,
        selection.restoreTo,
        null,
      );
    }

   case ACTIONS.SELECT_MONTH: {
  const { month } = action;

  if (typeof month !== 'string' || !MONTH_PATTERN.test(month)) {
    return state;
  }

  return {
    ...state,
    month: state.month === month ? null : month,
  };
}

    case ACTIONS.CLEAR_MONTH:
      return state.month ? { ...state, month: null } : state;

    case ACTIONS.CLEAR_ALL_SELECTIONS: {
      let next = state;

      for (const dimension of SELECTABLE_DIMENSIONS) {
        next = filterReducer(next, {
          type: ACTIONS.CLEAR_SELECTION,
          dimension,
        });
      }

      return next.month ? { ...next, month: null } : next;
    }

    default:
      return state;
  }
}

export const hasActiveSelections = (state) =>
  Boolean(
    state.month ||
    state.subCategorySelection ||
    SELECTABLE_DIMENSIONS.some((dimension) => state.selections[dimension]),
  );

export function getEffectiveFilters(state) {
  const orNull = (value) => (value === ALL ? null : value);

  return {
    region: orNull(state.dropdowns.region),
    category: orNull(state.dropdowns.category),
    segment: orNull(state.dropdowns.segment),
    year: orNull(state.dropdowns.year),
    subCategory: state.subCategorySelection?.value ?? null,
    month: state.month ?? null,
  };
}

export const VISUAL_FILTER_KEYS = {
  kpis: ['region', 'category', 'segment', 'year', 'month', 'subCategory'],
  monthlyTrend: ['region', 'category', 'segment', 'year', 'subCategory'],
  categories: ['region', 'segment', 'year', 'month'],
  regions: ['category', 'segment', 'year', 'month', 'subCategory'],
  segments: ['region', 'category', 'year', 'month'],
};

export function filtersForVisual(visual, effective) {
  const keys = VISUAL_FILTER_KEYS[visual];

  if (!keys) throw new Error(`Unknown visual: ${visual}`);

  return {
    region: keys.includes('region') ? effective.region : null,
    category: keys.includes('category') ? effective.category : null,
    segment: keys.includes('segment') ? effective.segment : null,
    year: keys.includes('year') ? effective.year : null,
    month: keys.includes('month') ? effective.month : null,
    subCategory: keys.includes('subCategory') ? effective.subCategory : null,
  };
}
