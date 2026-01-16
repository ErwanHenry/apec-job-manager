"""
Entity: RecurringTransaction

Représente un modèle de transaction récurrente (loyer, salaire, etc.).

Principes DDD:
- Entité avec identité unique
- Encapsule les règles de récurrence (fréquence, jours)
- Peut générer des instances de Transaction
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from src.domain.value_objects.money import Money


class Frequency(str, Enum):
    """Énumération des fréquences de récurrence."""

    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


@dataclass(frozen=True)
class RecurringTransaction:
    """
    Représente un modèle de transaction récurrente.

    Invariants:
    - id est toujours défini
    - name ne peut pas être vide
    - day_of_month doit être entre 1 et 31
    - variance_percent doit être entre 0 et 100
    - start_date <= end_date
    - La clé du déclenchement est (frequency, day_of_month)

    Examples:
        >>> recurring = RecurringTransaction(
        ...     name="Loyer",
        ...     amount=Money(Decimal("-1200.00")),
        ...     category_id=uuid4(),
        ...     frequency=Frequency.MONTHLY,
        ...     day_of_month=1,
        ...     start_date=date(2025, 1, 1),
        ... )
        >>> recurring.should_trigger_on(date(2025, 1, 1))
        True
        >>> recurring.should_trigger_on(date(2025, 2, 1))
        True
    """

    # === Identité ===
    id: UUID = field(default_factory=uuid4)
    account_id: UUID = field(default_factory=uuid4)

    # === Données principales ===
    name: str = ""
    amount: Money = field(default_factory=lambda: Money.zero())
    category_id: UUID = field(default_factory=uuid4)

    # === Récurrence ===
    frequency: Frequency = Frequency.MONTHLY
    day_of_month: int = 1

    # === Période ===
    start_date: date = field(default_factory=date.today)
    end_date: Optional[date] = None

    # === Variance (pour incertitude) ===
    is_variable: bool = False
    variance_percent: float = 0.0

    # === Timestamps ===
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self) -> None:
        """Validation des invariants à la création."""
        self._validate()

    def _validate(self) -> None:
        """Valide les invariants de l'entité."""
        # Name ne peut pas être vide
        if not self.name or not self.name.strip():
            raise ValueError("name cannot be empty")

        # day_of_month doit être entre 1 et 31
        if not 1 <= self.day_of_month <= 31:
            raise ValueError(
                f"day_of_month must be between 1 and 31, got: {self.day_of_month}"
            )

        # variance_percent doit être entre 0 et 100
        if not 0.0 <= self.variance_percent <= 100.0:
            raise ValueError(
                f"variance_percent must be between 0 and 100, got: {self.variance_percent}"
            )

        # start_date <= end_date
        if self.end_date is not None and self.start_date > self.end_date:
            raise ValueError(
                f"start_date must be <= end_date, "
                f"got: start={self.start_date}, end={self.end_date}"
            )

    # === Prédicats ===

    def is_open_ended(self) -> bool:
        """Retourne True si la récurrence n'a pas de date de fin."""
        return self.end_date is None

    def is_active_on(self, check_date: date) -> bool:
        """
        Vérifie si la récurrence est active à une date donnée.

        Args:
            check_date: Date à vérifier

        Returns:
            True si start_date <= check_date <= end_date (ou pas de fin)
        """
        if check_date < self.start_date:
            return False

        if self.end_date is not None and check_date > self.end_date:
            return False

        return True

    def is_income(self) -> bool:
        """Retourne True si c'est un revenu (montant positif)."""
        return self.amount.is_positive()

    def is_expense(self) -> bool:
        """Retourne True si c'est une dépense (montant négatif)."""
        return self.amount.is_negative()

    # === Déclenchement ===

    def should_trigger_on(self, check_date: date) -> bool:
        """
        Vérifie si la récurrence doit se déclencher à une date donnée.

        La logique dépend de la fréquence:
        - MONTHLY: déclenche si day_of_month == check_date.day
                   (ou derniers jours du mois si day > jours dans le mois)
        - YEARLY: déclenche si day_of_month == check_date.day ET dans le mois correct
        - WEEKLY: non implémenté pour V1
        - DAILY: déclenche chaque jour

        Args:
            check_date: Date à vérifier

        Returns:
            True si la récurrence doit se déclencher ce jour

        Examples:
            >>> rec = RecurringTransaction(
            ...     name="Loyer",
            ...     amount=Money(Decimal("-1200")),
            ...     category_id=uuid4(),
            ...     frequency=Frequency.MONTHLY,
            ...     day_of_month=1,
            ...     start_date=date(2025, 1, 1),
            ... )
            >>> rec.should_trigger_on(date(2025, 1, 1))
            True
            >>> rec.should_trigger_on(date(2025, 2, 1))
            True
        """
        # Ne doit pas être active
        if not self.is_active_on(check_date):
            return False

        if self.frequency == Frequency.MONTHLY:
            return self._should_trigger_monthly(check_date)
        elif self.frequency == Frequency.YEARLY:
            return self._should_trigger_yearly(check_date)
        elif self.frequency == Frequency.DAILY:
            return True
        elif self.frequency == Frequency.WEEKLY:
            return False  # TODO: Implémenter

        return False

    def _should_trigger_monthly(self, check_date: date) -> bool:
        """Logique pour déclenchement mensuel."""
        # Si day_of_month est 31 et mois a moins de 31 jours,
        # déclenche le dernier jour du mois
        days_in_month = self._days_in_month(check_date.year, check_date.month)

        if self.day_of_month > days_in_month:
            # Déclenche le dernier jour du mois
            return check_date.day == days_in_month

        # Sinon, déclenche le jour spécifique
        return check_date.day == self.day_of_month

    def _should_trigger_yearly(self, check_date: date) -> bool:
        """Logique pour déclenchement annuel."""
        # Déclenche le jour_of_month du premier mois (janvier)
        if check_date.month != 1:
            return False

        # Gère le cas du 31 janvier (existe)
        return check_date.day == self.day_of_month

    @staticmethod
    def _days_in_month(year: int, month: int) -> int:
        """Retourne le nombre de jours dans un mois."""
        if month == 2:
            # Février: 29 si année bissextile, sinon 28
            return 29 if (year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)) else 28
        elif month in [4, 6, 9, 11]:
            return 30
        else:
            return 31

    def next_occurrence_after(self, check_date: date) -> Optional[date]:
        """
        Calcule la prochaine occurrence après une date donnée.

        Args:
            check_date: Date de référence

        Returns:
            La date de la prochaine occurrence, ou None si pas de prochaine occurrence
        """
        if self.frequency == Frequency.MONTHLY:
            return self._next_monthly_after(check_date)
        elif self.frequency == Frequency.YEARLY:
            return self._next_yearly_after(check_date)
        elif self.frequency == Frequency.DAILY:
            return self._next_daily_after(check_date)

        return None

    def _next_monthly_after(self, check_date: date) -> Optional[date]:
        """Calcule la prochaine occurrence mensuelle."""
        # Essaie de déclencher le même mois
        days_in_current_month = self._days_in_month(check_date.year, check_date.month)
        target_day = min(self.day_of_month, days_in_current_month)

        # Si on n'a pas encore atteint le jour du mois
        if check_date.day < target_day:
            candidate = date(check_date.year, check_date.month, target_day)
            if self.is_active_on(candidate):
                return candidate

        # Sinon, essaie le mois suivant
        if check_date.month == 12:
            next_year = check_date.year + 1
            next_month = 1
        else:
            next_year = check_date.year
            next_month = check_date.month + 1

        days_in_next_month = self._days_in_month(next_year, next_month)
        target_day = min(self.day_of_month, days_in_next_month)

        candidate = date(next_year, next_month, target_day)

        # Vérifie que c'est avant la fin de la récurrence
        if self.end_date is not None and candidate > self.end_date:
            return None

        return candidate

    def _next_yearly_after(self, check_date: date) -> Optional[date]:
        """Calcule la prochaine occurrence annuelle."""
        # Essaie cette année en janvier
        candidate = date(check_date.year, 1, self.day_of_month)

        if candidate > check_date and self.is_active_on(candidate):
            return candidate

        # Sinon, l'année suivante
        candidate = date(check_date.year + 1, 1, self.day_of_month)

        if self.end_date is not None and candidate > self.end_date:
            return None

        return candidate

    def _next_daily_after(self, check_date: date) -> Optional[date]:
        """Calcule la prochaine occurrence quotidienne."""
        from datetime import timedelta

        candidate = check_date + timedelta(days=1)

        if self.end_date is not None and candidate > self.end_date:
            return None

        return candidate

    # === Comparaison ===

    def __eq__(self, other: object) -> bool:
        """Deux RecurringTransaction sont égales si même ID."""
        if not isinstance(other, RecurringTransaction):
            return NotImplemented
        return self.id == other.id

    def __hash__(self) -> int:
        """Hash basé sur l'ID."""
        return hash(self.id)

    # === Sérialisation ===

    def to_dict(self) -> dict:
        """Convertit en dictionnaire pour sérialisation."""
        return {
            "id": str(self.id),
            "account_id": str(self.account_id),
            "name": self.name,
            "amount": self.amount.to_dict(),
            "category_id": str(self.category_id),
            "frequency": self.frequency.value,
            "day_of_month": self.day_of_month,
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "is_variable": self.is_variable,
            "variance_percent": self.variance_percent,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict) -> RecurringTransaction:
        """Crée une instance depuis un dictionnaire."""
        from uuid import UUID
        from datetime import datetime

        recurring_id = data.get("id")
        if isinstance(recurring_id, str):
            recurring_id = UUID(recurring_id)

        account_id = data.get("account_id")
        if isinstance(account_id, str):
            account_id = UUID(account_id)

        category_id = data.get("category_id")
        if isinstance(category_id, str):
            category_id = UUID(category_id)

        amount = data.get("amount")
        if isinstance(amount, dict):
            amount = Money.from_dict(amount)
        elif amount is None:
            amount = Money.zero()

        frequency = data.get("frequency", "monthly")
        if isinstance(frequency, str):
            frequency = Frequency(frequency)

        start_date = data.get("start_date")
        if isinstance(start_date, str):
            start_date = datetime.fromisoformat(start_date).date()

        end_date = data.get("end_date")
        if isinstance(end_date, str):
            end_date = datetime.fromisoformat(end_date).date()

        return cls(
            id=recurring_id,
            account_id=account_id,
            name=data.get("name", ""),
            amount=amount,
            category_id=category_id,
            frequency=frequency,
            day_of_month=data.get("day_of_month", 1),
            start_date=start_date,
            end_date=end_date,
            is_variable=data.get("is_variable", False),
            variance_percent=data.get("variance_percent", 0.0),
        )
