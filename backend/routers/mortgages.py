from fastapi import APIRouter

router = APIRouter()


@router.get("/properties/{property_id}/mortgages")
def get_mortgages(property_id: str):
    return []


@router.post("/mortgages")
def create_mortgage():
    return {}


@router.put("/mortgages/{id}")
def update_mortgage(id: str):
    return {}
