# Superstore Retail Analytics Dashboard

An interactive retail analytics dashboard built with **React, Vite, and Recharts**. The project explores sales performance, profitability, regional trends, product performance, and customer behavior using the Tableau Sample Superstore dataset.

**Live Dashboard:** [View Superstore Retail Analytics Dashboard](https://quratulain-qurat97.github.io/superstore-dashboard/)

**GitHub Repository:** [Superstore Retail Analytics Dashboard](https://github.com/Quratulain-qurat97/superstore-dashboard)

## Dashboard Pages

The dashboard contains six analytical pages:

1. **Home** — Overall business performance and key metrics.
2. **Sales Analysis** — Sales trends, category performance, and sales comparisons.
3. **Regional Analysis** — Regional and state-level sales and profitability.
4. **Product Analysis** — Product and subcategory performance.
5. **Customer Analysis** — Customer purchasing behavior and profitability.
6. **Profitability Analysis** — Profit margins, discount impact, and profitability trends.

## Technology Stack

### Application Development

- React
- Vite
- JavaScript
- Recharts
- React Router
- CSS Modules
- Lucide React

### Supporting Analysis and Validation

- MySQL
- Python
- pandas

MySQL and Python were used in supporting analytical and validation work. The deployed dashboard uses a static dataset and does not connect to a live MySQL database or backend API.

## Dataset

The dashboard uses a cleaned version of Tableau's Sample Superstore retail dataset.

| Property | Value |
|---|---:|
| Transaction records | 9,994 |
| Unique order IDs | 5,009 |
| Unique customers | 793 |
| States represented | 49 |
| Analysis period | 2014–2017 |
| Retained fields | 17 |
| Duplicate Row IDs | 0 |
| Missing values across retained fields | 0 |

### Dataset Files

The repository contains two dataset files:

- `data/superstore.json` — Canonical dataset used for reference and verification.
- `data/superstore.compact.json` — Compact production dataset used by the dashboard.

The production application dynamically loads the compact dataset and decodes it into the transaction format expected by the dashboard.

The compact format reduces the amount of data transferred while preserving the original transaction records and values.

The canonical JSON remains available for verification and reproducibility.

**Source CSV:** The cleaned CSV, `Superstore_Cleaned.csv`, is stored separately from this repository and is not included in the GitHub project.

## Getting Started

### Prerequisites

- Node.js
- npm

### 1. Clone the Repository

```bash
git clone https://github.com/Quratulain-qurat97/superstore-dashboard.git
cd superstore-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Prepare the Dashboard Dataset (Optional)

The repository already includes both generated JSON datasets, so regeneration is not required to run the dashboard.

To regenerate them, make sure the cleaned CSV is available at:

`../data/processed/Superstore_Cleaned.csv`

From the project root, run:

```bash
node ./scripts/prepare-data.mjs "../data/processed/Superstore_Cleaned.csv" "data/superstore.json"
```

This command generates:

- `data/superstore.json`
- `data/superstore.compact.json`

The preparation script:

- Checks that all required columns exist.
- Parses quoted CSV fields.
- Validates ISO-formatted order dates.
- Converts numeric fields without rounding.
- Checks that exactly 9,994 transaction records are present.
- Checks for duplicate Row IDs.
- Checks for missing product identifiers and names.
- Generates the compact dataset from the canonical dataset.

**Note:** The cleaned CSV is stored outside this repository and is not tracked by Git. Dataset regeneration is optional because both generated JSON files are already included.

### 4. Start the Development Server

```bash
npm run dev
```

### 5. Run Tests

```bash
npm test
```

### 6. Run Data Verification

```bash
npm run verify:data
```

This runs the project's reference checks, analytical statement checks, and data-contract checks.

### 7. Build for Production

```bash
npm run build
```

### 8. Preview the Production Build

```bash
npm run preview
```

## Project Structure

Selected project files and directories:

```text
superstore-dashboard/
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── data/
│   ├── superstore.json
│   └── superstore.compact.json
│
├── docs/
│   ├── Superstore_Dashboard_Audit_Results.md
│   └── findings/
│
├── public/
│   ├── favicon.png
│   └── images/
│
├── scripts/
│   ├── compact-codec.mjs
│   ├── prepare-data.mjs
│   └── verify.mjs
│
├── src/
│   ├── app/
│   ├── core/
│   ├── data/
│   │   ├── __tests__/
│   │   │   └── compactDataset.test.js
│   │   ├── decodeCompactDataset.js
│   │   ├── dataSource.js
│   │   └── staticJsonSource.js
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

| Metric | Calculation |
|---|---|
| Total Sales | `SUM(Sales)` |
| Total Profit | `SUM(Profit)` |
| Profit Margin | `SUM(Profit) / SUM(Sales) × 100` |
| Average Order Value | `Total Sales / Distinct Orders` |
| Total Orders | Distinct count of Order IDs |
| Total Customers | Distinct count of Customer IDs |

Profit margins use weighted aggregation rather than averaging individual transaction margins.

Empty results are distinguished from zero sales or zero profit.

## Data Validation

The dashboard's canonical JSON dataset was independently validated against the cleaned source CSV.

Validation confirmed:

- 9,994 transaction records in both datasets.
- 9,994 unique Row IDs.
- No duplicate Row IDs.
- No missing values across the 17 retained fields.
- All 17 retained fields matched across all 9,994 records.
- Zero differences between the cleaned source CSV and the canonical JSON.
- Core business totals matched independently calculated reference values.

Additional calculation, filtering, and data-contract scenarios were tested.

The compact dataset was also decoded and compared against the canonical dataset. All 9,994 transaction records were reconstructed with an exact match.

Detailed validation results and testing limitations are documented in:

`docs/Superstore_Dashboard_Audit_Results.md`

## Additional Documentation

Detailed analytical findings are available in `docs/findings/`:

- **KEY_FINDINGS.md** — Business findings, profitability evidence, discount analysis, and supporting comparisons.
- **EXECUTIVE_SUMMARY.md** — Key business insights and executive narrative.
- **OVERVIEW_INSIGHTS.md** — Overall business performance.
- **customer-analysis-insights.md** — Customer analysis findings.
- **Product-Analysis-Insights.md** — Product and subcategory findings.
- **Regional-Analysis-Insights.md** — Regional and state-level findings.

## Project Status

The project includes:

- Six interactive analytical pages.
- A shared filtering system.
- Dynamic KPIs and data visualizations.
- Responsive desktop, tablet, and mobile layouts.
- Independent dataset and calculation validation.
- Automated tests.
- Compact dataset encoding and decoding.
- Optimized production data loading.
- GitHub Pages deployment.

The production dashboard is available here:

[Open the Live Dashboard](https://quratulain-qurat97.github.io/superstore-dashboard/)

## Data Source & Attribution

This project uses Tableau's **Sample Superstore** dataset, publicly provided by Tableau as sample data for learning and visualization.

**Original source:** [Tableau Public – Sample Data](https://public.tableau.com/app/resources/sample-data)

The original dataset represents a fictitious retail company.

### Data Integrity & Preparation

- Original dataset: 9,994 records and 21 columns.
- Project dataset: 9,994 records and 17 retained fields.
- Four columns excluded during preparation: `Ship Date`, `Country`, `City`, and `Postal Code`.
- All 17 retained fields were programmatically compared against the cleaned source CSV.
- Verification result: 9,994 records matched, with zero differences across all 17 retained fields.

The dataset was prepared for this project's analytical requirements. The original data has not been represented as my own.

**Attribution:** Credit for the original Sample Superstore dataset belongs to Tableau and its original creators. Public availability does not necessarily establish permission to redistribute the dataset. No specific redistribution licence has been verified.

## Author

**Quratul Ain Tariq**
