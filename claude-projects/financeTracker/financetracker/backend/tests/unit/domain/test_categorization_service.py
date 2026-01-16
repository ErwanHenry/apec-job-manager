"""
Unit tests for CategorizationService.

Tests the automatic categorization logic without database dependencies.
"""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from uuid import UUID, uuid4

import pytest

from src.domain.entities.category import Category, CategoryType
from src.domain.entities.transaction import Transaction
from src.domain.repositories.category_repository import CategoryRepository
from src.domain.repositories.transaction_repository import TransactionRepository
from src.domain.services.categorization_service import (
    CategorizationResult,
    CategorizationService,
)
from src.domain.value_objects.money import Money


# === Mocks ===


class MockCategoryRepository(CategoryRepository):
    """Mock CategoryRepository for testing."""

    def __init__(self, categories: list[Category]):
        self.categories = categories

    def save(self, category: Category) -> None:
        pass

    def get_by_id(self, category_id: UUID) -> Category | None:
        for cat in self.categories:
            if cat.id == category_id:
                return cat
        return None

    def find_all(self) -> list[Category]:
        return self.categories

    def find_roots(self) -> list[Category]:
        return [c for c in self.categories if c.is_root()]

    def find_children(self, parent_id: UUID) -> list[Category]:
        return [c for c in self.categories if c.parent_id == parent_id]

    def find_by_keyword(self, keyword: str) -> list[Category]:
        keyword_upper = keyword.upper()
        results = []
        for cat in self.categories:
            if any(kw.upper() == keyword_upper for kw in cat.keywords):
                results.append(cat)
        return results

    def find_by_name(self, name: str) -> Category | None:
        for cat in self.categories:
            if cat.name.lower() == name.lower():
                return cat
        return None

    def find_by_type(self, category_type: CategoryType) -> list[Category]:
        return [c for c in self.categories if c.category_type == category_type]

    def delete(self, category_id: UUID) -> None:
        pass


class MockTransactionRepository(TransactionRepository):
    """Mock TransactionRepository for testing."""

    def __init__(self, transactions: list[Transaction] = None):
        self.transactions = transactions or []

    def save(self, transaction: Transaction) -> None:
        pass

    def save_many(self, transactions: list[Transaction]) -> int:
        return len(transactions)

    def get_by_id(self, transaction_id: UUID) -> Transaction | None:
        for tx in self.transactions:
            if tx.id == transaction_id:
                return tx
        return None

    def find_by_account(
        self, account_id: UUID, limit: int = 100, offset: int = 0
    ) -> list[Transaction]:
        filtered = [tx for tx in self.transactions if tx.account_id == account_id]
        return filtered[offset : offset + limit]

    def find_by_date_range(
        self, date_range, account_id: UUID | None = None
    ) -> list[Transaction]:
        return []

    def find_by_category(
        self, category_id: UUID, date_range=None
    ) -> list[Transaction]:
        return []

    def find_uncategorized(
        self, account_id: UUID | None = None, limit: int = 50
    ) -> list[Transaction]:
        return []

    def count_by_account(self, account_id: UUID) -> int:
        return len([tx for tx in self.transactions if tx.account_id == account_id])

    def exists_by_hash(self, import_hash: str) -> bool:
        return False

    def delete(self, transaction_id: UUID) -> bool:
        return False

    def delete_by_account(self, account_id: UUID) -> int:
        return 0


# === Test Fixtures ===


@pytest.fixture
def account_id() -> UUID:
    """A test account ID."""
    return uuid4()


@pytest.fixture
def categories() -> list[Category]:
    """Create test categories with keywords."""
    return [
        Category(
            name="Alimentation",
            category_type=CategoryType.EXPENSE,
            keywords=["CARREFOUR", "SUPERMARCHE", "MARCHE"],
        ),
        Category(
            name="Restaurant",
            category_type=CategoryType.EXPENSE,
            keywords=["RESTAURANT", "CAFE", "PIZZERIA", "BISTRO"],
        ),
        Category(
            name="Transport",
            category_type=CategoryType.EXPENSE,
            keywords=["SNCF", "RATP", "ESSENCE", "PARKING"],
        ),
        Category(
            name="Salaire",
            category_type=CategoryType.INCOME,
            keywords=["VIREMENT SALAIRE", "PAYE", "SALAIRE"],
        ),
        Category(
            name="Non catégorisé",
            category_type=CategoryType.EXPENSE,
            keywords=[],
        ),
    ]


