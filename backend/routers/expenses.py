from fastapi import APIRouter

router = APIRouter()


@router.get("/properties/{property_id}/expenses")
def get_expenses(property_id: str, month: str = None):
    return []


@router.post("/expenses")
def create_expense():
    return {}


@router.delete("/expenses/{id}")
def delete_expense(id: str):
    return {}
