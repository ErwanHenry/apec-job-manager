"""
Integration tests for TransactionRepository.

Tests the complete repository with real domain entities and SQLite.
"""
from __future__ import annotations

import pytest
from decimal import Decimal
from datetime import date
from uuid import uuid4
from sqlalchemy.orm import Session

from src.infrastructure.persistence.database import Database, DatabaseConfig
from src.infrastructure.persistence.models import Base
from src.infrastructure.persistence.repositories import SQLiteTransactionRepository
from src.domain.entities.transaction import Transaction
from src.domain.entities.account import Account, AccountType
from src.domain.value_objects.money import Money
from src.domain.value_objects.date_range import DateRange


@pytest.fixture
def in_memory_db() -> Database:
    """Create an in-memory SQLite database for testing."""
    config = DatabaseConfig(
        database_url="sqlite:///:memory:",
        echo=False,
    )
    db = Database(config)
    db.create_all_tables(Base)
    yield db
    db.drop_all_tables(Base)
    db.close()


@pytest.fixture
def session(in_memory_db: Database) -> Session:
    """Provide a database session."""
    return in_memory_db.get_session()


@pytest.fixture
def repository(session: Session) -> SQLiteTransactionRepository:
    """Provide a transaction repository."""
    return SQLiteTransactionRepository(session)


@pytest.fixture
def account_id() -> str:
    """A test account ID."""
    return str(uuid4())


@pytest.fixture
def category_id() -> str:
    """A test category ID."""
    return str(uuid4())


class TestTransactionRepositorySave:
    """Tests for saving transactions."""

    def test_save_single_transaction(self, repository: SQLiteTransactionRepository, account_id: str, category_id: str):
        """Persiste une transaction unique."""
        tx = Transaction(
            account_id=uuid4() if isinstance(account_id, str) else account_id,
            date=date(2025, 1, 15),
            amount=Money(Decimal("-42.50")),
            description="CB CARREFOUR",
        )

        repository.save(tx)

        # Verify it was saved
        retrieved = repository.get_by_id(tx.id)
        assert retrieved is not None
        assert retrieved.id == tx.id
        assert retrieved.description == "CB CARREFOUR"
        assert retrieved.amount == Money(Decimal("-42.50"))

    def test_save_multiple_transactions(self, repository: SQLiteTransactionRepository):
        """Persiste plusieurs transactions."""
        account_id = uuid4()
        transactions = [
            Transaction(
                account_id=account_id,
                date=date(2025, 1, 15),
                amount=Money(Decimal("-42.50")),
                description="CB CARREFOUR",
            ),
            Transaction(
                account_id=account_id,
                date=date(2025, 1, 16),
                amount=Money(Decimal("-50.00")),
                description="CB MONOPRIX",
            ),
            Transaction(
                account_id=account_id,
                date=date(2025, 1, 17),
                amount=Money(Decimal("3000.00")),
                description="VIREMENT SALAIRE",
            ),
        ]

        # Compute import hashes
        for tx in transactions:
            tx.ensure_import_hash()

        count = repository.save_many(transactions)

        # Verify all were saved
        assert count == 3
        assert repository.count_by_account(account_id) == 3

    def test_duplicate_import_hash_raises_error(self, repository: SQLiteTransactionRepository):
        """Lève erreur si import_hash est déjà en base."""
        tx1 = Transaction(
            account_id=uuid4(),
            date=date(2025, 1, 15),
            amount=Money(Decimal("-42.50")),
            description="CB CARREFOUR",
        )
        tx1.ensure_import_hash()

        tx2 = Transaction(
            account_id=uuid4(),
            date=date(2025, 1, 15),
            amount=Money(Decimal("-42.50")),
            description="CB CARREFOUR",
        )
        tx2.ensure_import_hash()

        # Both should have the same import_hash
        assert tx1.import_hash == tx2.import_hash

        repository.save(tx1)

        # Saving tx2 should raise an error
        with pytest.raises(ValueError, match="already exists"):
            repository.save(tx2)


