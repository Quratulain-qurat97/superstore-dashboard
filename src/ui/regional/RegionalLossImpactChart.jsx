
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
} from '../../core/index.js';

import styles from './RegionalLossImpactChart.module.css';

const BAR_COLOR = '#EF4444';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;

  if (!item) return null;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{item.region}</p>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Loss Impact</span>
        <strong className={styles.negativeValue}>
          {formatPercent(item.lossImpact, 2)}
        </strong>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>State Losses</span>
        <strong className={styles.negativeValue}>
          {formatCurrency(item.lossAmount)}
        </strong>
      </div>

      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>
          Profitable-State Profit
        </span>
        <strong className={styles.positiveValue}>
          {formatCurrency(item.profitableStateProfit)}
        </strong>
      </div>
    </div>
  );
}

function LossImpactLabel({ x, y, width, height, value }) {
  if (!Number.isFinite(value)) return null;

  const label = formatPercent(value, 2);
  const labelWidth = label.length * 9 + 12;
  const centerY = y + height / 2;

  return (
    <g transform={`translate(${x + width + 8}, ${centerY})`}>
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

export default function RegionalLossImpactChart({
  regions,
  selectedRegion,
  onRegionSelect,
}) {
  const chartData = useMemo(
    () =>
      (regions ?? [])
        .filter((region) => Number.isFinite(region.lossImpact))
        .sort((a, b) => b.lossImpact - a.lossImpact),
    [regions],
  );

  const maxImpact = Math.max(
    0,
    ...chartData.map((region) => region.lossImpact),
  );

  const xAxisMax = Math.max(
    10,
    Math.ceil((maxImpact + 12) / 10) * 10,
  );

  if (chartData.length === 0) {
    return (
      <div className={styles.empty}>
        No regional loss-impact data available for the selected filters.
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.plot}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 12, bottom: 12, left: 5 }}
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

            <ReferenceLine x={0} stroke="#9CA3AF" />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                fill: '#F3F4F6',
                fillOpacity: 0.7,
              }}
            />

            <Bar
              dataKey="lossImpact"
              name="Loss Impact"
              radius={[0, 5, 5, 0]}
              barSize={28}
              isAnimationActive={false}
              cursor="pointer"
              shape={(props) => {
                const item = props.payload;
                const isSelected = selectedRegion === item?.region;

                const isMuted = selectedRegion
                  ? !isSelected
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
              onClick={(entry) => {
                const region = entry?.region ?? entry?.payload?.region;

                if (region) {
                  onRegionSelect?.(region);
                }
              }}
            >
              <LabelList content={<LossImpactLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
