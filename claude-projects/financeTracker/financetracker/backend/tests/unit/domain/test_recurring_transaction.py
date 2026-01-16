"""
Test suite for RecurringTransaction entity.

Tests la planification, les calculs de déclenchement, et les variants.
"""
from __future__ import annotations

import pytest
from datetime import date, timedelta
from decimal import Decimal
from uuid import uuid4

from src.domain.entities.recurring_transaction import RecurringTransaction, Frequency
from src.domain.value_objects.money import Money


class TestRecurringTransactionCreation:
    """Tests pour la création d'une RecurringTransaction."""

    def test_create_valid_recurring(self):
        """Crée une récurrence valide."""
        account_id = uuid4()
        category_id = uuid4()
        recurring_id = uuid4()

        recurring = RecurringTransaction(
            id=recurring_id,
            account_id=account_id,
            name="Salaire mensuel",
            amount=Money(Decimal("3000.00")),
            category_id=category_id,
            frequency=Frequency.MONTHLY,
            day_of_month=28,
            start_date=date(2025, 1, 1),
            end_date=date(2026, 12, 31),
        )

        assert recurring.id == recurring_id
        assert recurring.account_id == account_id
        assert recurring.name == "Salaire mensuel"
        assert recurring.amount == Money(Decimal("3000.00"))
        assert recurring.category_id == category_id
        assert recurring.frequency == Frequency.MONTHLY
        assert recurring.day_of_month == 28
        assert recurring.start_date == date(2025, 1, 1)
        assert recurring.end_date == date(2026, 12, 31)
        assert recurring.is_variable is False
        assert recurring.variance_percent == 0.0

    def test_create_variable_recurring(self):
        """Crée une récurrence avec variance."""
        recurring = RecurringTransaction(
            name="Bonus annuel variable",
            amount=Money(Decimal("5000.00")),
            category_id=uuid4(),
            frequency=Frequency.YEARLY,
            day_of_month=1,
            start_date=date(2025, 1, 1),
            is_variable=True,
            variance_percent=20.0,
        )

        assert recurring.is_variable is True
        assert recurring.variance_percent == 20.0

    def test_create_open_ended_recurring(self):
        """Crée une récurrence sans fin (end_date=None)."""
        recurring = RecurringTransaction(
            name="Loyer",
            amount=Money(Decimal("-1200.00")),
            category_id=uuid4(),
            frequency=Frequency.MONTHLY,
            day_of_month=1,
            start_date=date(2025, 1, 1),
            end_date=None,  # Pas de fin
        )

        assert recurring.end_date is None
        assert recurring.is_open_ended() is True

    def test_invalid_empty_name(self):
        """Lève ValueError si le nom est vide."""
        with pytest.raises(ValueError, match="name cannot be empty"):
            RecurringTransaction(
                name="",
                amount=Money(Decimal("1000.00")),
                category_id=uuid4(),
                frequency=Frequency.MONTHLY,
                day_of_month=15,
                start_date=date(2025, 1, 1),
            )

    def test_invalid_day_of_month(self):
        """Lève ValueError si day_of_month hors limites (1-31)."""
        with pytest.raises(ValueError, match="day_of_month must be between 1 and 31"):
            RecurringTransaction(
                name="Test",
                amount=Money(Decimal("100.00")),
                category_id=uuid4(),
                frequency=Frequency.MONTHLY,
                day_of_month=32,  # Invalid
                start_date=date(2025, 1, 1),
            )

    def test_invalid_variance_percent(self):
        """Lève ValueError si variance_percent hors limites (0-100)."""
        with pytest.raises(ValueError, match="variance_percent must be between 0 and 100"):
            RecurringTransaction(
                name="Test",
                amount=Money(Decimal("100.00")),
                category_id=uuid4(),
                frequency=Frequency.MONTHLY,
                day_of_month=15,
                start_date=date(2025, 1, 1),
                variance_percent=150.0,
            )

    def test_invalid_start_after_end(self):
        """Lève ValueError si start_date > end_date."""
        with pytest.raises(ValueError, match="start_date must be <= end_date"):
            RecurringTransaction(
                name="Test",
                amount=Money(Decimal("100.00")),
                category_id=uuid4(),
                frequency=Frequency.MONTHLY,
                day_of_month=15,
                start_date=date(2025, 12, 31),
                end_date=date(2025, 1, 1),
            )

    def test_immutable(self):
        """RecurringTransaction est immuable (frozen dataclass)."""
        recurring = RecurringTransaction(
            name="Loyer",
            amount=Money(Decimal("-1200.00")),
            category_id=uuid4(),
            frequency=Frequency.MONTHLY,
            day_of_month=1,
            start_date=date(2025, 1, 1),
        )

        with pytest.raises(AttributeError):
            recurring.name = "Changé"


