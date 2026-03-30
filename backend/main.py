from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import properties, mortgages, tenants, income, expenses, events, summary

app = FastAPI(title="Real Estate Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(properties.router, prefix="/api")
app.include_router(mortgages.router, prefix="/api")
app.include_router(tenants.router, prefix="/api")
app.include_router(income.router, prefix="/api")
app.include_router(expenses.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(summary.router, prefix="/api")


@app.get("/")
def root():
    return {"status": "ok"}
