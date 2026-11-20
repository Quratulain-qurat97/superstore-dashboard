
import KpiCard from '../kpi/KpiCard.jsx';

import {
  KpiTileSpline,
} from '../assets/figmaIcons.jsx';

import {
  KpiTileMoneyLoss,
} from '../assets/SalesKpiIcons.jsx';

// Trophy icon — green
function KpiTileTrophy(props) {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" fill="none" {...props}>
      <rect width="64" height="64" rx="16" fill="#DCFCE7" />
      <path
        d="M22 15h20v9c0 9-4 14-10 14s-10-5-10-14v-9Z"
        stroke="#16A34A"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 20h-7v4c0 7 4 10 10 10M42 20h7v4c0 7-4 10-10 10M32 38v8m-8 4h16m-12-4h8"
        stroke="#16A34A"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Percentage icon — coral
function KpiTilePercent(props) {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" fill="none" {...props}>
      <rect width="64" height="64" rx="16" fill="#FFE4E1" />
      <circle cx="23" cy="23" r="5" stroke="#FF6B5B" strokeWidth="4" />
      <circle cx="41" cy="41" r="5" stroke="#FF6B5B" strokeWidth="4" />
      <path
        d="M43 19 21 45"
        stroke="#FF6B5B"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

const cardLeft = (index) =>
  `calc(var(--content-left) + ${index} * (var(--kpi-w) + 20px))`;

const SLOTS = [
  { radius: 20, tileRight: 15, tileTop: 30 },
  { radius: 25, tileRight: 15, tileTop: 30 },
  { radius: 25, tileRight: 14, tileTop: 31 },
  { radius: 25, tileRight: 14, tileTop: 31 },
];

const TILES = {
  profitMargin: KpiTileSpline,
  lossMakingSubCategories: KpiTileMoneyLoss,
  topSubCategory: KpiTileTrophy,
  averageDiscount: KpiTilePercent,
};

const FALLBACK_CARDS = [
  {
    id: 'profitMargin',
    label: 'Profit Margin',
    value: '—',
    exact: 'Overall profit margin',
  },
  {
    id: 'lossMakingSubCategories',
    label: 'Loss-Making Sub-Categories',
    value: '—',
    exact: 'Number of sub-categories with negative profit',
  },
  {
    id: 'topSubCategory',
    label: 'Top Sub-Category',
    value: '—',
    supportingText: 'By total profit',
    exact: 'Sub-category with the highest total profit',
  },
  {
    id: 'averageDiscount',
    label: 'Average Discount',
    value: '—',
    exact: 'Average discount across transaction rows',
  },
];

const formatPercent = (value) =>
  value == null ? '—' : `${value.toFixed(1)}%`;

const formatCurrency = (value) =>
  value == null
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(value);

function buildCards(kpis, selectedSubCategory) {
  const cards = !kpis
    ? [...FALLBACK_CARDS]
    : [
        {
          id: 'profitMargin',
          label: 'Profit Margin',
          value: formatPercent(kpis.profitMargin),
          numericValue: kpis.profitMargin,
          exact: 'Overall profit margin',
        },
        {
          id: 'lossMakingSubCategories',
          label: 'Loss-Making Sub-Categories',
          value: `${kpis.lossMakingSubCategories} / ${kpis.totalSubCategories}`,
          numericValue: kpis.lossMakingSubCategories,
          exact: 'Number of sub-categories with negative profit',
        },
        {
          id: 'topSubCategory',
          label: 'Top Sub-Category',
          value: kpis.topSubCategoryName ?? '—',
          numericValue: kpis.topSubCategoryProfit,
          supportingText:
            kpis.topSubCategoryProfit == null
              ? 'By total profit'
              : `${formatCurrency(kpis.topSubCategoryProfit)} profit`,
          supportingTextColor:
            kpis.topSubCategoryProfit > 0
              ? '#16A34A'
              : kpis.topSubCategoryProfit < 0
                ? '#DC2626'
                : '#6B7280',
          exact: kpis.topSubCategoryName
            ? `${kpis.topSubCategoryName}: ${formatCurrency(kpis.topSubCategoryProfit)} profit`
            : 'No sub-category data available',
        },
        {
          id: 'averageDiscount',
          label: 'Average Discount',
          value: formatPercent(kpis.averageDiscount),
          numericValue: kpis.averageDiscount,
          exact: 'Average discount across transaction rows',
        },
      ];

  if (selectedSubCategory) {
    const profit = selectedSubCategory.profit;

    // KPI 1: selected sub-category profit margin.
    cards[0] = {
      ...cards[0],
      value: formatPercent(selectedSubCategory.profitMargin),
      numericValue: selectedSubCategory.profitMargin,
      exact: `${selectedSubCategory.subCategory} profit margin`,
    };

    // KPI 2: selected sub-category loss status.
    cards[1] = {
      ...cards[1],
      value: `${selectedSubCategory.lossMakingSubCategories} / ${selectedSubCategory.totalSubCategories}`,
      numericValue: selectedSubCategory.lossMakingSubCategories,
      exact: selectedSubCategory.isNegative
        ? `${selectedSubCategory.subCategory} is loss-making`
        : `${selectedSubCategory.subCategory} is profitable`,
    };

    // KPI 3: PRESERVED — existing selected sub-category behavior.
    cards[2] = {
      id: 'topSubCategory',
      label: 'Sub-Category',
      value: selectedSubCategory.subCategory,
      numericValue: profit,
      supportingText:
        profit == null
          ? 'No profit data available'
          : `${formatCurrency(profit)} profit`,
      supportingTextColor:
        profit > 0
          ? '#16A34A'
          : profit < 0
            ? '#DC2626'
            : '#6B7280',
      exact:
        profit == null
          ? `${selectedSubCategory.subCategory}: no profit data`
          : `${selectedSubCategory.subCategory}: ${formatCurrency(profit)} profit`,
    };

    // KPI 4: selected sub-category average discount.
    cards[3] = {
      ...cards[3],
      value: formatPercent(selectedSubCategory.averageDiscount),
      numericValue: selectedSubCategory.averageDiscount,
      exact: `${selectedSubCategory.subCategory} average discount`,
    };
  }

  return cards;
}

export default function ProductKpiRow({
  kpis = null,
  selectedSubCategory = null,
}) {
  const cards = buildCards(kpis, selectedSubCategory);

  return (
    <>
      {cards.map((card, index) => (
        <KpiCard
          key={card.id}
          label={card.label}
          value={card.value}
          numericValue={card.numericValue}
          title={card.exact}
          supportingText={card.supportingText}
          supportingTextColor={card.supportingTextColor}
          Tile={TILES[card.id]}
          left={cardLeft(index)}
          {...SLOTS[index]}
        />
      ))}
    </>
  );
}
