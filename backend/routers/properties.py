from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import date
from database.connection import supabase

router = APIRouter()


class PropertyCreate(BaseModel):
    name: str
    address: str
    city: str
    state: str
    zip: str
    property_type: str
    status: str = "active"
    purchase_price: Optional[float] = None
    current_value: Optional[float] = None
    purchase_date: Optional[date] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    square_feet: Optional[int] = None
    year_built: Optional[int] = None
    notes: Optional[str] = None


class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    property_type: Optional[str] = None
    status: Optional[str] = None
    purchase_price: Optional[float] = None
    current_value: Optional[float] = None
    purchase_date: Optional[date] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    square_feet: Optional[int] = None
    year_built: Optional[int] = None
    notes: Optional[str] = None


@router.get("/properties")
def get_properties():
    result = supabase.table("properties").select("*").order("created_at", desc=True).execute()
    return result.data


@router.get("/properties/{id}")
def get_property(id: str):
    result = supabase.table("properties").select("*").eq("id", id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Property not found")
    return result.data


@router.post("/properties", status_code=201)
def create_property(body: PropertyCreate):
    data = body.model_dump(exclude_none=True)
    if "purchase_date" in data and data["purchase_date"]:
        data["purchase_date"] = str(data["purchase_date"])
    result = supabase.table("properties").insert(data).execute()
    return result.data[0]


@router.put("/properties/{id}")
def update_property(id: str, body: PropertyUpdate):
    data = body.model_dump(exclude_none=True)
    if "purchase_date" in data and data["purchase_date"]:
        data["purchase_date"] = str(data["purchase_date"])
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = supabase.table("properties").update(data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Property not found")
    return result.data[0]


@router.delete("/properties/{id}", status_code=204)
def delete_property(id: str):
    supabase.table("properties").delete().eq("id", id).execute()