@pytest.fixture
def category_repo(categories: list[Category]) -> MockCategoryRepository:
    """Provide a mock category repository."""
    return MockCategoryRepository(categories)


@pytest.fixture
def service(category_repo: MockCategoryRepository) -> CategorizationService:
    """Provide a categorization service."""
    return CategorizationService(category_repo)


# === Tests: Exact Keyword Matching ===


class TestCategorizationExactMatch:
    """Tests for exact keyword matching."""

    def test_exact_keyword_match_uppercase(
        self, service: CategorizationService, account_id: UUID
    ):
        """Trouve une correspondance exacte en majuscules."""
        tx = Transaction(
            account_id=account_id,
            date=date(2025, 1, 15),
            amount=Money(Decimal("-42.50")),
            description="CARREFOUR",
        )

        result = service.categorize(tx)

        assert result.category_id is not None
        assert result.confidence == 1.0
        assert "Exact keyword match" in result.reason

    def test_exact_keyword_match_mixed_case(
        self, service: CategorizationService, account_id: UUID
    ):
        """Correspondance exacte insensible à la casse."""
        tx = Transaction(
            account_id=account_id,
            date=date(2025, 1, 15),
            amount=Money(Decimal("-42.50")),
            description="Carrefour",
        )

        result = service.categorize(tx)

        assert result.category_id is not None
        assert result.confidence == 1.0

    def test_exact_keyword_match_with_whitespace(
        self, service: CategorizationService, account_id: UUID
    ):
        """Correspondance exacte en ignorant les espaces."""
        tx = Transaction(
            account_id=account_id,
            date=date(2025, 1, 15),
            amount=Money(Decimal("-42.50")),
            description="  CARREFOUR  ",
        )

        result = service.categorize(tx)

        assert result.category_id is not None
        assert result.confidence == 1.0


# === Tests: Partial Keyword Matching ===


class TestCategorizationPartialMatch:
    """Tests for partial keyword matching."""

    def test_partial_keyword_match_prefix(
        self, service: CategorizationService, account_id: UUID
    ):
        """Trouve une correspondance partielle (préfixe)."""
        tx = Transaction(
            account_id=account_id,
            date=date(2025, 1, 15),
            amount=Money(Decimal("-42.50")),
            description="CB CARREFOUR STORE",
        )

        result = service.categorize(tx)

        assert result.category_id is not None
        assert result.confidence == 0.9
        assert "Partial keyword match" in result.reason

    def test_partial_keyword_match_suffix(
        self, service: CategorizationService, account_id: UUID
    ):
        """Trouve une correspondance partielle (suffixe)."""
        tx = Transaction(
            account_id=account_id,
            date=date(2025, 1, 15),
            amount=Money(Decimal("-28.90")),
            description="PIZZA RESTAURANT",
        )

        result = service.categorize(tx)

        assert result.category_id is not None
        assert result.confidence == 0.9

    def test_partial_keyword_match_infix(
        self, service: CategorizationService, account_id: UUID
    ):
        """Trouve une correspondance partielle (infixe)."""
        tx = Transaction(
            account_id=account_id,
            date=date(2025, 1, 15),
            amount=Money(Decimal("-35.75")),
            description="LE SUPERMARCHE METRO",
        )

        result = service.categorize(tx)

        assert result.category_id is not None
        assert result.confidence == 0.9


# === Tests: No Match ===


class TestCategorizationNoMatch:
    """Tests when no category matches."""

    def test_no_match_returns_uncategorized(
        self, service: CategorizationService, account_id: UUID
    ):
        """Retourne confidence 0.0 quand pas de match."""
        tx = Transaction(
            account_id=account_id,
            date=date(2025, 1, 15),
            amount=Money(Decimal("-42.50")),
            description="UNKNOWN MERCHANT",
        )

        result = service.categorize(tx)

        assert result.category_id is None
        assert result.confidence == 0.0
        assert "No matching category found" in result.reason

    def test_no_description_returns_uncategorized(
        self, service: CategorizationService, account_id: UUID
    ):
        """Pas de catégorisation si pas de description."""
        tx = Transaction(
            account_id=account_id,
            date=date(2025, 1, 15),
            amount=Money(Decimal("-42.50")),
            description="",
        )

        result = service.categorize(tx)

        assert result.category_id is None
        assert result.confidence == 0.0
        assert "No description" in result.reason


# === Tests: Historical Matching ===


