# Superstore Analytics Dashboard â€” Validated Key Findings

**Purpose:** Central evidence reference for the Sales Analysis, Product Analysis, and Executive Summary pages.

**Dataset:** `superstores_cleared.superstore_cleaned_python`
**Analysis period:** 2014â€“2017
**Transaction records:** 9,994
**Profit margin formula:** `SUM(Profit) / SUM(Sales) Ã— 100`

---

## 1. Dataset-Wide Discount Profitability

The full-dataset analysis identified a clear difference between the aggregated profitability of lower and higher discount tiers.

- Discount tiers from **0% through 20%** generated positive aggregate profit margins.
- Every observed discount tier from **30% through 80%** generated a negative aggregate profit margin.
- The relationship was not perfectly linear. For example, the 45% discount tier had a -45.45% margin, while the 50% tier had a -34.80% margin.

### 1.1 Complete Discount-Level Results

| Discount | Order Lines | Units Sold | Sales | Profit | Profit Margin |
|---:|---:|---:|---:|---:|---:|
| 0% | 4,798 | 18,267 | $1,087,908.47 | $320,987.60 | 29.51% |
| 10% | 94 | 373 | $54,369.35 | $9,029.18 | 16.61% |
| 15% | 52 | 198 | $27,558.52 | $1,418.99 | 5.15% |
| 20% | 3,657 | 13,660 | $764,594.37 | $90,337.31 | 11.82% |
| 30% | 227 | 849 | $103,226.66 | -$10,369.28 | -10.05% |
| 32% | 27 | 105 | $14,493.46 | -$2,391.14 | -16.50% |
| 40% | 206 | 786 | $116,417.78 | -$23,057.05 | -19.81% |
| 45% | 11 | 45 | $5,484.97 | -$2,493.11 | -45.45% |
| 50% | 66 | 241 | $58,918.54 | -$20,506.43 | -34.80% |
| 60% | 138 | 501 | $6,644.70 | -$5,944.66 | -89.46% |
| 70% | 418 | 1,660 | $40,620.28 | -$40,075.36 | -98.66% |
| 80% | 300 | 1,188 | $16,963.76 | -$30,539.04 | -180.03% |

### 1.2 Financial Impact of High Discounts

| Discount Range | Order Lines | Sales | Combined Profit | Weighted Profit Margin |
|---|---:|---:|---:|---:|
| 30%â€“80% | 1,393 | $362,770.15 | -$135,376.07 | -37.32% |
| 60%â€“80% | 856 | $64,228.74 | -$76,559.06 | -119.20% |

Additional findings:

- The 70% and 80% discount groups together generated $70,614.40 in losses.
- The 30%â€“80% discount groups accounted for approximately 13.9% of transaction lines.
- Their combined weighted profit margin was -37.32%.

**Interpretation:** The observed high-discount tiers represent a substantial profitability risk in this dataset. This is an association, not proof that discounting alone caused the losses.

---

## 2. West Region â€” Home Office Year-over-Year Profitability

West + Home Office remained profitable in every year from 2014 to 2017, but its profit margin weakened considerably.

| Year | Sales | Profit | Profit Margin |
|---|---:|---:|---:|
| 2014 | $21,708.92 | $3,690.42 | 17.00% |
| 2015 | $20,478.85 | $2,774.07 | 13.55% |
| 2016 | $37,943.41 | $3,696.97 | 9.74% |
| 2017 | $56,590.59 | $6,368.95 | 11.25% |

### Interpretation

- Margin declined from 17.00% in 2014 to 9.74% in 2016.
- It recovered partially to 11.25% in 2017 but remained below its 2014 level.
- Sales increased substantially, but profitability did not improve at the same rate.
- Home Office was never loss-making overall in the years shown.

### 2.1 West Segment Comparison

In 2016:

- Home Office margin: 9.74%.
- Corporate margin: 9.95%.
- Consumer margin: 16.54%.

In 2017:

- Home Office margin: 11.25%.
- Corporate margin: 18.27%.
- Consumer margin: 20.21%.

**Interpretation:** The 2016 profitability pressure was not exclusive to Home Office. However, Home Office had the weakest recovery among the three segments in 2017.

---

## 3. West Region â€” Home Office Tables and Machines

The subcategory analysis identified different profitability outcomes for Tables and Machines.

### 3.1 West + Home Office Subcategory Results

| Year | Subcategory | Sales | Profit | Profit Margin |
|---|---|---:|---:|---:|
| 2014 | Tables | $2,448.41 | $401.79 | 16.41% |
| 2014 | Machines | $1,279.97 | $415.99 | 32.50% |
| 2015 | Tables | $2,918.38 | $225.94 | 7.74% |
| 2015 | Machines | No rows | â€” | â€” |
| 2016 | Tables | $3,401.65 | -$1,378.97 | -40.54% |
| 2016 | Machines | $4,072.87 | -$556.79 | -13.67% |
| 2017 | Tables | $7,240.75 | $637.67 | 8.81% |
| 2017 | Machines | $5,888.37 | -$3,631.78 | -61.68% |

