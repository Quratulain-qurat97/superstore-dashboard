# Superstore Analytics — Findings Documentation

This folder contains the analytical findings and business insights derived from the Superstore retail dataset. These documents provide evidence and reference material for the dashboard's analytical pages and executive summaries.

## Documentation Files

### 1. `KEY_FINDINGS.md`

The detailed evidence reference containing:

- Dataset-wide discount profitability.
- West and Home Office year-over-year performance.
- Tables and Machines performance.
- Product-level loss examples.
- Cross-region product comparisons.
- Analytical interpretation caveats.
- Recommended dashboard placement.

Use this document when developing or validating the Sales Analysis, Product Analysis, and Profitability Analysis pages.

### 2. `EXECUTIVE_SUMMARY.md`

The concise, decision-level reference containing:

- Key business finding themes.
- Suggested insight titles and dynamic wording.
- Validated baseline values.
- Recommended insight priorities.
- Guidelines for dynamically updating executive insights.

Use this document when developing or validating executive summary content.

### 3. `OVERVIEW_INSIGHTS.md`

Contains findings related to overall business performance, including key metrics and insights that support the Home dashboard.

Use this document when developing or validating the Home page.

### 4. `Product-Analysis-Insights.md`

Contains product-level findings, including product and subcategory performance, profitability, and relevant comparisons.

Use this document when developing or validating the Product Analysis page.

### 5. `Regional-Analysis-Insights.md`

Contains regional and state-level findings, including sales and profitability comparisons.

Use this document when developing or validating the Regional Analysis page.

### 6. `customer-analysis-insights.md`

Contains customer-related findings and insights supporting the Customer Analysis page.

Use this document when developing or validating customer performance and purchasing analysis.

## Dataset Reference

| Property | Value |
|---|---|
| Database used for analytical reference | `superstores_cleared` |
| Table used for analytical reference | `superstore_cleaned_python` |
| Dashboard data source | `data/superstore.json` |
| Analysis period | 2014–2017 |
| Transaction records | 9,994 |
| Profit margin formula | `SUM(Profit) / SUM(Sales) × 100` |

## Dashboard Page Mapping

| Dashboard Page | Primary Question | Relevant Documentation |
|---|---|---|
| Home | What is the overall business performance? | `OVERVIEW_INSIGHTS.md`, `EXECUTIVE_SUMMARY.md` |
| Sales Analysis | How did sales, discounts, and profitability change? | `KEY_FINDINGS.md`, `EXECUTIVE_SUMMARY.md` |
| Regional Analysis | Which regions and states perform best? | `Regional-Analysis-Insights.md`, `KEY_FINDINGS.md` |
| Product Analysis | Which products and subcategories contribute to profit or loss? | `Product-Analysis-Insights.md`, `KEY_FINDINGS.md` |
| Customer Analysis | Who are the customers and how do they purchase? | `customer-analysis-insights.md` |
| Profitability Analysis | Where does the business generate or lose profit? | `KEY_FINDINGS.md`, `EXECUTIVE_SUMMARY.md` |

## Global Filter Requirements

Dashboard insights must respect the applicable global filters:

- Region
- Category
- Segment
- Year

The figures in these documents represent validated baseline results for their specified filter scopes. They must not be hardcoded into dashboard components when the values should respond dynamically to filters.

## Important Analytical Safeguards

- Use weighted profit margin, not the average of individual transaction margins.
- Do not infer causation from an observed discount-profit relationship.
- Small groups and individual transactions are examples, not broad evidence.
- A product with negative net profit over several years may still have profitable individual transactions.
- No matching rows is not the same as zero sales or zero profit.
- Keep region-specific and segment-specific findings clearly labelled.
- Always identify the filter scope and date range when reporting analytical findings.

## Updating These Documents

When new analytical results are validated:

1. Record the exact filter scope and date range.
2. Preserve the query or calculation methodology used, where practical.
3. Update the relevant evidence and interpretations in `KEY_FINDINGS.md`.
4. Update the relevant page-specific insight document when new evidence affects its findings.
5. Update `EXECUTIVE_SUMMARY.md` only when new evidence changes the strongest insight themes or baseline values.
6. Keep this README aligned with the actual documentation files and dashboard responsibilities.

## SQL Reference

SQL queries were used during the analysis and independent validation of the Superstore dataset. However, SQL scripts are not currently included in this dashboard repository.

The dashboard itself uses the cleaned JSON dataset at `data/superstore.json` as its data source. MySQL was used as an analytical reference for validating calculations and baseline results.

The absence of SQL scripts from this repository does not mean SQL was not used during the analytical process.
