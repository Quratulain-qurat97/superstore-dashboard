#!/usr/bin/env python3
"""
Independent Superstore dashboard data validator.

Run from the dashboard project root:
    python validate_superstore_dashboard.py

Or provide explicit paths:
    python validate_superstore_dashboard.py --csv "C:/path/Superstore_Cleaned.csv" --json "data/superstore.json"

Outputs:
    validation_output/validation_report.txt
    validation_output/reference_results.json
    validation_output/*.csv

This script independently reads the cleaned CSV and dashboard JSON. It does not
import or execute any React/JavaScript dashboard calculation code.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from collections import Counter
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

import pandas as pd


DEFAULT_CSV = Path("../data/processed/Superstore_Cleaned.csv")
DEFAULT_JSON = Path("data/superstore.json")
OUTPUT_DIR = Path("validation_output")

CSV_TO_JSON = {
    "Row ID": "rowId",
    "Order ID": "orderId",
    "Order Date": "orderDate",
    "Ship Mode": "shipMode",
    "Customer ID": "customerId",
    "Customer Name": "customerName",
    "Segment": "segment",
    "State": "state",
    "Region": "region",
    "Category": "category",
    "Sub-Category": "subCategory",
    "Product ID": "productId",
    "Product Name": "productName",
    "Sales": "sales",
    "Quantity": "quantity",
    "Discount": "discount",
    "Profit": "profit",
}

NUMERIC_FIELDS = {"Row ID", "Sales", "Quantity", "Discount", "Profit"}
DATE_FIELDS = {"Order Date"}
MONEY_TOLERANCE = Decimal("0.000001")


def parse_args():
    parser = argparse.ArgumentParser(description="Validate Superstore dashboard data.")
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV, help="Cleaned source CSV path")
    parser.add_argument("--json", type=Path, default=DEFAULT_JSON, help="Dashboard JSON path")
    parser.add_argument("--output", type=Path, default=OUTPUT_DIR, help="Output directory")
    return parser.parse_args()


def decimal_value(value: Any) -> Decimal | None:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    try:
        return Decimal(str(value).strip())
    except (InvalidOperation, ValueError):
        return None


def normalize_date(value: Any) -> str | None:
    if value is None:
        return None
    try:
        dt = pd.to_datetime(value, errors="coerce")
        if pd.isna(dt):
            return None
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return None


def normalize_value(field: str, value: Any):
    if value is None:
        return None
    if field in NUMERIC_FIELDS:
        number = decimal_value(value)
        if number is None:
            return None
        if field in {"Row ID", "Quantity"}:
            return int(number)
        return number.quantize(Decimal("0.000001"))
    if field in DATE_FIELDS:
        return normalize_date(value)
    return str(value).strip()


def load_source_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Source CSV not found: {path}")
    df = pd.read_csv(path)
    missing = [column for column in CSV_TO_JSON if column not in df.columns]
    if missing:
        raise ValueError(f"CSV is missing required columns: {missing}")
    df = df[list(CSV_TO_JSON.keys())].copy()
    df["Order Date"] = pd.to_datetime(df["Order Date"], errors="coerce")
    for col in ["Sales", "Quantity", "Discount", "Profit", "Row ID"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def load_dashboard_json(path: Path) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(f"Dashboard JSON not found: {path}")
    with path.open("r", encoding="utf-8") as f:
        payload = json.load(f)
    if isinstance(payload, dict):
        rows = payload.get("transactions")
    elif isinstance(payload, list):
        rows = payload
    else:
        rows = None
    if not isinstance(rows, list):
        raise ValueError("Expected JSON object with a 'transactions' array (or a top-level array).")
    return rows


def compare_csv_json(df: pd.DataFrame, json_rows: list[dict]) -> dict:
    csv_ids = df["Row ID"].dropna().astype(int).tolist()
    json_ids = [row.get("rowId") for row in json_rows]

    csv_counts = Counter(csv_ids)
    json_counts = Counter(json_ids)

    duplicate_csv_ids = sorted([str(k) for k, v in csv_counts.items() if v > 1])
    duplicate_json_ids = sorted([str(k) for k, v in json_counts.items() if v > 1])

    csv_by_id = {}
    for _, row in df.iterrows():
        if pd.notna(row["Row ID"]):
            csv_by_id[int(row["Row ID"])] = row

    json_by_id = {}
    for row in json_rows:
        rid = row.get("rowId")
        if rid is not None:
            try:
                json_by_id[int(rid)] = row
            except (ValueError, TypeError):
                pass

    missing_in_json = sorted(set(csv_by_id) - set(json_by_id))
    extra_in_json = sorted(set(json_by_id) - set(csv_by_id))
    mismatches = []

    for rid in sorted(set(csv_by_id) & set(json_by_id)):
        csv_row = csv_by_id[rid]
        json_row = json_by_id[rid]
        for csv_field, json_field in CSV_TO_JSON.items():
            left = normalize_value(csv_field, csv_row[csv_field])
            right = normalize_value(csv_field, json_row.get(json_field))
            equal = left == right
            if isinstance(left, Decimal) and isinstance(right, Decimal):
                equal = abs(left - right) <= MONEY_TOLERANCE
            if not equal:
                mismatches.append({
                    "rowId": rid,
                    "csvField": csv_field,
                    "jsonField": json_field,
                    "csvValue": str(left),
                    "jsonValue": str(right),
                })
                if len(mismatches) >= 100:
                    break
        if len(mismatches) >= 100:
            break

    return {
        "csvRows": int(len(df)),
        "jsonRows": int(len(json_rows)),
        "csvDuplicateRowIds": duplicate_csv_ids,
        "jsonDuplicateRowIds": duplicate_json_ids,
        "missingRowIdsInJson": missing_in_json,
        "extraRowIdsInJson": extra_in_json,
        "fieldMismatchesFirst100": mismatches,
        "allRowsMatch": (
            len(df) == len(json_rows)
            and not duplicate_csv_ids
            and not duplicate_json_ids
            and not missing_in_json
            and not extra_in_json
            and not mismatches
        ),
    }


def round_money(value) -> float:
    return round(float(value), 2)


def safe_margin(profit, sales):
    if pd.isna(sales) or sales == 0:
        return None
    return round(float(profit / sales * 100), 4)


def aggregate(df: pd.DataFrame, group_columns: list[str]) -> list[dict]:
    if df.empty:
        return []
    grouped = (
        df.groupby(group_columns, dropna=False)
        .agg(
            sales=("Sales", "sum"),
            profit=("Profit", "sum"),
            quantity=("Quantity", "sum"),
            transactionRows=("Row ID", "count"),
            distinctOrders=("Order ID", "nunique"),
            distinctCustomers=("Customer ID", "nunique"),
        )
        .reset_index()
    )
    grouped["profitMarginPercent"] = grouped.apply(
        lambda r: safe_margin(r["profit"], r["sales"]), axis=1
    )
    result = []
    for record in grouped.to_dict(orient="records"):
        clean = {}
        for key, value in record.items():
            if pd.isna(value):
                clean[key] = None
            elif key in {"sales", "profit"}:
                clean[key] = round_money(value)
            elif key == "profitMarginPercent":
                clean[key] = value
            elif isinstance(value, (int, float)):
                clean[key] = int(value) if float(value).is_integer() else float(value)
            else:
                clean[key] = str(value)
        result.append(clean)
    return result


def build_references(df: pd.DataFrame) -> dict:
    data = df.copy()
    data["Year"] = data["Order Date"].dt.year
    data["Month"] = data["Order Date"].dt.strftime("%Y-%m")
    data["Discount Group"] = data["Discount"].apply(
        lambda x: "Low (<=20%)" if x <= 0.20 else "High (>20%)"
    )

    total_sales = data["Sales"].sum()
    total_profit = data["Profit"].sum()
    total_orders = data["Order ID"].nunique()
    total_customers = data["Customer ID"].nunique()
    total_quantity = data["Quantity"].sum()

    kpis = {
        "totalRows": int(len(data)),
        "totalSales": round_money(total_sales),
        "totalProfit": round_money(total_profit),
        "totalQuantity": int(total_quantity),
        "totalOrders": int(total_orders),
        "totalCustomers": int(total_customers),
        "profitMarginPercent": safe_margin(total_profit, total_sales),
        "averageOrderValue": round_money(total_sales / total_orders) if total_orders else None,
        "dateMin": data["Order Date"].min().strftime("%Y-%m-%d") if len(data) else None,
        "dateMax": data["Order Date"].max().strftime("%Y-%m-%d") if len(data) else None,
    }

    yearly = aggregate(data, ["Year"])
    monthly = aggregate(data, ["Month"])
    category = aggregate(data, ["Category"])
    subcategory = aggregate(data, ["Category", "Sub-Category"])
    region = aggregate(data, ["Region"])
    state = aggregate(data, ["State", "Region"])
    segment = aggregate(data, ["Segment"])

    # Sales and profitability by category, region, year, month.
    sales_page = {
        "byYear": yearly,
        "byMonth": monthly,
        "byRegion": region,
        "byCategory": category,
        "bySegment": segment,
    }

    regional_page = {
        "byState": state,
        "byRegion": region,
    }

    product_page = {
        "byCategory": category,
        "bySubcategory": subcategory,
        "byDiscountGroup": aggregate(data, ["Discount Group"]),
        "bySubcategoryAndDiscount": aggregate(data, ["Sub-Category", "Discount"]),
    }

    # Customer-level independent aggregations.
    customer = (
        data.groupby(["Customer ID", "Customer Name"], dropna=False)
        .agg(
            sales=("Sales", "sum"),
            profit=("Profit", "sum"),
            quantity=("Quantity", "sum"),
            distinctOrders=("Order ID", "nunique"),
        )
        .reset_index()
    )
    customer["profitMarginPercent"] = customer.apply(
        lambda r: safe_margin(r["profit"], r["sales"]), axis=1
    )
    customer["isLossMaking"] = customer["profit"] < 0
    customer_sales = customer.sort_values(
        ["sales", "Customer Name"], ascending=[False, True]
    )
    customer_profit = customer.sort_values(
        ["profit", "Customer Name"], ascending=[True, True]
    )

    customer_page = {
        "customerCount": int(len(customer)),
        "top10BySales": customer_sales.head(10).assign(
            sales=lambda x: x["sales"].round(2),
            profit=lambda x: x["profit"].round(2),
        )[["Customer ID", "Customer Name", "sales", "profit", "profitMarginPercent", "distinctOrders"]].to_dict("records"),
        "top10ByLowestProfit": customer_profit.head(10).assign(
            sales=lambda x: x["sales"].round(2),
            profit=lambda x: x["profit"].round(2),
        )[["Customer ID", "Customer Name", "sales", "profit", "profitMarginPercent", "distinctOrders"]].to_dict("records"),
        "lossMakingCustomers": int((customer["profit"] < 0).sum()),
    }

    # Customer concentration curves ranked separately by sales and profit.
    def concentration_rows(frame, metric):
        ordered = frame.sort_values([metric, "Customer Name"], ascending=[False, True]).copy()
        total = ordered[metric].sum()
        ordered["rank"] = range(1, len(ordered) + 1)
        ordered["cumulativeValue"] = ordered[metric].cumsum()
        ordered["customerSharePercent"] = ordered["rank"] / len(ordered) * 100 if len(ordered) else None
        ordered["cumulativeSharePercent"] = (
            ordered["cumulativeValue"] / total * 100
            if total != 0 else None
        )
        return [
            {
                "rank": int(r["rank"]),
                "customerId": str(r["Customer ID"]),
                "customerName": str(r["Customer Name"]),
                "value": round_money(r[metric]),
                "customerSharePercent": round(float(r["customerSharePercent"]), 4),
                "cumulativeSharePercent": (
                    round(float(r["cumulativeSharePercent"]), 4)
                    if pd.notna(r["cumulativeSharePercent"]) else None
                ),
            }
            for _, r in ordered.iterrows()
        ]

    customer_page["salesConcentration"] = concentration_rows(customer, "sales")
    customer_page["profitConcentration"] = concentration_rows(customer, "profit")

    # Active / returning customers by year.
    active_sets = {
        int(year): set(group["Customer ID"].dropna().astype(str))
        for year, group in data.groupby("Year")
    }
    active_by_year = []
    for year in sorted(active_sets):
        current = active_sets[year]
        previous = active_sets.get(year - 1, set())
        returning = current & previous
        new_or_reactivated = current - previous
        active_by_year.append({
            "year": year,
            "activeCustomers": len(current),
            "returningCustomers": len(returning),
            "newOrReactivatedCustomers": len(new_or_reactivated),
            "retentionPercent": (
                round(len(returning) / len(previous) * 100, 4)
                if previous else None
            ),
        })
    customer_page["activeCustomersByYear"] = active_by_year

    # Product-level loss ranking.
    products = (
        data.groupby(["Product ID", "Product Name", "Category"], dropna=False)
        .agg(
            sales=("Sales", "sum"),
            profit=("Profit", "sum"),
            quantity=("Quantity", "sum"),
            distinctOrders=("Order ID", "nunique"),
        )
        .reset_index()
    )
    products["profitMarginPercent"] = products.apply(
        lambda r: safe_margin(r["profit"], r["sales"]), axis=1
    )
    loss_products = products[products["profit"] < 0].sort_values(
        ["profit", "Product Name"], ascending=[True, True]
    ).head(10)
    top_loss_products = []
    for _, r in loss_products.iterrows():
        top_loss_products.append({
            "productId": str(r["Product ID"]),
            "productName": str(r["Product Name"]),
            "category": str(r["Category"]),
            "sales": round_money(r["sales"]),
            "profit": round_money(r["profit"]),
            "profitMarginPercent": r["profitMarginPercent"],
            "distinctOrders": int(r["distinctOrders"]),
        })

    # Discount heatmap: all observed discount values per subcategory.
    discount_heatmap = aggregate(data, ["Category", "Sub-Category", "Discount"])
    for row in discount_heatmap:
        row["discountPercent"] = round(float(row["Discount"]) * 100, 2)
        del row["Discount"]

    # Profitability metrics.
    order_profit = data.groupby("Order ID", dropna=False)["Profit"].sum()
    customer_profit_totals = data.groupby("Customer ID", dropna=False)["Profit"].sum()
    discounted = data[data["Discount"] > 0]
    profitability_page = {
        "profitabilityKpis": {
            "profitMarginPercent": safe_margin(total_profit, total_sales),
            "discountedSalesProfit": round_money(discounted["Profit"].sum()),
            "lossMakingCustomers": int((customer_profit_totals < 0).sum()),
            "lossMakingOrders": int((order_profit < 0).sum()),
            "totalOrders": int(total_orders),
            "lossMakingOrdersPercent": (
                round((order_profit < 0).sum() / total_orders * 100, 4)
                if total_orders else None
            ),
        },
        "profitTrendByMonth": aggregate(data, ["Month"]),
        "profitMarginByCategory": category,
        "discountImpactHeatmap": discount_heatmap,
        "top10ProductsByNetLoss": top_loss_products,
    }

    return {
        "overallKpis": kpis,
        "homePage": {
            "yearly": yearly,
            "monthly": monthly,
            "byCategory": category,
            "byRegion": region,
            "bySegment": segment,
        },
        "salesPage": sales_page,
        "regionalPage": regional_page,
        "productPage": product_page,
        "customerPage": customer_page,
        "profitabilityPage": profitability_page,
    }


def json_safe(obj):
    if isinstance(obj, dict):
        return {str(k): json_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [json_safe(v) for v in obj]
    if isinstance(obj, (pd.Timestamp, datetime)):
        return obj.isoformat()
    if isinstance(obj, (pd.Int64Dtype,)):
        return int(obj)
    if hasattr(obj, "item"):
        try:
            return obj.item()
        except Exception:
            pass
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    return obj


def write_csv_outputs(references: dict, output_dir: Path):
    mappings = {
        "yearly_totals.csv": references["homePage"]["yearly"],
        "monthly_totals.csv": references["homePage"]["monthly"],
        "category_totals.csv": references["homePage"]["byCategory"],
        "region_totals.csv": references["homePage"]["byRegion"],
        "state_totals.csv": references["regionalPage"]["byState"],
        "subcategory_totals.csv": references["productPage"]["bySubcategory"],
        "segment_totals.csv": references["homePage"]["bySegment"],
        "discount_heatmap.csv": references["profitabilityPage"]["discountImpactHeatmap"],
        "top10_products_by_net_loss.csv": references["profitabilityPage"]["top10ProductsByNetLoss"],
        "active_customers_by_year.csv": references["customerPage"]["activeCustomersByYear"],
        "top10_customers_by_sales.csv": references["customerPage"]["top10BySales"],
    }
    for filename, rows in mappings.items():
        pd.DataFrame(rows).to_csv(output_dir / filename, index=False)


def build_report(df, comparison, references, output_dir):
    k = references["overallKpis"]
    lines = []
    lines.append("SUPERSTORE DASHBOARD — INDEPENDENT DATA VALIDATION")
    lines.append("=" * 58)
    lines.append("")
    lines.append("1. SOURCE DATA")
    lines.append(f"CSV rows: {len(df):,}")
    lines.append(f"CSV columns: {len(pd.read_csv(args.csv, nrows=0).columns):,}")
    lines.append(f"JSON transactions: {comparison['jsonRows']:,}")
    lines.append(f"CSV duplicate Row IDs: {len(comparison['csvDuplicateRowIds'])}")
    lines.append(f"JSON duplicate Row IDs: {len(comparison['jsonDuplicateRowIds'])}")
    lines.append(f"Rows missing from JSON: {len(comparison['missingRowIdsInJson'])}")
    lines.append(f"Extra JSON rows: {len(comparison['extraRowIdsInJson'])}")
    lines.append(f"Field mismatches (up to 100 shown): {len(comparison['fieldMismatchesFirst100'])}")
    lines.append(f"CSV and JSON match: {'PASS' if comparison['allRowsMatch'] else 'FAIL'}")
    lines.append("")
    lines.append("2. INDEPENDENT BASELINE KPIs (ALL FILTERS CLEARED)")
    for label, key in [
        ("Rows", "totalRows"),
        ("Sales", "totalSales"),
        ("Profit", "totalProfit"),
        ("Quantity", "totalQuantity"),
        ("Distinct orders", "totalOrders"),
        ("Distinct customers", "totalCustomers"),
        ("Profit margin (%)", "profitMarginPercent"),
        ("Average order value", "averageOrderValue"),
        ("First order date", "dateMin"),
        ("Last order date", "dateMax"),
    ]:
        lines.append(f"{label}: {k[key]}")
    lines.append("")
    lines.append("3. YEARLY REFERENCE TOTALS")
    for row in references["homePage"]["yearly"]:
        lines.append(
            f"{row['Year']}: Sales ${row['sales']:,.2f} | "
            f"Profit ${row['profit']:,.2f} | Orders {row['distinctOrders']:,} | "
            f"Quantity {row['quantity']:,} | Margin {row['profitMarginPercent']}%"
        )
    lines.append("")
    lines.append("4. PROFITABILITY KPI REFERENCE")
    for key, value in references["profitabilityPage"]["profitabilityKpis"].items():
        lines.append(f"{key}: {value}")
    lines.append("")
    lines.append("5. CUSTOMER REFERENCE")
    lines.append(f"Customers: {references['customerPage']['customerCount']:,}")
    lines.append(f"Loss-making customers: {references['customerPage']['lossMakingCustomers']:,}")
    lines.append("")
    lines.append("6. PRODUCT LOSS REFERENCE")
    for row in references["profitabilityPage"]["top10ProductsByNetLoss"]:
        lines.append(
            f"{row['productName']}: Profit ${row['profit']:,.2f}, "
            f"Sales ${row['sales']:,.2f}, Margin {row['profitMarginPercent']}%"
        )
    lines.append("")
    lines.append("7. INTERPRETATION")
    if comparison["allRowsMatch"]:
        lines.append("PASS: The dashboard JSON matches the cleaned CSV for all mapped fields.")
    else:
        lines.append("FAIL: The dashboard JSON does not fully match the cleaned CSV. Inspect the comparison details in reference_results.json.")
    lines.append(
        "The aggregation files are independent reference outputs. Compare them with the dashboard while filters are cleared, "
        "then repeat with selected filters using equivalent source-data subsets."
    )
    lines.append(
        "This script does not execute React components or verify browser interactions. It also does not automatically reproduce "
        "every chart-specific filter exclusion; those must be compared against each chart's documented filter contract."
    )
    (output_dir / "validation_report.txt").write_text("\n".join(lines), encoding="utf-8")


def main():
    global args
    args = parse_args()
    args.output.mkdir(parents=True, exist_ok=True)

    print("Loading cleaned CSV...")
    df = load_source_csv(args.csv)

    print("Loading dashboard JSON...")
    json_rows = load_dashboard_json(args.json)

    print("Comparing CSV records with dashboard JSON...")
    comparison = compare_csv_json(df, json_rows)

    print("Independently calculating dashboard reference aggregations...")
    references = build_references(df)

    results = {
        "sourceComparison": comparison,
        "references": references,
        "notes": [
            "All reference aggregations are calculated from the cleaned CSV, independently of dashboard JavaScript.",
            "The dashboard JSON is checked record-by-record against the CSV for the 17 mapped fields.",
            "Grouped reference outputs use the full dataset with all filters cleared.",
            "For filtered checks, apply the same filter conditions to the source CSV before comparing.",
            "Some dashboard charts intentionally ignore specific filters; use the chart's code contract when selecting comparison conditions.",
        ],
    }

    with (args.output / "reference_results.json").open("w", encoding="utf-8") as f:
        json.dump(json_safe(results), f, indent=2, ensure_ascii=False)

    write_csv_outputs(references, args.output)
    build_report(df, comparison, references, args.output)

    print("")
    print("=" * 58)
    print("VALIDATION COMPLETE")
    print("=" * 58)
    print(f"CSV/JSON match: {'PASS' if comparison['allRowsMatch'] else 'FAIL'}")
    print(f"Rows: {len(df):,}")
    print(f"Sales: ${references['overallKpis']['totalSales']:,.2f}")
    print(f"Profit: ${references['overallKpis']['totalProfit']:,.2f}")
    print(f"Orders: {references['overallKpis']['totalOrders']:,}")
    print(f"Customers: {references['overallKpis']['totalCustomers']:,}")
    print(f"Output folder: {args.output.resolve()}")
    print("Read validation_report.txt first.")
    if not comparison["allRowsMatch"]:
        print("WARNING: Source comparison failed. Inspect reference_results.json.")
        return 1
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"VALIDATION ERROR: {exc}", file=sys.stderr)
        sys.exit(2)
