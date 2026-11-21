
import { useMemo, useRef, useState } from 'react';

import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useElementWidth } from '../hooks/useElementWidth.js';

import {
  CUSTOMER_CONCENTRATION_BOX,
  CUSTOMER_CONCENTRATION_PLOT,
  CUSTOMER_CONCENTRATION_X_AXIS_HEIGHT,
  CUSTOMER_CONCENTRATION_X_LABEL,
  CUSTOMER_CONCENTRATION_Y_LABEL,
  CUSTOMER_CONCENTRATION_COLORS,
  CUSTOMER_CONCENTRATION_LABELS,
  CUSTOMER_CONCENTRATION_GRID_COLOR,
  CUSTOMER_CONCENTRATION_AXIS_COLOR,
  CUSTOMER_CONCENTRATION_DIM_OPACITY,
} from './customerConcentrationGeometry.js';

import styles from './CustomerConcentrationChart.module.css';

const DESIGN_WIDTH = 660;
const CHART_TOP_CLEARANCE = 14;
const MARKER_STEP_PERCENT = 10;
const OVERLAP_TOLERANCE = 2.5;

const TEXT_STYLE = {
  font: '600 12.8px var(--font-inter)',
  fill: '#000000',
};

const formatNumber = (value) =>
  Number(value ?? 0).toLocaleString('en-US');

const formatCurrency = (value) =>
  `$${Number(value ?? 0).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })}`;

const formatPercentage = (value) =>
  value == null ? '—' : `${Number(value).toFixed(1)}%`;

function buildChartData(series) {
  const salesCurve = series?.salesCurve ?? [];
  const profitCurve = series?.profitCurve ?? [];

  const origin = {
    isOrigin: true,
    customerPercentage: 0,

    salesCustomerId: null,
    salesCustomerName: null,
    salesRank: null,
    salesValue: null,
    salesProfit: null,
    salesCumulativeValue: 0,
    salesCumulativePercentage: 0,

    profitCustomerId: null,
    profitCustomerName: null,
    profitRank: null,
    profitSales: null,
    profitValue: null,
    profitCumulativeValue: 0,
    profitCumulativePercentage: 0,
  };

  const customerPoints = salesCurve.map((salesPoint, index) => {
    const profitPoint = profitCurve[index];

    return {
      isOrigin: false,
      customerPercentage: salesPoint.customerPercentage,

      salesCustomerId: salesPoint.customerId,
      salesCustomerName: salesPoint.customerName,
      salesRank: salesPoint.rank,
      salesValue: salesPoint.sales,
      salesProfit: salesPoint.profit,
      salesCumulativeValue: salesPoint.cumulativeValue,
      salesCumulativePercentage: salesPoint.cumulativePercentage,

      profitCustomerId: profitPoint?.customerId ?? null,
      profitCustomerName: profitPoint?.customerName ?? null,
      profitRank: profitPoint?.rank ?? null,
      profitSales: profitPoint?.sales ?? null,
      profitValue: profitPoint?.profit ?? null,
      profitCumulativeValue: profitPoint?.cumulativeValue ?? null,
      profitCumulativePercentage:
        profitPoint?.cumulativePercentage ?? null,
    };
  });

  return customerPoints.length > 0
    ? [origin, ...customerPoints]
    : [];
}

function getYAxis(chartData) {
  const values = chartData.flatMap((item) => [
    item.salesCumulativePercentage,
    item.profitCumulativePercentage,
  ]);

  const maximum = Math.max(
    100,
    ...values.filter(Number.isFinite),
  );

  const step = Math.max(25, Math.ceil(maximum / 4 / 25) * 25);
  const max = Math.ceil(maximum / step) * step;

  return {
    min: 0,
    max,
    step,
    ticks: Array.from(
      { length: max / step + 1 },
      (_, index) => index * step,
    ),
  };
}

