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

import styles from './ProductProfitMarginChart.module.css';
import { useMediaQuery } from '../hooks/useMediaQuery.js';

const POSITIVE_COLOR = '#16A34A';
const NEGATIVE_COLOR = '#EF4444';

const formatMargin = (value) =>
  value == null ? '—' : `${value.toFixed(1)}%`;

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;

  if (!item) return null;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>
        {item.subCategory}
      </p>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>
          Profit Margin
        </span>
        <span
          className={`${styles.tooltipValue} ${
            item.profitMargin < 0
              ? styles.negativeValue
              : styles.positiveValue
          }`}
        >
          {formatMargin(item.profitMargin)}
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
          Transaction Lines
        </span>
        <span className={styles.tooltipValue}>
          {item.transactionCount.toLocaleString('en-US')}
        </span>
      </div>
    </div>
  );
}

function MarginLabel({ x, y, width, value }) {
  // Negative bars intentionally have no data labels.
  if (value == null || value <= 0) return null;

  const label = formatMargin(value);
  const labelWidth = label.length * 7 + 12;

  return (
    <g
      transform={`translate(${x + width + 8}, ${y + 9})`}
      pointerEvents="none"
    >
      <rect
        x={-4}
        y={-10}
        width={labelWidth}
        height={19}
        rx={4}
        fill="#E5E7EB"
        fillOpacity={0.85}
      />

      <text
        x={labelWidth / 2 - 4}
        y={0}
        fill="#000000"
        fontSize={11}
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {label}
      </text>
    </g>
  );
}

export default function ProductProfitMarginChart({
  series,
  selectedCategory,
  selectedSubCategory,
  onSelectSubCategory,
}) {
  const isPhone = useMediaQuery('(max-width: 767px)');
  const chartData = useMemo(
    () =>
      (series ?? []).map((item) => ({
        ...item,
        chartValue: item.profitMargin ?? 0,
      })),
    [series],
  );

  const maxAbsMargin = Math.max(
    1,
    ...chartData.map((item) =>
      Math.abs(item.chartValue),
    ),
  );

  const axisLimit = Math.max(
    5,
    Math.ceil(maxAbsMargin / 5) * 5,
  );

  if (!chartData.length) {
    return (
      <div className={styles.empty}>
        No sub-category profitability data available
        for the selected filters.
      </div>
    );
  }

  return (
    <div
      className={styles.wrap}
      onClick={(event) => event.stopPropagation()}
    >
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.positiveSwatch} />
          <span>Positive Margin</span>
        </div>

        <div className={styles.legendItem}>
          <span className={styles.negativeSwatch} />
          <span>Negative Margin</span>
        </div>
      </div>

      <div className={styles.plot}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              top: 4,
              right: 65,
              bottom: 6,
              left: 8,
            }}
            barCategoryGap="28%"
          >
            <CartesianGrid
              horizontal={false}
              stroke="#E5E7EB"
              strokeDasharray="3 3"
            />

            <XAxis
              type="number"
              domain={[-axisLimit, axisLimit]}
              tickFormatter={(value) => `${value}%`}
              tick={{
                fill: '#6B7280',
                fontSize: 12,
                fontWeight: 600,
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              type="category"
              dataKey="subCategory"
              width={155}
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
              filterNull
              isAnimationActive={false}
              wrapperStyle={{
                outline: 'none',
                zIndex: 10,
              }}
            />

            <Bar
              dataKey="chartValue"
              name="Profit Margin"
              radius={[4, 4, 4, 4]}
              barSize={9}
              cursor="pointer"
              isAnimationActive={false}
              label={isPhone ? false : <MarginLabel />}
              shape={(props) => {
                const item = props.payload;
                const isNegative = item?.profitMargin < 0;

                let isMuted = false;

                if (selectedSubCategory) {
                  // Individual sub-category selection:
                  // only the selected bar stays fully colored.
                  isMuted =
                    item?.subCategory !== selectedSubCategory;
                } else if (selectedCategory) {
                  // Category filter:
                  // keep all bars, but tint other categories.
                  isMuted =
                    item?.category !== selectedCategory;
                }

                return (
                  <Rectangle
                    {...props}
                    fill={
                      isNegative
                        ? NEGATIVE_COLOR
                        : POSITIVE_COLOR
                    }
                    fillOpacity={isMuted ? 0.35 : 1}
                  />
                );
              }}
              onClick={(entry, index) => {
                const clickedItem =
                  chartData[index] ??
                  entry?.payload ??
                  entry;

                if (
                  clickedItem?.category &&
                  clickedItem?.subCategory
                ) {
                  onSelectSubCategory?.(
                    clickedItem.category,
                    clickedItem.subCategory,
                  );
                }
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}