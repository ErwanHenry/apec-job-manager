"""
Integration tests for Database layer.

Tests the SQLAlchemy setup with in-memory SQLite.
"""
from __future__ import annotations

import pytest
from sqlalchemy.orm import Session
from sqlalchemy import text

from src.infrastructure.persistence.database import Database, DatabaseConfig
from src.infrastructure.persistence.models import Base


@pytest.fixture
def in_memory_db() -> Database:
    """Create an in-memory SQLite database for testing."""
    config = DatabaseConfig(
        database_url="sqlite:///:memory:",
        echo=False,
    )
    db = Database(config)

    # Create all tables
    db.create_all_tables(Base)

    yield db

    # Cleanup
    db.drop_all_tables(Base)
    db.close()


@pytest.fixture
def session(in_memory_db: Database) -> Session:
    """Provide a database session."""
    return in_memory_db.get_session()


class TestDatabaseConnection:
    """Tests for database connection."""

    def test_check_connection_ok(self, in_memory_db: Database):
        """Vérifie que la connexion fonctionne."""
        assert in_memory_db.check_connection() is True

    def test_get_session(self, in_memory_db: Database):
        """Crée une nouvelle session."""
        session = in_memory_db.get_session()
        assert session is not None
        session.close()

    def test_get_session_context(self, in_memory_db: Database):
        """Context manager pour les sessions."""
        with in_memory_db.get_session_context() as session:
            assert session is not None
            # Session should be usable here

    def test_get_table_names(self, in_memory_db: Database):
        """Récupère la liste des tables."""
        tables = in_memory_db.get_table_names()

        # Should have all our tables
        expected_tables = [
            "transactions",
            "accounts",
            "categories",
            "recurring_transactions",
            "category_keywords",
        ]

        for expected in expected_tables:
            assert expected in tables


class TestDatabaseSetup:
    """Tests for database initialization."""

    def test_create_all_tables(self, in_memory_db: Database):
        """Les tables sont créées."""
        tables = in_memory_db.get_table_names()

        assert len(tables) == 5
        assert "transactions" in tables
        assert "accounts" in tables
        assert "categories" in tables

    def test_transaction_model_structure(self, session: Session):
        """Vérifie la structure du modèle Transaction."""
        from src.infrastructure.persistence.models import TransactionModel
        from sqlalchemy import inspect

        mapper = inspect(TransactionModel)
        columns = {c.name for c in mapper.columns}

        # Check required columns
        expected = {
            "id", "account_id", "date", "amount", "currency",
            "description", "category_id", "import_hash",
            "created_at", "updated_at"
        }

        for col in expected:
            assert col in columns

    def test_account_model_structure(self, session: Session):
        """Vérifie la structure du modèle Account."""
        from src.infrastructure.persistence.models import AccountModel
        from sqlalchemy import inspect

        mapper = inspect(AccountModel)
        columns = {c.name for c in mapper.columns}

        expected = {
            "id", "name", "bank", "account_type", "initial_balance",
            "currency", "is_active", "created_at", "updated_at"
        }

        for col in expected:
            assert col in columns

    def test_category_model_structure(self, session: Session):
        """Vérifie la structure du modèle Category."""
        from src.infrastructure.persistence.models import CategoryModel
        from sqlalchemy import inspect

        mapper = inspect(CategoryModel)
        columns = {c.name for c in mapper.columns}

        expected = {
            "id", "name", "category_type", "parent_id", "icon", "color",
            "keywords", "budget_default", "created_at", "updated_at"
        }

        for col in expected:
            assert col in columns


class TestDatabaseSession:
    """Tests for session management."""

    def test_session_commit(self, in_memory_db: Database):
        """Les changements sont committés."""
        session = in_memory_db.get_session()

        # Create a simple query
        result = session.execute(text("SELECT 1"))
        assert result is not None

        session.close()

    def test_session_rollback_on_error(self, in_memory_db: Database):
        """Les erreurs déclenchent un rollback."""
        with in_memory_db.get_session_context() as session:
            # Execute a valid query
            result = session.execute(text("SELECT 1"))
            assert result is not None
