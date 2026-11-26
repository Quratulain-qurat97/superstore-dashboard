
import { useMemo } from 'react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Rectangle,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatCurrency } from '../../core/index.js';

import { useMediaQuery } from '../hooks/useMediaQuery.js';

import styles from './ProductDiscountProfitChart.module.css';

const POSITIVE_COLOR = '#16A34A';
const NEGATIVE_COLOR = '#EF4444';

const axisCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const labelCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>
        {item.discountGroup}
      </p>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>
          Total Profit
        </span>
        <span
          className={`${styles.tooltipValue} ${
            item.profit < 0
              ? styles.negativeValue
              : styles.positiveValue
          }`}
        >
          {formatCurrency(item.profit)}
        </span>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>
          Total Sales
        </span>
        <span className={styles.tooltipValue}>
          {formatCurrency(item.sales)}
        </span>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>
          Average Discount
        </span>
        <span className={styles.tooltipValue}>
          {item.averageDiscount.toFixed(1)}%
        </span>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>
          Transaction Lines
        </span>
        <span className={styles.tooltipValue}>
          {item.transactionCount.toLocaleString('en-US')}
        </span>
      </div>
    </div>
  );
}

export default function ProductDiscountProfitChart({
  series,
  selectedDiscountGroup,
  onSelectDiscountGroup,
}) {
  const isPhone = useMediaQuery('(max-width: 767px)');

  const chartData = useMemo(
    () =>
      (series ?? []).map((item) => ({
        ...item,
        chartValue: item.profit ?? 0,
      })),
    [series],
  );

  const maxAbsProfit = Math.max(
    1,
    ...chartData.map((item) =>
      Math.abs(item.chartValue),
    ),
  );

  // Extra room on both sides for the data labels.
  const axisLimit = maxAbsProfit * 1.35;

  if (!chartData.length) {
    return (
      <div className={styles.empty}>
        No discount profitability data available
        for the selected filters.
      </div>
    );
  }

  function handleBarClick(entry, index) {
    const clickedItem =
      chartData[index] ??
      entry?.payload ??
      entry;

    if (clickedItem?.discountGroupKey) {
      onSelectDiscountGroup?.(
        clickedItem.discountGroupKey,
      );
    }
  }

  return (
    <div
      className={styles.wrap}
      onClick={(event) => event.stopPropagation()}
    >
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.positiveSwatch} />
          <span>Positive Profit</span>
        </div>

        <div className={styles.legendItem}>
          <span className={styles.negativeSwatch} />
          <span>Negative Profit</span>
        </div>
      </div>

      <div className={styles.plot}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              top: 4,
              right: 75,
              bottom: 6,
              left: 8,
            }}
            barCategoryGap="38%"
          >
            <CartesianGrid
              horizontal={false}
              stroke="#E5E7EB"
              strokeDasharray="3 3"
            />

            <XAxis
              type="number"
              domain={[-axisLimit, axisLimit]}
              tickFormatter={(value) =>
                axisCurrencyFormatter.format(value)
              }
              tick={{
                fill: '#6B7280',
                fontSize: 11,
                fontWeight: 600,
              }}
              axisLine={false}
              tickLine={false}
              tickCount={5}
            />

            <YAxis
              type="category"
              dataKey="discountGroup"
              width={165}
              interval={0}
              tick={{
                fill: '#374151',
                fontSize: 12,
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
              isAnimationActive={false}
              wrapperStyle={{
                outline: 'none',
                zIndex: 10,
              }}
            />

            <Bar
              dataKey="chartValue"
              name="Total Profit"
              radius={[4, 4, 4, 4]}
              barSize={24}
              cursor="pointer"
              isAnimationActive={false}
              shape={(props) => {
                const {
                  x,
                  y,
                  width,
                  height,
                  payload,
                } = props;

                const isNegative = payload?.profit < 0;

                const isMuted =
                  selectedDiscountGroup != null &&
                  payload?.discountGroupKey !== selectedDiscountGroup;

                const label = labelCurrencyFormatter.format(
                  payload?.profit ?? 0,
                );

                const labelWidth = label.length * 7 + 12;
                const centerY = y + height / 2;

                return (
                  <g>
                    <Rectangle
                      {...props}
                      fill={isNegative ? NEGATIVE_COLOR : POSITIVE_COLOR}
                      fillOpacity={isMuted ? 0.35 : 1}
                    />

                    {!isPhone && (
                      <g
                        transform={`translate(${
                          isNegative ? x - 8 : x + width + 8
                        }, ${centerY})`}
                        pointerEvents="none"
                      >
                        <rect
                          x={isNegative ? -labelWidth : 0}
                          y={-10}
                          width={labelWidth}
                          height={20}
                          rx={4}
                          fill="#E5E7EB"
                          fillOpacity={0.9}
                        />

                        <text
                          x={isNegative ? -labelWidth / 2 : labelWidth / 2}
                          y={0}
                          fill="#111827"
                          fontSize={11}
                          fontWeight={700}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              }}
              onClick={handleBarClick}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
