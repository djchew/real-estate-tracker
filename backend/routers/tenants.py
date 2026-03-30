from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import date
from database.connection import supabase

router = APIRouter()


class TenantCreate(BaseModel):
    property_id: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    unit: Optional[str] = None
    rent_amount: float
    lease_start: date
    lease_end: Optional[date] = None
    status: str = "active"
    security_deposit: Optional[float] = None
    notes: Optional[str] = None


class TenantUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    unit: Optional[str] = None
    rent_amount: Optional[float] = None
    lease_start: Optional[date] = None
    lease_end: Optional[date] = None
    status: Optional[str] = None
    security_deposit: Optional[float] = None
    notes: Optional[str] = None


@router.get("/properties/{property_id}/tenants")
def get_tenants(property_id: str):
    result = (
        supabase.table("tenants")
        .select("*")
        .eq("property_id", property_id)
        .order("status")
        .execute()
    )
    return result.data


@router.post("/tenants", status_code=201)
def create_tenant(body: TenantCreate):
    data = body.model_dump(exclude_none=True)
    data["lease_start"] = str(data["lease_start"])
    if "lease_end" in data and data["lease_end"]:
        data["lease_end"] = str(data["lease_end"])
    result = supabase.table("tenants").insert(data).execute()
    return result.data[0]


@router.put("/tenants/{id}")
def update_tenant(id: str, body: TenantUpdate):
    data = body.model_dump(exclude_none=True)
    if "lease_start" in data:
        data["lease_start"] = str(data["lease_start"])
    if "lease_end" in data and data["lease_end"]:
        data["lease_end"] = str(data["lease_end"])
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = supabase.table("tenants").update(data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return result.data[0]


@router.delete("/tenants/{id}", status_code=204)
def delete_tenant(id: str):
    supabase.table("tenants").delete().eq("id", id).execute()
