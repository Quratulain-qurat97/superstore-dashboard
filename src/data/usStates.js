
import usaMap from '@svg-maps/usa.states-territories';

// Locations not included in the Superstore dataset.
const EXCLUDED_LOCATIONS = new Set([
  'ak', // Alaska
  'hi', // Hawaii
  'as', // American Samoa
  'gu', // Guam
  'mp', // Northern Mariana Islands
  'pr', // Puerto Rico
  'vi', // Virgin Islands
]);

// Match geographic package names to the dataset's state names.
const NAME_OVERRIDES = {
  'Washington, DC': 'District of Columbia',
  SouthDakota: 'South Dakota',
};

// Geographic boundaries for the 49 locations in our dataset.
export const US_STATES = usaMap.locations
  .filter((location) => !EXCLUDED_LOCATIONS.has(location.id))
  .map((location) => ({
    id: location.id,
    name: NAME_OVERRIDES[location.name] ?? location.name,
    path: location.path,
  }));

// Original coordinate system used by the SVG map package.
export const US_MAP_VIEWBOX = usaMap.viewBox;
