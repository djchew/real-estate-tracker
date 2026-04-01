import re
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database.connection import supabase

router = APIRouter()

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-AU,en;q=0.9",
}


def _extract_og(html: str, prop: str) -> Optional[str]:
    # Matches both property="og:x" content="..." and content="..." property="og:x"
    patterns = [
        rf'<meta[^>]+property=["\']og:{prop}["\'][^>]+content=["\']([^"\']+)["\']',
        rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:{prop}["\']',
    ]
    for p in patterns:
        m = re.search(p, html, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return None


def fetch_og_data(url: str) -> dict:
    try:
        r = httpx.get(url, headers=HEADERS, follow_redirects=True, timeout=10)
        html = r.text
        return {
            "og_title": _extract_og(html, "title"),
            "og_image": _extract_og(html, "image"),
            "og_description": _extract_og(html, "description"),
        }
    except Exception:
        return {"og_title": None, "og_image": None, "og_description": None}


class WatchlistIn(BaseModel):
    listing_url: Optional[str] = None
    address: str
    suburb: Optional[str] = None
    state: Optional[str] = None
    asking_price: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    parking: Optional[int] = None
    land_size: Optional[int] = None
    property_type: Optional[str] = None
    status: str = "watching"
    notes: Optional[str] = None


@router.get("/watchlist")
def list_watchlist():
    return supabase.table("watchlist").select("*").order("created_at", desc=True).execute().data or []


@router.post("/watchlist")
def create_watchlist(data: WatchlistIn):
    payload = data.model_dump(exclude_none=True)
    if data.listing_url:
        og = fetch_og_data(data.listing_url)
        payload.update({k: v for k, v in og.items() if v})
    result = supabase.table("watchlist").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create entry")
    return result.data[0]


@router.put("/watchlist/{item_id}")
def update_watchlist(item_id: str, data: WatchlistIn):
    payload = data.model_dump(exclude_none=True)
    result = supabase.table("watchlist").update(payload).eq("id", item_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Not found")
    return result.data[0]


@router.delete("/watchlist/{item_id}")
def delete_watchlist(item_id: str):
    supabase.table("watchlist").delete().eq("id", item_id).execute()
    return {"ok": True}


@router.post("/watchlist/{item_id}/refresh-preview")
def refresh_preview(item_id: str):
    row = supabase.table("watchlist").select("listing_url").eq("id", item_id).execute().data
    if not row or not row[0].get("listing_url"):
        raise HTTPException(status_code=404, detail="No URL to fetch")
    og = fetch_og_data(row[0]["listing_url"])
    result = supabase.table("watchlist").update(og).eq("id", item_id).execute()
    return result.data[0]