### Interpretation

- Tables recovered from a $1,378.97 loss in 2016 to a $637.67 profit in 2017.
- Machines deteriorated further in 2017, recording a $3,631.78 loss at a -61.68% margin.
- There were no West + Home Office Machines records in 2015. This must not be represented as zero sales or zero profit.

### 3.2 Discount-Level Pattern

Within the observed West segment and year combinations:

- Every listed 50% discount Tables group was loss-making.
- Every listed 70% discount Machines group was loss-making.
- Some 20% discount Tables groups were also loss-making, while others remained profitable.

**Interpretation:** Higher discounts are an important profitability risk signal, but discount percentage alone does not determine the outcome. Product and transaction context also matter. Some groups contain very few observations.

---

## 4. Product-Level Loss Examples

The following examples illustrate why product-level investigation is useful. They are individual transaction or small-group observations, not universal product performance rules.

| Product | Region / Year / Segment | Discount | Sales | Profit |
|---|---|---:|---:|---:|
| Lexmark MX611dhe Monochrome Laser Printer | West / 2017 / Home Office | 70% | $2,549.99 | -$3,399.98 |
| Zebra GK420t Direct Thermal/Thermal Transfer Printer | West / 2016 / Home Office | 70% | $703.71 | -$938.28 |
| Swingline SM12-08 MicroCut Jam Free Shredder | West / 2017 / Home Office | 70% | $599.99 | -$479.99 |
| Bush Advantage Collection Racetrack Conference Table | West / 2016 / Home Office | 50% | $1,272.63 | -$814.48 |
| Bevis Boat-Shaped Conference Table | West / 2015 / Consumer | 50% | $393.17 | -$204.45 |
| Bevis Boat-Shaped Conference Table | West / 2016 / Consumer | 50% | $393.17 | -$204.45 |
| Bretford "Just In Time" Height-Adjustable Multi-Task Work Tables | West / 2016 / Consumer | 20% | $3,339.20 | -$542.62 |

### 4.1 Cross-Region and Segment Comparisons

**Bevis Boat-Shaped Conference Table**

- Losses appeared in East and West.
- A Central 2017 Home Office transaction was profitable.

**Bush Advantage Collection Racetrack Conference Table**

- Losses appeared in Central, East, South, and West.
- A West 2015 Corporate transaction at 0% discount generated a $610.86 profit.
- A West 2016 Home Office transaction at 50% discount generated an $814.48 loss.

**Hon 5100 Series Wood Tables**

- Losses appeared in East, South, and West.
- Some 0% discount transactions in Central and South were profitable.

**Lexmark MX611dhe Printer**

- Losses appeared in Central and West.
- A Central 2017 Corporate transaction at 10% discount generated a $680.00 profit.
- A West 2017 Home Office transaction at 70% discount generated a $3,399.98 loss.

**Swingline SM12-08 Shredder**

- Losses appeared in East and West.
- A West 2014 Home Office transaction at 20% discount generated a $415.99 profit.
- Transactions at 70% discount in East and West were loss-making.

**Zebra GK420t Printer**

- The supplied comparison showed a severe loss in West in 2016.
- The available comparison does not establish its performance in other regions or at other discount levels.

**Interpretation:** Product profitability varies by region, year, segment, and discount. A product must not be labelled universally unprofitable based on one transaction or one region.

---

## 5. Product-Level Net Losses Across the West Region

A separate analysis grouped products across 2014â€“2017 in West and retained products where total profit was negative.

The query returned 29 products.

Important distinction: `HAVING SUM(Profit) < 0` identifies products with a negative net total over the selected period. It does not mean every transaction for that product was loss-making.

Examples included:

| Product | Observations | Net Profit |
|---|---|---:|
| KI Conference Tables | 5 lines across 4 years | -$136.11 |
| Bevis Boat-Shaped Conference Table | 3 lines across 3 years | -$377.44 |
| Hon 61000 Series Interactive Training Tables | 4 lines across 3 years | -$6.22 |
| Hon 94000 Series Round Tables | 3 lines across 3 years | -$53.31 |
| Bretford "Just In Time" Height-Adjustable Multi-Task Work Tables | 3 lines across 2 years | -$425.75 |

Some products had both profitable and unprofitable transactions. The transaction history showed mixed outcomes for Bretford, Bush Advantage, Hon 5100, Hon 94000, KI Adjustable-Height, and Swingline products.

**Interpretation:** Net losses over a multi-year period should be evaluated alongside transaction-level profitability before making product-wide conclusions.

---

## 6. West Home Office Machines â€” Detailed High-Discount Investigation

The initial investigation focused on West, Home Office, Machines, where three transactions at a 70% discount were identified.

| Product | Units | Sales | Profit | Profit Margin |
|---|---:|---:|---:|---:|
| Lexmark MX611dhe Monochrome Laser Printer | 5 | $2,549.99 | -$3,399.98 | -133.33% |
| Zebra GK420t Direct Thermal/Thermal Transfer Printer | 6 | $703.71 | -$938.28 | -133.33% |
| Swingline SM12-08 MicroCut Jam Free Shredder | 5 | $599.99 | -$479.99 | -80.00% |
| **Combined** | **16** | **$3,853.68** | **-$4,818.25** | â€” |

