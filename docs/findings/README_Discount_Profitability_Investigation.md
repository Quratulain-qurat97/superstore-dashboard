# Superstore Analytics Dashboard

## Discount Profitability Investigation

**Status:** SQL investigation completed; dashboard implementation
pending.

This document records the validated findings from the
discount-profitability investigation and the agreed plan for presenting
them in the Superstore Analytics Dashboard.

------------------------------------------------------------------------

## 1. Data source

-   **Database:** `superstores_cleared`
-   **Table:** `superstore_cleaned_python`
-   **Source:** Python-cleaned Superstore dataset imported into MySQL.

Profit margin is calculated as:

\[ `\text{Profit Margin}`{=tex} =
`\frac{\text{Total Profit}}{\text{Total Sales}}`{=tex}
`\times 100`{=tex} \]

------------------------------------------------------------------------

## 2. Dataset-wide discount profitability

The following results were obtained by grouping the entire dataset by
discount level.

    Discount   Order lines   Units sold            Sales         Profit   Profit margin
  ---------- ------------- ------------ ---------------- -------------- ---------------
          0%         4,798       18,267   \$1,087,908.47   \$320,987.60          29.51%
         10%            94          373      \$54,369.35     \$9,029.18          16.61%
         15%            52          198      \$27,558.52     \$1,418.99           5.15%
         20%         3,657       13,660     \$764,594.37    \$90,337.31          11.82%
         30%           227          849     \$103,226.66   -\$10,369.28         -10.05%
         32%            27          105      \$14,493.46    -\$2,391.14         -16.50%
         40%           206          786     \$116,417.78   -\$23,057.05         -19.81%
         45%            11           45       \$5,484.97    -\$2,493.11         -45.45%
         50%            66          241      \$58,918.54   -\$20,506.43         -34.80%
         60%           138          501       \$6,644.70    -\$5,944.66         -89.46%
         70%           418        1,660      \$40,620.28   -\$40,075.36         -98.66%
         80%           300        1,188      \$16,963.76   -\$30,539.04        -180.03%

### Key findings

-   All observed discount levels from **0% through 20%** generated
    positive profit margins.
-   Every observed discount level from **30% through 80%** generated a
    negative profit margin.
-   The relationship is not perfectly linear. For example, the 45%
    discount group had a -45.45% margin, while the 50% group had a
    -34.80% margin.

### Financial impact

  Discount range     Order lines          Sales   Combined profit
  ---------------- ------------- -------------- -----------------
  30%--80%                 1,393   \$362,770.15     -\$135,376.07
  60%--80%                   856    \$64,228.74      -\$76,559.06

-   The 30%--80% discount groups had an aggregate weighted profit margin
    of approximately **-37.32%**.
-   The 60%--80% discount groups generated **\$76,559.06 in combined
    losses**.
-   The 70% and 80% discount groups together generated **\$70,614.40 in
    losses**.

------------------------------------------------------------------------

## 3. Product-level investigation

The initial concern came from the **West region, Home Office segment,
Machines subcategory**.

Three transactions at a 70% discount were identified:

  ----------------------------------------------------------------------------------
  Product                    Units            Sales            Profit         Margin
  ----------------- -------------- ---------------- ----------------- --------------
  Lexmark MX611dhe               5       \$2,549.99       -\$3,399.98       -133.33%
  Monochrome Laser                                                    
  Printer                                                             

  Zebra GK420t                   6         \$703.71         -\$938.28       -133.33%
  Direct                                                              
  Thermal/Thermal                                                     
  Transfer Printer                                                    

  Swingline SM12-08              5         \$599.99         -\$479.99        -80.00%
  MicroCut Jam Free                                                   
  Shredder                                                            

  **Combined**              **16**   **\$3,853.68**   **-\$4,818.25**            ---
  ----------------------------------------------------------------------------------

These three order lines account for the full loss in the West + Home
Office + Machines 70%-discount group.

### Cross-region and segment comparisons

**Lexmark MX611dhe printer** - Central / Corporate at 10% discount:
**+22.22%** margin. - Central / Consumer at 40% discount: **-16.67%**
margin. - Central / Corporate at 40% discount: **-16.67%** margin. -
West / Home Office at 70% discount: **-133.33%** margin.

