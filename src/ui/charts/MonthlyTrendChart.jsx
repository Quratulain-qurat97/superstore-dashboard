
import { useId, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
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
  formatMonthLong,
  formatMonthShort,
  formatSignedCurrency,
  formatSignedPercent,
  resolveChartClick,
} from '../../core/index.js';

import { useElementWidth } from '../hooks/useElementWidth.js';

import {
  CHART_BOX,
  COLORS,
  DIM_OPACITY,
  MARKER,
  MARKER_EMPHASIS,
  PLOT,
  TICK_LENGTH,
  X_AXIS_HEIGHT,
  X_LABEL,
  Y_LABEL,
} from './trendGeometry.js';

import styles from './MonthlyTrendChart.module.css';

const DESIGN_WIDTH = 641;

const TEXT_STYLE = {
  font: '600 12px var(--font-inter)',
  fill: '#000000',
};

// ---- Hover tooltip ---------------------------------------------------------------------------

function TrendTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;

  const point = payload[0].payload;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>
        {formatMonthLong(point.month)}
      </p>

      {point.hasData ? (
        <>
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Sales</span>
            <span className={styles.tooltipValue}>
              {formatCurrency(point.sales)}
            </span>
          </div>

          {point.momChange !== null && (
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>
                vs previous month
              </span>

              <span
                className={`${styles.tooltipValue} ${
                  point.momChange >= 0 ? styles.up : styles.down
                }`}
              >
                {formatSignedCurrency(point.momChange)} (
                {formatSignedPercent(point.momPercent)})
              </span>
            </div>
          )}
        </>
      ) : (
        <div className={styles.tooltipLabel}>
          No sales in this month
        </div>
      )}
    </div>
  );
}

// ---- Monthly Sales Trend chart ----------------------------------------------------------------

