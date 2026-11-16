
import { useRef } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  formatAxisCurrency,
  formatCompactCurrency,
  formatCurrency,
  formatPercent,
} from '../../core/index.js';

import { useElementWidth } from '../hooks/useElementWidth.js';

import {
  AXIS_COLOR,
  BAR_WIDTH,
  CATEGORY_BOX,
  CATEGORY_COLORS,
  CATEGORY_GRID_COLOR,
  CATEGORY_PLOT,
  CATEGORY_X_AXIS_HEIGHT,
  CATEGORY_X_LABEL,
  CATEGORY_Y_LABEL,
  DIM_OPACITY,
} from './categoryGeometry.js';

import styles from './CategoryRevenueChart.module.css';

const DESIGN_WIDTH = 660;
const TEXT_STYLE = {
  font: '600 13.8px var(--font-inter)',
  fill: '#000000',
};

function CategoryTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;

  const bar = payload[0].payload;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{bar.category}</p>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Sales</span>
        <span className={styles.tooltipValue}>
          {formatCurrency(bar.sales)}
        </span>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>
          Share of the three categories
        </span>
        <span className={styles.tooltipValue}>
          {formatPercent(bar.share)}
        </span>
      </div>
    </div>
  );
}

/**
 * The Revenue by Category bar chart (Furniture, Office Supplies, Technology),
 * drawn with Recharts to the exact Figma geometry of the Product Revenue chart.
 *
 * props:
 *   series              from buildCategorySeries()
 *   selectedCategory    the effective Category filter
 *   onSelectCategory    (category) => void
 *   onClearCategory     () => void
 *   fallbackWidth       width to use before the real width is measured
 */
export default function CategoryRevenueChart({
  series,
  selectedCategory,
  onSelectCategory,
  onClearCategory,
  fallbackWidth = DESIGN_WIDTH,
}) {
  const wrapRef = useRef(null);
  const width = useElementWidth(wrapRef, fallbackWidth);

  const { bars, axis, hasAnyData } = series;

  // Separate label values without changing the original sales data.
  const chartBars = bars.map((bar) => ({
    ...bar,
    salesLabel: bar.sales !== null ? bar.sales : null,
  }));

  const height = CATEGORY_BOX.height;
  const plotBottom = CATEGORY_PLOT.top + CATEGORY_PLOT.height;

  const yPx = (value) =>
    plotBottom - (value / axis.max) * CATEGORY_PLOT.height;

  const renderYTick = ({ y, payload }) => (
    <text
      key={payload.value}
      x={CATEGORY_Y_LABEL.anchorX}
      y={y + CATEGORY_Y_LABEL.baselineOffset}
      textAnchor="end"
      style={TEXT_STYLE}
    >
      {formatAxisCurrency(payload.value)}
    </text>
  );

  const renderXTick = ({ x, payload }) => (
    <text
      key={payload.value}
      x={x}
      y={plotBottom + CATEGORY_X_LABEL.baselineOffset}
      textAnchor="middle"
      style={TEXT_STYLE}
    >
      {payload.value}
    </text>
  );

  // One bar: a rectangle in the category's colour with Figma's 1px white outline.
  const renderBar = ({
    x,
    y,
    width: barWidth,
    height: barHeight,
    payload,
    index,
  }) => {
    if (payload.sales === null || !(barHeight > 0)) {
      return <g key={`bar-${index}`} />;
    }

    const selected = selectedCategory === payload.category;

    return (
      <path
  key={`bar-${index}`}
  data-category={payload.category}
  d={`
    M ${x} ${y + barHeight}
    L ${x} ${y + 5}
    Q ${x} ${y} ${x + 5} ${y}
    L ${x + barWidth - 5} ${y}
    Q ${x + barWidth} ${y} ${x + barWidth} ${y + 5}
    L ${x + barWidth} ${y + barHeight}
    Z
  `}
  fill={CATEGORY_COLORS[payload.category]}
  stroke="#ffffff"
  strokeWidth={1}
  opacity={
    selectedCategory && !selected ? DIM_OPACITY : 1
  }
  style={{ cursor: 'pointer' }}
  onClick={(event) => {
    event.stopPropagation();
    onSelectCategory(payload.category);
  }}
/>
    );
  };

  const summary = `Revenue by category, ${
    hasAnyData
      ? `total ${formatCompactCurrency(series.total)}`
      : 'no sales for the current selection'
  }`;

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      role="img"
      aria-label={summary}
    >
      <BarChart
        width={width}
        height={height}
        data={chartBars}
        margin={{
          top: CATEGORY_PLOT.top,
          right: CATEGORY_PLOT.rightMargin,
          bottom: 0,
          left: 0,
        }}
        onClick={() => onClearCategory()}
        style={{ outline: 'none' }}
      >
        <CartesianGrid
          stroke={CATEGORY_GRID_COLOR}
          strokeWidth={1}
          vertical={false}
          horizontalPoints={axis.ticks.map(yPx)}
        />

        <XAxis
          dataKey="category"
          type="category"
          interval={0}
          height={CATEGORY_X_AXIS_HEIGHT}
          tickLine={false}
          tick={renderXTick}
          axisLine={{ stroke: AXIS_COLOR }}
        />

        <YAxis
          type="number"
          domain={[0, axis.max]}
          ticks={axis.ticks}
          interval={0}
          width={CATEGORY_PLOT.left}
          tickLine={false}
          axisLine={false}
          tick={renderYTick}
        />

        <Tooltip
          content={<CategoryTooltip />}
          cursor={false}
          shared={false}
          isAnimationActive={false}
          wrapperStyle={{
            outline: 'none',
            zIndex: 10,
          }}
        />

        <Bar
          dataKey="sales"
          barSize={BAR_WIDTH}
          isAnimationActive={false}
          shape={renderBar}
        >
          <LabelList
            dataKey="salesLabel"
            position="top"
            content={({ x, y, width: barWidth, value }) => {
              if (
                value == null ||
                x == null ||
                y == null ||
                barWidth == null
              ) {
                return null;
              }

              const label = formatCompactCurrency(value);
              const labelWidth = label.length * 7 + 10;
              const labelHeight = 20;
              const centerX = x + barWidth / 2;
              const labelY = Math.max(y - 12, labelHeight / 2 + 2);

              return (
                <g transform={`translate(${centerX}, ${labelY})`}>
                  <rect
                    x={-labelWidth / 2}
                    y={-labelHeight / 2}
                    width={labelWidth}
                    height={labelHeight}
                    rx={4}
                    fill="#E5E7EB"
                    fillOpacity={0.45}
                  />

                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#000000"
                    fontSize={14}
                    fontWeight={700}
                  >
                    {label}
                  </text>
                </g>
              );
            }}
          />
        </Bar>
      </BarChart>

      {!hasAnyData && (
        <div className={styles.empty}>
          No data for this selection
        </div>
      )}
    </div>
  );
}
