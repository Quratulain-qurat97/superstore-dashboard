
import styles from './OverviewExecutiveSummary.module.css';

const currency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number.isFinite(Number(value)) ? Number(value) : 0);

const percentage = (value) =>
  value == null || !Number.isFinite(Number(value))
    ? 'N/A'
    : `${Number(value).toFixed(1)}%`;

const percentageChange = (current, previous) => {
  if (
    current == null ||
    previous == null ||
    !Number.isFinite(Number(current)) ||
    !Number.isFinite(Number(previous)) ||
    Number(previous) === 0
  ) {
    return null;
  }

  current = Number(current);
  previous = Number(previous);

  // A conventional percentage change is misleading when
  // the starting value is negative.
  if (previous < 0) {
    return null;
  }

  return ((current - previous) / previous) * 100;
};

function Metric({ value, type = 'neutral' }) {
  const className =
    type === 'negative'
      ? styles.negative
      : type === 'positive'
        ? styles.positive
        : styles.neutral;

  return <strong className={className}>{value}</strong>;
}

function Insight({ title, children }) {
  return (
    <section className={styles.insight}>
      <h3 className={styles.insightTitle}>{title}</h3>
      <p className={styles.insightText}>{children}</p>
    </section>
  );
}

export default function OverviewExecutiveSummary({ data }) {
  if (!data) {
    return (
      <p className={styles.empty}>
        Summary insights are unavailable.
      </p>
    );
  }

  const insights = [];

  // 1. Regional performance and customer reach

  const regions = data.regions ?? [];
  const regionalCustomers = data.regionalCustomerCounts ?? [];

  if (regions.length > 0) {
    const leader = regions.reduce((best, region) =>
      region.sales > best.sales ? region : best,
    );

    const totalRegionalSales = regions.reduce(
      (total, region) => total + region.sales,
      0,
    );

    const salesShare =
      totalRegionalSales > 0
        ? (leader.sales / totalRegionalSales) * 100
        : null;

    const customerCount = regionalCustomers.find(
      (item) => item.region === leader.region,
    )?.customerCount;

    insights.push({
      id: 'regional',
      title: 'Regional performance',
      content: (
        <>
          {regions.length > 1 ? (
            <>
              <strong>{leader.region}</strong> leads regional sales at{' '}
            </>
          ) : (
            <>
              Sales for <strong>{leader.region}</strong> total{' '}
            </>
          )}

          <Metric value={currency(leader.sales)} type="positive" />

          {salesShare !== null && (
            <> ({percentage(salesShare)} of regional sales)</>
          )}

          {customerCount !== undefined && (
            <>
              , across {customerCount.toLocaleString('en-US')} distinct
              customers
            </>
          )}

          . Its profit margin is{' '}
          <Metric
            value={percentage(leader.margin)}
            type={
              leader.margin < 0
                ? 'negative'
                : leader.margin > 0
                  ? 'positive'
                  : 'neutral'
            }
          />
          .
        </>
      ),
    });
  }

  // 2. Region/category profitability

  const combinations = data.regionCategoryProfitability ?? [];

  const lossMaking = combinations.filter(
    (item) => Number.isFinite(Number(item.profit)) && item.profit < 0,
  );

  if (lossMaking.length > 0) {
    const worst = lossMaking.reduce((lowest, item) =>
      item.profit < lowest.profit ? item : lowest,
    );

    insights.push({
      id: 'loss-making',
      title: 'Profitability warning',
      content: (
        <>
          <strong>
            {worst.region} — {worst.category}
          </strong>{' '}
          is the weakest region/category combination, with a loss of{' '}
          <Metric
            value={currency(Math.abs(worst.profit))}
            type="negative"
          />{' '}
          and a profit margin of{' '}
          <Metric
            value={percentage(worst.margin)}
            type="negative"
          />
          . There {lossMaking.length === 1 ? 'is' : 'are'}{' '}
          {lossMaking.length} loss-making combination
          {lossMaking.length === 1 ? '' : 's'} in the current selection.
        </>
      ),
    });
  } else if (combinations.length > 0) {
    insights.push({
      id: 'profitability',
      title: 'Profitability',
      content: (
        <>
          No region/category combination is currently operating
          at a net loss under the selected filters.
        </>
      ),
    });
  }

  // 3. Segment sales contribution

  const segments = data.segments ?? [];

  if (segments.length > 0) {
    const leader = segments.reduce((best, segment) =>
      segment.sales > best.sales ? segment : best,
    );

    const totalSegmentSales = segments.reduce(
      (total, segment) => total + segment.sales,
      0,
    );

    const share =
      totalSegmentSales > 0
        ? (leader.sales / totalSegmentSales) * 100
        : null;

    insights.push({
      id: 'segment',
      title: 'Customer segment contribution',
      content: (
        <>
          {segments.length > 1 ? (
            <>
              The <strong>{leader.segment}</strong> segment contributes{' '}
            </>
          ) : (
            <>
              The <strong>{leader.segment}</strong> segment records{' '}
            </>
          )}

          <Metric value={currency(leader.sales)} type="positive" />

          {share !== null && (
            <> ({percentage(share)} of segment sales)</>
          )}

          . Its profit margin is{' '}
          <Metric
            value={percentage(leader.margin)}
            type={
              leader.margin < 0
                ? 'negative'
                : leader.margin > 0
                  ? 'positive'
                  : 'neutral'
            }
          />
          .
        </>
      ),
    });
  }

  // 4. Historical performance

  const yearly = data.yearlyPerformance ?? [];

  if (yearly.length >= 2) {
    const first = yearly[0];
    const latest = yearly[yearly.length - 1];

    const salesGrowth = percentageChange(
      latest.sales,
      first.sales,
    );

    const profitGrowth = percentageChange(
      latest.profit,
      first.profit,
    );

    const marginChange =
      first.margin == null ||
      latest.margin == null ||
      !Number.isFinite(Number(first.margin)) ||
      !Number.isFinite(Number(latest.margin))
        ? null
        : Number(latest.margin) - Number(first.margin);

    const growthText = (value) => {
      if (value === null) {
        return 'could not be compared';
      }

      return (
        <>
          {value >= 0 ? 'increased by ' : 'decreased by '}
          <Metric
            value={percentage(Math.abs(value))}
            type={
              value > 0
                ? 'positive'
                : value < 0
                  ? 'negative'
                  : 'neutral'
            }
          />
        </>
      );
    };

    insights.push({
      id: 'trend',
      title: 'Historical performance',
      content: (
        <>
          From {first.year} to {latest.year}, sales{' '}
          {growthText(salesGrowth)} and profit{' '}
          {growthText(profitGrowth)}.

          {marginChange !== null ? (
            <>
              {' '}Profit margin changed by{' '}
              <Metric
                value={`${marginChange >= 0 ? '+' : ''}${marginChange.toFixed(1)} percentage points`}
                type={
                  marginChange > 0
                    ? 'positive'
                    : marginChange < 0
                      ? 'negative'
                      : 'neutral'
                }
              />
              .
            </>
          ) : (
            <> Profit margin could not be compared.</>
          )}
        </>
      ),
    });
  } else if (yearly.length === 1) {
    insights.push({
      id: 'trend',
      title: 'Historical performance',
      content: (
        <>
          The current comparison contains data for {yearly[0].year}
          only. A multi-year performance trend is not available
          under these filters.
        </>
      ),
    });
  }

  return (
    <div className={styles.container}>
      <p className={styles.description}>
        Key business findings based on the current dashboard filters.
      </p>

      {insights.length > 0 ? (
        insights.map((insight) => (
          <Insight key={insight.id} title={insight.title}>
            {insight.content}
          </Insight>
        ))
      ) : (
        <p className={styles.empty}>
          There is not enough data to generate meaningful insights
          for the current filter selection.
        </p>
      )}
    </div>
  );
}
