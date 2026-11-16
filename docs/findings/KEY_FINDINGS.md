# Superstore Analytics Dashboard --- Validated Key Findings

**Purpose:** Preserve the validated profitability findings from the
Superstore analysis so they can guide the Product Analysis, Sales
Analysis, and Executive Summary pages.

**Dataset:** `superstores_cleared.superstore_cleaned_python`\
**Analysis period:** 2014--2017\
**Profit margin formula:** `SUM(Profit) / SUM(Sales) * 100`

------------------------------------------------------------------------

## 1. Dataset-wide discount profitability

The full-dataset discount analysis showed a clear separation in observed
profitability:

-   Discount tiers from **0% through 20%** were profitable in the
    aggregated results.
-   Every observed discount tier from **30% through 80%** recorded a
    negative profit margin.
-   The relationship was not perfectly monotonic: for example, the 45%
    tier had a -45.45% margin, while the 50% tier had a -34.80% margin.

### High-discount financial impact

  Discount range     Order lines          Sales          Profit   Weighted margin
  ---------------- ------------- -------------- --------------- -----------------
  30%--80%                 1,393   \$362,770.15   -\$135,376.07           -37.32%
  60%--80%                   856    \$64,228.74    -\$76,559.06          -119.20%

The 60%--80% weighted margin is calculated as combined profit divided by
combined sales. These tiers generated losses substantially larger than
their sales base.

**Interpretation:** The observed high-discount tiers represent a major
profitability risk in this dataset. This is an association, not proof
that discounting alone caused the losses.

------------------------------------------------------------------------

## 2. West region: Home Office year-over-year profitability

West + Home Office remained profitable in every year, but its profit
margin weakened significantly.

  Year           Sales       Profit   Profit margin
  ------ ------------- ------------ ---------------
  2014     \$21,708.92   \$3,690.42          17.00%
  2015     \$20,478.85   \$2,774.07          13.55%
  2016     \$37,943.41   \$3,696.97           9.74%
  2017     \$56,590.59   \$6,368.95          11.25%

**Interpretation:**

-   Margin declined from 17.00% in 2014 to 9.74% in 2016.
-   It recovered partially to 11.25% in 2017, but remained below the
    2014 level.
-   Sales increased substantially, but the margin did not keep pace.
-   The segment was never loss-making overall in the years shown;
    describe this as profitability deterioration, not an overall loss.

### West segment comparison

In 2016, Home Office margin was 9.74% and Corporate margin was 9.95%,
while Consumer improved to 16.54%. In 2017, Consumer reached 20.21%,
Corporate recovered to 18.27%, and Home Office remained lower at 11.25%.

**Interpretation:** The 2016 pressure was not exclusive to Home Office,
but Home Office had the weakest recovery in 2017.

------------------------------------------------------------------------

## 3. West region: Tables and Machines

### West + Home Office subcategory results

  Year   Subcategory          Sales        Profit   Profit margin
  ------ ------------- ------------ ------------- ---------------
  2014   Tables          \$2,448.41      \$401.79          16.41%
  2014   Machines        \$1,279.97      \$415.99          32.50%
  2015   Tables          \$2,918.38      \$225.94           7.74%
  2015   Machines           No rows           ---             ---
  2016   Tables          \$3,401.65   -\$1,378.97         -40.54%
  2016   Machines        \$4,072.87     -\$556.79         -13.67%
  2017   Tables          \$7,240.75      \$637.67           8.81%
  2017   Machines        \$5,888.37   -\$3,631.78         -61.68%

**Interpretation:**

-   Home Office Tables moved from a substantial loss in 2016 to a
    positive result in 2017.
-   Home Office Machines deteriorated further in 2017, recording a
    \$3,631.78 loss at a -61.68% margin.
-   There were no West + Home Office Machines rows in 2015; this must
    not be represented as zero sales or zero profit.

### Discount-level pattern in West Tables and Machines

In the observed West segment/year combinations:

-   Every listed 50% discount Tables group was loss-making.
-   Every listed 70% discount Machines group was loss-making.
-   Some 20% discount Tables groups were also loss-making, while other
    20% groups remained profitable.

**Interpretation:** High discounts are an important risk signal, but a
20% discount does not guarantee profitability. The product and
transaction context also matter. Sample sizes in many groups are small.

------------------------------------------------------------------------

## 4. Product-level loss examples

The following examples show why product-level analysis is useful. They
are individual transaction or small-group observations, not universal
product rules.

  -------------------------------------------------------------------------------
  Product             Region /           Discount           Sales          Profit
                      year /                                      
                      segment                                     
  ------------------- ----------- --------------- --------------- ---------------
  Lexmark MX611dhe    West, 2017,             70%      \$2,549.99     -\$3,399.98
  Monochrome Laser    Home Office                                 
  Printer                                                         

  Zebra GK420t Direct West, 2016,             70%        \$703.71       -\$938.28
  Thermal/Thermal     Home Office                                 
  Transfer Printer                                                

  Swingline SM12-08   West, 2017,             70%        \$599.99       -\$479.99
  MicroCut Jam Free   Home Office                                 
  Shredder                                                        

  Bush Advantage      West, 2016,             50%      \$1,272.63       -\$814.48
  Collection          Home Office                                 
  Racetrack                                                       
  Conference Table                                                

  Bevis Boat-Shaped   West, 2015,             50%        \$393.17       -\$204.45
  Conference Table    Consumer                                    

  Bevis Boat-Shaped   West, 2016,             50%        \$393.17       -\$204.45
  Conference Table    Consumer                                    

  Bretford "Just In   West, 2016,             20%      \$3,339.20       -\$542.62
  Time"               Consumer                                    
  Height-Adjustable                                               
  Multi-Task Work                                                 
  Tables                                                          
  -------------------------------------------------------------------------------

