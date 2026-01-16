"""
Unit tests for ImportTransactionsHandler.

Tests the import orchestration without database dependencies.
"""
from __future__ import annotations

from pathlib import Path
from uuid import uuid4

import pytest

from src.application.commands.import_transactions import ImportTransactionsCommand
from src.application.handlers.import_handler import ImportTransactionsHandler
from src.domain.entities.transaction import Transaction
from src.domain.repositories.category_repository import CategoryRepository
from src.domain.repositories.transaction_repository import TransactionRepository
from src.domain.value_objects.money import Money
from src.infrastructure.import_adapters.adapter_factory import AdapterFactory
from src.infrastructure.import_adapters.base_adapter import ImportAdapter
from decimal import Decimal
from datetime import date


# === Mocks ===


class MockAdapter(ImportAdapter):
    """Mock adapter for testing."""

    def __init__(self, transactions: list[Transaction] = None):
        self.transactions = transactions or []

    @property
    def name(self) -> str:
        return "Mock"

    @property
    def supported_extensions(self) -> list[str]:
        return [".csv"]

    def can_parse(self, file_path: Path) -> bool:
        return file_path.suffix == ".csv"

    def parse(self, file_path: Path, account_id, auto_categorize: bool = False):
        return self.transactions


class MockAdapterFactory(AdapterFactory):
    """Mock factory for testing."""

    def __init__(self, adapter: ImportAdapter):
        self.adapter = adapter

    def get_adapter(self, file_path: Path) -> ImportAdapter:
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        return self.adapter


class MockTransactionRepository(TransactionRepository):
    """Mock transaction repository for testing."""

    def __init__(self):
        self.transactions = {}
        self.hashes = set()

    def save(self, transaction):
        self.transactions[transaction.id] = transaction

    def save_many(self, transactions):
        for tx in transactions:
            self.transactions[tx.id] = tx
            if tx.import_hash:
                self.hashes.add(tx.import_hash)
        return len(transactions)

    def get_by_id(self, transaction_id):
        return self.transactions.get(transaction_id)

    def find_by_account(self, account_id, limit=100, offset=0):
        return []

    def find_by_date_range(self, date_range, account_id=None):
        return []

    def find_by_category(self, category_id, date_range=None):
        return []

    def find_uncategorized(self, account_id=None, limit=50):
        return []

    def count_by_account(self, account_id):
        return 0

    def exists_by_hash(self, import_hash: str):
        return import_hash in self.hashes

    def delete(self, transaction_id):
        if transaction_id in self.transactions:
            del self.transactions[transaction_id]
            return True
        return False

    def delete_by_account(self, account_id):
        return 0


class MockCategoryRepository(CategoryRepository):
    """Mock category repository for testing."""

    def save(self, category):
        pass

    def delete(self, category_id):
        pass

    def get_by_id(self, category_id):
        return None

    def find_by_name(self, name):
        return None

    def find_by_type(self, category_type):
        return []

    def find_roots(self):
        return []

    def find_children(self, parent_id):
        return []

    def find_by_keyword(self, keyword):
        return []

    def find_all(self):
        return []


# === Fixtures ===


@pytest.fixture
def account_id():
    return uuid4()


@pytest.fixture
def mock_transactions(account_id):
    """Create test transactions."""
    return [
        Transaction(
            account_id=account_id,
            date=date(2025, 1, 15),
            amount=Money(Decimal("-42.50")),
            description="CB CARREFOUR",
        ),
        Transaction(
            account_id=account_id,
            date=date(2025, 1, 16),
            amount=Money(Decimal("-35.75")),
            description="CB MONOPRIX",
        ),
    ]


@pytest.fixture
def mock_adapter(mock_transactions):
    """Provide a mock adapter."""
    return MockAdapter(mock_transactions)


@pytest.fixture
def mock_factory(mock_adapter):
    """Provide a mock adapter factory."""
    return MockAdapterFactory(mock_adapter)


@pytest.fixture
def tx_repo():
    """Provide a mock transaction repository."""
    return MockTransactionRepository()


@pytest.fixture
def cat_repo():
    """Provide a mock category repository."""
    return MockCategoryRepository()