class TestFrequency:
    """Tests pour l'enum Frequency."""

    def test_frequency_values(self):
        """Vérifie que tous les types de fréquences existent."""
        assert Frequency.DAILY.value == "daily"
        assert Frequency.WEEKLY.value == "weekly"
        assert Frequency.MONTHLY.value == "monthly"
        assert Frequency.YEARLY.value == "yearly"

    def test_frequency_from_string(self):
        """Crée Frequency à partir d'une string."""
        assert Frequency("daily") == Frequency.DAILY
        assert Frequency("weekly") == Frequency.WEEKLY


class TestRecurringTransactionMethods:
    """Tests pour les méthodes métier."""

    def test_is_open_ended(self):
        """Vérifie si la récurrence est ouverte (pas de fin)."""
        open_ended = RecurringTransaction(
            name="Loyer",
            amount=Money(Decimal("-1200.00")),
            category_id=uuid4(),
            frequency=Frequency.MONTHLY,
            day_of_month=1,
            start_date=date(2025, 1, 1),
            end_date=None,
        )
        closed = RecurringTransaction(
            name="Bonus",
            amount=Money(Decimal("5000.00")),
            category_id=uuid4(),
            frequency=Frequency.YEARLY,
            day_of_month=1,
            start_date=date(2025, 1, 1),
            end_date=date(2025, 12, 31),
        )

        assert open_ended.is_open_ended() is True
        assert closed.is_open_ended() is False

    def test_is_active_on_date(self):
        """Vérifie si la récurrence est active à une date donnée."""
        recurring = RecurringTransaction(
            name="Loyer",
            amount=Money(Decimal("-1200.00")),
            category_id=uuid4(),
            frequency=Frequency.MONTHLY,
            day_of_month=1,
            start_date=date(2025, 2, 1),  # Commence en février
            end_date=date(2025, 6, 30),  # Se termine fin juin
        )

        # Avant la date de début
        assert recurring.is_active_on(date(2025, 1, 15)) is False

        # Pendant la période
        assert recurring.is_active_on(date(2025, 3, 15)) is True

        # Après la date de fin
        assert recurring.is_active_on(date(2025, 7, 15)) is False

        # À la date de début
        assert recurring.is_active_on(date(2025, 2, 1)) is True

        # À la date de fin
        assert recurring.is_active_on(date(2025, 6, 30)) is True

    def test_should_trigger_on_monthly(self):
        """Vérifie le déclenchement pour une récurrence mensuelle."""
        recurring = RecurringTransaction(
            name="Loyer",
            amount=Money(Decimal("-1200.00")),
            category_id=uuid4(),
            frequency=Frequency.MONTHLY,
            day_of_month=15,
            start_date=date(2025, 1, 1),
        )

        # Le 15 de chaque mois
        assert recurring.should_trigger_on(date(2025, 1, 15)) is True
        assert recurring.should_trigger_on(date(2025, 2, 15)) is True
        assert recurring.should_trigger_on(date(2025, 3, 15)) is True

        # D'autres jours: non
        assert recurring.should_trigger_on(date(2025, 1, 14)) is False
        assert recurring.should_trigger_on(date(2025, 1, 16)) is False

        # Si after start_date
        assert recurring.should_trigger_on(date(2024, 12, 15)) is False

    def test_should_trigger_on_monthly_end_of_month(self):
        """Vérifie le déclenchement pour jour 31 (fin de mois)."""
        recurring = RecurringTransaction(
            name="Salaire",
            amount=Money(Decimal("3000.00")),
            category_id=uuid4(),
            frequency=Frequency.MONTHLY,
            day_of_month=31,  # Fin de mois
            start_date=date(2025, 1, 1),
        )

        # Janvier a 31 jours
        assert recurring.should_trigger_on(date(2025, 1, 31)) is True

        # Février n'a que 28 jours -> déclenche le 28
        assert recurring.should_trigger_on(date(2025, 2, 28)) is True

        # Mars a 31 jours
        assert recurring.should_trigger_on(date(2025, 3, 31)) is True

        # Avril n'a que 30 jours -> déclenche le 30
        assert recurring.should_trigger_on(date(2025, 4, 30)) is True

    def test_should_trigger_on_yearly(self):
        """Vérifie le déclenchement pour une récurrence annuelle."""
        recurring = RecurringTransaction(
            name="Bonus",
            amount=Money(Decimal("5000.00")),
            category_id=uuid4(),
            frequency=Frequency.YEARLY,
            day_of_month=15,
            start_date=date(2025, 1, 1),
        )

        # Janvier 15 chaque année
        assert recurring.should_trigger_on(date(2025, 1, 15)) is True
        assert recurring.should_trigger_on(date(2026, 1, 15)) is True
        assert recurring.should_trigger_on(date(2027, 1, 15)) is True

        # Autres dates: non
        assert recurring.should_trigger_on(date(2025, 2, 15)) is False
        assert recurring.should_trigger_on(date(2025, 1, 16)) is False

    def test_next_occurrence_after_date(self):
        """Calcule la prochaine occurrence après une date."""
        recurring = RecurringTransaction(
            name="Loyer",
            amount=Money(Decimal("-1200.00")),
            category_id=uuid4(),
            frequency=Frequency.MONTHLY,
            day_of_month=1,
            start_date=date(2025, 1, 1),
            end_date=date(2026, 12, 31),
        )

        # Prochaine après janvier
        next_date = recurring.next_occurrence_after(date(2025, 1, 15))
        assert next_date == date(2025, 2, 1)

        # Prochaine après février 1
        next_date = recurring.next_occurrence_after(date(2025, 2, 1))
        assert next_date == date(2025, 3, 1)

        # Après la fin: None
        next_date = recurring.next_occurrence_after(date(2027, 1, 15))
        assert next_date is None

    def test_is_income(self):
        """Vérifie si c'est un revenu."""
        income = RecurringTransaction(
            name="Salaire",
            amount=Money(Decimal("3000.00")),  # Positif
            category_id=uuid4(),
            frequency=Frequency.MONTHLY,
            day_of_month=28,
            start_date=date(2025, 1, 1),
        )
        expense = RecurringTransaction(
            name="Loyer",
            amount=Money(Decimal("-1200.00")),  # Négatif
            category_id=uuid4(),
            frequency=Frequency.MONTHLY,
            day_of_month=1,
            start_date=date(2025, 1, 1),
        )

        assert income.is_income() is True
        assert expense.is_income() is False

    def test_is_expense(self):
        """Vérifie si c'est une dépense."""
        expense = RecurringTransaction(
            name="Loyer",
            amount=Money(Decimal("-1200.00")),  # Négatif
            category_id=uuid4(),
            frequency=Frequency.MONTHLY,
            day_of_month=1,
            start_date=date(2025, 1, 1),
        )
        income = RecurringTransaction(
            name="Salaire",
            amount=Money(Decimal("3000.00")),  # Positif
            category_id=uuid4(),
            frequency=Frequency.MONTHLY,
            day_of_month=28,
            start_date=date(2025, 1, 1),
        )

        assert expense.is_expense() is True
        assert income.is_expense() is False


