from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database.connection import supabase

router = APIRouter()


class MaintenanceIn(BaseModel):
    property_id: str
    title: str
    category: str
    priority: str = "medium"
    status: str = "open"
    reported_date: Optional[str] = None
    completed_date: Optional[str] = None
    cost: Optional[float] = None
    vendor: Optional[str] = None
    notes: Optional[str] = None


@router.get("/maintenance")
def list_maintenance(property_id: Optional[str] = None, status: Optional[str] = None):
    q = supabase.table("maintenance_requests").select("*, properties(name)").order("reported_date", desc=True)
    if property_id:
        q = q.eq("property_id", property_id)
    if status:
        q = q.eq("status", status)
    return q.execute().data or []


@router.post("/maintenance")
def create_maintenance(data: MaintenanceIn):
    payload = data.model_dump(exclude_none=True)
    result = supabase.table("maintenance_requests").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create request")
    return result.data[0]


@router.put("/maintenance/{req_id}")
def update_maintenance(req_id: str, data: MaintenanceIn):
    payload = data.model_dump(exclude_none=True)
    result = supabase.table("maintenance_requests").update(payload).eq("id", req_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Not found")
    return result.data[0]


@router.delete("/maintenance/{req_id}")
def delete_maintenance(req_id: str):
    supabase.table("maintenance_requests").delete().eq("id", req_id).execute()
    return {"ok": True}
