from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import router as auth_router
from app.db import prisma
from app.routers.assignments import router as assignments_router
from app.routers.clients import router as clients_router
from app.routers.companies import router as companies_router
from app.routers.contracts import router as contracts_router
from app.routers.profiles import router as profiles_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Connect Prisma on startup and disconnect on shutdown."""
    await prisma.connect()
    yield
    await prisma.disconnect()


app = FastAPI(
    title="Contracting App API",
    description="Backend API for a contracting/consultant management application.",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS – allow the frontend dev server at localhost:3000
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
API_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(companies_router, prefix=API_PREFIX)
app.include_router(clients_router, prefix=API_PREFIX)
app.include_router(profiles_router, prefix=API_PREFIX)
app.include_router(contracts_router, prefix=API_PREFIX)
app.include_router(assignments_router, prefix=API_PREFIX)


@app.get("/health", tags=["health"])
async def health_check() -> dict:
    """Simple liveness probe."""
    return {"status": "ok"}
