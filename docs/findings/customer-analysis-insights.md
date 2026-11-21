# Customer Analysis

## Overview

The Customer Analysis page examines customer value, profitability, retention, and revenue and profit concentration using the Superstore dataset.

The analysis focuses on four questions:

- How much revenue and profit does the average customer generate?
- Which customers generate losses despite contributing revenue?
- How concentrated are sales and profit among the highest-value customers?
- Are customers returning year after year?

The page contains four KPI cards and four charts, supported by global dashboard filters.

## Dataset

| Metric | Value |
|---|---:|
| Transaction rows | 9,994 |
| Unique customers | 793 |
| Unique orders | 5,009 |
| Total sales | $2,297,200.86 |
| Total profit | $286,397.02 |
| Analysis period | January 2014 – December 2017 |

**Data source:** `superstore_cleaned_python`

Each dataset row represents a product line within an order. Customer-level and order-level calculations therefore use distinct customer and order identifiers to avoid counting the same customer or order multiple times.

## Key Performance Indicators

### 1. Average Sales per Customer

**Formula:**

`Total Sales / Distinct Customer Count`

**Verified benchmark:** $2,896.85

Measures the average revenue generated per customer across the dataset.

### 2. Average Order Value

**Formula:**

`Total Sales / Distinct Order Count`

**Verified benchmark:** $458.61

Measures the average revenue generated per order. The calculation uses distinct order IDs rather than transaction rows.

### 3. Loss-Making Customers

**Definition:** Customers whose aggregated profit is below zero.

**Verified benchmark:**

- 155 loss-making customers
- 19.55% of the customer base
- $71,224.47 combined loss

This KPI identifies customers who generate negative overall profit despite making purchases.

### 4. Customer Retention

**Formula:**

`Customers Active in Both Consecutive Years / Customers Active in Previous Year × 100`

**Verified retention benchmarks:**

- 2015: 73.45%
- 2016: 78.88%
- 2017: 87.46%

When the Year filter is set to All, the latest available comparison is 2017 versus 2016.

The first year, 2014, has no previous-year comparison because the dataset begins in 2014.

## Charts and Analysis

### 1. Customer Sales vs Profit Margin

A customer-level scatter plot comparing sales and profit margin across the customer base.

**Analytical purpose:**
- Identify high-revenue customers with negative profitability.
- Compare customer revenue with profitability.
- Highlight customers whose sales performance does not translate into positive profit.

**Key finding:**

Sean Miller generated the highest customer sales at $25,043.05 but recorded a loss of $1,980.74, resulting in a profit margin of -7.91%.

This demonstrates that high customer revenue does not necessarily indicate high customer profitability.

### 2. Active Customers by Year

A yearly comparison of active customers, divided into returning and new/reactivated customers.

**Analytical purpose:**
- Track changes in the active customer base.
- Compare returning customers with customers not active in the preceding year.
- Monitor annual customer retention.

**Verified results:**

| Year | Active Customers | Returning Customers | New/Reactived Customers | Retention |
|---|---:|---:|---:|---:|
| 2014 | 595 | 0 | 595* | — |
| 2015 | 573 | 437 | 136 | 73.45% |
| 2016 | 638 | 452 | 186 | 78.88% |
| 2017 | 693 | 558 | 135 | 87.46% |

*2014 represents the first observed customer activity in the dataset. These customers cannot all be assumed to be genuinely new.*

**Key finding:**

Customer retention improved by 14.01 percentage points between 2015 and 2017, rising from 73.45% to 87.46%.

The new/reactivated group includes both genuinely new customers and previously inactive customers returning after a gap.

### 3. Customer Concentration

A cumulative comparison of customer contributions to total sales and total profit.

Customers are ranked independently by sales and profit, then cumulative contributions are measured across the customer base.

**Verified results:**

| Customer Group | Sales Contribution | Profit Contribution |
|---|---:|---:|
| Top 10% | 30.88% | 57.69% |
| Top 20% | 48.15% | 81.66% |

**Key finding:**

The top 20% of customers generate 48.15% of total sales but contribute 81.66% of total profit.

Profit is considerably more concentrated among a smaller group of customers than revenue.

### 4. Top 10 Customers

A horizontal bar chart ranking the ten highest-revenue customers.

The chart compares customer sales, while profitability is represented through the bar's positive or negative profit status. Additional customer profit and margin information is available in the chart tooltip.

**Selected customer examples:**

