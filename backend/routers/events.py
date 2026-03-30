from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import date
from database.connection import supabase

router = APIRouter()


class EventCreate(BaseModel):
    property_id: Optional[str] = None
    title: str
    category: str
    due_date: date
    status: str = "pending"
    notes: Optional[str] = None


class EventUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None


@router.get("/events")
def get_events(upcoming: Optional[int] = None):
    query = supabase.table("events").select("*, properties(name, address)")
    if upcoming:
        today = str(date.today())
        query = (
            query
            .gte("due_date", today)
            .eq("status", "pending")
            .order("due_date")
            .limit(upcoming)
        )
    else:
        query = query.order("due_date")
    result = query.execute()
    return result.data


@router.post("/events", status_code=201)
def create_event(body: EventCreate):
    data = body.model_dump(exclude_none=True)
    data["due_date"] = str(data["due_date"])
    result = supabase.table("events").insert(data).execute()
    return result.data[0]


@router.put("/events/{id}")
def update_event(id: str, body: EventUpdate):
    data = body.model_dump(exclude_none=True)
    if "due_date" in data:
        data["due_date"] = str(data["due_date"])
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = supabase.table("events").update(data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Event not found")
    return result.data[0]


@router.delete("/events/{id}", status_code=204)
def delete_event(id: str):
    supabase.table("events").delete().eq("id", id).execute()
