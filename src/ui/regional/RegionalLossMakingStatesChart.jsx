import { useMemo } from 'react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Rectangle,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  formatCurrency,
  formatPercent,
  formatCompactCurrency,
} from '../../core/index.js';

import styles from './RegionalLossMakingStatesChart.module.css';
import { useMediaQuery } from '../hooks/useMediaQuery.js';

const BAR_COLOR = '#EF4444';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{item.state}</p>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Region</span>
        <strong>{item.region}</strong>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Sales</span>
        <strong>{formatCurrency(item.sales)}</strong>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Profit</span>
        <strong className={styles.negativeValue}>
          {formatCurrency(item.profit)}
        </strong>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Profit Margin</span>
        <strong className={styles.negativeValue}>
          {formatPercent(item.margin, 2)}
        </strong>
      </div>
    </div>
  );
}



function LossLabel({ x, y, height, width, value }) {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(x) ||
    !Number.isFinite(width)
  ) {
    return null;
  }

  const label = formatCompactCurrency(value);
  const labelWidth = label.length * 8 + 12;
  const centerY = y + height / 2;

  // Find the left edge of the negative bar.
  const barLeft = x - Math.abs(width);

  // Place the label just before that edge.
  const labelX = barLeft - labelWidth - 8;

  return (
    <g transform={`translate(${labelX}, ${centerY})`}>
      <rect
        x={0}
        y={-10}
        width={labelWidth}
        height={21}
        rx={4}
        fill="#E5E7EB"
        fillOpacity={0.85}
      />

      <text
        x={labelWidth / 2}
        y={0}
        fill="#000000"
        fontSize={13}
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {label}
      </text>
    </g>
  );
}



export default function RegionalLossMakingStatesChart({
  states,
  selectedRegion,
  selectedState,
  onStateSelect,
}) {
  const isPhone = useMediaQuery('(max-width: 767px)');
  const chartData = useMemo(
    () =>
      (states ?? [])
        .filter(
          (state) =>
            Number.isFinite(state.profit) &&
            state.profit < 0,
        )
        .sort((a, b) => a.profit - b.profit),
    [states],
  );

  const lowestProfit = Math.min(
    0,
    ...chartData.map((state) => state.profit),
  );

  const xAxisMin = lowestProfit < 0
    ? Math.floor((lowestProfit * 1.3) / 1000) * 1000
    : -1000;

  if (chartData.length === 0) {
    return (
      <div className={styles.empty}>
        No loss-making states found for the selected filters.
      </div>
    );
  }

  return (
    <div
      className={styles.wrap}
      onClick={(event) => event.stopPropagation()}
    >
      <div className={styles.plot}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 12, bottom: 12, left: 5 }}
            barCategoryGap="16%"
          >
            <CartesianGrid
              horizontal={false}
              stroke="#E5E7EB"
              strokeDasharray="3 3"
            />

            <XAxis
              type="number"
              domain={[xAxisMin, 0]}
              tickFormatter={(value) => formatCompactCurrency(value)}
              tick={{
                fill: '#6B7280',
                fontSize: 11,
                fontWeight: 600,
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              type="category"
              dataKey="state"
              width={112}
              tick={{
                fill: '#111827',
                fontSize: 11,
                fontWeight: 600,
              }}
              axisLine={false}
              tickLine={false}
            />

            <ReferenceLine
              x={0}
              stroke="#6B7280"
              strokeWidth={1.5}
            />

            <Tooltip
  content={<CustomTooltip />}
  cursor={{
    fill: '#F3F4F6',
    fillOpacity: 0.7,
  }}
  offset={isPhone ? 2 : 8}
  wrapperStyle={{
    ...(isPhone ? {} : { marginLeft: '-228px' }),
    pointerEvents: 'none',
    zIndex: 1000,
  }}
/>

            <Bar
              dataKey="profit"
              name="Profit"
              radius={[5, 0, 0, 5]}
              barSize={16}
              cursor="pointer"
              isAnimationActive={false}
              shape={(props) => {
                const item = props.payload;

                const isMuted = selectedState
                  ? item?.state !== selectedState
                  : selectedRegion
                    ? item?.region !== selectedRegion
                    : false;

                return (
                  <Rectangle
                  {...props}
                  fill={BAR_COLOR}
                  fillOpacity={isMuted ? 0.35 : 1}
                  radius={[0, 5, 5, 0]}
                  />
                );
              }}
              onClick={(entry, index) => {
                const clickedItem =
                  chartData[index] ?? entry?.payload ?? entry;

                if (clickedItem?.state && clickedItem?.region) {
                  onStateSelect?.(
                    clickedItem.state,
                    clickedItem.region,
                  );
                }
              }}
            >
              {!isPhone && (
                <LabelList content={<LossLabel />} />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}