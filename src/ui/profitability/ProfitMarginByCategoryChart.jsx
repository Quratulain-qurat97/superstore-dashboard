
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
} from '../charts/categoryGeometry.js';

import styles from './ProfitMarginByCategoryChart.module.css';

const DESIGN_WIDTH = 660;

const TEXT_STYLE = {
  font: '600 13.8px var(--font-inter)',
  fill: '#000000',
};

function CategoryTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;

  const bar = payload[0]?.payload;

  if (!bar || bar.margin == null) return null;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{bar.category}</p>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Profit Margin</span>
        <span className={styles.tooltipValue}>
          {formatPercent(bar.margin)}
        </span>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Sales</span>
        <span className={styles.tooltipValue}>
          {formatCurrency(bar.sales)}
        </span>
      </div>
    </div>
  );
}

export default function ProfitMarginByCategoryChart({
  series,
  selectedCategory,
  onSelectCategory,
  onClearCategory,
  fallbackWidth = DESIGN_WIDTH,
}) {
  const wrapRef = useRef(null);
  const width = useElementWidth(wrapRef, fallbackWidth);

  const { bars, axis, hasAnyData } = series;

  const chartBars = bars.map((bar) => ({
    ...bar,
    marginLabel: bar.margin,
  }));

  const height = CATEGORY_BOX.height;
  const plotBottom = CATEGORY_PLOT.top + CATEGORY_PLOT.height;

  // This chart always uses zero as its baseline.
  const axisMin = 0;
  const axisRange = axis.max - axisMin;

  const yPx = (value) =>
    plotBottom -
    (value / axisRange) * CATEGORY_PLOT.height;

  const renderYTick = ({ y, payload }) => (
    <text
      key={payload.value}
      x={CATEGORY_Y_LABEL.anchorX}
      y={y + CATEGORY_Y_LABEL.baselineOffset}
      textAnchor="end"
      style={TEXT_STYLE}
    >
      {formatPercent(payload.value)}
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

  const renderBar = ({
    x,
    width: barWidth,
    payload,
    index,
  }) => {
    if (
      !payload ||
      payload.margin == null ||
      !Number.isFinite(x) ||
      !Number.isFinite(barWidth)
    ) {
      return <g key={`bar-${index}`} />;
    }

    const selected = selectedCategory === payload.category;

    // Both positive and negative values extend upward from zero.
    // Negative values retain their actual sign in the data.
    const barTop = yPx(Math.abs(payload.margin));
    const barBottom = plotBottom;

    const actualHeight = barBottom - barTop;

    if (!Number.isFinite(actualHeight) || actualHeight <= 0) {
      return <g key={`bar-${index}`} />;
    }

    const radius = Math.min(5, barWidth / 2, actualHeight / 2);

    // Both positive and negative bars have rounded top corners.
    const path = `
      M ${x} ${barBottom}
      L ${x} ${barTop + radius}
      Q ${x} ${barTop} ${x + radius} ${barTop}
      L ${x + barWidth - radius} ${barTop}
      Q ${x + barWidth} ${barTop} ${x + barWidth} ${barTop + radius}
      L ${x + barWidth} ${barBottom}
      Z
    `;

    return (
      <path
        key={`bar-${index}`}
        data-category={payload.category}
        d={path}
        fill={
          payload.margin < 0
            ? '#EF4444'
            : CATEGORY_COLORS[payload.category]
        }
        stroke="#ffffff"
        strokeWidth={1}
        opacity={
          selectedCategory && !selected
            ? DIM_OPACITY
            : 1
        }
        style={{ cursor: 'pointer' }}
        onClick={(event) => {
          event.stopPropagation();
          onSelectCategory(payload.category);
        }}
      />
    );
  };

  const summary = `Profit margin by category, ${
    hasAnyData
      ? 'showing aggregate profit margin percentages'
      : 'no data for the current selection'
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
          domain={[axisMin, axis.max]}
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
          dataKey="margin"
          barSize={BAR_WIDTH}
          isAnimationActive={false}
          shape={renderBar}
        >
          <LabelList
            dataKey="marginLabel"
            content={({ x, y, width: barWidth, value }) => {
              if (
                value == null ||
                x == null ||
                y == null ||
                barWidth == null
              ) {
                return null;
              }

              const label = formatPercent(value);
              const labelWidth = label.length * 7 + 10;
              const labelHeight = 20;
              const centerX = x + barWidth / 2;

              // Keep every label above its bar, including negative values.
              const barTop = yPx(Math.abs(value));
              const labelY = Math.max(
                barTop - 12,
                labelHeight / 2 + 2,
              );

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
                    fill={value < 0 ? '#DC2626' : '#000000'}
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
