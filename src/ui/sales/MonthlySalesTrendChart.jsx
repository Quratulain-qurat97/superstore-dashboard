import { useEffect, useId, useRef, useState } from 'react';

import {
  Area,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  formatAxisCurrency,
  formatCompactCurrency,
  formatCurrency,
} from '../../core/index.js';

import styles from './MonthlySalesTrendChart.module.css';

const PREVIOUS_COLOR = '#9333EA';
const CURRENT_COLOR = '#2563EB';
const HIT_RADIUS = 12;

// ---- Hover tooltip ---------------------------------------------------------------------------

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const previous = payload.find(
    (item) =>
      item.dataKey === 'previousSales' &&
      item.name?.includes('Sales')
  );

  const current = payload.find(
    (item) =>
      item.dataKey === 'sales' &&
      item.name?.includes('Sales')
  );

  const entries = [previous, current].filter(
    (item) => item && item.value != null
  );

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{label}</p>

      {entries.map((item) => (
        <div key={item.dataKey} className={styles.tooltipRow}>
          <span className={styles.tooltipLabel}>
            <span
              className={styles.tooltipDot}
              style={{ backgroundColor: item.color }}
            />
            {item.name}
          </span>

          <span className={styles.tooltipValue}>
            {formatCurrency(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function createLabel({ x, y, value, index, position }) {
  if (
    value == null ||
    x == null ||
    y == null ||
    index % 2 === 0
  ) {
    return null;
  }

  const label = formatCompactCurrency(value);
  const width = label.length * 7 + 10;
  const height = 20;

  const offsetY = position === 'above' ? -30 : 18;
  const offsetX = position === 'above' ? -10 : -6;

  return (
    <g
      transform={`translate(${x + offsetX}, ${y + offsetY})`}
      pointerEvents="none"
    >
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        rx={4}
        fill="#E5E7EB"
        fillOpacity={0.85}
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

function PreviousYearLabel(props) {
  return createLabel({ ...props, position: 'above' });
}

function CurrentYearLabel(props) {
  return createLabel({ ...props, position: 'below' });
}

function findNearestMonth(points, clickX, clickY) {
  let nearest = null;
  let minimumDistance = Infinity;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];

    if (!start || !end) continue;

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) continue;

    const projection = Math.max(
      0,
      Math.min(
        1,
        ((clickX - start.x) * dx +
          (clickY - start.y) * dy) /
          lengthSquared
      )
    );

    const projectedX = start.x + projection * dx;
    const projectedY = start.y + projection * dy;

    const distance = Math.hypot(
      clickX - projectedX,
      clickY - projectedY
    );

    if (distance < minimumDistance) {
      minimumDistance = distance;
      nearest = projection < 0.5 ? start : end;
    }
  }

  return minimumDistance <= HIT_RADIUS ? nearest : null;
}

function getSvgCoordinates(event, svg) {
  const nativeEvent = event?.nativeEvent ?? event;

  if (!svg || typeof nativeEvent?.clientX !== 'number') {
    return null;
  }

  const point = svg.createSVGPoint();

  point.x = nativeEvent.clientX;
  point.y = nativeEvent.clientY;

  const matrix = svg.getScreenCTM();

  if (!matrix) return null;

  return point.matrixTransform(matrix.inverse());
}

function MonthDot({
  cx,
  cy,
  index,
  payload,
  yearType,
  pointsRef,
  selectedMonth,
}) {
  if (cx == null || cy == null) return null;

  const monthKey =
    yearType === 'previous'
      ? payload?.previousMonthKey
      : payload?.currentMonthKey;

  if (!monthKey) return null;

  pointsRef.current[yearType][index] = {
    x: cx,
    y: cy,
    key: monthKey,
  };

  const selected = selectedMonth === monthKey;

  const color =
    yearType === 'previous' ? PREVIOUS_COLOR : CURRENT_COLOR;

  return (
    <g pointerEvents="none">
      {selected && (
        <circle
          cx={cx}
          cy={cy}
          r={9}
          fill={color}
          fillOpacity={0.16}
          stroke={color}
          strokeWidth={2}
        />
      )}

      <circle
        cx={cx}
        cy={cy}
        r={selected ? 5 : 4}
        fill={color}
        stroke="none"
      />
    </g>
  );
}

export default function MonthlySalesTrendChart({
  series,
  selectedYear,
  selectedMonth,
  onSelectMonth,
}) {
  const gradientId = useId().replace(/:/g, '');

  const plotRef = useRef(null);

  const pointsRef = useRef({
    previous: [],
    current: [],
  });

  const [activeYear, setActiveYear] = useState(null);

  if (!series?.length) return null;

  const currentYear = Number(selectedYear) || 2017;
  const previousYear = currentYear - 1;

  const previousGradient = `${gradientId}-previous`;
  const currentGradient = `${gradientId}-current`;

  const selectedMonthYear = selectedMonth
    ? Number(selectedMonth.slice(0, 4))
    : null;

  const previousDimmed = activeYear
    ? activeYear !== 'previous'
    : selectedMonthYear !== null &&
      selectedMonthYear !== previousYear;

  const currentDimmed = activeYear
    ? activeYear !== 'current'
    : selectedMonthYear !== null &&
      selectedMonthYear !== currentYear;

  // Each line has its own handler.
  // The selected legend year controls which line can respond.
  const handleLineClick = (yearType) => (...args) => {
    if (activeYear && activeYear !== yearType) {
      return;
    }

    const event = args.find(
      (arg) =>
        typeof arg?.clientX === 'number' ||
        typeof arg?.nativeEvent?.clientX === 'number'
    );

    if (!event) {
      return;
    }

    const svg = plotRef.current?.querySelector('svg');
    const coordinates = getSvgCoordinates(event, svg);

    if (!coordinates) return;

    const nearest = findNearestMonth(
      pointsRef.current[yearType],
      coordinates.x,
      coordinates.y
    );

    if (nearest) {
      onSelectMonth?.(nearest.key);
    }
  };

  // Clicking the active legend item again restores both lines.
  const handleLegendClick = (yearType) => {
    setActiveYear((current) =>
      current === yearType ? null : yearType
    );
  };

  return (
    <div className={styles.chart}>
      <div className={styles.legend}>
        {currentYear > 2014 && (
          <button
            type="button"
            className={styles.legendItem}
            onClick={() => handleLegendClick('previous')}
            aria-pressed={activeYear === 'previous'}
            style={{
              opacity: previousDimmed ? 0.3 : 1,
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
              font: 'inherit',
            }}
          >
            <span className={`${styles.legendLine} ${styles.previousLine}`} />
            {previousYear} Sales
          </button>
        )}

        <button
          type="button"
          className={styles.legendItem}
          onClick={() => handleLegendClick('current')}
          aria-pressed={activeYear === 'current'}
          style={{
            opacity: currentDimmed ? 0.3 : 1,
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: 0,
            font: 'inherit',
          }}
        >
          <span className={`${styles.legendLine} ${styles.currentLine}`} />
          {currentYear} Sales
        </button>
      </div>

      <div
        className={styles.plot}
        ref={plotRef}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={series}
            margin={{ top: 38, right: 20, bottom: 38, left: 12 }}
          >
            <defs>
              <linearGradient
                id={previousGradient}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={PREVIOUS_COLOR} stopOpacity={0.35} />
                <stop offset="100%" stopColor={PREVIOUS_COLOR} stopOpacity={0.02} />
              </linearGradient>

              <linearGradient
                id={currentGradient}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={CURRENT_COLOR} stopOpacity={0.35} />
                <stop offset="100%" stopColor={CURRENT_COLOR} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#E5E7EB"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }}
              axisLine={{ stroke: '#D1D5DB' }}
              tickLine={false}
            />

            <YAxis
              tickFormatter={formatAxisCurrency}
              tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              width={72}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={false}
              filterNull
              isAnimationActive={false}
              wrapperStyle={{
                outline: 'none',
                zIndex: 10,
              }}
            />

            <Area
              type="monotone"
              dataKey="previousSales"
              name={`${previousYear} Sales`}
              stroke="none"
              fill={`url(#${previousGradient})`}
              fillOpacity={previousDimmed ? 0.2 : 1}
              connectNulls={false}
              legendType="none"
              tooltipType="none"
            />

            <Area
              type="monotone"
              dataKey="sales"
              name={`${currentYear} Sales`}
              stroke="none"
              fill={`url(#${currentGradient})`}
              fillOpacity={currentDimmed ? 0.2 : 1}
              connectNulls={false}
              legendType="none"
              tooltipType="none"
            />

            <Line
              type="monotone"
              dataKey="previousSales"
              name={`${previousYear} Sales`}
              stroke={PREVIOUS_COLOR}
              strokeWidth={3}
              strokeOpacity={previousDimmed ? 0.25 : 1}
              dot={(props) => (
                <MonthDot
                  {...props}
                  yearType="previous"
                  pointsRef={pointsRef}
                  selectedMonth={selectedMonth}
                />
              )}
              activeDot={false}
              connectNulls={false}
            >
              <LabelList
                dataKey="previousSales"
                content={PreviousYearLabel}
              />
            </Line>

            <Line
              type="monotone"
              dataKey="sales"
              name={`${currentYear} Sales`}
              stroke={CURRENT_COLOR}
              strokeWidth={3}
              strokeOpacity={currentDimmed ? 0.25 : 1}
              dot={(props) => (
                <MonthDot
                  {...props}
                  yearType="current"
                  pointsRef={pointsRef}
                  selectedMonth={selectedMonth}
                />
              )}
              activeDot={false}
              connectNulls={false}
            >
              <LabelList
                dataKey="sales"
                content={CurrentYearLabel}
              />
            </Line>

            {/* Previous-year interactive hit area */}
            <Line
              type="monotone"
              dataKey="previousSales"
              stroke="transparent"
              strokeWidth={24}
              strokeOpacity={1}
              style={{
                cursor: activeYear && activeYear !== 'previous'
                  ? 'default'
                  : 'pointer',
              }}
              pointerEvents={
                activeYear && activeYear !== 'previous'
                  ? 'none'
                  : 'stroke'
              }
              dot={false}
              activeDot={false}
              connectNulls={false}
              isAnimationActive={false}
              onClick={handleLineClick('previous')}
            />

            {/* Current-year interactive hit area */}
            <Line
              type="monotone"
              dataKey="sales"
              stroke="transparent"
              strokeWidth={24}
              strokeOpacity={1}
              style={{
                cursor: activeYear && activeYear !== 'current'
                  ? 'default'
                  : 'pointer',
              }}
              pointerEvents={
                activeYear && activeYear !== 'current'
                  ? 'none'
                  : 'stroke'
              }
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              onClick={handleLineClick('current')}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}