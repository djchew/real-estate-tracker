from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import date
from database.connection import supabase

router = APIRouter()


class IncomeCreate(BaseModel):
    property_id: str
    tenant_id: Optional[str] = None
    category: str
    amount: float
    date: date
    description: Optional[str] = None


@router.get("/properties/{property_id}/income")
def get_income(property_id: str, month: Optional[str] = None):
    query = (
        supabase.table("income_records")
        .select("*, tenants(first_name, last_name)")
        .eq("property_id", property_id)
    )
    if month:
        query = query.eq("month", month)
    result = query.order("date", desc=True).execute()
    return result.data


@router.post("/income", status_code=201)
def create_income(body: IncomeCreate):
    data = body.model_dump(exclude_none=True)
    record_date = data["date"]
    data["date"] = str(record_date)
    data["month"] = str(record_date)[:7]  # "YYYY-MM"
    result = supabase.table("income_records").insert(data).execute()
    return result.data[0]


@router.delete("/income/{id}", status_code=204)
def delete_income(id: str):
    supabase.table("income_records").delete().eq("id", id).execute()
