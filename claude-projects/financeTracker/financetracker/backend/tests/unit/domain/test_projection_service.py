"""
Unit tests for ProjectionService.

Tests the balance projection logic with recurring transactions.
"""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from uuid import uuid4

import pytest

from src.domain.entities.account import Account, AccountType
from src.domain.entities.recurring_transaction import RecurringTransaction, Frequency
from src.domain.repositories.account_repository import AccountRepository
from src.domain.repositories.recurring_repository import RecurringRepository
from src.domain.services.projection_service import ProjectionService
from src.domain.value_objects.money import Money
from src.domain.value_objects.scenario import Scenario


# === Mocks ===


class MockAccountRepository(AccountRepository):
    """Mock AccountRepository for testing."""

    def __init__(self, accounts: list[Account] = None):
        self.accounts = accounts or []

    def save(self, account: Account) -> None:
        pass

    def delete(self, account_id):
        pass

    def get_by_id(self, account_id):
        for acc in self.accounts:
            if acc.id == account_id:
                return acc
        return None

    def find_by_name(self, name: str):
        for acc in self.accounts:
            if acc.name.lower() == name.lower():
                return acc
        return None

    def find_by_bank(self, bank: str):
        return [acc for acc in self.accounts if acc.bank.lower() == bank.lower()]

    def find_active(self):
        return [acc for acc in self.accounts if acc.is_active]

    def find_all(self):
        return self.accounts


class MockRecurringRepository(RecurringRepository):
    """Mock RecurringRepository for testing."""

    def __init__(self, recurring_txs: list[RecurringTransaction] = None):
        self.recurring_txs = recurring_txs or []

    def save(self, recurring_transaction):
        pass

    def delete(self, recurring_id):
        pass

    def get_by_id(self, recurring_id):
        for rtx in self.recurring_txs:
            if rtx.id == recurring_id:
                return rtx
        return None

    def find_by_account(self, account_id):
        return [rtx for rtx in self.recurring_txs if rtx.account_id == account_id]

    def find_active(self, on_date=None):
        if on_date is None:
            on_date = date.today()
        return [rtx for rtx in self.recurring_txs if rtx.is_active_on(on_date)]

    def find_all(self):
        return self.recurring_txs


# === Test Fixtures ===


@pytest.fixture
def account_id():
    return uuid4()


@pytest.fixture
def category_id():
    return uuid4()


