
import styles from './ProfitabilityExecutiveSummary.module.css';

function formatCurrency(value) {
  if (!Number.isFinite(value)) return '—';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return '—';
  return `${value.toFixed(1)}%`;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return '—';

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDiscount(value) {
  if (!Number.isFinite(value)) return '—';
  return `${(value * 100).toFixed(0)}%`;
}

function getValueClass(value) {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value >= 0
  ) {
    return '';
  }

  return styles.negativeValue;
}

function Insight({ label, value, detail, valueClass = '' }) {
  return (
    <div className={styles.insight}>
      <span className={styles.insightLabel}>{label}</span>
      <span className={`${styles.insightValue} ${valueClass}`}>
        {value}
      </span>
      {detail && (
        <p className={styles.insightDetail}>{detail}</p>
      )}
    </div>
  );
}

function Section({ title, context, children }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>

      {context && (
        <p className={styles.context}>{context}</p>
      )}

      <div className={styles.insightGrid}>{children}</div>
    </section>
  );
}

function Narrative({ children }) {
  return (
    <p className={styles.narrative}>
      {children}
    </p>
  );
}

export default function ProfitabilityExecutiveSummary({
  data,
  selectedProductId = null,
}) {
  if (!data) {
    return (
      <div className={styles.emptyState}>
        Profitability data is not available yet.
      </div>
    );
  }

  const kpis = data.kpis;

  // Category profitability
  const categories = (
    data.profitMarginByCategory?.bars ?? []
  ).filter(
    (item) =>
      item.hasData &&
      Number.isFinite(item.margin),
  );

  const highestCategory = categories.length
    ? categories.reduce((best, item) =>
        item.margin > best.margin ? item : best,
      )
    : null;

  const lowestCategory = categories.length
    ? categories.reduce((worst, item) =>
        item.margin < worst.margin ? item : worst,
      )
    : null;

  const lossMakingCategories = categories.filter(
    (item) => item.margin < 0,
  );

  // Discount heatmap profitability
  const heatmapCells = (
    data.discountImpactHeatmap?.groups ?? []
  ).flatMap((group) =>
    (group.rows ?? []).flatMap((row) =>
      (row.cells ?? [])
        .filter(
          (cell) =>
            cell.hasData &&
            Number.isFinite(cell.margin),
        )
        .map((cell) => ({
          ...cell,
          category: group.category,
          subCategory: row.subCategory,
        })),
    ),
  );

  const highestDiscountCell = heatmapCells.length
    ? heatmapCells.reduce((best, item) =>
        item.margin > best.margin ? item : best,
      )
    : null;

  const lowestDiscountCell = heatmapCells.length
    ? heatmapCells.reduce((worst, item) =>
        item.margin < worst.margin ? item : worst,
      )
    : null;

  // Product losses
  const products = data.top10ProductsByNetLoss ?? [];

  const selectedProduct = selectedProductId
    ? products.find(
        (product) =>
          product.productId === selectedProductId,
      )
    : null;

  const worstProduct = products[0] ?? null;

  const hasData =
    (data.rowCount ?? 0) > 0 ||
    categories.length > 0 ||
    heatmapCells.length > 0;

  if (!hasData) {
    return (
      <div className={styles.emptyState}>
        No profitability data is available for the current filters.
      </div>
    );
  }

  return (
    <div className={styles.summary}>

      {/* Overall Profitability */}
      <Section
        title="Overall Profitability"
        context={
          selectedProduct
            ? `Metrics reflect ${selectedProduct.productName} within the active filters.`
            : 'Profitability metrics reflect the active filters.'
        }
      >
        <Insight
          label="Profit Margin"
          value={formatPercent(kpis.profitMargin)}
          valueClass={getValueClass(kpis.profitMargin)}
        />

        <Insight
          label="Discounted Sales Profit"
          value={formatCurrency(kpis.discountedSalesProfit)}
          detail="Profit from transactions where a discount was applied"
          valueClass={getValueClass(kpis.discountedSalesProfit)}
        />
      </Section>

        <Narrative>
  {kpis.profitMargin < 0 ? (
    <>
      The business loses approximately{' '}
      <strong>
        {formatCurrency(Math.abs(kpis.profitMargin) / 100)}
      </strong>{' '}
      for every $1 of sales. The negative margin indicates that
      overall sales are generating a net loss.
    </>
  ) : kpis.profitMargin === 0 ? (
    'The business is currently at break-even, generating no net profit per $1 of sales.'
  ) : (
    <>
      The business retains approximately{' '}
      <strong>
        {formatCurrency(kpis.profitMargin / 100)}
      </strong>{' '}
      in profit for every $1 of sales. The positive margin indicates
      that sales are generating a net profit.
    </>
  )}

  {' '}

  {kpis.discountedSalesProfit < 0
    ? `Transactions involving discounts collectively generated a loss of ${formatCurrency(Math.abs(kpis.discountedSalesProfit))}.`
    : `Transactions involving discounts collectively generated ${formatCurrency(kpis.discountedSalesProfit)} in profit.`}
</Narrative>

      {/* Loss-Making Exposure */}
      <Section
        title="Loss-Making Exposure"
        context="Customers and orders with negative aggregated profit."
      >
        <Insight
          label="Loss-Making Customers"
          value={formatNumber(kpis.lossMakingCustomers)}
          detail="Distinct customers with a net loss"
        />

        <Insight
          label="Loss-Making Orders"
          value={formatNumber(kpis.lossMakingOrders)}
          detail={`${formatPercent(kpis.lossMakingOrdersPercent)} of ${formatNumber(kpis.totalOrders)} filtered orders`}
        />

        <Insight
          label="Largest Product Loss"
          value={
            worstProduct
              ? formatCurrency(worstProduct.profit)
              : '—'
          }
          detail={
            worstProduct
              ? worstProduct.productName
              : 'No loss-making products found'
          }
          valueClass={
            worstProduct
              ? getValueClass(worstProduct.profit)
              : ''
          }
        />

        <Insight
          label="Products in Top 10 Losses"
          value={formatNumber(products.length)}
          detail="Loss-making products shown by the chart"
        />
      </Section>

      <Narrative>
        {formatPercent(kpis.lossMakingOrdersPercent)} of filtered
        orders generated a net loss.{' '}

        {formatNumber(kpis.lossMakingCustomers)} customers generated
        a net loss across their filtered transactions, highlighting
        customer-level profitability exposure.

        {worstProduct && (
          <>
            {' '}The largest product-level loss comes from{' '}
            <strong>{worstProduct.productName}</strong>, with a net
            loss of{' '}
            <strong>
              {formatCurrency(Math.abs(worstProduct.profit))}
            </strong>.
          </>
        )}
      </Narrative>

      {/* Category Profitability */}
      <Section
        title="Category Profitability"
        context={
            selectedProduct
            ? `Category margin reflects the selected product's category, ${selectedProduct.category}.`
            : 'Category margins use aggregate profit divided by aggregate sales, comparing all categories independently of the selected Category filter.'
        }
        >
        <Insight
          label="Highest Profit Margin"
          value={
            highestCategory
              ? formatPercent(highestCategory.margin)
              : '—'
          }
          detail={
            highestCategory
              ? highestCategory.category
              : 'No category data'
          }
          valueClass={
            highestCategory
              ? getValueClass(highestCategory.margin)
              : ''
          }
        />

        <Insight
          label="Lowest Profit Margin"
          value={
            lowestCategory
              ? formatPercent(lowestCategory.margin)
              : '—'
          }
          detail={
            lowestCategory
              ? lowestCategory.category
              : 'No category data'
          }
          valueClass={
            lowestCategory
              ? getValueClass(lowestCategory.margin)
              : ''
          }
        />

        <Insight
          label="Loss-Making Categories"
          value={formatNumber(lossMakingCategories.length)}
          detail={
            lossMakingCategories.length
              ? lossMakingCategories
                  .map((item) => item.category)
                  .join(', ')
              : 'No categories with negative margins'
          }
        />
      </Section>

      {highestCategory && lowestCategory && (
        <Narrative>
          <strong>{highestCategory.category}</strong> has the
          strongest category margin at{' '}
          <strong>
            {formatPercent(highestCategory.margin)}
          </strong>
          , while <strong>{lowestCategory.category}</strong> has
          the weakest at{' '}
          <strong>
            {formatPercent(lowestCategory.margin)}
          </strong>
          .

          {lowestCategory.margin < 0
            ? ' The weakest category is operating at a negative margin.'
            : ' Even the weakest category remains above break-even.'}
        </Narrative>
      )}

      {/* Discount Impact */}
      <Section
        title="Discount Impact"
        context={
            selectedProduct
            ? `Discount margins reflect the selected product across its observed discount levels; Category and Sub-category filters do not further restrict this comparison.`
            : 'Highest and lowest observed margins across all categories, sub-categories, and discount combinations, independent of the selected Category filter.'
        }
        >
        <Insight
          label="Highest Profit Margin"
          value={
            highestDiscountCell
              ? formatPercent(highestDiscountCell.margin)
              : '—'
          }
          detail={
            highestDiscountCell
              ? `${highestDiscountCell.subCategory} · ${formatDiscount(highestDiscountCell.discount)} discount · ${formatCurrency(highestDiscountCell.sales)} sales · ${formatCurrency(highestDiscountCell.profit)} profit · ${formatNumber(highestDiscountCell.transactionCount)} transactions`
              : 'No heatmap data'
          }
          valueClass={
            highestDiscountCell
              ? getValueClass(highestDiscountCell.margin)
              : ''
          }
        />

        <Insight
          label="Lowest Profit Margin"
          value={
            lowestDiscountCell
              ? formatPercent(lowestDiscountCell.margin)
              : '—'
          }
          detail={
            lowestDiscountCell
              ? `${lowestDiscountCell.subCategory} · ${formatDiscount(lowestDiscountCell.discount)} discount · ${formatCurrency(lowestDiscountCell.sales)} sales · ${formatCurrency(lowestDiscountCell.profit)} profit · ${formatNumber(lowestDiscountCell.transactionCount)} transactions`
              : 'No heatmap data'
          }
          valueClass={
            lowestDiscountCell
              ? getValueClass(lowestDiscountCell.margin)
              : ''
          }
        />
      </Section>

      {highestDiscountCell && lowestDiscountCell && (
        <Narrative>
          The strongest observed combination is{' '}
          <strong>
            {highestDiscountCell.subCategory} at{' '}
            {formatDiscount(highestDiscountCell.discount)} discount
          </strong>
          , with a margin of{' '}
          <strong>
            {formatPercent(highestDiscountCell.margin)}
          </strong>
          . It generated{' '}
          <strong>
            {formatCurrency(highestDiscountCell.profit)}
          </strong>{' '}
          in profit across{' '}
          <strong>
            {formatNumber(highestDiscountCell.transactionCount)}
          </strong>{' '}
          transactions.

          {' '}The weakest combination is{' '}
          <strong>
            {lowestDiscountCell.subCategory} at{' '}
            {formatDiscount(lowestDiscountCell.discount)} discount
          </strong>
          , with a margin of{' '}
          <strong>
            {formatPercent(lowestDiscountCell.margin)}
          </strong>
          . It generated a loss of{' '}
          <strong>
            {formatCurrency(Math.abs(lowestDiscountCell.profit))}
          </strong>{' '}
          across{' '}
          <strong>
            {formatNumber(lowestDiscountCell.transactionCount)}
          </strong>{' '}
          transactions.

          {' '}These are observed associations, not proof that the
          discount level alone caused the difference.
        </Narrative>
      )}

    </div>
  );
}
