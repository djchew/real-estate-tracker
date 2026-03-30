from fastapi import APIRouter

router = APIRouter()


@router.get("/properties/{property_id}/income")
def get_income(property_id: str, month: str = None):
    return []


@router.post("/income")
def create_income():
    return {}


@router.delete("/income/{id}")
def delete_income(id: str):
    return {}
