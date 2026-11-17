

# Regional Analysis â€” Executive Summary Insights

**Dashboard:** Superstore Analytics Dashboard
**Page:** Regional Analysis
**Dataset:** Superstore Cleaned Dataset
**Baseline:** All global filters cleared

## 1. West Leads Regional Profitability

West is the strongest region by overall profitability, generating **$725,457.82 in sales** and **$108,418.45 in profit**, with a profit margin of **14.94%**.

## 2. Central Has the Lowest Regional Profit

Despite generating $501,239.89 in sales, Central produces only **$39,706.36 in profit**, the lowest among the four regions. Its profit margin is **7.92%**.

## 3. Central Has the Highest Loss Impact

Central records **$38,337.24 in state-level losses**, resulting in a loss impact of **49.12%**, the highest among all four regions.

## 4. Texas Is the Largest State-Level Loss Contributor

Texas has the lowest state-level profit, recording a loss of **$25,729.36**, making it the worst-performing state in the dataset.

## 5. West Has the Lowest Loss Impact

Although West has three loss-making states, its loss impact is only **9.32%**, the lowest among the four regions.

---

## Calculation Definitions

| Metric | Calculation |
|---|---|
| Regional Profit Margin | Regional Profit Ã· Regional Sales Ã— 100 |
| Total State Losses | Sum of absolute losses from loss-making states |
| Loss Impact | Absolute losses from negative-profit states Ã· profit from positive-profit states Ã— 100 |
| Worst State Profit | Lowest aggregated state-level profit |

## Dynamic Insight Requirements

The Executive Summary must:

- Display 3â€“5 meaningful, data-supported insights.
- Recalculate insights using the currently filtered dataset.
- Respond dynamically to Region, Category, Segment, and Year filters.
- Use actual calculated values rather than hardcoded baseline figures.
- Avoid treating a profitable region as loss-making merely because some of its states are unprofitable.

**Note:** The five findings above represent the unfiltered baseline. Their values and rankings may change when global filters are applied.
