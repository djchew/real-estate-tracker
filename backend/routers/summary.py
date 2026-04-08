from fastapi import APIRouter, HTTPException
from datetime import date, timedelta
from database.connection import supabase

router = APIRouter()


@router.get("/summary")
def get_summary():
    portfolio = supabase.table("v_portfolio_summary").select("*").execute()
    row = portfolio.data[0] if portfolio.data else {}

    current_month = str(date.today())[:7]
    income_result = (
        supabase.table("income_records")
        .select("amount")
        .eq("month", current_month)
        .execute()
    )
    expense_result = (
        supabase.table("expense_records")
        .select("amount")
        .eq("month", current_month)
        .execute()
    )
    monthly_income = sum(r["amount"] for r in income_result.data)
    monthly_expenses = sum(r["amount"] for r in expense_result.data)

    today = str(date.today())
    upcoming_result = (
        supabase.table("events")
        .select("id, title, due_date, category, properties(name)")
        .eq("status", "pending")
        .gte("due_date", today)
        .order("due_date")
        .limit(5)
        .execute()
    )

    # Leases expiring within 60 days
    in_60 = str(date.today() + timedelta(days=60))
    expiring_result = (
        supabase.table("tenants")
        .select("id, first_name, last_name, lease_end, rent_amount, unit, properties(id, name)")
        .eq("status", "active")
        .gte("lease_end", today)
        .lte("lease_end", in_60)
        .order("lease_end")
        .execute()
    )

    return {
        "portfolio_value": float(row.get("portfolio_value") or 0),
        "total_equity": float(row.get("total_equity") or 0),
        "total_debt": float(row.get("total_debt") or 0),
        "total_monthly_mortgage": float(row.get("total_monthly_mortgage") or 0),
        "active_properties": int(row.get("active_properties") or 0),
        "current_month": current_month,
        "monthly_income": monthly_income,
        "monthly_expenses": monthly_expenses,
        "monthly_cash_flow": monthly_income - monthly_expenses,
        "upcoming_events": upcoming_result.data,
        "expiring_leases": expiring_result.data,
    }


@router.get("/summary/cash-flow")
def get_cash_flow():
    try:
        result = (
            supabase.table("v_monthly_cash_flow")
            .select("*")
            .order("month", desc=True)
            .execute()
        )
        return [row for row in (result.data or []) if row.get("month")]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/tax-export")
def get_tax_export(fy: int):
    """
    Download income + expenses for an Australian financial year as CSV.
    FY ending 30 June of `fy`, e.g. fy=2025 covers 2024-07-01 to 2025-06-30.
    """
    from fastapi.responses import StreamingResponse
    import csv, io

    start = f"{fy - 1}-07-01"
    end   = f"{fy}-06-30"

    try:
        income_rows = (
            supabase.table("income_records")
            .select("date, category, amount, description, properties(name)")
            .gte("date", start).lte("date", end)
            .order("date")
            .execute()
        ).data or []

        expense_rows = (
            supabase.table("expense_records")
            .select("date, category, amount, description, vendor, properties(name)")
            .gte("date", start).lte("date", end)
            .order("date")
            .execute()
        ).data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    buf = io.StringIO()
    writer = csv.writer(buf)

    writer.writerow(["Type", "Date", "Property", "Category", "Amount (AUD)", "Description", "Vendor"])
    for r in income_rows:
        writer.writerow([
            "Income", r["date"],
            r.get("properties", {}).get("name", ""),
            r["category"], r["amount"], r.get("description", ""), ""
        ])
    for r in expense_rows:
        writer.writerow([
            "Expense", r["date"],
            r.get("properties", {}).get("name", ""),
            r["category"], r["amount"], r.get("description", ""), r.get("vendor", "")
        ])

    buf.seek(0)
    filename = f"tax_summary_FY{fy}.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/summary/analytics")
