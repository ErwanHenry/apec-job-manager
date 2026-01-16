"""
FinanceTracker - Personal Finance Management API

Point d'entrée principal de l'application FastAPI.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle: startup and shutdown events."""
    # Startup
    print(f"🚀 Starting FinanceTracker API (debug={settings.debug})")
    # TODO: Initialize database connection
    # TODO: Start scheduler
    yield
    # Shutdown
    print("👋 Shutting down FinanceTracker API")


app = FastAPI(
    title="FinanceTracker API",
    description="Personal finance tracking and budget projection",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware (pour le frontend local)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check
@app.get("/health", tags=["system"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "0.1.0"}


# TODO: Include routers when implemented
# from src.infrastructure.api.routes import transactions, accounts, projection
# app.include_router(transactions.router, prefix="/api/v1")
# app.include_router(accounts.router, prefix="/api/v1")
# app.include_router(projection.router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=settings.debug)
