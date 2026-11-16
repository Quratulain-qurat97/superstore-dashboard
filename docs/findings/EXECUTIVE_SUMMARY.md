# Superstore Analytics Dashboard --- Executive Summary Findings

**Purpose:** A concise, decision-oriented reference for the dashboard's
Executive Summary panel.

**Dataset period:** 2014--2017\
**Source table:** `superstores_cleared.superstore_cleaned_python`

------------------------------------------------------------------------

## Executive Summary

The analysis identifies a material relationship between high discount
tiers and negative profitability, alongside specific regional, segment,
and product-level pressure points. In the full dataset, all observed
discount tiers from 30% to 80% were loss-making in aggregate. Within
West + Home Office, overall profitability remained positive each year,
but margin declined from 17.00% in 2014 to 9.74% in 2016 and recovered
only partially to 11.25% in 2017. The most severe subcategory issue was
Home Office Machines in West in 2017, which recorded a \$3,631.78 loss
at a -61.68% margin. Home Office Tables, by contrast, recovered from a
\$1,378.97 loss in 2016 to a \$637.67 profit in 2017.

These findings should be treated as evidence of profitability risks and
patterns, not proof that discounting alone caused losses.

------------------------------------------------------------------------

## Key Finding 1 --- High discounts are associated with substantial losses

All observed discount tiers from 30% through 80% recorded negative
aggregate profit margins in the full dataset.

-   30%--80% discount tiers: \$362,770.15 sales and -\$135,376.07
    profit.
-   Combined weighted profit margin: -37.32%.
-   60%--80% discount tiers: \$64,228.74 sales and -\$76,559.06 profit.

**Suggested panel title:** High-Discount Profitability Risk

**Suggested dynamic insight:** "Discount tiers of 30% or higher are
currently generating \[calculated profit\] in combined losses at a
\[calculated margin\] margin."

The panel must recalculate this statement from the active filters. If
the selected data does not contain those discount tiers or the losses
are no longer present, the insight must change or disappear.

------------------------------------------------------------------------

## Key Finding 2 --- West Home Office profitability weakened

West + Home Office remained profitable in every year from 2014 to 2017,
but its margin declined:

-   2014: 17.00%
-   2015: 13.55%
-   2016: 9.74%
-   2017: 11.25%

**Suggested panel title:** Home Office Margin Pressure

**Suggested dynamic insight:** "West Home Office margin moved from
\[start margin\] to \[end margin\] over the selected period."

Do not describe the whole West Home Office segment as loss-making. It
remained profitable overall in each year.

------------------------------------------------------------------------

## Key Finding 3 --- West Home Office Machines suffered a severe 2017 loss

In West, Home Office Machines recorded:

-   Sales: \$5,888.37
-   Profit: -\$3,631.78
-   Profit margin: -61.68%

This was a sharper issue than Home Office Tables in 2017.

**Suggested panel title:** Machines Profitability Alert

**Suggested dynamic insight:** "Machines recorded \[calculated profit\]
at a \[calculated margin\] margin for the selected filters."

------------------------------------------------------------------------

## Key Finding 4 --- Home Office Tables recovered in 2017

West + Home Office Tables changed from:

-   2016: -\$1,378.97 profit, -40.54% margin.
-   2017: +\$637.67 profit, +8.81% margin.

**Suggested panel title:** Tables Profit Recovery

**Suggested dynamic insight:** "Tables moved from \[prior-period
profit\] to \[current-period profit\] across the selected years."

------------------------------------------------------------------------

## Key Finding 5 --- Product outcomes vary across regions and discount conditions

The same products showed different results across transactions,
segments, regions, and discount levels.

Examples: - Bush Advantage Collection Racetrack Conference Table: West
2015 at 0% discount generated +\$610.86, while West 2016 at 50% discount
generated -\$814.48. - Lexmark MX611dhe Printer: Central 2017 at 10%
discount generated +\$680.00, while West 2017 at 70% discount generated
-\$3,399.98. - Swingline SM12-08 Shredder: West 2014 at 20% discount
generated +\$415.99, while West 2017 at 70% discount generated
-\$479.99.

**Suggested panel title:** Product Profitability Varies

**Suggested dynamic insight:** "Profitability differs across products
and selected business conditions; review the largest current
product-level losses."

------------------------------------------------------------------------

## Recommended Executive Summary behavior

The dashboard should display 3--5 insights, chosen by significance and
relevance to the currently selected data.

Global filters: - Region - Category - Segment - Year

Implementation principles: 1. Calculate insights from the filtered
dataset, not fixed historical text. 2. Use weighted margin: total profit
divided by total sales. 3. Prioritize material losses, large margin
changes, and meaningful recoveries. 4. Suppress an insight when its
required comparison or data is unavailable. 5. Avoid displaying a
West-specific insight as if it applies to all regions. 6. Show the
relevant period, segment, region, and metric in each insight. 7. Use
neutral wording such as "associated with" or "recorded"; avoid
unsupported causal language.

------------------------------------------------------------------------

## Suggested priority order

For the current full-dataset baseline: 1. High-discount profitability
risk. 2. West Home Office Machines 2017 loss. 3. West Home Office margin
deterioration. 4. West Home Office Tables recovery. 5. Product-level
regional variation.

This priority order is a starting point. It should be recalculated or
adapted when users change filters.