| Customer | Sales | Profit | Profit Margin |
|---|---:|---:|---:|
| Sean Miller | $25,043.05 | -$1,980.74 | -7.91% |
| Tamara Chand | $19,052.22 | $8,981.32 | 47.14% |
| Raymond Buch | $15,117.34 | $6,976.10 | 46.15% |
| Ken Lonsdale | $14,175.23 | $806.86 | 5.69% |
| Grant Thornton | $9,351.21 | -$4,108.66 | -43.94% |

**Key finding:**

The highest-sales customers do not all have strong profit margins. Sean Miller and Grant Thornton are examples of high-revenue customers with substantial losses.

## Discount and Customer Profitability Analysis

An additional SQL investigation compared customer profitability across average-discount bands.

Each customer's average transaction-line discount was calculated first. Customers were then grouped by their average discount, and profitability was compared across the groups.

| Average Discount Band | Customers | Loss-Making Customers | Loss-Making Rate | Combined Profit |
|---|---:|---:|---:|---:|
| Below 10% | 210 | 8 | 3.81% | $148,348.88 |
| 10%–19.99% | 338 | 44 | 13.02% | $143,690.51 |
| 20%–29.99% | 195 | 67 | 34.36% | $6,677.81 |
| 30% and above | 50 | 36 | 72.00% | -$12,320.18 |

**Key finding:**

The loss-making customer rate rises as the average discount band increases:

- Below 10%: 3.81%
- 10%–19.99%: 13.02%
- 20%–29.99%: 34.36%
- 30% and above: 72.00%

The 30%+ discount group has 50 customers, of whom 36 are loss-making.

Across all customers, the average customer discount is 23.81% for loss-making customers compared with 13.79% for profitable customers.

This shows a strong association between higher discount exposure and customer losses. It does not establish that discounts alone cause those losses; product mix, order characteristics, and other factors may also contribute.

## Global Filters

The Customer Analysis page supports the following global filters:

- **Region**
- **Category**
- **Segment**
- **Year**
- **Discount Group**

These filters affect the customer KPIs and all four charts.

The Customer Analysis page does not use a Month filter.

The retention comparison follows the selected year:
- All Years: 2017 versus 2016
- 2015: 2015 versus 2014
- 2016: 2016 versus 2015
- 2017: 2017 versus 2016

The previous-year customer cohort is used as the retention denominator.

## SQL Methodology

The analysis uses MySQL customer-level aggregations.

### Customer-level aggregation

Customer performance is calculated by grouping transaction records by `Customer ID` and `Customer Name`.

```sql
SELECT
    `Customer ID`,
    `Customer Name`,
    COUNT(DISTINCT `Order ID`) AS total_orders,
    SUM(`Sales`) AS total_sales,
    SUM(`Profit`) AS total_profit,
    SUM(`Profit`) / NULLIF(SUM(`Sales`), 0) * 100
        AS profit_margin
FROM `superstore_cleaned_python`
GROUP BY
    `Customer ID`,
    `Customer Name`;
```

### Loss-making customer identification

Customers are classified using their total aggregated profit:

```sql
CASE
    WHEN total_profit < 0 THEN 'Loss-Making'
    ELSE 'Profitable'
END
```

### Customer retention

Customer activity is deduplicated by customer and calendar year. Consecutive years are compared using `Customer ID`.

A customer is considered returning when they appear in both the current year and the immediately preceding year.

### Customer concentration

Customers are ranked independently by total sales and total profit using `ROW_NUMBER()`.

The contributions of the highest-ranked 10% and 20% of customers are calculated as a percentage of the corresponding overall total.

### Average discount analysis

Transaction-line discounts are averaged at the customer level before customers are assigned to discount bands. Loss-making rates are then calculated within each band.

## Business Recommendations

Based on the observed results:

1. **Review high-revenue loss-making customers.** Investigate pricing, discounts, product mix, and order-level profitability for customers such as Sean Miller and Grant Thornton.
2. **Review high-discount customers.** The 30%+ discount group has a 72% loss-making rate. Evaluate discount policies and their impact on customer profitability.
3. **Protect high-profit customer relationships.** The top 20% of customers generate 81.66% of total profit. Monitor retention and profitability within this group.
4. **Continue improving retention.** Retention increased from 73.45% in 2015 to 87.46% in 2017. Identify the factors associated with this improvement and monitor whether it continues.

These recommendations are investigation priorities, not claims that the available analysis has established causation.

---

## Conclusion

The Customer Analysis reveals that customer value cannot be evaluated through sales alone.

Although most customers are profitable, 19.55% generate losses. Higher average discount bands are associated with substantially higher loss-making rates, while profit is much more concentrated among top customers than revenue.

At the same time, customer retention improved consistently between 2015 and 2017.

Together, these findings highlight the importance of evaluating customer revenue, profitability, discount exposure, concentration, and retention as connected aspects of customer performance.