export default function MonthlyTrendChart({
  series,
  selectedMonth,
  onSelectMonth,
  onClearMonth,
  fallbackWidth = DESIGN_WIDTH,
}) {
  const wrapRef = useRef(null);
  const width = useElementWidth(wrapRef, fallbackWidth);
  const [hoverIndex, setHoverIndex] = useState(null);
  const gradientId = useId().replace(/:/g, '');

  const { points, axis, labelStep, hasAnyData } = series;

  // Create separate label values without changing actual sales data.
  const chartPoints = points.map((point, index) => ({
    ...point,
    salesLabel:
      point.hasData &&
      (points.length <= 12 || index % 4 === 0)
        ? point.sales
        : null,
  }));

  const height = CHART_BOX.height;
  const plotWidth = width - PLOT.left - PLOT.rightMargin;
  const plotBottom = PLOT.top + PLOT.height;

  const yPx = (value) =>
    plotBottom - (value / axis.max) * PLOT.height;

  const xPx = (index) =>
    PLOT.left +
    (points.length > 1
      ? (index / (points.length - 1)) * plotWidth
      : 0);

  // X-axis labels and vertical gridlines.
  const labelIndexes = points
    .map((_, i) => i)
    .filter((i) => i % labelStep === 0);

  const labelMonths = labelIndexes.map((i) => points[i].month);

  const renderXTick = ({ x, payload }) => (
    <text
      key={payload.value}
      textAnchor="end"
      style={TEXT_STYLE}
      transform={`translate(${x + X_LABEL.dx} ${
        plotBottom + TICK_LENGTH.x + X_LABEL.dy
      }) rotate(${X_LABEL.rotate}) skewX(${X_LABEL.skew})`}
    >
      {formatMonthShort(payload.value)}
    </text>
  );

  const renderYTick = ({ y, payload }) => {
    const isTop = payload.value === axis.max;

    return (
      <text
        key={payload.value}
        data-testid="y-axis-tick"
        x={Y_LABEL.anchorX}
        y={
          y +
          Y_LABEL.baselineOffset +
          (isTop ? Y_LABEL.topTickExtraOffset : 0)
        }
        textAnchor="end"
        style={TEXT_STYLE}
      >
        {formatAxisCurrency(payload.value)}
      </text>
    );
  };

  const renderDot = ({ cx, cy, payload, index }) => {
    if (
      payload.sales === null ||
      cx === undefined ||
      cy === undefined ||
      Number.isNaN(cx)
    ) {
      return <g key={`dot-${index}`} />;
    }

    const selected = selectedMonth === payload.month;
    const size = selected ? MARKER_EMPHASIS : MARKER;

    return (
      <ellipse
        key={`dot-${index}`}
        cx={cx}
        cy={cy}
        rx={size.rx}
        ry={size.ry}
        fill={selected ? COLORS.line : '#ffffff'}
        stroke={COLORS.line}
        strokeWidth={2}
        opacity={
          selectedMonth && !selected ? DIM_OPACITY : 1
        }
      />
    );
  };

  const renderActiveDot = ({ cx, cy, payload, index }) => {
    if (
      payload.sales === null ||
      cx === undefined ||
      cy === undefined ||
      Number.isNaN(cx)
    ) {
      return <g key={`active-${index}`} />;
    }

    return (
      <ellipse
        key={`active-${index}`}
        cx={cx}
        cy={cy}
        rx={MARKER_EMPHASIS.rx}
        ry={MARKER_EMPHASIS.ry}
        fill={COLORS.line}
        stroke={COLORS.line}
        strokeWidth={2}
      />
    );
  };

  const onChartClick = (state, event) => {
    if (event?.stopPropagation) {
      event.stopPropagation();
    }

    const action = resolveChartClick(state, points);

    if (action.kind === 'select') {
      onSelectMonth(action.month);
    } else {
      onClearMonth();
    }
  };

  const hoverable =
    hoverIndex !== null &&
    points[hoverIndex] &&
    points[hoverIndex].hasData;

  const summary = `Monthly sales trend, ${points.length} months, ${
    hasAnyData
      ? `total ${formatCompactCurrency(series.total)}`
      : 'no sales for the current selection'
  }`;

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      style={{
        cursor: hoverable ? 'pointer' : 'default',
      }}
      role="img"
      aria-label={summary}
    >
      <AreaChart
        width={width}
        height={height}
        data={chartPoints}
        margin={{
          top: PLOT.top,
          right: PLOT.rightMargin,
          bottom: 0,
          left: 0,
        }}
        onClick={onChartClick}
        onMouseMove={(state) =>
          setHoverIndex(
            state.isTooltipActive
              ? Number(state.activeIndex)
              : null
          )
        }
        onMouseLeave={() => setHoverIndex(null)}
        style={{ outline: 'none' }}
      >
        <defs>
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1="0"
            x2="0"
            y1={yPx(series.maxSales)}
            y2={plotBottom}
          >
            <stop
              offset="0.6"
              stopColor={COLORS.gradientTop}
            />
            <stop
              offset="1"
              stopColor="#ffffff"
              stopOpacity="0.5"
            />
          </linearGradient>
        </defs>

        <CartesianGrid
          stroke={COLORS.grid}
          strokeWidth={1}
          horizontalPoints={axis.ticks.map(yPx)}
          verticalPoints={labelIndexes.map(xPx)}
        />

        <XAxis
          dataKey="month"
          type="category"
          ticks={labelMonths}
          interval={0}
          height={X_AXIS_HEIGHT}
          padding={{ left: 0, right: 0 }}
          tickSize={TICK_LENGTH.x}
          tickMargin={0}
          tick={renderXTick}
          tickLine={{ stroke: COLORS.axis }}
          axisLine={{ stroke: COLORS.axis }}
        />

        <YAxis
          type="number"
          domain={[0, axis.max]}
          ticks={axis.ticks}
          interval={0}
          width={PLOT.left}
          tickSize={TICK_LENGTH.y}
          tickMargin={0}
          tick={renderYTick}
          tickLine={{ stroke: COLORS.axis }}
          axisLine={{ stroke: COLORS.axis }}
        />

        <Tooltip
          content={<TrendTooltip />}
          cursor={false}
          filterNull={false}
          isAnimationActive={false}
          wrapperStyle={{
            outline: 'none',
            zIndex: 10,
          }}
        />

        <Area
          type="linear"
          dataKey="sales"
          stroke={COLORS.line}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          fillOpacity={COLORS.fillOpacity}
          connectNulls={false}
          isAnimationActive={false}
          dot={renderDot}
          activeDot={renderActiveDot}
        >
          <LabelList
            dataKey="salesLabel"
            position="top"
            content={({ x, y, value }) => {
              if (value == null || x == null || y == null) {
                return null;
              }

              const label = formatCompactCurrency(value);
              const labelWidth = label.length * 7 + 10;
              const labelHeight = 20;

              return (
                <g transform={`translate(${x}, ${y - 14})`}>
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
        </Area>
      </AreaChart>

      {!hasAnyData && (
        <div className={styles.empty}>
          No data for this selection
        </div>
      )}
    </div>
  );
}
