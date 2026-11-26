import { useMemo } from 'react';

import {
  Bar,
  CartesianGrid,
  ComposedChart,
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
} from '../../core/index.js';

import styles from './SalesRegionalChart.module.css';
import { useMediaQuery } from '../hooks/useMediaQuery.js';

const BAR_COLOR = '#3B82F6';
const POSITIVE_COLOR = '#10B981';
const NEGATIVE_COLOR = '#EF4444';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;

  if (!item?.hasData) return null;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{item.region}</p>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Sales</span>
        <span className={styles.tooltipValue}>
          {formatCurrency(item.sales)}
        </span>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Profit</span>
        <span
          className={`${styles.tooltipValue} ${
            item.profit < 0 ? styles.negativeValue : ''
          }`}
        >
          {formatCurrency(item.profit)}
        </span>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Sales Contribution</span>
        <span className={styles.tooltipValue}>
          {formatPercent(item.salesContribution)}
        </span>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Profit Margin</span>
        <span
          className={`${styles.tooltipValue} ${
            item.isNegativeMargin
              ? styles.negativeValue
              : styles.positiveValue
          }`}
        >
          {formatPercent(item.margin)}
        </span>
      </div>
    </div>
  );
}

function SalesContributionLabel({ x, y, width, value }) {
  if (value == null) return null;

  const label = `${value.toFixed(1)}%`;
  const labelWidth = label.length * 9 + 12;

  return (
    <g transform={`translate(${x + width + 8}, ${y + 10})`}>
      <rect
        x={-4}
        y={-10}
        width={labelWidth}
        height={21}
        rx={4}
        fill="#E5E7EB"
        fillOpacity={0.85}
      />

      <text
        x={labelWidth / 2 - 4}
        y={0}
        fill="#000000"
        fontSize={14}
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {label}
      </text>
    </g>
  );
}

export default function SalesRegionalChart({
  series,
  selectedRegion,
  onSelectRegion,
}) {
  const isPhone = useMediaQuery('(max-width: 767px)');
  const chartData = useMemo(
    () => (series?.bars ?? []).filter((bar) => bar.hasData),
    [series],
  );

  const maxContribution = Math.max(
    0,
    ...chartData.map((item) => item.salesContribution ?? 0),
  );

  const xAxisMax = Math.max(
    10,
    Math.ceil((maxContribution + 12) / 10) * 10,
  );

  const renderMarginTick = ({ x, y, payload }) => {
    const item = chartData.find(
      (region) => region.region === payload.value,
    );

    if (!item || item.margin == null) return null;

    const label = formatPercent(item.margin);
    const labelWidth = label.length * 9 + 12;

    const color = item.isNegativeMargin
      ? NEGATIVE_COLOR
      : POSITIVE_COLOR;

    return (
      <g transform={`translate(${x + 8}, ${y})`}>
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
          fill={color}
          fontSize={14}
          fontWeight={700}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {label}
        </text>
      </g>
    );
  };

  if (!series?.hasAnyData) {
    return (
      <div className={styles.empty}>
        No regional data available for the selected filters.
      </div>
    );
  }

  return (
    <div
      className={styles.wrap}
      onClick={(event) => event.stopPropagation()}
    >
      {/* Permanent chart legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.salesSwatch} />
          <span>Sales Contribution (%)</span>
        </div>

        <div className={styles.legendItem}>
          <span className={styles.marginSwatch} />
          <span>Profit Margin (%)</span>
        </div>
      </div>

      <div className={styles.plot}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 5, bottom: 12, left: 5 }}
            barCategoryGap="24%"
          >
            <CartesianGrid
              horizontal={false}
              stroke="#E5E7EB"
              strokeDasharray="3 3"
            />

            <XAxis
              type="number"
              domain={[0, xAxisMax]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600}}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              type="category"
              dataKey="region"
              width={75}
              tick={{
                fill: '#111827',
                fontSize: 12,
                fontWeight: 600,
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              yAxisId="margin"
              type="category"
              dataKey="region"
              orientation="right"
              width={85}
              axisLine={false}
              tickLine={false}
              tick={renderMarginTick}
            />

            <ReferenceLine x={0} stroke="#9CA3AF" />

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
  dataKey="salesContribution"
  name="Sales Contribution"
  fill={BAR_COLOR}
  radius={[0, 5, 5, 0]}
  barSize={28}
  cursor="pointer"
  label={isPhone ? false : <SalesContributionLabel />}
  shape={(props) => (
    <Rectangle
      {...props}
      fillOpacity={
        selectedRegion && selectedRegion !== props.payload?.region
          ? 0.35
          : 1
      }
    />
  )}
  onClick={(entry, index) => {
    const clickedRegion =
      chartData[index] ?? entry?.payload ?? entry;

    if (clickedRegion?.region) {
      onSelectRegion?.(clickedRegion.region);
    }
  }}
/>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}