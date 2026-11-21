
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
  CUSTOMER_TOP10_BOX,
  CUSTOMER_TOP10_PLOT,
  CUSTOMER_TOP10_X_AXIS_HEIGHT,
  CUSTOMER_TOP10_BAR_SIZE,
  CUSTOMER_TOP10_COLORS,
  CUSTOMER_TOP10_DIM_OPACITY,
  CUSTOMER_TOP10_GRID_COLOR,
  CUSTOMER_TOP10_AXIS_COLOR,
  CUSTOMER_TOP10_TEXT,
  CUSTOMER_TOP10_VALUE_LABEL,
} from './customerTop10Geometry.js';

import styles from './CustomerTop10CustomersChart.module.css';

const DESIGN_WIDTH = 660;

const formatNumber = (value) =>
  Number(value ?? 0).toLocaleString('en-US');

const formatCurrency = (value) =>
  `$${Number(value ?? 0).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })}`;

const formatAxisCurrency = (value) => {
  if (value >= 1000) {
    return `$${Number(value / 1000).toLocaleString('en-US', {
      maximumFractionDigits: 1,
    })}k`;
  }

  return `$${formatNumber(value)}`;
};

const formatPercentage = (value) =>
  value == null ? '—' : `${Number(value).toFixed(1)}%`;

function getAxis(customers) {
  const maximum = Math.max(
    100,
    ...customers.map((customer) => customer.sales ?? 0),
  );

  const roughStep = maximum / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep || 1));
  const normalizedStep = roughStep / magnitude;

  const niceStep =
    normalizedStep <= 1
      ? 1
      : normalizedStep <= 2
        ? 2
        : normalizedStep <= 2.5
          ? 2.5
          : normalizedStep <= 5
            ? 5
            : 10;

  const step = niceStep * magnitude;
  const max = Math.ceil(maximum / step) * step;

  return {
    max,
    ticks: Array.from(
      { length: Math.round(max / step) + 1 },
      (_, index) => index * step,
    ),
  };
}

function CustomerTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const customer = payload[0]?.payload;

  if (!customer) {
    return null;
  }

  const color = customer.isProfitable
    ? CUSTOMER_TOP10_COLORS.positive
    : CUSTOMER_TOP10_COLORS.negative;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>
        #{customer.rank} {customer.customerName}
      </p>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>
          <span
            className={styles.swatch}
            style={{ background: color }}
          />
          Sales
        </span>

        <span className={styles.tooltipValue}>
          {formatCurrency(customer.sales)}
        </span>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Profit</span>

        <span className={styles.tooltipValue}>
          {formatCurrency(customer.profit)}
        </span>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Profit Margin</span>

        <span className={styles.tooltipValue}>
          {formatPercentage(customer.profitMargin)}
        </span>
      </div>
    </div>
  );
}

