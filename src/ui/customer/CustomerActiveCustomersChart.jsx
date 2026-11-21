import { useMemo, useRef } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useElementWidth } from '../hooks/useElementWidth.js';

import {
  AXIS_COLOR,
  BAR_WIDTH,
  CATEGORY_GRID_COLOR,
  CUSTOMER_ACTIVE_BOX,
  CUSTOMER_ACTIVE_PLOT,
  CUSTOMER_ACTIVE_X_AXIS_HEIGHT,
  CUSTOMER_ACTIVE_X_LABEL,
  CUSTOMER_ACTIVE_Y_LABEL,
  CUSTOMER_COLORS,
  CUSTOMER_LABELS,
  DIM_OPACITY,
} from './customerActiveGeometry.js';

import styles from './CustomerActiveCustomersChart.module.css';

const DESIGN_WIDTH = 660;

// Tune these to shrink overall chart height, plot height, and top clearance from the legend
// without moving the legend itself.
const CHART_HEIGHT_DELTA = -32; // Negative decreases total chart height
const PLOT_HEIGHT_DELTA = -28; // Negative decreases plot/grid height
const TOP_CLEARANCE_DELTA = 8; // Positive gives extra breathing room below the legend

const TEXT_STYLE = {
  font: '600 13.8px var(--font-inter)',
  fill: '#000000',
};

const formatNumber = (value) =>
  Number(value ?? 0).toLocaleString('en-US');

function getAxis(activeCustomers) {
  const maximum = Math.max(
    100,
    ...activeCustomers.map((item) => item.activeCustomers ?? 0),
  );

  const step = Math.max(25, Math.ceil(maximum / 4 / 25) * 25);
  const max = Math.ceil(maximum / step) * step;

  return {
    min: 0,
    max,
    ticks: Array.from(
      { length: max / step + 1 },
      (_, index) => index * step,
    ),
  };
}

function CustomerTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{item.year}</p>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>
          <span
            className={styles.swatch}
            style={{ background: CUSTOMER_COLORS.returning }}
          />
          {CUSTOMER_LABELS.returning}
        </span>

        <span className={styles.tooltipValue}>
          {formatNumber(item.returningCustomers)}
        </span>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>
          <span
            className={styles.swatch}
            style={{ background: CUSTOMER_COLORS.newOrReactivated }}
          />
          {CUSTOMER_LABELS.newOrReactivated}
        </span>

        <span className={styles.tooltipValue}>
          {formatNumber(item.newOrReactivatedCustomers)}
        </span>
      </div>

      <div className={styles.tooltipDivider} />

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Active Customers</span>
        <span className={styles.tooltipValue}>
          {formatNumber(item.activeCustomers)}
        </span>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Retention</span>
        <span className={styles.tooltipValue}>
          {item.retentionRate == null
            ? '—'
            : `${item.retentionRate.toFixed(1)}%`}
        </span>
      </div>
    </div>
  );
}

