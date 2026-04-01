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