**Swingline SM12-08 shredder** - West / Home Office at 20% discount:
**+32.50%** margin. - East / Consumer at 70% discount: **-80.00%**
margin. - West / Home Office at 70% discount: **-80.00%** margin.

**Zebra GK420t printer** - The observed transaction was in West / Home
Office at 70% discount, with a **-133.33%** margin. The available
comparison does not establish its performance at other discount levels.

### Interpretation

-   The high-discount losses are not exclusive to one product or one
    region.
-   The same Lexmark product has different profitability outcomes across
    discount levels and business contexts.
-   Swingline is profitable at 20% but loss-making at 70% in the
    observed records.
-   The dataset-wide results show that the high-discount profitability
    pattern extends beyond these three transactions.

------------------------------------------------------------------------

## 4. Dashboard implementation plan

The agreed approach is to present the finding at two levels: a concise
business-level insight in the Executive Summary and a deeper
investigation on the Product Analysis page.

### A. Executive Summary --- high-level insight

Include one concise insight among the 3--5 dynamically generated
Executive Summary insights.

**Proposed title:** High Discount Profitability Risk

**Proposed insight:**

> All observed discount tiers of 30% or higher recorded negative profit
> margins. Discounts of 60--80% generated \$76.56K in combined losses,
> highlighting a significant profitability risk associated with
> aggressive discounting.

**Purpose** - Make the overall profitability issue immediately
visible. - Communicate its financial impact without overwhelming the
reader. - Direct readers to Product Analysis for the deeper
investigation.

**Dynamic behavior:** Calculate this insight from the actual currently
filtered dataset. It must update with the four global filters:

-   Region
-   Category
-   Segment
-   Year

Do not hardcode the full-dataset baseline figures into the dashboard
insight.

### B. Product Analysis --- detailed investigation

Use this page to investigate which products contribute to
discount-related losses and how their performance differs.

Recommended analysis:

1.  **Products contributing to high-discount losses**
    -   Identify products with the largest negative profit.
    -   Show sales, profit, and profit margin.
2.  **Subcategory contribution**
    -   Identify subcategories accounting for the largest losses.
    -   Compare profitable and loss-making subcategories.
3.  **Discount-level product performance**
    -   Compare product profitability at different observed discount
        levels.
    -   Identify products that are profitable at lower discounts but
        loss-making at higher discounts.
4.  **Regional and segment comparison**
    -   Determine where major product losses occur.
    -   Compare the same products across regions and customer segments
        where sufficient data exists.
5.  **Extreme-loss examples**
    -   Investigate the Lexmark, Zebra, and Swingline transactions.
    -   Use their combined **\$4,818.25 loss** as a specific drilldown
        example, not as a representation of all high-discount losses.

**Purpose:** Move beyond the overall discount pattern and identify the
products, subcategories, and business contexts behind the losses.

------------------------------------------------------------------------

## 5. Interpretation and data-quality cautions

-   The observed relationship between high discounts and negative profit
    is an **association**, not proof that discounts alone caused the
    losses.
-   The implied product cost previously calculated as `Sales - Profit`
    is derived from the dataset's Sales and Profit fields. It is not an
    independently verified cost figure.
-   Validate the source dataset's profit calculation, discount
    treatment, and transaction context before making causal claims or
    recommending a specific discount policy.
-   The results in this document are the full-dataset baseline.
    Dashboard insights must recalculate when global filters change.

------------------------------------------------------------------------

## 6. Final agreed conclusion

The Superstore dataset shows a substantial profitability concern
associated with high-discount transactions:

-   Every observed discount tier from 30% through 80% was loss-making.
-   The 30%--80% groups generated **\$135.38K in combined losses**.
-   The 60%--80% groups generated **\$76.56K in combined losses**.
-   Specific product investigations revealed exceptionally negative
    margins, including **-133.33%** for two printer transactions.

### Implementation decision

  -----------------------------------------------------------------------
  Dashboard page                      What to include
  ----------------------------------- -----------------------------------
  **Executive Summary**               One concise, dynamically calculated
                                      insight communicating the overall
                                      high-discount profitability risk.

  **Product Analysis**                Detailed investigation of products,
                                      subcategories, discount levels,
                                      regions, segments, and the
                                      transactions contributing to
                                      losses.
  -----------------------------------------------------------------------

Keep the detailed investigation on Product Analysis and the
business-level conclusion in the Executive Summary.