@pytest.fixture
def account(account_id):
    """Create a test account."""
    return Account(
        id=account_id,
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
    """Provide an empty mock recurring repository."""
    return MockRecurringRepository([])


@pytest.fixture
def service(account_repo, recurring_repo):
    """Provide a projection service."""
    return ProjectionService(account_repo, recurring_repo)


# === Tests: Basic Projection ===


class TestProjectionBasic:
    """Tests for basic projection functionality."""

    def test_project_6_months_returns_result(
        self, service: ProjectionService
    ):
        """Projette 6 mois et retourne un résultat."""
        result = service.project(months=6, scenario=Scenario.REALISTIC)

        assert result is not None
        assert len(result.projection_points) > 0
        assert result.starting_balance.amount == Decimal("1000.00")
        assert result.scenario == Scenario.REALISTIC

    def test_project_invalid_months_raises_error(
        self, service: ProjectionService
    ):
        """Lève erreur pour un nombre de mois invalide."""
        with pytest.raises(ValueError, match="must be between 1 and 12"):
            service.project(months=0)

        with pytest.raises(ValueError, match="must be between 1 and 12"):
            service.project(months=13)

    def test_project_all_scenarios(self, service: ProjectionService):
        """Projette pour tous les scénarios."""
        results = service.project_multiple_scenarios(months=3)

        assert len(results) == 3
        assert "pessimistic" in results
        assert "realistic" in results
        assert "optimistic" in results


# === Tests: With Recurring Transactions ===


class TestProjectionWithRecurring:
    """Tests for projection with recurring transactions."""

    def test_project_with_monthly_salary(
        self, account_id: uuid4, category_id: uuid4, account_repo, recurring_repo
    ):
        """Projette avec un salaire mensuel."""
        # Créer un salaire récurrent
        salary = RecurringTransaction(
            name="Salaire",
            amount=Money(Decimal("3000.00")),
            category_id=category_id,
            frequency=Frequency.MONTHLY,
            day_of_month=1,
            start_date=date(2025, 1, 1),
            account_id=account_id,
        )

        recurring_repo.recurring_txs = [salary]
        service = ProjectionService(account_repo, recurring_repo)

        result = service.project(
            months=3,
            scenario=Scenario.REALISTIC,
            from_date=date(2025, 1, 1),
        )

        # Le solde devrait augmenter
        assert result.is_improving()
        assert result.ending_balance.amount > result.starting_balance.amount

    def test_project_with_monthly_rent(
        self, account_id: uuid4, category_id: uuid4, account_repo, recurring_repo
    ):
        """Projette avec un loyer mensuel."""
        # Créer un loyer récurrent
        rent = RecurringTransaction(
            name="Loyer",
            amount=Money(Decimal("-1200.00")),
            category_id=category_id,
            frequency=Frequency.MONTHLY,
            day_of_month=1,
            start_date=date(2025, 1, 1),
            account_id=account_id,
        )

        recurring_repo.recurring_txs = [rent]
        service = ProjectionService(account_repo, recurring_repo)

        result = service.project(
            months=3,
            scenario=Scenario.REALISTIC,
            from_date=date(2025, 1, 1),
        )

        # Le solde devrait diminuer
        assert result.is_deteriorating()
        assert result.ending_balance.amount < result.starting_balance.amount


# === Tests: Scenarios ===


class TestProjectionScenarios:
    """Tests for different projection scenarios."""

    def test_pessimistic_scenario_reduces_income(
        self, account_id: uuid4, category_id: uuid4, account_repo, recurring_repo
    ):
        """Le scénario pessimiste réduit les revenus."""
        salary = RecurringTransaction(
            name="Salaire",
            amount=Money(Decimal("3000.00")),
            category_id=category_id,
            frequency=Frequency.MONTHLY,
            day_of_month=1,
            start_date=date(2025, 1, 1),
            account_id=account_id,
        )

        recurring_repo.recurring_txs = [salary]
        service = ProjectionService(account_repo, recurring_repo)

        realistic = service.project(months=3, scenario=Scenario.REALISTIC)
        pessimistic = service.project(months=3, scenario=Scenario.PESSIMISTIC)

        # Le pessimiste devrait avoir un solde final inférieur
        assert pessimistic.ending_balance.amount < realistic.ending_balance.amount

    def test_optimistic_scenario_increases_income(
        self, account_id: uuid4, category_id: uuid4, account_repo, recurring_repo
    ):
        """Le scénario optimiste augmente les revenus."""
        salary = RecurringTransaction(
            name="Salaire",
            amount=Money(Decimal("3000.00")),
            category_id=category_id,
            frequency=Frequency.MONTHLY,
            day_of_month=1,
            start_date=date(2025, 1, 1),
            account_id=account_id,
        )

        recurring_repo.recurring_txs = [salary]
        service = ProjectionService(account_repo, recurring_repo)

        realistic = service.project(months=3, scenario=Scenario.REALISTIC)
        optimistic = service.project(months=3, scenario=Scenario.OPTIMISTIC)

        # L'optimiste devrait avoir un solde final supérieur
        assert optimistic.ending_balance.amount > realistic.ending_balance.amount


# === Tests: ProjectionResult Properties ===


class TestProjectionResultProperties:
    """Tests for ProjectionResult properties."""

    def test_result_calculates_statistics(self, service: ProjectionService):
        """Les statistiques sont calculées correctement."""
        result = service.project(months=3, scenario=Scenario.REALISTIC)

        # Toutes les statistiques devraient être disponibles
        assert result.starting_balance is not None
        assert result.ending_balance is not None
        assert result.min_balance is not None
        assert result.max_balance is not None
        assert result.average_balance is not None
        assert result.total_change is not None

    def test_result_critical_status(
        self, account_id: uuid4, category_id: uuid4, account_repo, recurring_repo
    ):
        """Détecte une situation critique si solde négatif."""
        # Loyer très élevé causant un solde négatif
        rent = RecurringTransaction(
            name="Loyer",
            amount=Money(Decimal("-2000.00")),
            category_id=category_id,
            frequency=Frequency.MONTHLY,
            day_of_month=1,
            start_date=date(2025, 1, 1),
            account_id=account_id,
        )

        recurring_repo.recurring_txs = [rent]
        service = ProjectionService(account_repo, recurring_repo)

        result = service.project(months=3, scenario=Scenario.REALISTIC)

        # Devrait être critique (solde négatif)
        assert result.is_critical()

    def test_result_to_dict(self, service: ProjectionService):
        """Peut exporter en dictionnaire."""
        result = service.project(months=1, scenario=Scenario.REALISTIC)

        result_dict = result.to_dict()

        assert result_dict["scenario"] == "realistic"
        assert "starting_balance" in result_dict
        assert "ending_balance" in result_dict
        assert "projection_points" in result_dict
        assert len(result_dict["projection_points"]) > 0