export default function CustomerTop10CustomersChart({
  series,
  selectedCustomerId,
  onSelectCustomer,
  fallbackWidth = DESIGN_WIDTH,
}) {
  const wrapRef = useRef(null);
  const width = useElementWidth(wrapRef, fallbackWidth);

  const customers = series ?? [];

  const chartData = useMemo(
    () =>
      customers.map((customer) => ({
        ...customer,
        displayName: `${customer.rank}. ${customer.customerName}`,
      })),
    [customers],
  );

  const axis = useMemo(
    () => getAxis(chartData),
    [chartData],
  );

  const hasSelection = selectedCustomerId != null;

  const getCustomerOpacity = (customer) => {
    if (!hasSelection) {
      return 1;
    }

    return String(selectedCustomerId) === String(customer.customerId)
      ? 1
      : CUSTOMER_TOP10_DIM_OPACITY;
  };

  const renderXAxisTick = ({ x, y, payload }) => (
    <text
      x={x}
      y={y + 20}
      textAnchor="middle"
      style={CUSTOMER_TOP10_TEXT}
    >
      {formatAxisCurrency(payload.value)}
    </text>
  );

  const renderYAxisTick = ({ x, y, payload }) => (
    <text
      x={x - 8}
      y={y + 4}
      textAnchor="end"
      style={CUSTOMER_TOP10_TEXT}
    >
      {payload.value}
    </text>
  );

  const renderBar = ({
    x,
    y,
    width: barWidth,
    height: barHeight,
    payload,
    index,
  }) => {
    if (
      !payload ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !(barWidth > 0) ||
      !(barHeight > 0)
    ) {
      return null;
    }

    const fill = payload.isProfitable
      ? CUSTOMER_TOP10_COLORS.positive
      : CUSTOMER_TOP10_COLORS.negative;

    const opacity = getCustomerOpacity(payload);

    return (
      <rect
        key={`customer-bar-${index}`}
        x={x}
        y={y}
        width={barWidth}
        height={barHeight}
        rx={4}
        ry={4}
        fill={fill}
        opacity={opacity}
        style={{
          cursor: 'pointer',
          outline: 'none',
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelectCustomer?.(payload.customerId);
        }}
      />
    );
  };

  const renderValueLabel = ({
    x,
    y,
    width: barWidth,
    height: barHeight,
    payload,
  }) => {
    if (
      x == null ||
      y == null ||
      barWidth == null ||
      barHeight == null ||
      !payload
    ) {
      return null;
    }

    return (
      <text
        x={x + barWidth + CUSTOMER_TOP10_VALUE_LABEL.offset}
        y={y + barHeight / 2}
        dominantBaseline="middle"
        textAnchor="start"
        fill={CUSTOMER_TOP10_VALUE_LABEL.fill}
        fontSize={CUSTOMER_TOP10_VALUE_LABEL.fontSize}
        fontWeight={CUSTOMER_TOP10_VALUE_LABEL.fontWeight}
        opacity={getCustomerOpacity(payload)}
        style={{ pointerEvents: 'none' }}
      >
        {formatCurrency(payload.sales)}
      </text>
    );
  };

  const summary = `Top ${customers.length} customers ranked by sales. Green bars represent customers with non-negative profit; red bars represent customers with negative profit.`;

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      role="group"
      aria-label={summary}
    >
      {chartData.length > 0 && (
        <BarChart
          width={width}
          height={CUSTOMER_TOP10_BOX.height}
          data={chartData}
          layout="vertical"
          margin={{
            top: CUSTOMER_TOP10_PLOT.top,
            right: CUSTOMER_TOP10_PLOT.rightMargin,
            bottom: 0,
            left: 0,
          }}
          style={{ outline: 'none' }}
        >
          <CartesianGrid
            stroke={CUSTOMER_TOP10_GRID_COLOR}
            strokeWidth={1}
            vertical
            horizontal={false}
          />

          <XAxis
            type="number"
            domain={[0, axis.max]}
            ticks={axis.ticks}
            interval={0}
            height={CUSTOMER_TOP10_X_AXIS_HEIGHT}
            tickLine={false}
            axisLine={{
              stroke: CUSTOMER_TOP10_AXIS_COLOR,
            }}
            tick={renderXAxisTick}
          />

          <YAxis
            type="category"
            dataKey="displayName"
            width={CUSTOMER_TOP10_PLOT.left}
            interval={0}
            reversed
            tickLine={false}
            axisLine={false}
            tick={renderYAxisTick}
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

          <Bar
            dataKey="sales"
            barSize={CUSTOMER_TOP10_BAR_SIZE}
            isAnimationActive={false}
            shape={renderBar}
          >
            <LabelList
              dataKey="sales"
              position="right"
              content={renderValueLabel}
            />
          </Bar>
        </BarChart>
      )}

      {chartData.length === 0 && (
        <div className={styles.empty}>
          No data for this selection
        </div>
      )}
    </div>
  );
}