@pytest.fixture
def handler(mock_factory, tx_repo, cat_repo):
    """Provide the handler under test."""
    return ImportTransactionsHandler(mock_factory, tx_repo, cat_repo)


# === Tests ===


class TestImportHandlerBasic:
    """Tests for basic import functionality."""

    def test_handle_imports_transactions(
        self, handler: ImportTransactionsHandler, account_id, tmp_path
    ):
        """Importe les transactions depuis un fichier."""
        csv_file = tmp_path / "test.csv"
        csv_file.write_text("test")

        cmd = ImportTransactionsCommand(
            file_path=csv_file,
            account_id=account_id,
            auto_categorize=False,
        )

        result = handler.handle(cmd)

        assert result.imported_count == 2
        assert result.skipped_count == 0
        assert result.error_count == 0
        assert result.categorized_count == 0

    def test_handle_nonexistent_file_raises_error(
        self, handler: ImportTransactionsHandler, account_id
    ):
        """Lève erreur si le fichier n'existe pas."""
        cmd = ImportTransactionsCommand(
            file_path=Path("/nonexistent/file.csv"),
            account_id=account_id,
        )

        with pytest.raises(FileNotFoundError):
            handler.handle(cmd)


class TestImportHandlerDeduplication:
    """Tests for duplicate detection."""

    def test_handle_skips_duplicates(
        self, account_id, tmp_path
    ):
        """Ignore les doublons basés sur import_hash."""
        # Créer des transactions avec les mêmes hashes
        from src.application.dto.import_result_dto import ImportResultDTO
        from datetime import date

        tx1 = Transaction(
            account_id=account_id,
            date=date(2025, 1, 15),
            amount=Money(Decimal("-42.50")),
            description="CB CARREFOUR",
        )
        tx1.ensure_import_hash()  # Générer le hash

        # Créer un repo avec ce hash stocké (duplicate)
        tx_repo = MockTransactionRepository()
        tx_repo.hashes.add(tx1.import_hash)  # Simuler qu'il existe déjà

        cat_repo = MockCategoryRepository()
        adapter = MockAdapter([tx1])
        factory = MockAdapterFactory(adapter)

        handler = ImportTransactionsHandler(factory, tx_repo, cat_repo)

        csv_file = tmp_path / "test.csv"
        csv_file.write_text("test")

        cmd = ImportTransactionsCommand(
            file_path=csv_file,
            account_id=account_id,
            auto_categorize=False,
        )

        # Importer - devrait détecter le doublon
        result = handler.handle(cmd)

        assert result.imported_count == 0
        assert result.skipped_count == 1

    def test_handle_import_result_statistics(
        self, handler: ImportTransactionsHandler, account_id, tmp_path
    ):
        """Les statistiques de résultat sont correctes."""
        csv_file = tmp_path / "test.csv"
        csv_file.write_text("test")

        cmd = ImportTransactionsCommand(
            file_path=csv_file,
            account_id=account_id,
            auto_categorize=False,
        )

        result = handler.handle(cmd)

        assert result.total_processed == 2
        assert result.success_rate == 100.0
        assert result.categorization_rate == 0.0  # Pas de catégorisation


class TestImportResultDTO:
    """Tests for ImportResultDTO."""

    def test_import_result_dto_to_dict(self, account_id):
        """Export en dictionnaire pour JSON."""
        from src.application.dto.import_result_dto import ImportResultDTO

        result = ImportResultDTO(
            account_id=account_id,
            imported_count=10,
            skipped_count=2,
            error_count=0,
            categorized_count=8,
        )

        result_dict = result.to_dict()

        assert result_dict["imported_count"] == 10
        assert result_dict["skipped_count"] == 2
        # Success rate = (imported / total_processed) * 100
        # (10 / 12) * 100 = 83.33...
        assert result_dict["success_rate"] == round((10 / 12) * 100, 2)

    def test_import_result_dto_str(self, account_id):
        """Format lisible."""
        from src.application.dto.import_result_dto import ImportResultDTO

        result = ImportResultDTO(
            account_id=account_id,
            imported_count=10,
            skipped_count=2,
            error_count=0,
        )

        str_result = str(result)
        assert "10 imported" in str_result
        assert "2 skipped" in str_result
