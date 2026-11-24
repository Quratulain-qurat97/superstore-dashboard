
import { useMemo, useRef, useState } from 'react';

import {
  US_STATES,
  US_MAP_VIEWBOX,
} from '../../data/usStates.js';

import styles from './USStateProfitabilityMap.module.css';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value) {
  return currencyFormatter.format(value ?? 0);
}

function formatPercent(value) {
  return value == null ? 'N/A' : `${percentFormatter.format(value)}%`;
}

// Classify states according to their profit margin.
function getProfitability(margin) {
  if (margin == null || !Number.isFinite(margin)) {
    return 'no-data';
  }

  if (margin >= 10) return 'strong-profit';
  if (margin >= 0) return 'low-profit';
  if (margin > -10) return 'mild-loss';

  return 'severe-loss';
}

export default function USStateProfitabilityMap({
  states = [],
  selectedRegion = null,
  selectedState = null,
  onStateSelect,
}) {
  const [hoveredState, setHoveredState] = useState(null);

  const [tooltipPosition, setTooltipPosition] = useState({
    x: 0,
    y: 0,
  });

  const tooltipRef = useRef(null);

  // Convert aggregated state records into a quick lookup.
  const stateDataMap = useMemo(() => {
    return new Map(
      states.map((item) => [item.state, item]),
    );
  }, [states]);

  // Update tooltip position as the cursor moves over the map.
  function handlePointerMove(event) {
    const container = event.currentTarget.closest(
      `.${styles.mapContainer}`,
    );

    if (!container) return;

    const bounds = container.getBoundingClientRect();

    // Account for the ScaleToFit transformation.
    const scaleX = bounds.width / container.offsetWidth;
    const scaleY = bounds.height / container.offsetHeight;

    // Convert screen coordinates into container coordinates.
    const pointerX =
      (event.clientX - bounds.left) / scaleX;

    const pointerY =
      (event.clientY - bounds.top) / scaleY;

    const tooltip = tooltipRef.current;

    const tooltipWidth = tooltip?.offsetWidth ?? 210;
    const tooltipHeight = tooltip?.offsetHeight ?? 125;

    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    const GAP = 3;
    const EDGE = 8;

    let x = pointerX + GAP;
    let y = pointerY + GAP;

    // Move left if there is insufficient horizontal space.
    if (x + tooltipWidth > containerWidth - EDGE) {
      x = pointerX - tooltipWidth - GAP;
    }

    // Move above if there is insufficient vertical space.
    if (y + tooltipHeight > containerHeight - EDGE) {
      y = pointerY - tooltipHeight - GAP;
    }

    // Keep the tooltip inside the map container.
    x = Math.max(
      EDGE,
      Math.min(x, containerWidth - tooltipWidth - EDGE),
    );

    y = Math.max(
      EDGE,
      Math.min(y, containerHeight - tooltipHeight - EDGE),
    );

    setTooltipPosition({ x, y });
  }

  function handleStateClick(stateName, region) {
    if (onStateSelect) {
      onStateSelect(stateName, region);
    }
  }

  function handleKeyDown(event, stateName, region) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleStateClick(stateName, region);
    }
  }

  const hoveredData = hoveredState
    ? stateDataMap.get(hoveredState)
    : null;

  return (
    <div className={styles.mapContainer}>
      <svg
        className={styles.map}
        viewBox={US_MAP_VIEWBOX}
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label="United States state profitability map"
        onMouseMove={handlePointerMove}
      >
        {US_STATES.map((location) => {
          const item = stateDataMap.get(location.name);

          const profitability = getProfitability(item?.margin);

          const isSelected = selectedState === location.name;

          const isInSelectedRegion =
            !selectedRegion || item?.region === selectedRegion;

          // Individual state selection takes priority.
          // Dim every other state, including states in the same region.
          const isDimmed = selectedState
            ? !isSelected
            : selectedRegion && !isInSelectedRegion;

          return (
            <path
              key={location.id}
              d={location.path}
              className={[
                styles.state,
                styles[profitability],
                isSelected ? styles.selected : '',
                isDimmed ? styles.dimmed : '',
                hoveredState === location.name
                  ? styles.hovered
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onMouseEnter={() => setHoveredState(location.name)}
              onMouseLeave={() => setHoveredState(null)}
              onFocus={() => setHoveredState(location.name)}
              onBlur={() => setHoveredState(null)}
              onClick={() =>
                item && handleStateClick(location.name, item.region)
              }
              onKeyDown={(event) =>
                item && handleKeyDown(event, location.name, item.region)
              }
              tabIndex={item ? 0 : -1}
              role={item ? 'button' : undefined}
              aria-label={
                item
                  ? `${location.name}, ${item.region}, ${formatCurrency(item.profit)} profit`
                  : `${location.name}, no matching data`
              }
            />
          );
        })}
      </svg>

      {hoveredState && (
  <div
    ref={tooltipRef}
    className={styles.tooltip}
    style={{
      left: tooltipPosition.x,
      top: tooltipPosition.y,
    }}
  >
    <p className={styles.tooltipTitle}>
      {hoveredState}
    </p>

    {hoveredData ? (
      <>
        <div className={styles.tooltipRow}>
          <span className={styles.tooltipLabel}>Region</span>
          <span className={styles.tooltipValue}>
            {hoveredData.region}
          </span>
        </div>

        <div className={styles.tooltipRow}>
          <span className={styles.tooltipLabel}>Sales</span>
          <span className={styles.tooltipValue}>
            {formatCurrency(hoveredData.sales)}
          </span>
        </div>

        <div className={styles.tooltipRow}>
          <span className={styles.tooltipLabel}>Profit</span>
          <span
            className={`${styles.tooltipValue} ${
              hoveredData.profit < 0
                ? styles.negativeValue
                : styles.positiveValue
            }`}
          >
            {formatCurrency(hoveredData.profit)}
          </span>
        </div>

        <div className={styles.tooltipRow}>
          <span className={styles.tooltipLabel}>Profit Margin</span>
          <span className={styles.tooltipValue}>
            {formatPercent(hoveredData.margin)}
          </span>
        </div>
      </>
    ) : (
      <div className={styles.noDataMessage}>
        No matching data for current filters
      </div>
    )}
  </div>
)}
    </div>
  );
}