function ConcentrationTooltip({ active, payload, measure }) {
  if (!active || !payload?.length || !measure) {
    return null;
  }

  const item = payload[0]?.payload;

  if (!item || item.isOrigin) {
    return null;
  }

  const isSales = measure === 'sales';

  const customerName = isSales
    ? item.salesCustomerName
    : item.profitCustomerName;

  const rank = isSales
    ? item.salesRank
    : item.profitRank;

  const cumulativeValue = isSales
    ? item.salesCumulativeValue
    : item.profitCumulativeValue;

  const cumulativePercentage = isSales
    ? item.salesCumulativePercentage
    : item.profitCumulativePercentage;

  const individualValue = isSales
    ? item.salesValue
    : item.profitValue;

  const label = isSales ? 'Sales' : 'Profit';

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>
        {formatPercentage(item.customerPercentage)} of Customers
      </p>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>
          <span
            className={styles.swatch}
            style={{
              background: CUSTOMER_CONCENTRATION_COLORS[measure],
            }}
          />
          {label} — Rank #{formatNumber(rank)}
        </span>
      </div>

      {customerName && (
        <div className={styles.tooltipRow}>
          <span className={styles.tooltipLabel}>
            {customerName}
          </span>
        </div>
      )}

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>
          Cumulative {label}
        </span>
        <span className={styles.tooltipValue}>
          {formatCurrency(cumulativeValue)}
        </span>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>
          {label} Contribution
        </span>
        <span className={styles.tooltipValue}>
          {formatPercentage(cumulativePercentage)}
        </span>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>
          Customer {label}
        </span>
        <span className={styles.tooltipValue}>
          {formatCurrency(individualValue)}
        </span>
      </div>
    </div>
  );
}

