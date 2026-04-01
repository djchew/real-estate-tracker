from fastapi import APIRouter, HTTPException
from database.connection import supabase
from datetime import date, timedelta

router = APIRouter()


@router.post("/demo/seed")
def seed_demo():
    """Populate the database with sample Australian property data."""
    try:
        today = date.today()

        # Properties
        props = supabase.table("properties").insert([
            {
                "name": "Bondi Beach Unit",
                "address": "12 Campbell Parade",
                "city": "Bondi Beach",
                "state": "NSW",
                "zip": "2026",
                "property_type": "condo",
                "status": "active",
                "purchase_price": 850000,
                "current_value": 1050000,
                "purchase_date": "2019-03-15",
                "bedrooms": 2,
                "bathrooms": 1,
                "square_feet": 720,
                "year_built": 2005,
            },
            {
                "name": "Fitzroy Terrace",
                "address": "44 Smith Street",
                "city": "Fitzroy",
                "state": "VIC",
                "zip": "3065",
                "property_type": "townhouse",
                "status": "active",
                "purchase_price": 720000,
                "current_value": 920000,
                "purchase_date": "2020-08-01",
                "bedrooms": 3,
                "bathrooms": 2,
                "square_feet": 1100,
                "year_built": 1998,
            },
        ]).execute().data

        p1, p2 = props[0]["id"], props[1]["id"]

        # Mortgages
        supabase.table("mortgages").insert([
            {
                "property_id": p1,
                "lender": "Commonwealth Bank",
                "loan_type": "conventional",
                "original_amount": 680000,
                "current_balance": 598000,
                "interest_rate": 0.0599,
                "monthly_payment": 3850,
                "start_date": "2019-03-15",
                "term_months": 360,
                "is_primary": True,
            },
            {
                "property_id": p2,
                "lender": "ANZ Bank",
                "loan_type": "conventional",
                "original_amount": 576000,
                "current_balance": 520000,
                "interest_rate": 0.0625,
                "monthly_payment": 3540,
                "start_date": "2020-08-01",
                "term_months": 360,
                "is_primary": True,
            },
        ]).execute()

        # Tenants
        supabase.table("tenants").insert([
            {
                "property_id": p1,
                "first_name": "Sarah",
                "last_name": "Mitchell",
                "email": "sarah.mitchell@example.com",
                "phone": "0412 345 678",
                "rent_amount": 2800,
                "lease_start": str(today - timedelta(days=180)),
                "lease_end": str(today + timedelta(days=185)),
                "status": "active",
                "security_deposit": 5600,
            },
            {
                "property_id": p2,
                "first_name": "James",
                "last_name": "Nguyen",
                "email": "james.nguyen@example.com",
                "phone": "0421 987 654",
                "rent_amount": 3200,
                "lease_start": str(today - timedelta(days=90)),
                "lease_end": str(today + timedelta(days=275)),
                "status": "active",
                "security_deposit": 6400,
            },
        ]).execute()

        # Income records (last 3 months)
        income = []
        for i in range(3):
            m = (today.replace(day=1) - timedelta(days=i * 30))
            month = str(m)[:7]
            d = str(m.replace(day=1))
            income += [
                {"property_id": p1, "category": "rent", "amount": 2800, "date": d, "month": month, "description": "Monthly rent"},
                {"property_id": p2, "category": "rent", "amount": 3200, "date": d, "month": month, "description": "Monthly rent"},
            ]
        supabase.table("income_records").insert(income).execute()

        # Expenses (last 3 months)
        expenses = []
        for i in range(3):
            m = (today.replace(day=1) - timedelta(days=i * 30))
            month = str(m)[:7]
            d = str(m.replace(day=5))
            expenses += [
                {"property_id": p1, "category": "insurance", "amount": 180, "date": d, "month": month, "description": "Landlord insurance", "is_recurring": True},
                {"property_id": p2, "category": "property_tax", "amount": 420, "date": d, "month": month, "description": "Council rates", "is_recurring": True},
            ]
        supabase.table("expense_records").insert(expenses).execute()

        # Maintenance request
        supabase.table("maintenance_requests").insert([
            {
                "property_id": p1,
                "title": "Hot water system replacement",
                "category": "plumbing",
                "priority": "high",
                "status": "completed",
                "reported_date": str(today - timedelta(days=30)),
                "completed_date": str(today - timedelta(days=20)),
                "cost": 1850,
                "vendor": "Sydney Hot Water Pros",
                "notes": "Old unit failed, replaced with new 250L system.",
            },
            {
                "property_id": p2,
                "title": "Roof gutter cleaning",
                "category": "landscaping",
                "priority": "medium",
                "status": "open",
                "reported_date": str(today - timedelta(days=5)),
            },
        ]).execute()

        # Events
        supabase.table("events").insert([
            {
                "property_id": p1,
                "title": "Lease renewal — Sarah Mitchell",
                "category": "lease_renewal",
                "due_date": str(today + timedelta(days=30)),
                "status": "pending",
            },
            {
                "property_id": p2,
                "title": "Annual landlord insurance renewal",
                "category": "insurance_renewal",
                "due_date": str(today + timedelta(days=45)),
                "status": "pending",
            },
        ]).execute()

        return {"ok": True, "properties_created": 2}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/demo/clear")
def clear_demo():
    """Remove all data (useful for resetting the demo)."""
    try:
        supabase.table("events").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        supabase.table("maintenance_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        supabase.table("income_records").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        supabase.table("expense_records").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        supabase.table("tenants").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        supabase.table("mortgages").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        supabase.table("properties").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
