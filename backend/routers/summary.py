from fastapi import APIRouter

router = APIRouter()


@router.get("/summary")
def get_summary():
    return {
        "portfolio_value": 0,
        "total_equity": 0,
        "total_debt": 0,
        "monthly_cash_flow": 0,
        "active_properties": 0,
    }
