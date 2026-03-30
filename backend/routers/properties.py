from fastapi import APIRouter

router = APIRouter()


@router.get("/properties")
def get_properties():
    return []


@router.post("/properties")
def create_property():
    return {}


@router.put("/properties/{id}")
def update_property(id: str):
    return {}


@router.delete("/properties/{id}")
def delete_property(id: str):
    return {}
