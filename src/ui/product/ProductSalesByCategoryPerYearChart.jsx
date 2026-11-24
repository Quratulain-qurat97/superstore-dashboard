import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import styles from './ProductSalesByCategoryPerYearChart.module.css';

const CATEGORY_COLORS = {
  Furniture: '#2563EB',
  'Office Supplies': '#9333EA',
  Technology: '#16A34A',
};

const CATEGORY_ORDER = [
  'Furniture',
  'Office Supplies',
  'Technology',
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function formatCurrency(value) {
  return currencyFormatter.format(value ?? 0);
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const orderedPayload = CATEGORY_ORDER
    .map((category) =>
      payload.find((item) => item.dataKey === category),
    )
    .filter(Boolean);

  const totalSales = orderedPayload.reduce(
    (total, item) => total + (item.value ?? 0),
    0,
  );

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{label}</p>

      {orderedPayload.map((item) => (
        <div
          className={styles.tooltipRow}
          key={item.dataKey}
        >
          <span className={styles.tooltipCategory}>
            <span
              className={styles.tooltipDot}
              style={{ backgroundColor: item.color }}
            />
            {item.dataKey}
          </span>

          <span className={styles.tooltipValue}>
            {formatCurrency(item.value)}
          </span>
        </div>
      ))}

      <div className={styles.tooltipDivider} />

      <div className={styles.tooltipTotal}>
        <span>Total Sales</span>
        <span>{formatCurrency(totalSales)}</span>
      </div>
    </div>
  );
}

export default function ProductSalesByCategoryPerYearChart({
  series = [],
  selectedCategory,
  onSelectCategory,
}) {
  const hasData = series.some((year) =>
    CATEGORY_ORDER.some((category) => (year[category] ?? 0) > 0),
  );

  if (!series.length || !hasData) {
    return (
      <div className={styles.emptyState}>
        No sales data available for the selected filters.
      </div>
    );
  }

return (
  <div className={styles.chartWrapper}>
    <div className={styles.legend}>
      {CATEGORY_ORDER.map((category) => (
        <button
          key={category}
          type="button"
          className={styles.legendItem}
          onClick={() => onSelectCategory?.(category)}
        >
          <span
            className={styles.legendSquare}
            style={{
              backgroundColor: CATEGORY_COLORS[category],
              opacity:
                selectedCategory && selectedCategory !== category
                  ? 0.30
                  : 1,
            }}
          />
          <span>{category}</span>
        </button>
      ))}
    </div>

    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={series}
          margin={{
            top: 12,
            right: 12,
            bottom: 4,
            left: 8,
          }}
          barCategoryGap="28%"
        >
          <CartesianGrid
            stroke="#E5E7EB"
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey="year"
            axisLine={{ stroke: '#D1D5DB' }}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 11 }}
            tickMargin={9}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 10 }}
            tickFormatter={(value) => {
              if (value >= 1_000_000) {
                return `$${(value / 1_000_000).toFixed(1)}M`;
              }

              if (value >= 1_000) {
                return `$${Math.round(value / 1_000)}K`;
              }

              return `$${value}`;
            }}
            width={54}
          />

          <Tooltip
  content={<CustomTooltip />}
  cursor={{ fill: 'rgba(156, 163, 175, 0.10)' }}
  offset={22}
  wrapperStyle={{
    zIndex: 9999,
    pointerEvents: 'none',
  }}
/>

          {CATEGORY_ORDER.map((category) => (
            <Bar
              key={category}
              dataKey={category}
              name={category}
              stackId="sales"
              fill={CATEGORY_COLORS[category]}
              fillOpacity={
                selectedCategory
                  ? selectedCategory === category
                    ? 1
                    : 0.30
                  : 1
              }
              radius={
                category === 'Technology'
                  ? [3, 3, 0, 0]
                  : [0, 0, 0, 0]
              }
              cursor="pointer"
              onClick={() => onSelectCategory?.(category)}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);
}