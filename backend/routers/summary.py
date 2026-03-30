from fastapi import APIRouter
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
    result = (
        supabase.table("v_monthly_cash_flow")
        .select("*")
        .order("month", desc=True)
        .execute()
    )
    return result.data
