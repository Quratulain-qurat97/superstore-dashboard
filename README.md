# Superstore Retail Analytics

React + Vite + Recharts dashboard for the Superstore analysis (9,994 transactions, 2014-2017).

**Status: checkpoint 5C of 7.** Core logic and tests, the dashboard shell (header, left navigation,
profile badge, four working filter dropdowns), the four KPI cards and all four Home charts: Monthly Sales
Trend, Revenue by Category, Regional Performance and Revenue by Segment (donut).

## Run it

```
npm install
npm run dev        # opens the app (Vite prints the local address)
npm test           # 182 tests: core logic, chart geometry vs the Figma, and full-page interactions
npm run build      # production build
npm run verify:data  # your original 67 data-contract checks (unchanged)
```

Needs Node 22.12+ (you have 24).

The layout is a 1460 x 1024 canvas: the Figma's 1440 plus 20px of extra space between the sidebar and the
main column (every component keeps its exact Figma width). At exactly that size it is pixel-for-pixel the design.
In a WIDER window the sidebar stays on the left and the main column (filter bar, KPI cards, chart
cards) takes all the extra width; heights never change. In a smaller window (too narrow or too
short) the whole canvas is scaled down uniformly so it fits without any scrollbar. Real tablet and
mobile layouts come in checkpoint 7.

Click or hover the charts: a click on a month, a category bar, a region's column or a segment's slice filters the KPI cards
and the other charts to it (and sets the matching dropdown); click it again, press Escape, or click empty
chart space to clear.

## Layout

```
data/superstore.json     transactions generated from Superstore_Cleaned.csv
scripts/                 prepare-data.mjs (CSV -> JSON), verify.mjs (67 checks), both unchanged
src/core/                pure JS: filters, aggregation, formatting. No React, no browser APIs
src/core/__tests__/      node --test suites (+ a guard that keeps core/ free of browser code)
src/data/                where data comes from (today: bundled JSON; later: the MySQL API)
src/app/                 App (HashRouter), routes.js (the six navigation items)
src/state/               React hooks around the core logic (useFilterState)
src/pages/home/          the Home page
src/ui/                  layout (nav, profile, header), filters, KPI cards, charts, generated Figma icons
src/styles/              design tokens + global CSS
src/main.jsx             entry point
```

## Notes for the future MySQL backend

Revenue by Category needs this query (the Category filter is deliberately NOT applied, so the three
categories can always be compared; the selected one is only highlighted):

```sql
SELECT Category, SUM(Sales) AS sales
FROM sample_superstore
WHERE (:region  IS NULL OR Region  = :region)
  AND (:segment IS NULL OR Segment = :segment)
  AND (:year    IS NULL OR YEAR(order_date) = :year)
  AND (:month   IS NULL OR DATE_FORMAT(order_date, '%Y-%m') = :month)
GROUP BY Category;
```

Unfiltered results to compare in MySQL: Furniture 741,999.80 / Office Supplies 719,047.03 /
Technology 836,154.03 (total 2,297,200.86). The test suite checks the app against exactly this logic.

`jsdom` is a test-only dev dependency (it simulates a browser for the UI tests); it is not part of the app.

Regional Performance needs this query (the Region filter is deliberately NOT applied, so the four
regions can always be compared; the selected one is only highlighted):

```sql
SELECT Region, SUM(Sales) AS sales, SUM(Profit) AS profit,
       SUM(Profit) / SUM(Sales) * 100 AS margin
FROM sample_superstore
WHERE (:category IS NULL OR Category = :category)
  AND (:segment  IS NULL OR Segment  = :segment)
  AND (:year     IS NULL OR YEAR(order_date) = :year)
  AND (:month    IS NULL OR DATE_FORMAT(order_date, '%Y-%m') = :month)
GROUP BY Region;
```

Unfiltered results to compare in MySQL (Sales / Profit):

| Region  | Sales      | Profit     | Margin |
|---------|-----------:|-----------:|-------:|
| West    | 725,457.82 | 108,418.45 | 14.94% |
| East    | 678,781.24 |  91,522.78 | 13.48% |
| Central | 501,239.89 |  39,706.36 |  7.92% |
| South   | 391,721.91 |  46,749.43 | 11.93% |
| Total   | 2,297,200.86 | 286,397.02 |      |

Profit is a SUM over transactions (it can be negative, e.g. Central / Furniture = -2,871.05); the margin is
SUM(Profit) / SUM(Sales), never an average of row margins.

Revenue by Segment needs this query (the Segment filter is deliberately NOT applied, so the three
segments can always be compared; the selected one is only highlighted):

```sql
SELECT Segment, SUM(Sales) AS sales
FROM sample_superstore
WHERE (:region   IS NULL OR Region   = :region)
  AND (:category IS NULL OR Category = :category)
  AND (:year     IS NULL OR YEAR(order_date) = :year)
  AND (:month    IS NULL OR DATE_FORMAT(order_date, '%Y-%m') = :month)
GROUP BY Segment;
```

Unfiltered results to compare in MySQL (the data has 4 decimals; compare the raw value, or ROUND(..., 2)):

| Segment     | SUM(Sales) raw | Displayed (2 decimals) | Share  |
|-------------|---------------:|-----------------------:|-------:|
| Consumer    | 1,161,401.3450 |           1,161,401.35 | 50.56% |
| Corporate   |   706,146.3668 |             706,146.37 | 30.74% |
| Home Office |   429,653.1485 |             429,653.15 | 18.70% |
| Total       | 2,297,200.8603 |           2,297,200.86 |        |

### Money rounding

Amounts are shown with 2 decimals, rounded half away from zero on the exact 4-decimal value, the same as
MySQL's `ROUND()` on a DECIMAL column. (Plain floating-point `toFixed(2)` would show Consumer's
1,161,401.3450 as .34.) Two of the headline figures are exact half-cents: Consumer sales 1,161,401.3450 and
South sales 391,721.9050. If your Sales column is DOUBLE rather than DECIMAL, MySQL's own float sum may
differ from these by a cent in such cases.