These three order lines account for the full loss in the West + Home Office + Machines 70%-discount group.

### 6.1 Product Comparison

**Lexmark MX611dhe Printer**

- Central / Corporate at 10% discount: +22.22% margin.
- Central / Consumer at 40% discount: -16.67% margin.
- Central / Corporate at 40% discount: -16.67% margin.
- West / Home Office at 70% discount: -133.33% margin.

**Swingline SM12-08 Shredder**

- West / Home Office at 20% discount: +32.50% margin.
- East / Consumer at 70% discount: -80.00% margin.
- West / Home Office at 70% discount: -80.00% margin.

**Zebra GK420t Printer**

- The observed West / Home Office transaction at 70% discount had a -133.33% margin.
- The available comparison does not establish performance at other discount levels.

### Interpretation

- The high-discount losses are not exclusive to one product or one region.
- The same Lexmark product had different profitability outcomes across discount levels and business contexts.
- Swingline was profitable at 20% discount but loss-making at 70% in the observed records.
- The three transactions are a focused example of the broader dataset-wide discount pattern, not a representation of all high-discount losses.

---

## 7. Recommended Dashboard Placement

### Sales Analysis Page â€” Financial Impact

Use the findings for:

- Discount-tier sales, profit, and margin.
- Financial impact of high-discount tiers.
- Year-over-year profitability trends.
- West + Home Office margin deterioration as a focused regional and segment example, provided the context is clearly labelled.

### Product Analysis Page â€” Product Contributors

Use the findings for:

- Product and subcategory profitability.
- Ranked loss-making products.
- Product performance by region and segment.
- Product-level discount and transaction context.
- Distinguishing net product losses over a period from individual loss-making transactions.

### Executive Summary â€” Decision-Level Insights

Potential insight themes:

1. High-discount profitability risk.
2. West + Home Office margin deterioration.
3. 2017 West + Home Office Machines loss.
4. Home Office Tables recovery in 2017.
5. Product profitability variation across regions and discount conditions.

The Executive Summary should display only the strongest 3â€“5 insights for the currently selected filters.

---

## 8. Validation and Interpretation Rules

1. **Use weighted profit margin:** `SUM(Profit) / SUM(Sales) Ã— 100`. Do not average individual transaction margins to calculate an aggregate margin.
2. **Preserve filter context:** Identify the relevant region, category, segment, year, and date range when reporting a finding.
3. **Avoid causal claims:** The observed relationship between high discounts and negative profit is an association, not proof that discounts alone caused the losses.
4. **Respect sample size:** Treat groups with one or a few order lines as limited evidence.
5. **Distinguish missing groups from zero:** No matching rows do not mean zero sales or zero profit.
6. **Distinguish net losses from transaction losses:** A product with negative net profit over several years may still have profitable individual transactions.
7. **Use dynamic calculations:** Dashboard findings should recalculate from the active global filters: Region, Category, Segment, and Year.
8. **Validate against baseline figures:** The numbers in this document represent the specified unfiltered or explicitly scoped baseline. Results should change when the selected filters change.
9. **Avoid universal product conclusions:** Product-level outcomes must be interpreted in their transaction, region, year, segment, and discount context.

---

## 9. Data Source and Reproducibility

**Database used for analytical reference:** `superstores_cleared`
**Table used for analytical reference:** `superstore_cleaned_python`
**Dashboard data source:** `data/superstore.json`
**Original cleaned dataset:** `Superstore_Cleaned.csv`

Relevant analytical fields include:

- `Region`
- `Segment`
- `Category`
- `Sub-Category`
- `Product Name`
- `Product ID`
- `Sales`
- `Profit`
- `Discount`
- `Quantity`
- `Order ID`
- `Order Date`
- `Row ID`

The SQL query results were used during the analysis and validation process. The SQL scripts themselves are not included in this dashboard repository.

This document preserves the reported analytical findings, baseline figures, and interpretation rules. It is not a substitute for the original dataset or executable query scripts.

---

## Final Conclusion

The Superstore analysis identifies a substantial association between higher discount tiers and negative profitability, alongside specific regional, segment, subcategory, and product-level pressure points.

The most significant findings include:

- Discount tiers from 30% to 80% generated $135,376.07 in combined losses.
- Discount tiers from 60% to 80% generated $76,559.06 in combined losses.
- West + Home Office margin declined from 17.00% in 2014 to 9.74% in 2016, followed by a partial recovery to 11.25% in 2017.
- West + Home Office Machines recorded a $3,631.78 loss in 2017.
- West + Home Office Tables recovered from a $1,378.97 loss in 2016 to a $637.67 profit in 2017.
- Product profitability varied considerably across regions, segments, years, and discount levels.

These findings support further investigation of discount exposure, product profitability, and regional performance. They should guide dashboard interpretation without implying unsupported causal relationships.