class TestTransactionRepositoryRead:
    """Tests for reading transactions."""

    def test_get_by_id(self, repository: SQLiteTransactionRepository):
        """Récupère une transaction par son ID."""
        tx = Transaction(
            account_id=uuid4(),
            date=date(2025, 1, 15),
            amount=Money(Decimal("-42.50")),
            description="CB CARREFOUR",
        )

        repository.save(tx)
        retrieved = repository.get_by_id(tx.id)

        assert retrieved is not None
        assert retrieved.id == tx.id
        assert retrieved.description == "CB CARREFOUR"

    def test_get_by_id_not_found(self, repository: SQLiteTransactionRepository):
        """Retourne None si transaction n'existe pas."""
        retrieved = repository.get_by_id(uuid4())
        assert retrieved is None

    def test_find_by_date_range(self, repository: SQLiteTransactionRepository):
        """Récupère les transactions dans une plage de dates."""
        account_id = uuid4()

        # Save transactions for different dates
        tx1 = Transaction(
            account_id=account_id,
            date=date(2025, 1, 10),
            amount=Money(Decimal("-42.50")),
            description="TX1 DESCRIPTION",
        )
        tx2 = Transaction(
            account_id=account_id,
            date=date(2025, 1, 15),
            amount=Money(Decimal("-50.00")),
            description="TX2 DESCRIPTION",
        )
        tx3 = Transaction(
            account_id=account_id,
            date=date(2025, 1, 20),
            amount=Money(Decimal("-60.00")),
            description="TX3 DESCRIPTION",
        )

        for tx in [tx1, tx2, tx3]:
            tx.ensure_import_hash()

        repository.save_many([tx1, tx2, tx3])

        # Query for date range
        date_range = DateRange(date(2025, 1, 12), date(2025, 1, 18))
        results = repository.find_by_date_range(date_range, account_id=account_id)

        # Should only get tx2
        assert len(results) == 1
        assert results[0].description == "TX2 DESCRIPTION"

    def test_find_by_account(self, repository: SQLiteTransactionRepository):
        """Récupère les transactions d'un compte."""
        account_id1 = uuid4()
        account_id2 = uuid4()

        # Save transactions for different accounts
        tx1 = Transaction(
            account_id=account_id1,
            date=date(2025, 1, 15),
            amount=Money(Decimal("-42.50")),
            description="TRANSACTION ACCOUNT1",
        )
        tx2 = Transaction(
            account_id=account_id2,
            date=date(2025, 1, 15),
            amount=Money(Decimal("-50.00")),
            description="TRANSACTION ACCOUNT2",
        )

        tx1.ensure_import_hash()
        tx2.ensure_import_hash()

        repository.save_many([tx1, tx2])

        # Query by account
        results = repository.find_by_account(account_id1)

        assert len(results) == 1
        assert results[0].account_id == account_id1


class TestTransactionRepositoryDelete:
    """Tests for deleting transactions."""

    def test_delete_transaction(self, repository: SQLiteTransactionRepository):
        """Supprime une transaction."""
        tx = Transaction(
            account_id=uuid4(),
            date=date(2025, 1, 15),
            amount=Money(Decimal("-42.50")),
            description="CB CARREFOUR",
        )

        repository.save(tx)
        assert repository.get_by_id(tx.id) is not None

        repository.delete(tx.id)
        assert repository.get_by_id(tx.id) is None


class TestTransactionRepositoryStats:
    """Tests for statistics queries."""

    def test_count_by_account(self, repository: SQLiteTransactionRepository):
        """Compte les transactions d'un compte."""
        account_id = uuid4()

        # Save 3 transactions
        for i in range(3):
            tx = Transaction(
                account_id=account_id,
                date=date(2025, 1, 15 + i),
                amount=Money(Decimal("-42.50")),
                description=f"TRANSACTION_{i}_DESC",
            )
            tx.ensure_import_hash()
            repository.save(tx)

        count = repository.count_by_account(account_id)
        assert count == 3

    def test_exists_by_hash(self, repository: SQLiteTransactionRepository):
        """Vérifie l'existence par hash."""
        tx = Transaction(
            account_id=uuid4(),
            date=date(2025, 1, 15),
            amount=Money(Decimal("-42.50")),
            description="CB CARREFOUR",
        )
        tx.ensure_import_hash()

        assert repository.exists_by_hash(tx.import_hash) is False

        repository.save(tx)

        assert repository.exists_by_hash(tx.import_hash) is True
        assert repository.exists_by_hash("nonexistent_hash") is False
