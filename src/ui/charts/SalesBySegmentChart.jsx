
import { useMemo, useRef } from 'react';
import { Pie, PieChart, Sector, Tooltip } from 'recharts';

import {
  formatCompactCurrency,
  formatCurrency,
  formatPercent,
} from '../../core/index.js';

import { useElementWidth } from '../hooks/useElementWidth.js';

import {
  DIM_OPACITY,
  DONUT_GEOMETRY,
  SEGMENT_BOX,
  SEGMENT_COLORS,
} from './segmentGeometry.js';

import styles from './SalesBySegmentChart.module.css';

const DESIGN_WIDTH = 660;
const RADIAN = Math.PI / 180;

function SegmentTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const slice = payload[0].payload;

  if (slice.sales == null) {
    return null;
  }

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{slice.segment}</p>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Sales</span>
        <span className={styles.tooltipValue}>
          {formatCurrency(slice.sales)}
        </span>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Share of sales</span>
        <span className={styles.tooltipValue}>
          {formatPercent(slice.share)}
        </span>
      </div>
    </div>
  );
}

function renderSegmentLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  value,
  payload,
}) {
  if (
    value == null ||
    cx == null ||
    cy == null ||
    midAngle == null ||
    outerRadius == null
  ) {
    return null;
  }

  const label = formatCompactCurrency(value);
  const labelWidth = label.length * 7 + 10;
  const labelHeight = 20;
  const labelRadius = outerRadius + 20;

  const centerX =
    cx + labelRadius * Math.cos(-midAngle * RADIAN);

  const centerY =
    cy + labelRadius * Math.sin(-midAngle * RADIAN);

  return (
    <g
   data-label={payload?.segment}
   transform={`translate(${centerX}, ${centerY})`}
   >
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
}

export default function SalesBySegmentChart({
  series,
  selectedSegment,
  onSelectSegment,
  onClearSegment,
  fallbackWidth = DESIGN_WIDTH,
}) {
  const wrapRef = useRef(null);

  const width = useElementWidth(wrapRef, fallbackWidth);

  const { slices } = series;

  // buildSegmentSeries now returns only data-bearing slices.
  // Do not check slice.hasData because that property no longer exists.
  const chartData = useMemo(
    () =>
      slices.filter(
        (slice) =>
          slice.sales != null &&
          Number.isFinite(slice.sales) &&
          slice.sales > 0,
      ),
    [slices],
  );

  const hasChartData = chartData.length > 0;

  const handlePieClick = (entry, index, event) => {
    event?.stopPropagation();

    const segment =
      entry?.payload?.segment ??
      entry?.segment ??
      entry?.name;

    if (segment) {
      onSelectSegment(segment);
    }
  };

  const summary = `Sales by segment: ${
    chartData
      .map(
        (slice) =>
          `${slice.segment}, ${formatCurrency(slice.sales)}`,
      )
      .join('; ') || 'no data'
  }`;

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      role="img"
      aria-label={summary}
    >
      <PieChart
        width={width}
        height={SEGMENT_BOX.height}
        onClick={() => onClearSegment?.()}
      >
        <Pie
          data={chartData}
          dataKey="sales"
          nameKey="segment"
          cx="50%"
          cy="48%"
          outerRadius={DONUT_GEOMETRY.outerRadius}
          innerRadius={DONUT_GEOMETRY.innerRadius}
          paddingAngle={DONUT_GEOMETRY.paddingAngle}
          cornerRadius={DONUT_GEOMETRY.cornerRadius}
          stroke="#ffffff"
          strokeWidth={1}
          isAnimationActive={false}
          onClick={handlePieClick}
          label={renderSegmentLabel}
          labelLine={false}
          shape={(props) => {
  const selected =
    selectedSegment === props.payload.segment;

  return (
    <Sector
      {...props}
      data-segment={props.payload.segment}
      fill={SEGMENT_COLORS[props.payload.segment]}
      opacity={
        selectedSegment && !selected
          ? DIM_OPACITY
          : 1
      }
      style={{
        cursor: 'pointer',
        outline: 'none',
      }}
    />
  );
}}
        />

        <Tooltip
          content={<SegmentTooltip />}
          cursor={false}
          isAnimationActive={false}
          wrapperStyle={{
            outline: 'none',
            zIndex: 10,
          }}
        />
      </PieChart>

      {/* Segment colour legend */}
      <div className={styles.legend}>
        {Object.entries(SEGMENT_COLORS).map(
          ([segment, color]) => (
            <div key={segment} className={styles.legendItem}>
              <span
                className={styles.legendSwatch}
                style={{ backgroundColor: color }}
              />
              <span>{segment}</span>
            </div>
          ),
        )}
      </div>

      {!hasChartData && (
        <div className={styles.empty}>
          No data for this selection
        </div>
      )}
    </div>
  );
}
