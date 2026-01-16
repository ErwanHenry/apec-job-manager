"""
Dependency Injection Configuration for FastAPI

Provides FastAPI dependencies for:
- Database sessions
- Repository implementations
- Application handlers and services
"""
from __future__ import annotations

from functools import lru_cache
from typing import Generator

from sqlalchemy.orm import Session

from src.config import settings
from src.infrastructure.persistence.database import (
    initialize_database,
    get_database,
    DatabaseConfig,
)
from src.infrastructure.persistence.repositories.sqlite_transaction_repository import (
    SQLiteTransactionRepository,
)
from src.infrastructure.persistence.repositories.sqlite_account_repository import (
    SQLiteAccountRepository,
)
from src.infrastructure.persistence.repositories.sqlite_category_repository import (
    SQLiteCategoryRepository,
)
from src.infrastructure.import_adapters.adapter_factory import AdapterFactory
from src.application.handlers.import_handler import ImportTransactionsHandler
from src.application.handlers.projection_handler import ProjectionHandler


# === Database ===


@lru_cache(maxsize=1)
def get_db_config() -> DatabaseConfig:
    """Get cached database configuration."""
    return DatabaseConfig(
        database_url=settings.database_url,
        echo=settings.debug,
    )


def init_database() -> None:
    """Initialize the database (call once at startup)."""
    config = get_db_config()
    initialize_database(config)


def get_session() -> Generator[Session, None, None]:
    """
    FastAPI dependency: Get database session.

    Yields:
        SQLAlchemy Session (auto-cleanup)

    Usage:
        @app.get("/items")
        async def read_items(session: Session = Depends(get_session)):
            return session.query(Item).all()
    """
    db = get_database()
    with db.get_session_context() as session:
        yield session


# === Repositories ===


def get_transaction_repository(
    session: Session = None,
) -> SQLiteTransactionRepository:
    """Get transaction repository instance."""
    if session is None:
        session = get_session()
    return SQLiteTransactionRepository(session)


def get_account_repository(
    session: Session = None,
) -> SQLiteAccountRepository:
    """Get account repository instance."""
    if session is None:
        session = get_session()
    return SQLiteAccountRepository(session)


def get_category_repository(
    session: Session = None,
) -> SQLiteCategoryRepository:
    """Get category repository instance."""
    if session is None:
        session = get_session()
    return SQLiteCategoryRepository(session)


# === Adapter Factory ===


@lru_cache(maxsize=1)
def get_adapter_factory() -> AdapterFactory:
    """Get cached adapter factory instance."""
    return AdapterFactory()


# === Application Handlers ===


def get_import_handler(
    adapter_factory: AdapterFactory = None,
    transaction_repo: SQLiteTransactionRepository = None,
    category_repo: SQLiteCategoryRepository = None,
) -> ImportTransactionsHandler:
    """Get import transactions handler."""
    if adapter_factory is None:
        adapter_factory = get_adapter_factory()
    if transaction_repo is None:
        session = get_database().get_session()
        transaction_repo = SQLiteTransactionRepository(session)
    if category_repo is None:
        session = get_database().get_session()
        category_repo = SQLiteCategoryRepository(session)

    return ImportTransactionsHandler(
        adapter_factory=adapter_factory,
        transaction_repository=transaction_repo,
        category_repository=category_repo,
    )


def get_projection_handler(
    account_repo: SQLiteAccountRepository = None,
    recurring_repo: SQLiteAccountRepository = None,  # Placeholder - implement RecurringRepository
    transaction_repo: SQLiteTransactionRepository = None,
) -> ProjectionHandler:
    """Get projection handler."""
    if account_repo is None:
        session = get_database().get_session()
        account_repo = SQLiteAccountRepository(session)
    if transaction_repo is None:
        session = get_database().get_session()
        transaction_repo = SQLiteTransactionRepository(session)

    # TODO: Implement RecurringRepository
    # if recurring_repo is None:
    #     session = get_database().get_session()
    #     recurring_repo = SQLiteRecurringRepository(session)

    from src.domain.repositories.recurring_repository import RecurringRepository
    from unittest.mock import Mock

    if recurring_repo is None:
        recurring_repo = Mock(spec=RecurringRepository)

    return ProjectionHandler(
        account_repository=account_repo,
        recurring_repository=recurring_repo,
        transaction_repository=transaction_repo,
    )
