from fastapi import APIRouter

router = APIRouter()


@router.get("/properties/{property_id}/tenants")
def get_tenants(property_id: str):
    return []


@router.post("/tenants")
def create_tenant():
    return {}


@router.put("/tenants/{id}")
def update_tenant(id: str):
    return {}
