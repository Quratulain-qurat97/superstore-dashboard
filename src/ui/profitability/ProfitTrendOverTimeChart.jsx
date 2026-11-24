
import { useId, useRef } from 'react';

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
  ACTIONS,
  ALL,
  formatAxisCurrency,
  formatCompactCurrency,
  formatCurrency,
} from '../../core/index.js';

import styles from './ProfitTrendOverTimeChart.module.css';

const YEARS = [2014, 2015, 2016, 2017];

const YEAR_COLORS = {
  2014: '#9333EA',
  2015: '#2563EB',
  2016: '#16A34A',
  2017: '#EC4899',
};

const HIT_RADIUS = 12;

function CustomTooltip({ active, payload, label, activeYear }) {
  if (!active || !payload?.length) return null;

  const entries = YEARS
    .filter((year) => activeYear == null || year === activeYear)
    .map((year) => {
      const item = payload.find(
        (entry) => entry.dataKey === `profit${year}`,
      );

      return item
        ? { year, value: item.value }
        : null;
    })
    .filter((item) => item && item.value != null);

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{label}</p>

      {entries.map((item) => (
        <p key={item.year} className={styles.tooltipRow}>
          <span
            className={styles.tooltipDot}
            style={{ backgroundColor: YEAR_COLORS[item.year] }}
          />
          <span>{item.year} Profit:</span>
          <strong>{formatCurrency(item.value)}</strong>
        </p>
      ))}
    </div>
  );
}