### Product performance varies across regions and transactions

The cross-region comparison showed that several products with losses in
West also had losses elsewhere:

-   **Bevis Boat-Shaped Conference Table:** losses appeared in East and
    West; a Central 2017 Home Office transaction was profitable.
-   **Bush Advantage Collection Racetrack Conference Table:** losses
    appeared in Central, East, South, and West. A West 2015 Corporate
    transaction at 0% discount was profitable (+\$610.86), while a West
    2016 Home Office transaction at 50% discount lost \$814.48.
-   **Hon 5100 Series Wood Tables:** losses appeared in East, South, and
    West, while some 0% discount transactions in Central and South were
    profitable.
-   **Lexmark MX611dhe Printer:** losses appeared in Central and West. A
    Central 2017 Corporate transaction at 10% discount was profitable
    (+\$680.00), while the West 2017 Home Office transaction at 70%
    discount lost \$3,399.98.
-   **Swingline SM12-08 Shredder:** losses appeared in East and West. A
    West 2014 Home Office transaction at 20% discount was profitable
    (+\$415.99), while 70% discount transactions in East and West were
    loss-making.
-   **Zebra GK420t Printer:** the supplied comparison showed a severe
    loss in West in 2016; no conclusion about other regions should be
    drawn from this result alone.

**Interpretation:** Product profitability varies by region, year,
segment, and discount. Do not label a product universally unprofitable
based on one transaction or one region.

------------------------------------------------------------------------

## 5. Product-level net losses over the full West period

A separate query grouped products across 2014--2017 in West and retained
products where total profit was negative. It returned 29 products.

Important distinction: `HAVING SUM(Profit) < 0` identifies products with
a negative **net total** over the selected period. It does not mean
every transaction for that product was loss-making.

Examples of products with repeated observations included:

-   KI Conference Tables: 5 lines across 4 years observed, net profit
    -\$136.11.
-   Bevis Boat-Shaped Conference Table: 3 lines across 3 years observed,
    net profit -\$377.44.
-   Hon 61000 Series Interactive Training Tables: 4 lines across 3 years
    observed, net profit -\$6.22.
-   Hon 94000 Series Round Tables: 3 lines across 3 years observed, net
    profit -\$53.31.
-   Bretford "Just In Time" Height-Adjustable Multi-Task Work Tables: 3
    lines across 2 years observed, net profit -\$425.75.

Some products had both profitable and unprofitable transactions. For
example, the transaction history showed positive and negative outcomes
for Bretford, Bush Advantage, Hon 5100, Hon 94000, KI Adjustable-Height,
and Swingline products.

------------------------------------------------------------------------

## 6. Recommended dashboard placement

### Sales Analysis page --- financial impact

Use: - Discount-tier sales, profit, and margin. - Financial impact of
high-discount tiers. - Year-over-year profitability trends. - The West +
Home Office deterioration as a focused regional/segment example, if the
page's filters or narrative make that context clear.

### Product Analysis page --- product contributors

Use: - Product and subcategory profitability. - Ranked loss-making
products. - Product performance by region and segment. - Product-level
discount and transaction context. - Clear distinction between a
product's net loss over a period and an individual loss-making
transaction.

### Executive Summary --- concise decision-level insights

Potential insight themes: 1. High-discount profitability risk. 2. West +
Home Office margin deterioration. 3. 2017 West + Home Office Machines
loss. 4. Home Office Tables recovery in 2017. 5. Product profitability
differs across regions and discount conditions.

The Executive Summary should show only the strongest 3--5 insights for
the currently selected filters.

------------------------------------------------------------------------

## 7. Validation and interpretation rules

1.  Use weighted profit margin: `SUM(Profit) / SUM(Sales) * 100`. Do not
    average row-level percentages to calculate an aggregate margin.
2.  Keep the analysis period and filter context visible.
3.  Do not claim discounts caused losses; the analysis establishes
    association, not causation.
4.  Treat groups with one or a few order lines as limited evidence.
5.  Distinguish no rows from zero sales/profit.
6.  Distinguish product net loss across multiple years from every
    transaction being loss-making.
7.  All findings displayed in the dashboard should recalculate from the
    active global filters: Region, Category, Segment, and Year.
8.  Use the validated figures in this document as baseline checks when
    implementing and testing the dashboard. If the filters differ, the
    displayed result should differ accordingly.

------------------------------------------------------------------------

## 8. SQL source and reproducibility

Database and table used: - Database: `superstores_cleared` - Table:
`superstore_cleaned_python`

Relevant fields: - `Region` - `Segment` - `Sub-Category` -
`Product Name` - `Sales` - `Profit` - `Discount` - `Quantity` -
`Order ID` - `Order Date` - `Row ID`

The SQL query outputs were supplied during the analysis conversation.
This document preserves the findings and interpretation; it is not a
substitute for retaining the actual SQL query scripts and source
dataset.
