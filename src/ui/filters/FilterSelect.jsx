import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from '../assets/figmaIcons.jsx';
import styles from './FilterSelect.module.css';

// Per-position offsets from the Figma (pixels, measured from the filter bar / the dropdown box).
// Figma's three dropdowns differ slightly, and those differences are reproduced on purpose.
const SLOT_OFFSETS = {
  first: { iconLeft: 5, iconTop: 8, labelLeft: 35.07, labelTop: 8.54, valueLeft: 22.43, chevronRight: 6.48 },
  middle: { iconLeft: 0, iconTop: 8, labelLeft: 30.07, labelTop: 10.54, valueLeft: 11.02, chevronRight: 11 },
  last: { iconLeft: 0, iconTop: 12, labelLeft: 29.57, labelTop: 15.52, valueLeft: 11.02, chevronRight: 6 },
};

/**
 * A dropdown that looks exactly like the Figma one and works like a standard select:
 * mouse, keyboard (Arrow keys, Home, End, Enter, Space, Escape, Tab) and screen readers.
 *
 * props: label, Icon, slot ('first' | 'middle' | 'last'), left, width (Figma px),
 *        options [{ value, label }], value, onChange(value)
 */
export default function FilterSelect({ label, Icon, slot, left, width, options, value, onChange }) {
  const offsets = SLOT_OFFSETS[slot];
  const baseId = useId();
  const labelId = `${baseId}-label`;
  const listId = `${baseId}-list`;
  const rootRef = useRef(null);

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  // Close when the user clicks anywhere outside this dropdown.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  // Keep the highlighted option visible while moving with the arrow keys.
  useEffect(() => {
    if (open) document.getElementById(`${baseId}-opt-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex, baseId]);

  const openList = () => {
    setActiveIndex(selectedIndex);
    setOpen(true);
  };

  const choose = (index) => {
    onChange(options[index].value);
    setOpen(false);
  };

  const onKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) openList();
        else setActiveIndex((i) => Math.min(options.length - 1, i + 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!open) openList();
        else setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        if (open) {
          event.preventDefault();
          setActiveIndex(0);
        }
        break;
      case 'End':
        if (open) {
          event.preventDefault();
          setActiveIndex(options.length - 1);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (open) choose(activeIndex);
        else openList();
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          event.stopPropagation(); // closing the list must not also clear chart selections
          setOpen(false);
        }
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        break;
    }
  };

  const style = {
    left,
    width,
    '--icon-left': `${offsets.iconLeft}px`,
    '--icon-top': `${offsets.iconTop}px`,
    '--label-left': `${offsets.labelLeft}px`,
    '--label-top': `${offsets.labelTop}px`,
    '--value-left': `${offsets.valueLeft}px`,
    '--chevron-right': `${offsets.chevronRight}px`,
  };

  return (
    <div className={styles.field} style={style} ref={rootRef}>
      <Icon className={styles.icon} />
      <span id={labelId} className={styles.label}>
        {label}
      </span>

      <button
        type="button"
        className={styles.box}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${labelId} ${baseId}-value`}
        aria-activedescendant={open ? `${baseId}-opt-${activeIndex}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span id={`${baseId}-value`} className={styles.value}>
          {options[selectedIndex].label}
        </span>
        <ChevronDown className={styles.chevron} />
      </button>

      {open && (
        <ul id={listId} role="listbox" aria-labelledby={labelId} className={styles.list} tabIndex={-1}>
          {options.map((option, index) => (
            <li
              key={String(option.value)}
              id={`${baseId}-opt-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              className={[
                styles.option,
                index === activeIndex ? styles.optionActive : '',
                index === selectedIndex ? styles.optionSelected : '',
              ].join(' ')}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()} // keep focus on the button
              onClick={() => choose(index)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