def get_analytics():
    """Single endpoint that returns all data needed for the analytics page."""
    try:
        mortgages = supabase.table("mortgages").select("*").execute()
        tenants = supabase.table("tenants").select("*").execute()
        return {
            "mortgages": mortgages.data or [],
            "tenants": tenants.data or [],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/expense-trends")
def get_expense_trends():
    """
    Returns last 13 months of expenses grouped by property, month, category.
    Includes 3-month rolling average per property/category and anomaly flags (>1.5x avg).
    """
    try:
        from datetime import datetime, timedelta
        from collections import defaultdict

        # Cutoff: first day of month 13 months ago
        today = date.today()
        cutoff_date = (today.replace(day=1) - timedelta(days=1)).replace(day=1)
        for _ in range(12):
            cutoff_date = cutoff_date.replace(day=1) - timedelta(days=1)
            cutoff_date = cutoff_date.replace(day=1)
        cutoff_month = cutoff_date.strftime("%Y-%m")

        # Fetch expense records for the last 13 months
        expense_result = (
            supabase.table("expense_records")
            .select("property_id, category, amount, month")
            .gte("month", cutoff_month)
            .order("month")
            .execute()
        )

        # Fetch properties for name mapping
        properties_result = supabase.table("properties").select("id, name").execute()
        prop_map = {p["id"]: p["name"] for p in (properties_result.data or [])}

        # Group by (property_id, category) and aggregate amounts by month
        groups = defaultdict(lambda: [])
        for row in (expense_result.data or []):
            key = (row["property_id"], row["category"])
            groups[key].append({"month": row["month"], "amount": row["amount"]})

        # Sort each group by month and aggregate duplicate month entries
        monthly_totals = {}
        for key, entries in groups.items():
            monthly_totals[key] = {}
            for entry in entries:
                month = entry["month"]
                monthly_totals[key][month] = monthly_totals[key].get(month, 0) + entry["amount"]

        # Build rows with rolling average and anomaly flags
        rows = []
        anomalies = []

        for (property_id, category), month_dict in monthly_totals.items():
            sorted_months = sorted(month_dict.keys())

            for i, month in enumerate(sorted_months):
                total_amount = month_dict[month]

                # Rolling average: mean of up to 3 prior months (not including current)
                rolling_avg = None
                is_anomaly = False

                if i >= 3:
                    prior_amounts = [month_dict[sorted_months[j]] for j in range(max(0, i-3), i)]
                    rolling_avg = sum(prior_amounts) / len(prior_amounts)
                    is_anomaly = total_amount > rolling_avg * 1.5

                row = {
                    "property_id": property_id,
                    "property_name": prop_map.get(property_id, "Unknown"),
                    "month": month,
                    "category": category,
                    "total_amount": float(total_amount),
                    "rolling_avg": float(rolling_avg) if rolling_avg else None,
                    "is_anomaly": is_anomaly,
                }
                rows.append(row)

                if is_anomaly:
                    anomalies.append(row)

        return {"rows": rows, "anomalies": anomalies}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/forecast")
def get_forecast():
    """
    Returns 12-month cash flow forecast based on active tenants and historical expense patterns.
    Projections include active tenant rent and mortgage payments + avg historical operating expenses.
    """
    try:
        from datetime import datetime, timedelta
        from collections import defaultdict

        # Fetch active tenants
        tenants_result = (
            supabase.table("tenants")
            .select("property_id, rent_amount, lease_end")
            .eq("status", "active")
            .execute()
        )
        active_tenants = tenants_result.data or []

        # Fetch all mortgages
        mortgages_result = supabase.table("mortgages").select("property_id, monthly_payment").execute()
        all_mortgages = mortgages_result.data or []

        # Compute total monthly mortgage per property
        mortgage_per_property = defaultdict(float)
        for m in all_mortgages:
            mortgage_per_property[m["property_id"]] += m["monthly_payment"]

        # Fetch last 6 months of non-mortgage expenses
        six_months_ago_date = date.today().replace(day=1) - timedelta(days=1)
        for _ in range(5):
            six_months_ago_date = six_months_ago_date.replace(day=1) - timedelta(days=1)
        six_months_ago = six_months_ago_date.strftime("%Y-%m")

        expense_result = (
            supabase.table("expense_records")
            .select("property_id, month, amount")
            .gte("month", six_months_ago)
            .neq("category", "mortgage")  # Exclude mortgage category (use mortgage table instead)
            .execute()
        )
        expenses = expense_result.data or []

        # Compute avg monthly OpEx per property
        opex_per_property = defaultdict(lambda: {"total": 0.0, "months": set()})
        for exp in expenses:
            opex_per_property[exp["property_id"]]["total"] += exp["amount"]
            opex_per_property[exp["property_id"]]["months"].add(exp["month"])

        avg_opex_per_property = {}
        for prop_id, data in opex_per_property.items():
            month_count = len(data["months"])
            avg_opex_per_property[prop_id] = data["total"] / month_count if month_count > 0 else 0

        # Get all properties to build a complete set
        properties_result = supabase.table("properties").select("id").execute()
        all_property_ids = {p["id"] for p in (properties_result.data or [])}

        # Ensure all properties have an entry (use 0 if no data)
        for prop_id in all_property_ids:
            if prop_id not in avg_opex_per_property:
                avg_opex_per_property[prop_id] = 0
            if prop_id not in mortgage_per_property:
                mortgage_per_property[prop_id] = 0

        # Compute portfolio totals
        total_avg_opex = sum(avg_opex_per_property.values())
        total_mortgage = sum(mortgage_per_property.values())

        # Generate 12-month forecast
        forecast = []
        current_month = date.today().replace(day=1)

        for i in range(12):
            # Month for this forecast period (next month onwards)
            forecast_month = current_month + timedelta(days=32)  # Move to next month
            forecast_month = forecast_month.replace(day=1)  # Set to first day of month
            for _ in range(i):
                forecast_month = forecast_month + timedelta(days=32)
                forecast_month = forecast_month.replace(day=1)

            month_label = forecast_month.strftime("%Y-%m")
            month_start = forecast_month.date()

            # Projected income: sum of active tenant rents where lease_end is None or >= month_start
            projected_income = 0
            for tenant in active_tenants:
                if tenant["lease_end"] is None:
                    # Month-to-month, always included
                    projected_income += tenant["rent_amount"]
                else:
                    # Check if lease extends through this month
                    lease_end = datetime.strptime(tenant["lease_end"], "%Y-%m-%d").date()
                    if lease_end >= month_start:
                        projected_income += tenant["rent_amount"]

            # Projected expenses: total OpEx + total mortgage
            projected_expenses = total_avg_opex + total_mortgage

            # Projected cash flow
            projected_cash_flow = projected_income - projected_expenses

            forecast.append({
                "month": month_label,
                "projected_income": float(projected_income),
                "projected_expenses": float(projected_expenses),
                "projected_cash_flow": float(projected_cash_flow),
                "is_forecast": True,
            })

        return {"forecast": forecast}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
