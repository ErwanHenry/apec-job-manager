"""
FinanceTracker - Personal Finance Management API

Point d'entrée principal de l'application FastAPI.
"""
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.infrastructure.persistence.database import initialize_database, DatabaseConfig

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle: startup and shutdown events."""
    # Startup
    print(f"🚀 Starting FinanceTracker API (debug={settings.debug})")
    try:
        # Initialize database connection
        db_config = DatabaseConfig(
            database_url=settings.database_url,
            echo=settings.debug,
        )
        db = initialize_database(db_config)
        if db.check_connection():
            print("✅ Database connected")
        else:
            print("⚠️ Database connection failed")
    except Exception as e:
        print(f"❌ Database initialization error: {e}")
        raise
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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "https://financetracker.vercel.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check
@app.get("/health", tags=["system"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "0.1.0"}


# Include routers
from src.infrastructure.api.routes import import_routes, transactions, projection, accounts

app.include_router(import_routes.router, prefix="/api/v1", tags=["import"])
app.include_router(transactions.router, prefix="/api/v1", tags=["transactions"])
app.include_router(projection.router, prefix="/api/v1", tags=["projection"])
app.include_router(accounts.router, prefix="/api/v1", tags=["accounts"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=settings.debug)
