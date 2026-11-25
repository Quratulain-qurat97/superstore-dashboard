# Superstore Dashboard — Audit Results

## Overall result

**No numerical discrepancies were found in the tested production calculation paths.** This is a strong calculation-level pass, not a full browser/runtime sign-off.

## Evidence

| Check | Result | Scope |
|---|---:|---|
| CSV ↔ dashboard JSON reconciliation | PASS | User ran the Python validator locally: 9,994 records, 17 mapped fields, zero mismatches |
| Existing core test suite | PASS | 196 tests passed, 0 failed |
| Existing data-contract verifier | PASS | 67 checks passed, 0 failed |
| Existing Regional baseline verifier | PASS | 19 checks passed |
| Additional independent filter validation | PASS | 594 filter states; 236,207 assertions; 0 discrepancies |

The additional validation imported the actual project calculation modules and compared their outputs with separately implemented reference aggregations. It covered Sales Analysis, Regional Analysis, and Profitability Analysis, including KPI totals, trend values, region/category/state breakdowns, heatmap cells, loss-making product rankings, and chart-specific filter exclusions. It exercised each filter dimension individually and selected pairwise combinations, plus selected-product cases.

The existing 196 core tests cover the shared calculations and the Overview, Product, and Customer calculation modules, as well as filter reducer behavior and chart geometry helpers.

## Separate documentation findings

The existing `scripts/verify.mjs` reports **23 README numeric-claim mismatches** and **5 README narrative statements that evaluate false** against the current dashboard JSON. These are documentation/reference-claim discrepancies, not failures in the tested dashboard calculations. The script still exits successfully when these README mismatches occur because its exit status is based on contract-check failures, not README-claim mismatches.

## Not verified in this run

- Two UI test modules could not execute because the dependency installation timed out and Vite/React packages were unavailable in the audit environment.
- A production Vite build was not run for the same reason.
- Browser-level interactions across every page (real pointer/touch behavior, chart hit testing, keyboard operation, responsive rendering) are not established by calculation tests.

## Other code-review findings already identified

- Home, Product, and Profitability page components do not surface their data-loading error state; a load failure can leave those pages without a clear error message.
- The Customer scatter chart clamps points below the current zoomed X-axis minimum to the left plot edge instead of excluding them from the visible domain. This is a chart behavior issue, not a data aggregation discrepancy.

## Conclusion

**Numerical calculation status: PASS within the tested scope.** No calculation fix is currently indicated by these tests. Remaining work is limited to the blocked UI/build verification, targeted browser interaction checks, and deciding whether to correct the stale README claims and the separate code-review issues.
