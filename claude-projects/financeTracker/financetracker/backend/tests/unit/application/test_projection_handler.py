"""
Unit tests for ProjectionHandler.

Tests the projection query handling.
"""
from __future__ import annotations

from uuid import uuid4

import pytest

from src.application.queries.get_projection import GetProjectionQuery
from src.application.handlers.projection_handler import ProjectionHandler
from src.domain.entities.account import Account, AccountType
from src.domain.entities.recurring_transaction import RecurringTransaction, Frequency
from src.domain.repositories.account_repository import AccountRepository
from src.domain.repositories.recurring_repository import RecurringRepository
from src.domain.repositories.transaction_repository import TransactionRepository
from src.domain.value_objects.money import Money
from src.domain.value_objects.scenario import Scenario
from datetime import date
from decimal import Decimal


# === Mocks ===


class MockAccountRepository(AccountRepository):
    """Mock account repository."""

    def __init__(self, accounts: list[Account] = None):
        self.accounts = accounts or []

    def save(self, account):
        pass

    def delete(self, account_id):
        pass

    def get_by_id(self, account_id):
        for acc in self.accounts:
            if acc.id == account_id:
                return acc
        return None

    def find_by_name(self, name):
        return None

    def find_by_bank(self, bank):
        return []

    def find_active(self):
        return [a for a in self.accounts if a.is_active]

    def find_all(self):
        return self.accounts


class MockRecurringRepository(RecurringRepository):
    """Mock recurring repository."""

    def __init__(self, recurring_txs: list[RecurringTransaction] = None):
        self.recurring_txs = recurring_txs or []

    def save(self, recurring_transaction):
        pass

    def delete(self, recurring_id):
        pass

    def get_by_id(self, recurring_id):
        return None

    def find_by_account(self, account_id):
        return []

    def find_active(self, on_date=None):
        if on_date is None:
            on_date = date.today()
        return [rtx for rtx in self.recurring_txs if rtx.is_active_on(on_date)]

    def find_all(self):
        return self.recurring_txs


class MockTransactionRepository(TransactionRepository):
    """Mock transaction repository."""

    def save(self, transaction):
        pass

    def save_many(self, transactions):
        return len(transactions)

    def get_by_id(self, transaction_id):
        return None

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

    def exists_by_hash(self, import_hash):
        return False

    def delete(self, transaction_id):
        return False

    def delete_by_account(self, account_id):
        return 0


# === Fixtures ===


@pytest.fixture
def account():
    """Create a test account."""
    return Account(
        name="Test Account",
        bank="Test Bank",
        account_type=AccountType.CHECKING,
        initial_balance=Decimal("1000.00"),
        currency="EUR",
        is_active=True,
    )


@pytest.fixture
def account_repo(account):
    """Provide a mock account repository."""
    return MockAccountRepository([account])


@pytest.fixture
def recurring_repo():
    """Provide a mock recurring repository."""
    return MockRecurringRepository()


@pytest.fixture
def tx_repo():
    """Provide a mock transaction repository."""
    return MockTransactionRepository()


@pytest.fixture
def handler(account_repo, recurring_repo, tx_repo):
    """Provide the handler under test."""
    return ProjectionHandler(account_repo, recurring_repo, tx_repo)


# === Tests ===


class TestProjectionHandlerBasic:
    """Tests for basic projection handling."""

    def test_handle_returns_dto(self, handler: ProjectionHandler):
        """Retourne un DTO valide."""
        from src.application.dto.projection_dto import ProjectionDTO

        query = GetProjectionQuery(months=6, scenario=Scenario.REALISTIC)
        result = handler.handle(query)

        assert isinstance(result, ProjectionDTO)
        assert result.scenario == "realistic"
        assert result.starting_balance == "1000.00"

    def test_handle_invalid_months_raises_error(self, handler: ProjectionHandler):
        """Lève erreur pour mois invalide."""
        with pytest.raises(ValueError):
            query = GetProjectionQuery(months=0, scenario=Scenario.REALISTIC)
            handler.handle(query)

    def test_handle_all_scenarios(self, handler: ProjectionHandler):
        """Gère tous les scénarios."""
        for scenario in [
            Scenario.PESSIMISTIC,
            Scenario.REALISTIC,
            Scenario.OPTIMISTIC,
        ]:
            query = GetProjectionQuery(months=3, scenario=scenario)
            result = handler.handle(query)

            assert result.scenario == scenario.value
            assert result.num_days > 0


class TestProjectionResultDTO:
    """Tests for ProjectionResultDTO."""

    def test_dto_to_dict(self):
        """Export en dictionnaire pour JSON."""
        from src.application.dto.projection_dto import ProjectionDTO, ProjectionPointDTO

        point = ProjectionPointDTO(
            date="2025-02-01", balance="1050.00", net_change="50.00"
        )

        dto = ProjectionDTO(
            scenario="realistic",
            starting_balance="1000.00",
            ending_balance="1050.00",
            min_balance="1000.00",
            max_balance="1050.00",
            average_balance="1025.00",
            total_change="50.00",
            is_critical=False,
            is_warning=False,
            is_healthy=True,
            is_improving=True,
            num_days=31,
            num_negative_days=0,
            percentage_negative_days=0.0,
            projection_points=[point],
        )

        dto_dict = dto.to_dict()

        assert dto_dict["scenario"] == "realistic"
        assert len(dto_dict["projection_points"]) == 1
        assert dto_dict["is_healthy"] is True

    def test_dto_str_representation(self):
        """Format lisible du DTO."""
        from src.application.dto.projection_dto import ProjectionDTO, ProjectionPointDTO

        point = ProjectionPointDTO(
            date="2025-02-01", balance="1050.00", net_change="50.00"
        )

        dto = ProjectionDTO(
            scenario="realistic",
            starting_balance="1000.00",
            ending_balance="1050.00",
            min_balance="1000.00",
            max_balance="1050.00",
            average_balance="1025.00",
            total_change="50.00",
            is_critical=False,
            is_warning=False,
            is_healthy=True,
            is_improving=True,
            num_days=31,
            num_negative_days=0,
            percentage_negative_days=0.0,
            projection_points=[point],
        )

        str_repr = str(dto)
        assert "realistic" in str_repr
        assert "1000.00" in str_repr


class TestGetProjectionQuery:
    """Tests for GetProjectionQuery."""

    def test_query_validation(self):
        """Valide les paramètres."""
        with pytest.raises(ValueError):
            GetProjectionQuery(months=13)

        with pytest.raises(ValueError):
            GetProjectionQuery(scenario="invalid")

    def test_query_defaults(self):
        """Les valeurs par défaut sont correctes."""
        query = GetProjectionQuery()

        assert query.months == 6
        assert query.scenario == Scenario.REALISTIC
