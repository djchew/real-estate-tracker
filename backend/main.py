import os
import sys
import time
import asyncio
import threading
from fastapi import FastAPI

# Fix httpx/WinError 10035 on Windows (WSAEWOULDBLOCK with ProactorEventLoop)
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
from fastapi.middleware.cors import CORSMiddleware

from routers import properties, mortgages, tenants, income, expenses, events, summary, maintenance, demo, watchlist

app = FastAPI(title="Real Estate Tracker API")

# Shutdown when browser closes (no heartbeat for 30s after first ping)
_last_heartbeat: float = 0.0
_connected = False

def _watch():
    global _connected
    while True:
        time.sleep(10)
        if _connected and time.time() - _last_heartbeat > 30:
            os._exit(0)

threading.Thread(target=_watch, daemon=True).start()

@app.post("/api/heartbeat")
def heartbeat():
    global _last_heartbeat, _connected
    _last_heartbeat = time.time()
    _connected = True
    return {"ok": True}

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
app.include_router(maintenance.router, prefix="/api")
app.include_router(demo.router, prefix="/api")
app.include_router(watchlist.router, prefix="/api")


@app.get("/")
def root():
    return {"status": "ok"}
