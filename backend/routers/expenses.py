from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import date
from database.connection import supabase

router = APIRouter()


class ExpenseCreate(BaseModel):
    property_id: str
    category: str
    amount: float
    date: date
    vendor: Optional[str] = None
    description: Optional[str] = None
    is_recurring: bool = False


@router.get("/properties/{property_id}/expenses")
def get_expenses(property_id: str, month: Optional[str] = None):
    query = (
        supabase.table("expense_records")
        .select("*")
        .eq("property_id", property_id)
    )
    if month:
        query = query.eq("month", month)
    result = query.order("date", desc=True).execute()
    return result.data


@router.post("/expenses", status_code=201)
def create_expense(body: ExpenseCreate):
    data = body.model_dump(exclude_none=True)
    record_date = data["date"]
    data["date"] = str(record_date)
    data["month"] = str(record_date)[:7]  # "YYYY-MM"
    result = supabase.table("expense_records").insert(data).execute()
    return result.data[0]


@router.delete("/expenses/{id}", status_code=204)
def delete_expense(id: str):
    supabase.table("expense_records").delete().eq("id", id).execute()