export default function CustomerConcentrationChart({
  series,
  selectedCustomerId,
  onSelectCustomer,
  fallbackWidth = DESIGN_WIDTH,
}) {
  const wrapRef = useRef(null);
  const width = useElementWidth(wrapRef, fallbackWidth);

  const [activeMeasure, setActiveMeasure] = useState(null);
  const [hoveredMeasure, setHoveredMeasure] = useState(null);

  const chartData = useMemo(
    () => buildChartData(series),
    [series],
  );

  const axis = useMemo(
    () => getYAxis(chartData),
    [chartData],
  );

  const customerCount = series?.customerCount ?? 0;

  const { markerIndices, calloutIndices } = useMemo(() => {
    const markers = new Set();
    const callouts = { sales: -1, profit: -1 };
    const points = chartData.slice(1);

    if (!points.length) {
      return { markerIndices: markers, calloutIndices: callouts };
    }

    for (
      let pct = MARKER_STEP_PERCENT;
      pct <= 100;
      pct += MARKER_STEP_PERCENT
    ) {
      let bestIdx = -1;
      let bestDiff = Infinity;

      points.forEach((pt, idx) => {
        const currentPct =
          pt.customerPercentage ?? ((idx + 1) / points.length) * 100;

        const diff = Math.abs(currentPct - pct);

        if (diff < bestDiff) {
          bestDiff = diff;
          bestIdx = idx + 1;
        }
      });

      if (bestIdx > 0) markers.add(bestIdx);
    }

    let maxProfit = -Infinity;
    let profitPeakIdx = -1;

    points.forEach((pt, idx) => {
      if (
        Number.isFinite(pt.profitCumulativePercentage) &&
        pt.profitCumulativePercentage > maxProfit
      ) {
        maxProfit = pt.profitCumulativePercentage;
        profitPeakIdx = idx + 1;
      }
    });

    if (profitPeakIdx > 0) {
      callouts.profit = profitPeakIdx;
      markers.add(profitPeakIdx);
    }

    if (profitPeakIdx > 0) {
      const targetPct =
        chartData[profitPeakIdx]?.customerPercentage ?? 60;

      let bestSalesIdx = -1;
      let bestPctDiff = Infinity;

      points.forEach((pt, idx) => {
        if (!Number.isFinite(pt.salesCumulativePercentage)) return;

        const diff = Math.abs(
          (pt.customerPercentage ?? 0) - targetPct,
        );

        if (diff < bestPctDiff) {
          bestPctDiff = diff;
          bestSalesIdx = idx + 1;
        }
      });

      if (bestSalesIdx > 0) {
        callouts.sales = bestSalesIdx;
        markers.add(bestSalesIdx);
      }
    }

    return { markerIndices: markers, calloutIndices: callouts };
  }, [chartData]);

  const hasData =
    chartData.length > 1 &&
    chartData.some(
      (item) =>
        !item.isOrigin &&
        Number.isFinite(item.salesCumulativePercentage),
    );

  const plotTop =
    CUSTOMER_CONCENTRATION_PLOT.top + CHART_TOP_CLEARANCE;

  const plotHeight = Math.max(
    80,
    CUSTOMER_CONCENTRATION_PLOT.height - CHART_TOP_CLEARANCE,
  );

  const height = CUSTOMER_CONCENTRATION_BOX.height;
  const plotBottom = plotTop + plotHeight;

  const yPx = (value) =>
    plotBottom - (value / axis.max) * plotHeight;

  const handleChartMouseMove = (chartState) => {
    const index = Number(chartState?.activeTooltipIndex);
    const pointerY = chartState?.activeCoordinate?.y;

    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= chartData.length ||
      !Number.isFinite(pointerY)
    ) {
      setHoveredMeasure(null);
      return;
    }

    const point = chartData[index];

    if (!point || point.isOrigin) {
      setHoveredMeasure(null);
      return;
    }

    const salesValue = point.salesCumulativePercentage;
    const profitValue = point.profitCumulativePercentage;

    const salesDistance = Number.isFinite(salesValue)
      ? Math.abs(pointerY - yPx(salesValue))
      : Infinity;

    const profitDistance = Number.isFinite(profitValue)
      ? Math.abs(pointerY - yPx(profitValue))
      : Infinity;

    if (activeMeasure != null) {
      const activeDistance =
        activeMeasure === 'sales'
          ? salesDistance
          : profitDistance;

      const otherDistance =
        activeMeasure === 'sales'
          ? profitDistance
          : salesDistance;

      if (
        activeDistance <= otherDistance + OVERLAP_TOLERANCE
      ) {
        setHoveredMeasure(activeMeasure);
      } else {
        setHoveredMeasure(null);
      }

      return;
    }

    if (
      salesDistance === Infinity &&
      profitDistance === Infinity
    ) {
      setHoveredMeasure(null);
      return;
    }

    setHoveredMeasure(
      salesDistance <= profitDistance ? 'sales' : 'profit',
    );
  };

  const renderYTick = ({ y, payload }) => (
    <text
      key={payload.value}
      x={CUSTOMER_CONCENTRATION_Y_LABEL.anchorX}
      y={y + CUSTOMER_CONCENTRATION_Y_LABEL.baselineOffset}
      textAnchor="end"
      style={TEXT_STYLE}
    >
      {`${payload.value}%`}
    </text>
  );

  const renderXTick = ({ x, payload }) => {
    const anchor =
      payload.value === 0
        ? 'start'
        : payload.value === 100
          ? 'end'
          : 'middle';

    return (
      <text
        key={payload.value}
        x={x}
        y={plotBottom + CUSTOMER_CONCENTRATION_X_LABEL.baselineOffset}
        textAnchor={anchor}
        style={TEXT_STYLE}
      >
        {`${payload.value}%`}
      </text>
    );
  };

  const handleLegendClick = (measure) => {
    setActiveMeasure((current) =>
      current === measure ? null : measure,
    );

    setHoveredMeasure(null);
  };

       const renderDot = (measure) =>
    ({ cx, cy, payload, index }) => {
      if (cx == null || cy == null || !payload) {
        return null;
      }

      const customerId =
        measure === 'sales'
          ? payload.salesCustomerId
          : payload.profitCustomerId;

      const selected =
        selectedCustomerId != null &&
        customerId != null &&
        String(selectedCustomerId) === String(customerId);

      const hasSelection = selectedCustomerId != null;

      const curveIsActive =
        activeMeasure == null || activeMeasure === measure;

      const opacity = selected
        ? 1
        : !curveIsActive
          ? CUSTOMER_CONCENTRATION_DIM_OPACITY * 0.45
          : hasSelection
            ? 0.25
            : 1;

      const isCallout =
        !payload.isOrigin && calloutIndices[measure] === index;

      const showMarker =
        payload.isOrigin || customerId != null;

      if (!showMarker && !isCallout) {
        return null;
      }

      const metricValue =
        measure === 'sales'
          ? payload.salesCumulativePercentage
          : payload.profitCumulativePercentage;

      const isProfit = measure === 'profit';

      const dotRadius = selected
        ? 6.5
        : isCallout
          ? 5.5
          : markerIndices.has(index)
            ? 4.5
            : 1.35;

      const isRegularCustomerDot =
        !selected &&
        !payload.isOrigin &&
        !markerIndices.has(index) &&
        !isCallout;

      return (
        <g key={`${measure}-${index}`}>
          {showMarker && (
            <circle
              cx={cx}
              cy={cy}
              r={dotRadius}
              fill={CUSTOMER_CONCENTRATION_COLORS[measure]}
              fillOpacity={opacity}
              stroke={
                isRegularCustomerDot ? 'none' : '#FFFFFF'
              }
              strokeWidth={isRegularCustomerDot ? 0 : 1.5}
              style={{
                cursor:
                  customerId != null && curveIsActive
                    ? 'pointer'
                    : 'default',
                outline: 'none',
                pointerEvents: curveIsActive ? 'auto' : 'none',
              }}
              onClick={(event) => {
                event.stopPropagation();

                if (customerId != null && curveIsActive) {
                  onSelectCustomer?.(customerId);
                }
              }}
            />
          )}

          {isCallout && Number.isFinite(metricValue) && (
            <g transform={`translate(${cx}, ${cy})`}>
              <line
                x1={0}
                y1={isProfit ? -7 : 7}
                x2={0}
                y2={isProfit ? -15 : 15}
                stroke={CUSTOMER_CONCENTRATION_COLORS[measure]}
                strokeWidth={1.5}
                strokeOpacity={opacity}
              />

              <text
                x={0}
                y={isProfit ? -19 : 26}
                textAnchor="middle"
                fill={CUSTOMER_CONCENTRATION_COLORS[measure]}
                fillOpacity={opacity}
                fontSize={12}
                fontWeight={700}
                style={{
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                {formatPercentage(metricValue)}
              </text>
            </g>
          )}
        </g>
      );
    };

  const tooltipMeasure =
    activeMeasure != null
      ? hoveredMeasure === activeMeasure
        ? activeMeasure
        : null
      : hoveredMeasure;

  const summary = `Customer concentration for ${customerCount} customers. Sales and Profit are ranked independently and plotted cumulatively against percentage of customers.`;

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      role="group"
      aria-label={summary}
    >
      <div className={styles.legend}>
        {(['sales', 'profit']).map((measure) => {
          const isActive =
            activeMeasure == null || activeMeasure === measure;

          return (
            <button
              key={measure}
              type="button"
              className={styles.legendItem}
              aria-pressed={activeMeasure === measure}
              onClick={() => handleLegendClick(measure)}
              style={{
                opacity: isActive ? 1 : 0.4,
                border: 0,
                padding: 0,
                background: 'transparent',
                color: 'inherit',
                font: 'inherit',
              }}
            >
              <span
                className={styles.legendLine}
                style={{
                  background: CUSTOMER_CONCENTRATION_COLORS[measure],
                }}
              />
              <span>{CUSTOMER_CONCENTRATION_LABELS[measure]}</span>
            </button>
          );
        })}
      </div>

      {hasData && (
        <LineChart
          width={width}
          height={height}
          data={chartData}
          margin={{
            top: plotTop,
            right: CUSTOMER_CONCENTRATION_PLOT.rightMargin,
            bottom: 0,
            left: 0,
          }}
          style={{ outline: 'none' }}
          onMouseMove={handleChartMouseMove}
          onMouseLeave={() => setHoveredMeasure(null)}
        >
          <CartesianGrid
            stroke={CUSTOMER_CONCENTRATION_GRID_COLOR}
            strokeWidth={1}
            vertical={false}
            horizontalPoints={axis.ticks.map(yPx)}
          />

          <XAxis
            dataKey="customerPercentage"
            type="number"
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            interval={0}
            height={CUSTOMER_CONCENTRATION_X_AXIS_HEIGHT}
            tickLine={false}
            axisLine={{ stroke: CUSTOMER_CONCENTRATION_AXIS_COLOR }}
            tick={renderXTick}
          />

          <YAxis
            type="number"
            domain={[axis.min, axis.max]}
            ticks={axis.ticks}
            interval={0}
            width={CUSTOMER_CONCENTRATION_PLOT.left}
            tickLine={false}
            axisLine={false}
            tick={renderYTick}
          />

          <Tooltip
            content={
              <ConcentrationTooltip measure={tooltipMeasure} />
            }
            cursor={false}
            isAnimationActive={false}
            wrapperStyle={{
              outline: 'none',
              zIndex: 10,
            }}
          />

          <Line
            type="monotone"
            dataKey="salesCumulativePercentage"
            name="Sales"
            stroke={CUSTOMER_CONCENTRATION_COLORS.sales}
            strokeWidth={3}
            strokeOpacity={
              activeMeasure == null || activeMeasure === 'sales'
                ? 1
                : 0.25
            }
            dot={renderDot('sales')}
            activeDot={false}
            isAnimationActive={false}
            connectNulls={false}
          />

          <Line
            type="monotone"
            dataKey="profitCumulativePercentage"
            name="Profit"
            stroke={CUSTOMER_CONCENTRATION_COLORS.profit}
            strokeWidth={3}
            strokeOpacity={
              activeMeasure == null || activeMeasure === 'profit'
                ? 1
                : 0.25
            }
            dot={renderDot('profit')}
            activeDot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
        </LineChart>
      )}

      {!hasData && (
        <div className={styles.empty}>
          No data for this selection
        </div>
      )}
    </div>
  );
}
