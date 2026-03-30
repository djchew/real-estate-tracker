from fastapi import APIRouter

router = APIRouter()


@router.get("/events")
def get_events(upcoming: int = None):
    return []


@router.post("/events")
def create_event():
    return {}


@router.put("/events/{id}")
def update_event(id: str):
    return {}


@router.delete("/events/{id}")
def delete_event(id: str):
    return {}
