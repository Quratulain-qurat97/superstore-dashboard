
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

import { useMediaQuery } from '../hooks/useMediaQuery.js';

import styles from './Top10ProductsByNetLossChart.module.css';

const BAR_COLOR = '#EF4444';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{item.productName}</p>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Category</span>
        <strong>{item.category}</strong>
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
          {formatPercent(item.profitMargin, 2)}
        </strong>
      </div>
    </div>
  );
}

function ProductTick({ x, y, payload }) {
  const name = String(payload.value ?? '');
  const words = name.split(' ');
  const lines = [];
  let currentLine = '';

  // Wrap product names into at most two lines.
  words.forEach((word) => {
    const candidate = currentLine
      ? `${currentLine} ${word}`
      : word;

    if (candidate.length > 13 && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  });

  if (currentLine) lines.push(currentLine);

  const visibleLines = lines.slice(0, 2);

  return (
    <g transform={`translate(${x},${y})`}>
      {visibleLines.map((line, index) => (
        <text
          key={index}
          x={-10}
          y={visibleLines.length === 1 ? 4 : index * 13 - 2}
          textAnchor="end"
          fill="#111827"
          fontSize={10}
          fontWeight={600}
        >
          {line}
        </text>
      ))}
    </g>
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

export default function Top10ProductsByNetLossChart({
  products,
  selectedProductId,
  onProductSelect,
}) {
  const isPhone = useMediaQuery('(max-width: 767px)');

  const chartData = useMemo(
    () =>
      (products ?? [])
        .filter(
          (product) =>
            Number.isFinite(product.profit) &&
            product.profit < 0,
        )
        .sort((a, b) => a.profit - b.profit),
    [products],
  );

  const lowestProfit = Math.min(
    0,
    ...chartData.map((product) => product.profit),
  );

  const xAxisMin = lowestProfit < 0
    ? Math.floor((lowestProfit * 1.3) / 1000) * 1000
    : -1000;

  if (chartData.length === 0) {
    return (
      <div className={styles.empty}>
        No loss-making products found for the selected filters.
      </div>
    );
  }

  return (
    <div
      className={`${styles.wrap} net-loss-chart`}
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
              tickFormatter={(value) =>
                formatCompactCurrency(value)
              }
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
              dataKey="productName"
              width={150}
              interval={0}
              tick={<ProductTick />}
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
  cursor={false}
  shared={false}
  trigger="hover"
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

                const isMuted = selectedProductId != null &&
                  item?.productId !== selectedProductId;

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

                if (clickedItem?.productId) {
                  onProductSelect?.(clickedItem.productId);
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
