
import {
  filterRows,
  profitMargin,
  sumBy,
} from './aggregations.js';

// Actual discount values found in superstore.json.
export const DISCOUNT_HEATMAP_LEVELS = [
  0,
  0.1,
  0.15,
  0.2,
  0.3,
  0.32,
  0.4,
  0.45,
  0.5,
  0.6,
  0.7,
  0.8,
];

// Fixed row order, grouped by parent category.
export const DISCOUNT_HEATMAP_GROUPS = [
  {
    category: 'Furniture',
    subCategories: [
      'Bookcases',
      'Chairs',
      'Furnishings',
      'Tables',
    ],
  },
  {
    category: 'Office Supplies',
    subCategories: [
      'Appliances',
      'Art',
      'Binders',
      'Envelopes',
      'Fasteners',
      'Labels',
      'Paper',
      'Storage',
      'Supplies',
    ],
  },
  {
    category: 'Technology',
    subCategories: [
      'Accessories',
      'Copiers',
      'Machines',
      'Phones',
    ],
  },
];

function buildCell(rows) {
  if (rows.length === 0) {
    return {
      sales: null,
      profit: null,
      margin: null,
      transactionCount: 0,
      hasData: false,
    };
  }

  const sales = sumBy(rows, 'sales');
  const profit = sumBy(rows, 'profit');

  return {
    sales,
    profit,
    margin: profitMargin(profit, sales),
    transactionCount: rows.length,
    hasData: true,
  };
}

/**
 * Builds the discount impact heatmap.
 *
 * Applies Region, Segment, Year and Month filters.
 * Deliberately excludes Category so all 17 sub-categories remain visible.
 *
 * Each cell uses aggregate profit margin:
 * SUM(Profit) / SUM(Sales) * 100.
 */
export function buildProfitabilityDiscountHeatmap(
  rows,
  effective = {},
) {
  const filteredRows = filterRows(rows, {
    region: effective.region ?? null,
    segment: effective.segment ?? null,
    year: effective.year ?? null,
    month: effective.month ?? null,
  });

  const grouped = new Map();

  for (const row of filteredRows) {
    const key = `${row.subCategory}|${row.discount}`;

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key).push(row);
  }

  const groups = DISCOUNT_HEATMAP_GROUPS.map((group) => ({
    category: group.category,

    rows: group.subCategories.map((subCategory) => ({
      subCategory,

      cells: DISCOUNT_HEATMAP_LEVELS.map((discount) => {
        const key = `${subCategory}|${discount}`;
        const cellRows = grouped.get(key) ?? [];

        return {
          discount,
          ...buildCell(cellRows),
        };
      }),
    })),
  }));

  return {
    discounts: DISCOUNT_HEATMAP_LEVELS,
    groups,
    transactionCount: filteredRows.length,
    hasAnyData: filteredRows.length > 0,
  };
}