function createLabel({ x, y, value, index }) {
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

  return (
    <g
      transform={`translate(${x}, ${y - 25})`}
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
        (
          (clickX - start.x) * dx +
          (clickY - start.y) * dy
        ) / lengthSquared,
      ),
    );

    const projectedX = start.x + projection * dx;
    const projectedY = start.y + projection * dy;

    const distance = Math.hypot(
      clickX - projectedX,
      clickY - projectedY,
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

function ProfitDot({
  cx,
  cy,
  index,
  payload,
  year,
  pointsRef,
  selectedMonth,
}) {
  if (cx == null || cy == null) return null;

  const monthKey = payload?.[`monthKey${year}`];

  if (!monthKey) return null;

  pointsRef.current[year][index] = {
    x: cx,
    y: cy,
    key: monthKey,
  };

  const selected = selectedMonth === monthKey;
  const color = YEAR_COLORS[year];

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

export default function ProfitTrendOverTimeChart({
  series,
  selectedYear,
  selectedMonth,
  dispatch,
}) {
  const gradientId = useId().replace(/:/g, '');
  const plotRef = useRef(null);

  const pointsRef = useRef({
    2014: [],
    2015: [],
    2016: [],
    2017: [],
  });

  if (!series?.length) return null;

  const activeYear = selectedYear == null
    ? null
    : Number(selectedYear);

  const gradients = Object.fromEntries(
    YEARS.map((year) => [
      year,
      `${gradientId}-year-${year}`,
    ]),
  );

  const handleLegendClick = (year) => {
    if (activeYear === year) {
      dispatch({
        type: ACTIONS.SET_DROPDOWN,
        dimension: 'year',
        value: ALL,
      });

      dispatch({ type: ACTIONS.CLEAR_MONTH });
      return;
    }

    dispatch({
      type: ACTIONS.SET_DROPDOWN,
      dimension: 'year',
      value: year,
    });
  };

  const handleLineClick = (year) => (...args) => {
    // A year must be isolated before a monthly point can be selected.
    if (activeYear !== year) return;

    const event = args.find(
      (arg) =>
        typeof arg?.clientX === 'number' ||
        typeof arg?.nativeEvent?.clientX === 'number',
    );

    if (!event) return;

    const svg = plotRef.current?.querySelector('svg');
    const coordinates = getSvgCoordinates(event, svg);

    if (!coordinates) return;

    const nearest = findNearestMonth(
      pointsRef.current[year],
      coordinates.x,
      coordinates.y,
    );

    if (nearest) {
      dispatch({
        type: ACTIONS.SELECT_MONTH,
        month: nearest.key,
      });
    }
  };

  return (
    <div className={styles.chart}>
      <div className={styles.legend}>
        {YEARS.map((year) => {
          const dimmed = activeYear != null && activeYear !== year;

          return (
            <button
              key={year}
              type="button"
              className={styles.legendItem}
              onClick={() => handleLegendClick(year)}
              aria-pressed={activeYear === year}
              style={{
                opacity: dimmed ? 0.3 : 1,
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: 0,
                font: 'inherit',
              }}
            >
              <span
                className={styles.legendLine}
                style={{ backgroundColor: YEAR_COLORS[year] }}
              />
              {year}
            </button>
          );
        })}
      </div>

      <div className={styles.plot} ref={plotRef}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={series}
            margin={{ top: 38, right: 20, bottom: 38, left: 12 }}
          >
            <defs>
              {YEARS.map((year) => (
                <linearGradient
                  key={year}
                  id={gradients[year]}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={YEAR_COLORS[year]}
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="100%"
                    stopColor={YEAR_COLORS[year]}
                    stopOpacity={0.01}
                  />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid
              stroke="#E5E7EB"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              tick={{
                fill: '#6B7280',
                fontSize: 12,
                fontWeight: 600,
              }}
              axisLine={{ stroke: '#D1D5DB' }}
              tickLine={false}
            />

            <YAxis
              tickFormatter={formatAxisCurrency}
              tick={{
                fill: '#6B7280',
                fontSize: 12,
                fontWeight: 600,
              }}
              axisLine={false}
              tickLine={false}
              width={72}
            />

            <Tooltip
            content={<CustomTooltip activeYear={activeYear} />}
            filterNull
            />

            {YEARS.map((year) => {
              const dimmed = activeYear != null && activeYear !== year;
              const color = YEAR_COLORS[year];
              const dataKey = `profit${year}`;

              return (
                <Area
                  key={`area-${year}`}
                  type="monotone"
                  dataKey={dataKey}
                  name={`${year} Profit`}
                  stroke="none"
                  fill={`url(#${gradients[year]})`}
                  fillOpacity={dimmed ? 0.15 : 1}
                  connectNulls={false}
                  legendType="none"
                  tooltipType="none"
                />
              );
            })}

            {YEARS.map((year) => {
              const dimmed = activeYear != null && activeYear !== year;
              const color = YEAR_COLORS[year];
              const dataKey = `profit${year}`;

              return (
                <Line
                  key={`line-${year}`}
                  type="monotone"
                  dataKey={dataKey}
                  name={`${year} Profit`}
                  stroke={color}
                  strokeWidth={3}
                  strokeOpacity={dimmed ? 0.25 : 1}
                  dot={(props) => (
                    <ProfitDot
                      {...props}
                      year={year}
                      pointsRef={pointsRef}
                      selectedMonth={selectedMonth}
                    />
                  )}
                  activeDot={false}
                  connectNulls={false}
                >
                  {activeYear === year && (
                    <LabelList
                      dataKey={dataKey}
                      content={createLabel}
                    />
                  )}
                </Line>
              );
            })}

            {/* Only the isolated year's line accepts monthly clicks. */}
            {YEARS.map((year) => (
              <Line
                key={`hit-${year}`}
                type="monotone"
                dataKey={`profit${year}`}
                stroke="transparent"
                strokeWidth={24}
                strokeOpacity={1}
                style={{
                  cursor: activeYear === year ? 'pointer' : 'default',
                }}
                pointerEvents={activeYear === year ? 'stroke' : 'none'}
                dot={false}
                activeDot={false}
                connectNulls={false}
                isAnimationActive={false}
                onClick={handleLineClick(year)}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
