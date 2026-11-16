# Superstore Analytics Dashboard --- Findings Documentation

This folder contains three reference documents that preserve the
validated profitability analysis and explain how to use it when
developing the dashboard.

## Files

### 1. `KEY_FINDINGS.md`

The detailed evidence reference: - Dataset-wide discount
profitability. - West + Home Office year-over-year performance. - Tables
and Machines performance. - Product-level loss examples. - Cross-region
product comparisons. - Interpretation caveats and dashboard placement.

Use this file when building or validating the Product Analysis and Sales
Analysis pages.

### 2. `EXECUTIVE_SUMMARY.md`

The concise decision-level reference: - Five key finding themes. -
Suggested titles and dynamic insight wording. - Current baseline
values. - Recommended insight priority. - Rules for dynamically updating
the panel.

Use this file when implementing the collapsible Executive Summary panel.

### 3. `README.md`

This guide explains the purpose of the documentation and how to maintain
it.

## Dataset reference

-   Database: `superstores_cleared`
-   Table: `superstore_cleaned_python`
-   Period analyzed: 2014--2017
-   Profit margin: `SUM(Profit) / SUM(Sales) * 100`

## Dashboard structure

  -----------------------------------------------------------------------
  Dashboard page          Primary question        Findings to use
  ----------------------- ----------------------- -----------------------
  Sales Analysis          How did sales,          Discount-tier impact,
                          discounts, and          high-discount losses,
                          profitability change?   year-over-year trends

  Product Analysis        Which products and      Product-level losses,
                          subcategories           Tables/Machines, region
                          contribute to profit or and segment comparisons
                          loss?                   

  Executive Summary       What are the most       The strongest 3--5
                          important things to     dynamic insights from
                          know right now?         the active filters
  -----------------------------------------------------------------------

## Global filter requirements

All findings displayed in the dashboard must respect the four global
filters: - Region - Category - Segment - Year

The figures in these documents are validated baseline results for the
specific filter scopes described. They are not fixed values to hardcode
into the UI.

## Important analytical safeguards

-   Use weighted margin, not the average of individual row margins.
-   Do not infer causation from the observed discount/profit
    relationship.
-   Small groups and single-line transactions are examples, not broad
    proof.
-   A product with negative net profit over several years may still have
    profitable transactions.
-   No matching rows is not the same as zero sales or zero profit.
-   Keep region- and segment-specific findings clearly labelled.

## Updating these documents

When new SQL results are validated: 1. Record the exact filter scope and
date range. 2. Preserve the SQL query used, ideally in a
version-controlled `sql/` folder. 3. Update the relevant tables and
interpretation in `KEY_FINDINGS.md`. 4. Update `EXECUTIVE_SUMMARY.md`
only when the new evidence changes the strongest insight themes or
baseline values. 5. Keep this README aligned with the current file
contents and dashboard page responsibilities.

## Recommended project placement

You can keep these files in a project documentation folder such as:

``` text
docs/
  findings/
    KEY_FINDINGS.md
    EXECUTIVE_SUMMARY.md
    README.md
```

Keep the SQL scripts separately, for example:

``` text
sql/
  discount_profitability.sql
  west_home_office_yearly_profitability.sql
  west_tables_machines_by_segment.sql
  product_loss_transaction_history.sql
  cross_region_product_comparison.sql
```

The filenames above are suggested organization only. They do not imply
that those SQL scripts have already been created.
