
import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  formatCurrency,
  formatInteger,
  formatPercent,
} from '../../core/index.js';

import { DIM_OPACITY } from '../charts/categoryGeometry.js';

import styles from './DiscountImpactHeatmapChart.module.css';

const EMPTY_COLOR = '#D1D5DB';
const NEUTRAL_COLOR = '#FEF3C7';

const NEGATIVE_COLOR = [239, 68, 68];
const POSITIVE_COLOR = [16, 185, 129];
const NEUTRAL_RGB = [254, 243, 199];

const NEGATIVE_MARGIN_LIMIT = 75;
const POSITIVE_MARGIN_LIMIT = 40;

function interpolateColor(start, end, amount) {
  const t = Math.max(0, Math.min(1, amount));

  const rgb = start.map((value, index) =>
    Math.round(value + (end[index] - value) * t),
  );

  return `rgb(${rgb.join(', ')})`;
}

function getCellColor(margin) {
  if (margin == null || !Number.isFinite(margin)) {
    return EMPTY_COLOR;
  }

  if (margin === 0) {
    return NEUTRAL_COLOR;
  }

  const limit =
    margin < 0
      ? NEGATIVE_MARGIN_LIMIT
      : POSITIVE_MARGIN_LIMIT;

  const intensity = Math.min(
    Math.abs(margin) / limit,
    1,
  );

  return interpolateColor(
    NEUTRAL_RGB,
    margin < 0 ? NEGATIVE_COLOR : POSITIVE_COLOR,
    intensity,
  );
}

function HeatmapTooltip({ cell, subCategory, category }) {
  if (!cell) return null;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{subCategory}</p>

      <p className={styles.tooltipCategory}>{category}</p>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Discount</span>
        <span className={styles.tooltipValue}>
          {formatPercent(cell.discount * 100, 0)}
        </span>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Profit Margin</span>
        <span className={styles.tooltipValue}>
          {formatPercent(cell.margin)}
        </span>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Sales</span>
        <span className={styles.tooltipValue}>
          {formatCurrency(cell.sales)}
        </span>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Profit</span>
        <span
          className={styles.tooltipValue}
          data-negative={cell.profit < 0}
        >
          {formatCurrency(cell.profit)}
        </span>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Transactions</span>
        <span className={styles.tooltipValue}>
          {formatInteger(cell.transactionCount)}
        </span>
      </div>
    </div>
  );
}

