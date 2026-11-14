import { useMemo, useReducer } from 'react';
import { filterReducer, getEffectiveFilters, initialFilterState } from '../core/index.js';

// React wrapper around the pure filter state machine in core/filters.js.
// Returns { state, dispatch, effective } where `effective` is what the data code should apply.
export function useFilterState() {
  const [state, dispatch] = useReducer(filterReducer, undefined, initialFilterState);
  const effective = useMemo(() => getEffectiveFilters(state), [state]);
  return { state, dispatch, effective };
}
