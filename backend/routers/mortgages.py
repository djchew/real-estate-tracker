from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import date
from database.connection import supabase

router = APIRouter()


class MortgageCreate(BaseModel):
    property_id: str
    lender: str
    loan_type: str = "conventional"
    original_amount: float
    current_balance: float
    interest_rate: float
    monthly_payment: float
    start_date: date
    term_months: int
    is_primary: bool = True
    notes: Optional[str] = None


class MortgageUpdate(BaseModel):
    lender: Optional[str] = None
    loan_type: Optional[str] = None
    current_balance: Optional[float] = None
    interest_rate: Optional[float] = None
    monthly_payment: Optional[float] = None
    is_primary: Optional[bool] = None
    notes: Optional[str] = None


@router.get("/properties/{property_id}/mortgages")
def get_mortgages(property_id: str):
    result = (
        supabase.table("mortgages")
        .select("*")
        .eq("property_id", property_id)
        .order("is_primary", desc=True)
        .execute()
    )
    return result.data


@router.post("/mortgages", status_code=201)
def create_mortgage(body: MortgageCreate):
    data = body.model_dump(exclude_none=True)
    data["start_date"] = str(data["start_date"])
    result = supabase.table("mortgages").insert(data).execute()
    return result.data[0]


@router.put("/mortgages/{id}")
def update_mortgage(id: str, body: MortgageUpdate):
    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = supabase.table("mortgages").update(data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Mortgage not found")
    return result.data[0]


@router.delete("/mortgages/{id}", status_code=204)
def delete_mortgage(id: str):
    supabase.table("mortgages").delete().eq("id", id).execute()
