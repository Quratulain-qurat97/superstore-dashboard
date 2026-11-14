// The dropdown / chart-selection state machine.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTIONS, ALL, initialFilterState, filterReducer, getEffectiveFilters, filtersForVisual, hasActiveSelections,
} from '../index.js';

const run = (state, ...actions) => actions.reduce((s, a) => filterReducer(s, a), state);
const dropdown = (dimension, value) => ({ type: ACTIONS.SET_DROPDOWN, dimension, value });
const select = (dimension, value) => ({ type: ACTIONS.SELECT_ITEM, dimension, value });
const month = (m) => ({ type: ACTIONS.SELECT_MONTH, month: m });

test('initial state is all "All" with no selections', () => {
  const s = initialFilterState();
  assert.deepEqual(getEffectiveFilters(s), { region: null, category: null, segment: null, year: null, month: null });
  assert.equal(hasActiveSelections(s), false);
});

test('all four dropdowns combine', () => {
  const s = run(initialFilterState(), dropdown('region', 'West'), dropdown('category', 'Technology'), dropdown('segment', 'Corporate'), dropdown('year', 2016));
  assert.deepEqual(getEffectiveFilters(s), { region: 'West', category: 'Technology', segment: 'Corporate', year: 2016, month: null });
});

test('invalid dropdown values are ignored', () => {
  const s = initialFilterState();
  assert.equal(filterReducer(s, dropdown('region', 'Mars')), s);
  assert.equal(filterReducer(s, dropdown('year', 2020)), s);
  assert.equal(filterReducer(s, dropdown('country', 'US')), s);
});

test('chart click syncs the dropdown; clicking again restores the previous value', () => {
  const clicked = run(initialFilterState(), select('region', 'East'));
  assert.equal(clicked.dropdowns.region, 'East');
  assert.equal(hasActiveSelections(clicked), true);
  const cleared = run(clicked, select('region', 'East'));
  assert.equal(cleared.dropdowns.region, ALL);
  assert.equal(hasActiveSelections(cleared), false);
});

test('clearing restores the PREVIOUS dropdown value, not "All"', () => {
  const s = run(initialFilterState(), dropdown('region', 'West'), select('region', 'East'));
  assert.equal(s.dropdowns.region, 'East');
  assert.equal(run(s, { type: ACTIONS.CLEAR_SELECTION, dimension: 'region' }).dropdowns.region, 'West');
  assert.equal(run(s, select('region', 'East')).dropdowns.region, 'West');
});

test('switching to another item keeps the ORIGINAL previous value', () => {
  const s = run(initialFilterState(), dropdown('category', 'Furniture'), select('category', 'Technology'), select('category', 'Office Supplies'));
  assert.equal(s.dropdowns.category, 'Office Supplies');
  assert.equal(run(s, { type: ACTIONS.CLEAR_SELECTION, dimension: 'category' }).dropdowns.category, 'Furniture');
});

test('clicking back to the original value simply clears the selection', () => {
  const s = run(initialFilterState(), dropdown('segment', 'Consumer'), select('segment', 'Corporate'), select('segment', 'Consumer'));
  assert.equal(s.dropdowns.segment, 'Consumer');
  assert.equal(s.selections.segment, null);
});

test('manually changing a dropdown replaces the chart selection', () => {
  const s = run(initialFilterState(), select('region', 'East'), dropdown('region', 'South'));
  assert.equal(s.dropdowns.region, 'South');
  assert.equal(s.selections.region, null);
  assert.equal(run(s, { type: ACTIONS.CLEAR_ALL_SELECTIONS }).dropdowns.region, 'South'); // no restore: it is a normal dropdown choice now
});

test('clicking the highlighted item of a MANUAL dropdown choice deselects it to All', () => {
  const s = run(initialFilterState(), dropdown('region', 'West'), select('region', 'West'));
  assert.equal(s.dropdowns.region, ALL);
});

test('clearing a selection never touches the other dropdowns', () => {
  const s = run(initialFilterState(), dropdown('year', 2015), dropdown('segment', 'Corporate'), select('region', 'East'));
  const cleared = run(s, { type: ACTIONS.CLEAR_SELECTION, dimension: 'region' });
  assert.equal(cleared.dropdowns.year, 2015);
  assert.equal(cleared.dropdowns.segment, 'Corporate');
  assert.equal(cleared.dropdowns.region, ALL);
});

test('Escape (clear all) restores every dimension and the month', () => {
  const s = run(initialFilterState(), dropdown('region', 'West'), dropdown('category', 'Furniture'), select('region', 'East'), select('category', 'Technology'), month('2016-03'));
  const cleared = run(s, { type: ACTIONS.CLEAR_ALL_SELECTIONS });
  assert.deepEqual(getEffectiveFilters(cleared), { region: 'West', category: 'Furniture', segment: null, year: null, month: null });
  assert.equal(hasActiveSelections(cleared), false);
});

test('month: toggles on and off, and is independent of the Year dropdown', () => {
  const on = run(initialFilterState(), month('2016-03'));
  assert.equal(on.month, '2016-03');
  assert.equal(on.dropdowns.year, ALL); // the Year dropdown is never changed by a month click
  assert.equal(run(on, month('2016-03')).month, null);
  assert.equal(run(on, month('2016-04')).month, '2016-04');
});

test('month: ignored when outside the Year filter; cleared when Year moves away from it', () => {
  const s = run(initialFilterState(), dropdown('year', 2015));
  assert.equal(filterReducer(s, month('2016-03')), s);
  const picked = run(s, month('2015-07'));
  assert.equal(picked.month, '2015-07');
  assert.equal(run(picked, dropdown('year', 2016)).month, null);
  assert.equal(run(picked, dropdown('year', 2015)).month, '2015-07');
  assert.equal(run(picked, dropdown('year', ALL)).month, '2015-07');
});

test('month: invalid values are ignored', () => {
  const s = initialFilterState();
  assert.equal(filterReducer(s, month('2016-13')), s);
  assert.equal(filterReducer(s, month('March')), s);
});

test('each visual applies the right filters (own dimension is highlighted, not filtered)', () => {
  const all = { region: 'West', category: 'Furniture', segment: 'Consumer', year: 2016, month: '2016-03' };
  assert.deepEqual(filtersForVisual('kpis', all), all);
  assert.deepEqual(filtersForVisual('monthlyTrend', all), { ...all, month: null });
  assert.deepEqual(filtersForVisual('categories', all), { ...all, category: null });
  assert.deepEqual(filtersForVisual('regions', all), { ...all, region: null });
  assert.deepEqual(filtersForVisual('segments', all), { ...all, segment: null });
  assert.throws(() => filtersForVisual('nope', all));
});