class TestCategorizationHistoricalMatch:
    """Tests for historical matching based on past transactions."""

    def test_historical_match_same_description(
        self, account_id: UUID, category_repo: MockCategoryRepository
    ):
        """Trouve une correspondance partielle avant historique."""
        # Créer une transaction passée catégorisée
        restaurant_cat = [c for c in category_repo.find_all() if c.name == "Restaurant"][
            0
        ]

        past_tx = Transaction(
            account_id=account_id,
            date=date(2025, 1, 10),
            amount=Money(Decimal("-28.90")),
            description="PIZZA RESTAURANT",
            category_id=restaurant_cat.id,
        )

        tx_repo = MockTransactionRepository([past_tx])
        service = CategorizationService(category_repo, tx_repo)

        # Transaction identique à catégoriser
        new_tx = Transaction(
            account_id=account_id,
            date=date(2025, 1, 15),
            amount=Money(Decimal("-35.50")),
            description="PIZZA RESTAURANT",
        )

        result = service.categorize(new_tx)

        # Doit trouver la correspondance partielle (priorité sur historique)
        assert result.category_id == restaurant_cat.id
        assert result.confidence == 0.9
        assert "Partial keyword match" in result.reason

    def test_historical_match_different_amounts(
        self, account_id: UUID, category_repo: MockCategoryRepository
    ):
        """Correspondance partielle même si montants différents."""
        restaurant_cat = [c for c in category_repo.find_all() if c.name == "Restaurant"][
            0
        ]

        past_tx = Transaction(
            account_id=account_id,
            date=date(2025, 1, 10),
            amount=Money(Decimal("-28.90")),
            description="CAFE PARIS",
            category_id=restaurant_cat.id,
        )

        tx_repo = MockTransactionRepository([past_tx])
        service = CategorizationService(category_repo, tx_repo)

        new_tx = Transaction(
            account_id=account_id,
            date=date(2025, 1, 15),
            amount=Money(Decimal("-12.50")),
            description="CAFE PARIS",
        )

        result = service.categorize(new_tx)

        # "CAFE" keyword matches "CAFE PARIS" description
        assert result.category_id == restaurant_cat.id
        assert result.confidence == 0.9


# === Tests: Batch Categorization ===


class TestCategorizationBatch:
    """Tests for batch categorization."""

    def test_categorize_many(self, service: CategorizationService, account_id: UUID):
        """Catégorise plusieurs transactions."""
        transactions = [
            Transaction(
                account_id=account_id,
                date=date(2025, 1, 15),
                amount=Money(Decimal("-42.50")),
                description="CARREFOUR",
            ),
            Transaction(
                account_id=account_id,
                date=date(2025, 1, 16),
                amount=Money(Decimal("-28.90")),
                description="RESTAURANT",
            ),
            Transaction(
                account_id=account_id,
                date=date(2025, 1, 17),
                amount=Money(Decimal("3500.00")),
                description="VIREMENT SALAIRE",
            ),
        ]

        results = service.categorize_many(transactions)

        assert len(results) == 3
        assert all(isinstance(r, CategorizationResult) for r in results)
        assert results[0].confidence >= 0.9
        assert results[1].confidence >= 0.9
        assert results[2].confidence >= 0.9

    def test_categorize_many_preserves_order(
        self, service: CategorizationService, account_id: UUID
    ):
        """L'ordre des résultats correspond aux entrées."""
        transactions = [
            Transaction(
                account_id=account_id,
                date=date(2025, 1, 15),
                amount=Money(Decimal("-42.50")),
                description="CARREFOUR",
            ),
            Transaction(
                account_id=account_id,
                date=date(2025, 1, 16),
                amount=Money(Decimal("-999.99")),
                description="UNKNOWN",
            ),
        ]

        results = service.categorize_many(transactions)

        # Premier a confiance élevée
        assert results[0].confidence >= 0.9
        # Deuxième n'a pas de match
        assert results[1].confidence == 0.0


# === Tests: Result Class ===


class TestCategorizationResult:
    """Tests for CategorizationResult."""

    def test_result_initialization(self):
        """Initialise correctement le résultat."""
        cat_id = uuid4()
        result = CategorizationResult(
            category_id=cat_id,
            confidence=0.95,
            reason="Test reason",
        )

        assert result.category_id == cat_id
        assert result.confidence == 0.95
        assert result.reason == "Test reason"

    def test_result_repr(self):
        """La représentation contient les info principales."""
        cat_id = uuid4()
        result = CategorizationResult(
            category_id=cat_id,
            confidence=0.95,
            reason="Test",
        )

        repr_str = repr(result)
        assert "CategorizationResult" in repr_str
        assert str(cat_id) in repr_str
        assert "0.95" in repr_str
