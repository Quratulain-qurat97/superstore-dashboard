# Overview Insights — Superstore Retail Analytics Dashboard

## Purpose

This document records the key business findings supported by the Overview dashboard. It will serve as a reference when developing the Overview page's Executive Summary.

All figures represent the full dataset before applying dashboard filters.

---

## 1. Central Region — Furniture Records a Net Loss

### Key Metrics

| Metric | Value |
|---|---:|
| Central Total Sales | $501.2K |
| Central Total Profit | $39.7K |
| Furniture Sales | $163.8K |
| Furniture Profit | -$2,871.05 |
| Furniture Profit Margin | -1.75% |

### Key Insight

The Central region generated approximately $501.2K in sales and $39.7K in overall profit. However, Furniture was its only loss-making category, recording approximately $2.87K in losses and a -1.75% profit margin.

Central Office Supplies and Technology remained profitable, with margins of 5.32% and 19.77%, respectively.

### Business Implication

Although Central is profitable overall, its Furniture category is generating losses despite substantial sales. This highlights a category-level profitability concern that may require further investigation.

### Further Investigation

Examine Furniture subcategories, individual products, discount levels, and transaction-level profitability.

**Supporting analysis:** Central category profitability SQL query.

---

## 2. West Region — Leading Contributor to Sales and Profit

### Key Metrics

| Metric | Value |
|---|---:|
| Total Sales | $725.5K |
| Total Profit | $108.4K |
| Profit Margin | 14.9% |
| Total Orders | 1,611 |
| West Customers | 686 |
| Total Dataset Customers | 793 |

### Additional Metrics

- West served approximately 86.5% of the dataset's customers.
- West accounted for approximately 32.7% of total orders.

### Key Insight

The West region generated approximately $725.5K in sales and $108.4K in profit, achieving a 14.9% profit margin.

It was the leading region in total sales and total profit contribution, serving 686 of the 793 customers in the dataset.

### Business Implication

West represents a major contributor to overall business performance. Its substantial sales, profit contribution, and customer reach make it an important region to monitor.

### Further Investigation

Compare regional profit margins and investigate the categories, products, and customer segments contributing to West's performance.

**Supporting analysis:** Regional sales and profitability metrics.

---

## 3. Consumer Segment — Contributes More Than Half of Total Sales

### Overall Business Metrics

| Metric | Value |
|---|---:|
| Total Sales | $2.30M |
| Total Profit | $286.4K |

### Consumer Segment Metrics

| Metric | Value |
|---|---:|
| Total Sales | $1.16M |
| Total Profit | $134.1K |
| Share of Total Sales | 50.6% |

### Key Insight

The Consumer segment generated approximately $1.16M in sales and $134.1K in profit, accounting for 50.6% of total business sales.

This makes Consumer the largest contributor to revenue among the three customer segments.

### Business Implication

More than half of total business sales come from Consumer customers. Consequently, changes in this segment's performance could have a significant impact on overall business results.

### Further Investigation

Compare Consumer, Corporate, and Home Office profitability, and identify the products and categories contributing most to Consumer sales.

**Supporting analysis:** Segment-level sales and profit metrics.

---

## 4. Yearly Performance — Strong Sales and Profit Growth

### Yearly Performance

| Year | Total Sales | Total Profit | Profit Margin | Total Orders |
|---|---:|---:|---:|---:|
| 2014 | $484,247.50 | $49,543.97 | 10.23% | 969 |
| 2015 | $470,532.51 | $61,618.60 | 13.10% | 1,038 |
| 2016 | $609,205.60 | $81,795.17 | 13.43% | 1,315 |
| 2017 | $733,215.26 | $93,439.27 | 12.74% | 1,687 |

### Key Insight

Between 2014 and 2017:

- Sales increased approximately 51.4%.
- Profit increased approximately 88.6%.
- Orders increased from 969 to 1,687.
- Profit margin improved from 10.23% in 2014 to 12.74% in 2017.

However, profit margin peaked at 13.43% in 2016 before declining slightly to 12.74% in 2017.

### Business Implication

The business experienced substantial growth in both revenue and profit over the four-year period. However, the slight margin decline in 2017 indicates that profitability did not improve at the same rate as sales during the final year.

### Further Investigation

Examine changes in discounting, product mix, and regional performance between 2016 and 2017 to understand the margin decline.

**Supporting analysis:** Yearly sales, profit, margin, and order SQL query.

---

# Consolidated Overview Findings

| # | Finding | Key Evidence |
|---|---|---|
| 1 | Central Furniture profitability concern | -$2.87K profit and -1.75% margin |
| 2 | West regional leadership | $725.5K sales and $108.4K profit |
| 3 | Consumer segment sales contribution | 50.6% of total business sales |
| 4 | Strong yearly business growth | Sales grew 51.4% and profit 88.6% from 2014–2017 |

---

# Methodology and Data Notes

**Database:** `superstores_cleared`

**Table:** `superstore_cleaned_python`

### Metric Definitions

- Total Sales: `SUM(Sales)`
- Total Profit: `SUM(Profit)`
- Profit Margin: `SUM(Profit) / SUM(Sales) * 100`
- Total Orders: `COUNT(DISTINCT Order ID)`
- Total Customers: `COUNT(DISTINCT Customer ID)`

### Interpretation Guidelines

1. Total profit and profit margin measure different aspects of performance.
2. A loss-making category does not mean every product within that category is loss-making.
3. Associations between discounts and losses should not be presented as proof of causation.
4. Rounded dashboard values should be distinguished from exact SQL results.
5. Findings in this document describe full-dataset baseline performance, not dynamically filtered results.

---

# Future Executive Summary Reference

These four findings will serve as the baseline evidence for the Overview page's future Executive Summary.

The eventual Executive Summary must:

- Display approximately 3–5 meaningful business insights.
- Recalculate metrics using the currently filtered dataset.
- Respond to all four global filters:
  - Region
  - Category
  - Segment
  - Year
- Present concise business interpretations rather than simply repeating chart values.
- Avoid hardcoding the baseline figures in place of dynamically calculated results.

**Important:** This document contains only findings relevant to the Overview dashboard. Additional SQL investigations, including the seven loss-making Central subcategories, should be documented separately and used in the relevant detailed analysis pages.

---

*Document: `OVERVIEW_INSIGHTS.md`*  
*Project: Superstore Retail Analytics Dashboard*