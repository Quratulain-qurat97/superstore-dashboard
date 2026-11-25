# Superstore Retail Analytics Dashboard

An interactive retail analytics dashboard built with **React, Vite, and Recharts**, using the Superstore dataset to explore sales, profitability, regional performance, products, and customer behavior.

## Dashboard Pages

The dashboard contains six analytical pages:

1. **Home** — Overall business performance and key metrics.
2. **Sales Analysis** — Sales trends, category performance, and sales comparisons.
3. **Regional Analysis** — Regional and state-level sales and profitability.
4. **Product Analysis** — Product and subcategory performance.
5. **Customer Analysis** — Customer purchasing behavior and profitability.
6. **Profitability Analysis** — Profit margins, discount impact, and profitability trends.

## Technology Stack

- React
- Vite
- JavaScript
- Recharts
- React Router
- CSS Modules
- Lucide React
- MySQL for analytical reference and independent validation
- Python for independent dataset validation

## Dataset

The dashboard uses a cleaned Superstore retail dataset.

| Property | Value |
|---|---:|
| Transaction records | 9,994 |
| Unique order IDs | 5,009 |
| Unique customers | 793 |
| Analysis period | 2014–2017 |
| Retained fields | 17 |
| Duplicate Row IDs | 0 |
| Missing values across retained fields | 0 |

The dashboard loads its data from:

`data/superstore.json`

The JSON dataset was generated from `Superstore_Cleaned.csv` using the project's data preparation script.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Prepare the Dashboard Dataset

Place `Superstore_Cleaned.csv` in the project root, then run:

```bash
npm run prepare:data
```

This command generates `data/superstore.json`.

The preparation script:
- Checks that all required columns exist.
- Parses quoted CSV fields.
- Validates ISO-formatted order dates.
- Converts numeric fields without rounding.
- Checks for exactly 9,994 transaction records.
- Checks for duplicate Row IDs.
- Checks for missing product identifiers and names.

**Note:** The cleaned CSV must be available in the project root before running this command. If the generated JSON dataset is already available, you do not need to regenerate it.

### 3. Start the Development Server

```bash
npm run dev
```

### 4. Run Tests

```bash
npm test
```

### 5. Build for Production

```bash
npm run build
```

### 6. Preview the Production Build

```bash
npm run preview
```

## Project Structure

```text
superstore-dashboard/
│
├── data/
│   └── superstore.json
│
├── docs/
│   ├── Superstore_Dashboard_Audit_Results.md
│   └── findings/
│       ├── customer-analysis-insights.md
│       ├── EXECUTIVE_SUMMARY.md
│       ├── KEY_FINDINGS.md
│       ├── OVERVIEW_INSIGHTS.md
│       ├── Product-Analysis-Insights.md
│       ├── Regional-Analysis-Insights.md
│       └── README.md
│
├── public/
│   └── images/
│       ├── avatar.jfif
│       └── avatar2.jfif
│
├── scripts/
│   ├── contract-sample.json
│   ├── prepare-data.mjs
│   ├── verification-results.json
│   ├── verify-regional.mjs
│   └── verify.mjs
│
├── src/
│   ├── app/
│   ├── core/
│   │   └── __tests__/
│   ├── data/
│   ├── pages/
│   ├── state/
│   ├── styles/
│   ├── ui/
│   └── main.jsx
│
├── index.html
├── package.json
├── package-lock.json
└── vite.config.js
```

## Analytical Methodology

The dashboard uses consistent aggregation rules:

- **Total Sales:** `SUM(Sales)`
- **Total Profit:** `SUM(Profit)`
- **Profit Margin:** `SUM(Profit) / SUM(Sales) × 100`
- **Average Order Value:** `Total Sales / Distinct Orders`
- **Total Orders:** Distinct count of Order IDs.
- **Total Customers:** Distinct count of Customer IDs.

Profit margins use weighted aggregation rather than averaging individual transaction margins.

Empty results are distinguished from zero sales or zero profit.

## Data Validation

The dashboard dataset was independently compared against the cleaned CSV source.

Validation confirmed:

- 9,994 transaction records.
- No duplicate records in the dashboard JSON.
- No missing values across the 17 retained fields.
- All 17 shared fields matched the source CSV across all 9,994 records.
- Core business totals matched independently calculated reference values.

Additional calculation and filter scenarios were tested.

Detailed validation results and testing limitations are documented in:

`docs/Superstore_Dashboard_Audit_Results.md`

## Additional Documentation

Detailed analytical findings are available in `docs/findings/`:

- **KEY_FINDINGS.md** — Detailed findings, profitability evidence, discount analysis, and supporting comparisons.
- **EXECUTIVE_SUMMARY.md** — Key business insights and executive narrative guidance.
- **OVERVIEW_INSIGHTS.md** — Overall business performance findings.
- **customer-analysis-insights.md** — Customer analysis findings.
- **Product-Analysis-Insights.md** — Product and subcategory findings.
- **Regional-Analysis-Insights.md** — Regional and state-level findings.
- **README.md** — Guide to the findings documentation.

## Project Status

The dashboard includes six analytical pages, a shared filtering system, data validation, and automated tests.

Refer to the audit documentation and current project implementation for detailed testing and verification results.

## Author

Qurat Ul Ain Tariq
