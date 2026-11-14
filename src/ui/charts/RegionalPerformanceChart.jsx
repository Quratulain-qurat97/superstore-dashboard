
import { useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  formatAxisCurrency,
  formatCompactCurrency,
  formatCurrency,
  formatPercent,
  isNegativeValue,
  resolveRegionClick,
} from '../../core/index.js';

import { useElementWidth } from '../hooks/useElementWidth.js';

import {
  AXIS_COLOR,
  BAR_GAP,
  BAR_WIDTH,
  CATEGORY_GRID_COLOR,
  DIM_OPACITY,
  MEASURE_COLORS,
  MEASURE_LABELS,
  REGIONAL_BOX,
  REGIONAL_PLOT,
  REGIONAL_X_AXIS_HEIGHT,
  REGIONAL_X_LABEL,
  REGIONAL_Y_LABEL,
} from './regionalGeometry.js';

import styles from './RegionalPerformanceChart.module.css';

const DESIGN_WIDTH = 660;
const TEXT_STYLE = {
  font: '600 13.8px var(--font-inter)',
  fill: '#000000',
};

function RegionTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;

  const bar = payload[0].payload;
  if (!bar.hasData) return null;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{bar.region}</p>

      {['sales', 'profit'].map((measure) => (
        <div key={measure} className={styles.tooltipRow}>
          <span className={styles.tooltipLabel}>
            <span
              className={styles.swatch}
              style={{ background: MEASURE_COLORS[measure] }}
              aria-hidden="true"
            />
            {MEASURE_LABELS[measure]}
          </span>

          <span
            className={`${styles.tooltipValue} ${
              measure === 'profit' && isNegativeValue(bar[measure])
                ? 'negative-value'
                : ''
            }`}
          >
            {formatCurrency(bar[measure])}
          </span>
        </div>
      ))}

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Profit margin</span>
        <span
          className={`${styles.tooltipValue} ${
            isNegativeValue(bar.margin) ? 'negative-value' : ''
          }`}
        >
          {formatPercent(bar.margin)}
        </span>
      </div>
    </div>
  );
}

/**
 * The Regional Performance grouped bar chart: Sales and Profit for West, East, Central and South.
 *
 * props:
 *   series            from buildRegionSeries()
 *   selectedRegion    the effective Region filter
 *   onSelectRegion    (region) => void
 *   onClearRegion     () => void
 *   fallbackWidth     width before the real width is measured
 */