export default function CustomerActiveCustomersChart({
  series,
  selectedYear,
  onSelectYear,
  fallbackWidth = DESIGN_WIDTH,
}) {
  const wrapRef = useRef(null);
  const width = useElementWidth(wrapRef, fallbackWidth);

  const bars = series ?? [];

  const chartBars = useMemo(
    () =>
      bars.map((item) => ({
        ...item,
        returningLabel: item.returningCustomers,
        newOrReactivatedLabel: item.newOrReactivatedCustomers,
      })),
    [bars],
  );

  const axis = useMemo(() => getAxis(bars), [bars]);

  const plotTop = Math.max(12, CUSTOMER_ACTIVE_PLOT.top + TOP_CLEARANCE_DELTA);
  const plotHeight = Math.max(
    120,
    CUSTOMER_ACTIVE_PLOT.height + PLOT_HEIGHT_DELTA,
  );
  const height = Math.max(
    plotTop + plotHeight + CUSTOMER_ACTIVE_X_AXIS_HEIGHT,
    CUSTOMER_ACTIVE_BOX.height + CHART_HEIGHT_DELTA,
  );

  const plotBottom = plotTop + plotHeight;

  const yPx = (value) =>
    plotBottom - (value / axis.max) * plotHeight;

  const renderYTick = ({ y, payload }) => (
    <text
      key={payload.value}
      x={CUSTOMER_ACTIVE_Y_LABEL.anchorX}
      y={y + CUSTOMER_ACTIVE_Y_LABEL.baselineOffset}
      textAnchor="end"
      style={TEXT_STYLE}
    >
      {formatNumber(payload.value)}
    </text>
  );

  const renderXTick = ({ x, payload }) => (
    <text
      key={payload.value}
      x={x}
      y={plotBottom + CUSTOMER_ACTIVE_X_LABEL.baselineOffset}
      textAnchor="middle"
      style={TEXT_STYLE}
    >
      {payload.value}
    </text>
  );

  const renderBar = (measure) =>
    ({ x, y, width: barWidth, height: barHeight, payload, index }) => {
      if (!(barHeight > 0)) {
        return <g key={`${measure}-${index}`} />;
      }

      const selected =
        selectedYear != null &&
        String(selectedYear) === String(payload.year);

      const radius = Math.min(5, barWidth / 2, barHeight / 2);
      const right = x + barWidth;
      const bottom = y + barHeight;

      const path =
        measure === 'returning'
          ? `
            M ${x} ${y}
            L ${right} ${y}
            L ${right} ${bottom - radius}
            Q ${right} ${bottom} ${right - radius} ${bottom}
            L ${x + radius} ${bottom}
            Q ${x} ${bottom} ${x} ${bottom - radius}
            Z
          `
          : `
            M ${x + radius} ${y}
            L ${right - radius} ${y}
            Q ${right} ${y} ${right} ${y + radius}
            L ${right} ${bottom}
            L ${x} ${bottom}
            L ${x} ${y + radius}
            Q ${x} ${y} ${x + radius} ${y}
            Z
          `;

      return (
        <path
          key={`${measure}-${index}`}
          d={path}
          fill={CUSTOMER_COLORS[measure]}
          stroke="#ffffff"
          strokeWidth={1}
          opacity={
            selectedYear == null
              ? 1
              : selected
                ? 1
                : DIM_OPACITY
          }
          style={{ cursor: 'pointer' }}
          onClick={(event) => {
            event.stopPropagation();
            onSelectYear(payload.year);
          }}
        />
      );
    };

  const summary = `Active customers by year: ${bars
    .map((item) => `${item.year}: ${item.activeCustomers}`)
    .join(', ')}`;

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      role="img"
      aria-label={summary}
    >
      {/* Legend — stays in its exact existing position */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span
            className={styles.legendSquare}
            style={{ background: CUSTOMER_COLORS.returning }}
          />
          <span>{CUSTOMER_LABELS.returning}</span>
        </div>

        <div className={styles.legendItem}>
          <span
            className={styles.legendSquare}
            style={{ background: CUSTOMER_COLORS.newOrReactivated }}
          />
          <span>{CUSTOMER_LABELS.newOrReactivated}</span>
        </div>
      </div>

      <BarChart
        width={width}
        height={height}
        data={chartBars}
        margin={{
          top: plotTop,
          right: CUSTOMER_ACTIVE_PLOT.rightMargin,
          bottom: 0,
          left: 0,
        }}
        onClick={(state, event) => {
          if (event?.stopPropagation) {
            event.stopPropagation();
          }
        }}
        style={{ outline: 'none' }}
      >
        <CartesianGrid
          stroke={CATEGORY_GRID_COLOR}
          strokeWidth={1}
          vertical={false}
          horizontalPoints={axis.ticks.map(yPx)}
        />

        <XAxis
          dataKey="year"
          type="category"
          interval={0}
          height={CUSTOMER_ACTIVE_X_AXIS_HEIGHT}
          tickLine={false}
          axisLine={{ stroke: AXIS_COLOR }}
          tick={renderXTick}
        />

        <YAxis
          type="number"
          domain={[0, axis.max]}
          ticks={axis.ticks}
          interval={0}
          width={CUSTOMER_ACTIVE_PLOT.left}
          tickLine={false}
          axisLine={false}
          tick={renderYTick}
        />

        <Tooltip
          content={<CustomerTooltip />}
          cursor={false}
          shared={false}
          isAnimationActive={false}
          wrapperStyle={{
            outline: 'none',
            zIndex: 10,
          }}
        />

        {/* Returning customers */}
        <Bar
          dataKey="returningCustomers"
          stackId="customers"
          barSize={BAR_WIDTH}
          isAnimationActive={false}
          shape={renderBar('returning')}
        >
          <LabelList
            dataKey="returningLabel"
            position="center"
            content={({ x, y, width: barWidth, height: barHeight, value }) => {
              if (
                value == null ||
                x == null ||
                y == null ||
                barWidth == null ||
                barHeight < 22
              ) {
                return null;
              }

              return (
                <text
                  x={x + barWidth / 2}
                  y={y + barHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#ffffff"
                  fontSize={12}
                  fontWeight={700}
                >
                  {formatNumber(value)}
                </text>
              );
            }}
          />
        </Bar>

        {/* New / reactivated customers */}
        <Bar
          dataKey="newOrReactivatedCustomers"
          stackId="customers"
          barSize={BAR_WIDTH}
          isAnimationActive={false}
          shape={renderBar('newOrReactivated')}
        >
          <LabelList
            dataKey="newOrReactivatedLabel"
            position="center"
            content={({ x, y, width: barWidth, height: barHeight, value }) => {
              if (
                value == null ||
                x == null ||
                y == null ||
                barWidth == null ||
                barHeight < 22
              ) {
                return null;
              }

              return (
                <text
                  x={x + barWidth / 2}
                  y={y + barHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#ffffff"
                  fontSize={12}
                  fontWeight={700}
                >
                  {formatNumber(value)}
                </text>
              );
            }}
          />

          {/* Total active customers and retention */}
          <LabelList
            dataKey="activeCustomers"
            position="top"
            content={({ x, y, width: barWidth, value, payload }) => {
              if (
                value == null ||
                x == null ||
                y == null ||
                barWidth == null ||
                !payload
              ) {
                return null;
              }

              const total = formatNumber(value);

              const retention =
                payload.retentionRate == null
                  ? '—'
                  : `${payload.retentionRate.toFixed(1)}%`;

              const centerX = x + barWidth / 2;
              const labelWidth = 70;
              const labelHeight = 38;
              const labelY = y - 23;

              return (
                <g transform={`translate(${centerX}, ${labelY})`}>
                  <rect
                    x={-labelWidth / 2}
                    y={-labelHeight / 2}
                    width={labelWidth}
                    height={labelHeight}
                    rx={5}
                    fill="#E5E7EB"
                    fillOpacity={0.45}
                  />

                  <text
                    textAnchor="middle"
                    y={-5}
                    fill="#000000"
                    fontSize={13}
                    fontWeight={700}
                  >
                    {total}
                  </text>

                  <text
                    textAnchor="middle"
                    y={11}
                    fill="#555555"
                    fontSize={11}
                    fontWeight={600}
                  >
                    {retention}
                  </text>
                </g>
              );
            }}
          />
        </Bar>
      </BarChart>

      {bars.length === 0 && (
        <div className={styles.empty}>
          No data for this selection
        </div>
      )}
    </div>
  );
}