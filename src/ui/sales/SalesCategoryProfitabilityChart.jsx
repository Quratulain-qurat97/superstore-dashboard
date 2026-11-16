
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

import {
  formatAxisCurrency,
  formatCurrency,
  formatPercent,
} from '../../core/index.js';

import styles from './SalesCategoryProfitabilityChart.module.css';

const POSITIVE_COLOR = '#3B82F6';
const NEGATIVE_COLOR = '#EF4444';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;

  if (!item) return null;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>
        {item.category} · {item.subCategory}
      </p>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Sales</span>
        <strong>{formatCurrency(item.sales)}</strong>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Profit</span>
        <strong
          className={
            item.isNegative ? styles.negativeValue : styles.positiveValue
          }
        >
          {formatCurrency(item.profit)}
        </strong>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Profit Margin</span>
        <strong
          className={
            item.margin < 0 ? styles.negativeValue : styles.positiveValue
          }
        >
          {formatPercent(item.margin)}
        </strong>
      </div>
    </div>
  );
}

function ProfitLabel({ x, y, width, value }) {
  if (value == null || value === 0) return null;

  if (width < 55) return null;

  const label = formatAxisCurrency(value);
  const labelWidth = label.length * 8 + 12;
  const isNegative = value < 0;

  return (
    <g
      transform={`translate(${isNegative ? x - 8 : x + width + 8}, ${y + 9})`}
    >
      <rect
        x={isNegative ? -labelWidth + 4 : -4}
        y={-10}
        width={labelWidth}
        height={19}
        rx={4}
        fill="#E5E7EB"
        fillOpacity={0.85}
      />

      <text
        x={isNegative ? 0 : labelWidth / 2 - 4}
        y={0}
        fill={isNegative ? NEGATIVE_COLOR : '#000000'}
        fontSize={12}
        fontWeight={700}
        textAnchor={isNegative ? 'end' : 'middle'}
        dominantBaseline="middle"
      >
        {label}
      </text>
    </g>
  );
}

export default function SalesCategoryProfitabilityChart({
  series,
  selectedCategory,
  selectedSubCategory,
  onSelectSubCategory,
}) {
  const chartData = useMemo(() => {
    return (series?.categories ?? []).flatMap((category) =>
      category.subCategories.map((item, index) => ({
        ...item,
        category: category.category,
        label:
          index === 0
            ? `${category.category} · ${item.subCategory}`
            : item.subCategory,
      })),
    );
  }, [series]);

  const maxAbsProfit = Math.max(
    1,
    ...chartData.map((item) => Math.abs(item.profit)),
  );

  const axisLimit = Math.ceil((maxAbsProfit * 1.08) / 100) * 100;

  if (!series?.hasAnyData || chartData.length === 0) {
    return (
      <div className={styles.empty}>
        No category profitability data available for the selected filters.
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
            margin={{ top: 4, right: 65, bottom: 6, left: 8 }}
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
              tickFormatter={formatAxisCurrency}
              tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600, }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              type="category"
              dataKey="label"
              width={220}
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
            />

            <Bar
              dataKey="profit"
              name="Profit"
              radius={[4, 4, 4, 4]}
              barSize={9}
              cursor="pointer"
              label={<ProfitLabel />}
              shape={(props) => {
                const item = props.payload;
                const isNegative = item?.profit < 0;

                const isMuted = selectedSubCategory
                  ? item?.subCategory !== selectedSubCategory ||
                    item?.category !== selectedCategory
                  : selectedCategory
                    ? item?.category !== selectedCategory
                    : false;

                return (
                  <Rectangle
                    {...props}
                    fill={isNegative ? NEGATIVE_COLOR : POSITIVE_COLOR}
                    fillOpacity={isMuted ? 0.35 : 1}
                  />
                );
              }}
              onClick={(entry, index) => {
                const clickedItem =
                  chartData[index] ?? entry?.payload ?? entry;

                if (clickedItem?.category && clickedItem?.subCategory) {
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