export default function RegionalPerformanceChart({
  series,
  selectedRegion,
  onSelectRegion,
  onClearRegion,
  fallbackWidth = DESIGN_WIDTH,
}) {
  const wrapRef = useRef(null);
  const width = useElementWidth(wrapRef, fallbackWidth);
  const [hoverIndex, setHoverIndex] = useState(null);

  const { bars, axis, hasAnyData } = series;

  const chartBars = bars.map((bar) => ({
    ...bar,
    salesLabel: bar.hasData && bar.sales != null ? bar.sales : null,
    profitLabel: bar.hasData && bar.profit != null ? bar.profit : null,
  }));

  const height = REGIONAL_BOX.height;
  const plotBottom = REGIONAL_PLOT.top + REGIONAL_PLOT.height;

  const yPx = (value) =>
    REGIONAL_PLOT.top +
    ((axis.max - value) / (axis.max - axis.min)) *
      REGIONAL_PLOT.height;

  const renderYTick = ({ y, payload }) => (
    <text
      key={payload.value}
      x={REGIONAL_Y_LABEL.anchorX}
      y={y + REGIONAL_Y_LABEL.baselineOffset}
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
      y={plotBottom + REGIONAL_X_LABEL.baselineOffset}
      textAnchor="middle"
      style={TEXT_STYLE}
    >
      {payload.value}
    </text>
  );


  
  // One bar: rounded outer corners with a 1px white outline.
  // Positive bars round the top; negative bars round the bottom.
  const renderBar = (measure) =>
    ({ x, y, width: barWidth, height: barHeight, payload, index }) => {
      if (!payload.hasData || !barHeight) {
        return <g key={`${measure}-${index}`} />;
      }

      const selected = selectedRegion === payload.region;
      const radius = Math.min(5, barWidth / 2, Math.abs(barHeight) / 2);

      const top = barHeight < 0 ? y + barHeight : y;
      const bottom = barHeight < 0 ? y : y + barHeight;
      const right = x + barWidth;

      const path =
        barHeight < 0
          ? `
            M ${x} ${top}
            L ${right} ${top}
            L ${right} ${bottom - radius}
            Q ${right} ${bottom} ${right - radius} ${bottom}
            L ${x + radius} ${bottom}
            Q ${x} ${bottom} ${x} ${bottom - radius}
            Z
          `
          : `
            M ${x} ${bottom}
            L ${x} ${top + radius}
            Q ${x} ${top} ${x + radius} ${top}
            L ${right - radius} ${top}
            Q ${right} ${top} ${right} ${top + radius}
            L ${right} ${bottom}
            Z
          `;

      return (
        <path
          key={`${measure}-${index}`}
          data-region={payload.region}
          data-measure={measure}
          d={path}
          fill={MEASURE_COLORS[measure]}
          stroke="#ffffff"
          strokeWidth={1}
          opacity={
            selectedRegion && !selected ? DIM_OPACITY : 1
          }
        />
      );
    };


  const onChartClick = (state, event) => {
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }

    const action = resolveRegionClick(state, bars);

    if (action.kind === 'select') {
      onSelectRegion(action.region);
    } else {
      onClearRegion();
    }
  };

  const hoverable =
    hoverIndex !== null &&
    bars[hoverIndex] &&
    bars[hoverIndex].hasData;

  const summary = `Regional performance: sales and profit for ${
    bars
      .filter((b) => b.hasData)
      .map((b) => b.region)
      .join(', ') || 'no region'
  }`;

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      style={{ cursor: hoverable ? 'pointer' : 'default' }}
      role="img"
      aria-label={summary}
    >
      <BarChart
        width={width}
        height={height}
        data={chartBars}
        margin={{
          top: REGIONAL_PLOT.top,
          right: REGIONAL_PLOT.rightMargin,
          bottom: 0,
          left: 0,
        }}
        barGap={BAR_GAP}
        onClick={onChartClick}
        onMouseMove={(state) =>
          setHoverIndex(
            state.isTooltipActive
              ? Number(state.activeIndex)
              : null,
          )
        }
        onMouseLeave={() => setHoverIndex(null)}
        style={{ outline: 'none' }}
      >
        <CartesianGrid
          stroke={CATEGORY_GRID_COLOR}
          strokeWidth={1}
          vertical={false}
          horizontalPoints={axis.ticks.map(yPx)}
        />

        <XAxis
          dataKey="region"
          type="category"
          interval={0}
          height={REGIONAL_X_AXIS_HEIGHT}
          tickLine={false}
          axisLine={false}
          tick={renderXTick}
        />

        <YAxis
          type="number"
          domain={[axis.min, axis.max]}
          ticks={axis.ticks}
          interval={0}
          width={REGIONAL_PLOT.left}
          tickLine={false}
          axisLine={false}
          tick={renderYTick}
        />

        <Tooltip
          content={<RegionTooltip />}
          cursor={false}
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
          shape={renderBar('sales')}
        >
          <LabelList
            dataKey="salesLabel"
            position="top"
            content={({ x, y, width: barWidth, height: barHeight, value }) => {
              if (
                value == null ||
                x == null ||
                y == null ||
                barWidth == null ||
                barHeight == null
              ) {
                return null;
              }

              const label = formatCompactCurrency(value);
              const labelWidth = label.length * 7 + 10;
              const labelHeight = 20;
              const centerX = x + barWidth / 2;
              const labelY =
                value < 0
                  ? Math.max(y, y + barHeight) + 12
                  : Math.min(y, y + barHeight) - 12;

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

        <Bar
          dataKey="profit"
          barSize={BAR_WIDTH}
          isAnimationActive={false}
          shape={renderBar('profit')}
        >
          <LabelList
            dataKey="profitLabel"
            position="top"
            content={({ x, y, width: barWidth, height: barHeight, value }) => {
              if (
                value == null ||
                x == null ||
                y == null ||
                barWidth == null ||
                barHeight == null
              ) {
                return null;
              }

              const label = formatCompactCurrency(value);
              const labelWidth = label.length * 7 + 10;
              const labelHeight = 20;
              const centerX = x + barWidth / 2;
              const labelY =
                value < 0
                  ? Math.max(y, y + barHeight) + 12
                  : Math.min(y, y + barHeight) - 12;

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
                    fill={isNegativeValue(value) ? '#EF4444' : '#000000'}
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

        {/* The black zero line (Figma's x axis line). */}
        <ReferenceLine
          y={0}
          stroke={AXIS_COLOR}
          strokeWidth={1}
          ifOverflow="visible"
        />
      </BarChart>

      {!hasAnyData && (
        <div className={styles.empty}>
          No data for this selection
        </div>
      )}
    </div>
  );
}