export default function DiscountImpactHeatmapChart({
  data,
  selectedCategory,
}) {
  const tooltipRef = useRef(null);

  const [hoveredCell, setHoveredCell] = useState(null);

  const [cursorPosition, setCursorPosition] = useState({
    x: 8,
    y: 8,
  });

  const [tooltipPosition, setTooltipPosition] = useState({
    x: 8,
    y: 8,
  });

  // Measure and position the tooltip after React renders its content.
  useLayoutEffect(() => {
    if (!hoveredCell) return;

    const tooltip = tooltipRef.current;

    if (!tooltip) return;

    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;

    const gap = 10;
    const padding = 8;

    let x = cursorPosition.x + gap;
    let y = cursorPosition.y + gap;

    // Move left when approaching the right edge.
    if (x + tooltipWidth > window.innerWidth - padding) {
      x = cursorPosition.x - tooltipWidth - gap;
    }

    // Move above when approaching the bottom edge.
    if (y + tooltipHeight > window.innerHeight - padding) {
      y = cursorPosition.y - tooltipHeight - gap;
    }

    // Keep the tooltip inside the browser viewport.
    const maxX = Math.max(
      padding,
      window.innerWidth - tooltipWidth - padding,
    );

    const maxY = Math.max(
      padding,
      window.innerHeight - tooltipHeight - padding,
    );

    x = Math.max(padding, Math.min(x, maxX));
    y = Math.max(padding, Math.min(y, maxY));

    setTooltipPosition({ x, y });
  }, [hoveredCell, cursorPosition]);

  if (!data || !data.groups?.length) {
    return (
      <div className={styles.empty}>
        No data for this selection
      </div>
    );
  }

  function handleTooltipPointerMove(event) {
    if (!hoveredCell) return;

    setCursorPosition({
      x: event.clientX,
      y: event.clientY,
    });
  }

  function handleCellMouseEnter(event, row, cell) {
    setHoveredCell({
      subCategory: row.subCategory,
      discount: cell.discount,
    });

    setCursorPosition({
      x: event.clientX,
      y: event.clientY,
    });
  }

  const tooltipGroup = hoveredCell
    ? data.groups.find((group) =>
        group.rows.some(
          (row) => row.subCategory === hoveredCell.subCategory,
        ),
      )
    : null;

  const tooltipRow = tooltipGroup?.rows.find(
    (row) => row.subCategory === hoveredCell?.subCategory,
  );

  const tooltipData = tooltipRow?.cells.find(
    (cell) => cell.discount === hoveredCell?.discount,
  );

  const summary = `Discount impact heatmap with ${data.groups.reduce(
    (total, group) => total + group.rows.length,
    0,
  )} sub-categories and ${data.discounts.length} discount levels.`;

  return (
    <div
      className={styles.wrap}
      role="group"
      aria-label={summary}
      onMouseMove={handleTooltipPointerMove}
      onMouseLeave={() => setHoveredCell(null)}
    >
      <div className={styles.heatmap}>
        <div className={styles.header}>
          <div className={styles.rowLabelHeader}>
            Sub-category
          </div>

          {data.discounts.map((discount) => (
            <div
              key={discount}
              className={styles.discountLabel}
            >
              {formatPercent(discount * 100, 0)}
            </div>
          ))}
        </div>

        {data.groups.map((group) => {
          const isMuted =
            selectedCategory != null &&
            selectedCategory !== group.category;

          return (
            <div
              key={group.category}
              className={styles.categoryGroup}
              style={{
                opacity: isMuted ? DIM_OPACITY : 1,
              }}
            >
              <div className={styles.groupLabel}>
                {group.category}
              </div>

              {group.rows.map((row) => (
                <div
                  key={row.subCategory}
                  className={styles.heatmapRow}
                >
                  <div className={styles.subCategoryLabel}>
                    {row.subCategory}
                  </div>

                  {row.cells.map((cell) => {
                    const hasMargin =
                      cell.hasData &&
                      Number.isFinite(cell.margin);

                    const isHovered =
                      hoveredCell?.subCategory === row.subCategory &&
                      hoveredCell?.discount === cell.discount;

                    return (
                      <div
                        key={`${row.subCategory}-${cell.discount}`}
                        className={styles.cell}
                        style={{
                          backgroundColor: cell.hasData
                            ? getCellColor(cell.margin)
                            : EMPTY_COLOR,
                        }}
                        data-empty={!cell.hasData}
                        data-hovered={isHovered}
                        aria-label={
                          `${row.subCategory}, ` +
                          `${formatPercent(cell.discount * 100, 0)} discount, ` +
                          `${hasMargin
                            ? formatPercent(cell.margin)
                            : 'No margin data'}`
                        }
                        onMouseEnter={(event) => {
                          handleCellMouseEnter(event, row, cell);
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ backgroundColor: '#EF4444' }}
          />
          Negative
        </span>

        <span className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ backgroundColor: NEUTRAL_COLOR }}
          />
          Near zero
        </span>

        <span className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ backgroundColor: '#10B981' }}
          />
          Positive
        </span>

        <span className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ backgroundColor: EMPTY_COLOR }}
          />
          No data
        </span>
      </div>

      {tooltipData &&
        hoveredCell &&
        createPortal(
          <div
            ref={tooltipRef}
            className={styles.tooltipPosition}
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
            }}
          >
            <HeatmapTooltip
              cell={tooltipData}
              subCategory={hoveredCell.subCategory}
              category={tooltipGroup.category}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