class TestRecurringTransactionSerialization:
    """Tests pour la sérialisation."""

    def test_to_dict(self):
        """Convertit en dictionnaire."""
        recurring_id = uuid4()
        account_id = uuid4()
        category_id = uuid4()

        recurring = RecurringTransaction(
            id=recurring_id,
            account_id=account_id,
            name="Salaire",
            amount=Money(Decimal("3000.00")),
            category_id=category_id,
            frequency=Frequency.MONTHLY,
            day_of_month=28,
            start_date=date(2025, 1, 1),
            end_date=date(2026, 12, 31),
            is_variable=True,
            variance_percent=5.0,
        )

        data = recurring.to_dict()

        assert data["id"] == str(recurring_id)
        assert data["account_id"] == str(account_id)
        assert data["name"] == "Salaire"
        assert data["amount"]["amount"] == "3000.00"
        assert data["category_id"] == str(category_id)
        assert data["frequency"] == "monthly"
        assert data["day_of_month"] == 28
        assert data["start_date"] == "2025-01-01"
        assert data["end_date"] == "2026-12-31"
        assert data["is_variable"] is True
        assert data["variance_percent"] == 5.0

    def test_from_dict(self):
        """Crée depuis un dictionnaire."""
        recurring_id = str(uuid4())
        account_id = str(uuid4())
        category_id = str(uuid4())

        data = {
            "id": recurring_id,
            "account_id": account_id,
            "name": "Salaire",
            "amount": {"amount": "3000.00", "currency": "EUR"},
            "category_id": category_id,
            "frequency": "monthly",
            "day_of_month": 28,
            "start_date": "2025-01-01",
            "end_date": "2026-12-31",
            "is_variable": True,
            "variance_percent": 5.0,
        }

        recurring = RecurringTransaction.from_dict(data)

        assert str(recurring.id) == recurring_id
        assert str(recurring.account_id) == account_id
        assert recurring.name == "Salaire"
        assert recurring.amount == Money(Decimal("3000.00"))
        assert str(recurring.category_id) == category_id
        assert recurring.frequency == Frequency.MONTHLY
        assert recurring.day_of_month == 28
        assert recurring.start_date == date(2025, 1, 1)
        assert recurring.end_date == date(2026, 12, 31)
        assert recurring.is_variable is True
        assert recurring.variance_percent == 5.0
