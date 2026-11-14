import { Users } from 'lucide-react';
import { ALL, CATEGORIES, REGIONS, SEGMENTS, YEARS, ACTIONS } from '../../core/index.js';
import { FilterIconBox, FilterIconMapPin, FilterIconCalendarDays } from '../assets/figmaIcons.jsx';
import FilterSelect from './FilterSelect.jsx';
import styles from './FilterBar.module.css';

// Segment has no icon in the Figma, so it uses Lucide's "users" drawn like the other filter icons
// (24px box, 2px stroke, the same muted grey).
const SegmentIcon = (props) => <Users size={24} strokeWidth={2} color="#8E8E93" aria-hidden="true" {...props} />;

// Four dropdowns across the Figma bar. Figma has three at x = 18 / 486 / 945 (363px wide).
// Four narrower boxes use the same left (18) and right (32px before the bar's end) edges:
// 293px wide with 40px gaps at 1440, and wider in a wider window (see FilterBar.module.css).
const fieldLeft = (index) => `calc(18px + ${index} * (var(--field-w) + 40px))`;

// Figma's three dropdowns are not identical (label, icon and chevron offsets differ slightly),
// and those differences are kept by position: the first uses Figma's first dropdown, the last
// uses Figma's third, and the two in between use Figma's second.
const SLOTS = ['first', 'middle', 'middle', 'last'];

const FILTERS = [
  { dimension: 'region', label: 'Region', allLabel: 'All Regions', values: REGIONS, Icon: FilterIconMapPin },
  { dimension: 'category', label: 'Category', allLabel: 'All Categories', values: CATEGORIES, Icon: FilterIconBox },
  { dimension: 'segment', label: 'Segment', allLabel: 'All Segments', values: SEGMENTS, Icon: SegmentIcon },
  { dimension: 'year', label: 'Year', allLabel: 'All Years', values: YEARS, Icon: FilterIconCalendarDays },
];

export default function FilterBar({ state, dispatch }) {
  return (
    <section className={styles.bar} aria-label="Filters">
      {FILTERS.map((filter, index) => (
        <FilterSelect
          key={filter.dimension}
          label={filter.label}
          Icon={filter.Icon}
          slot={SLOTS[index]}
          left={fieldLeft(index)}
          width="var(--field-w)"
          value={state.dropdowns[filter.dimension]}
          options={[
            { value: ALL, label: filter.allLabel },
            ...filter.values.map((value) => ({ value, label: String(value) })),
          ]}
          onChange={(value) => dispatch({ type: ACTIONS.SET_DROPDOWN, dimension: filter.dimension, value })}
        />
      ))}
    </section>
  );
}
