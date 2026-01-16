"""
Value Object: DateRange

Principes SOLID appliqués:
- SRP: Représente uniquement une plage de dates
- OCP: Extensible via factory methods
- LSP: Peut être substitué partout où DateRange est attendu
- ISP: Interface minimale
- DIP: Aucune dépendance externe (que stdlib)

Caractéristiques:
- Immuable (frozen dataclass)
- Hashable (utilisable dans sets/dicts)
- Itérable (jours, mois)
- Factory methods pour cas courants
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from typing import Iterator


@dataclass(frozen=True)
class DateRange:
    """
    Représente une plage de dates continue.

    Immuable - toutes les opérations retournent de nouvelles instances
    ou des itérateurs.

    Examples:
        >>> dr = DateRange(date(2025, 1, 1), date(2025, 1, 31))
        >>> dr.days()
        31

        >>> dr.contains(date(2025, 1, 15))
        True

        >>> dr2 = DateRange(date(2025, 1, 15), date(2025, 2, 15))
        >>> dr.overlaps(dr2)
        True
    """

    start: date
    end: date

    def __post_init__(self) -> None:
        """Validation de l'invariant: start <= end."""
        if self.start > self.end:
            raise ValueError(
                f"start must be <= end, got: start={self.start}, end={self.end}"
            )

    # === Calculs de durée ===

    def days(self) -> int:
        """
        Retourne le nombre de jours dans la plage (inclusif).

        Examples:
            >>> dr = DateRange(date(2025, 1, 1), date(2025, 1, 31))
            >>> dr.days()
            31
        """
        delta = self.end - self.start
        return delta.days + 1

    def months(self) -> int:
        """
        Retourne le nombre de mois dans la plage (approximatif).

        Calcule: (end_year - start_year) * 12 + (end_month - start_month) + 1

        Examples:
            >>> dr = DateRange(date(2025, 1, 1), date(2025, 12, 31))
            >>> dr.months()
            12
        """
        # Nombre de mois complets + 1 (pour inclure le mois partiel de début)
        months_diff = (self.end.year - self.start.year) * 12 + (self.end.month - self.start.month)
        return months_diff + 1

    # === Contenance ===

    def contains(self, date_to_check: date) -> bool:
        """
        Vérifie si une date est dans la plage (incluse).

        Args:
            date_to_check: Date à vérifier

        Returns:
            True si start <= date_to_check <= end

        Examples:
            >>> dr = DateRange(date(2025, 1, 1), date(2025, 1, 31))
            >>> dr.contains(date(2025, 1, 15))
            True
            >>> dr.contains(date(2025, 2, 1))
            False
        """
        return self.start <= date_to_check <= self.end

    # === Chevauchement ===

    def overlaps(self, other: DateRange) -> bool:
        """
        Vérifie si deux plages se chevauchent (inclusif aux extrémités).

        Args:
            other: Autre DateRange à comparer

        Returns:
            True si les plages partagent au moins un jour

        Examples:
            >>> dr1 = DateRange(date(2025, 1, 1), date(2025, 1, 20))
            >>> dr2 = DateRange(date(2025, 1, 15), date(2025, 1, 31))
            >>> dr1.overlaps(dr2)
            True

            >>> dr3 = DateRange(date(2025, 2, 1), date(2025, 2, 28))
            >>> dr1.overlaps(dr3)
            False
        """
        # Pas de chevauchement si: self.end < other.start OR other.end < self.start
        # Il y a chevauchement sinon
        return not (self.end < other.start or other.end < self.start)

    # === Factory Methods ===

    @classmethod
    def this_month(cls) -> DateRange:
        """
        Crée une plage pour le mois courant.

        Returns:
            DateRange du 1er au dernier jour du mois courant

        Examples:
            >>> dr = DateRange.this_month()  # Pour janvier 2025
            >>> dr.start.month
            1
            >>> dr.start.day
            1
            >>> dr.end.day
            31
        """
        today = date.today()
        first_day = today.replace(day=1)

        # Dernier jour du mois = 1er jour du mois suivant - 1 jour
        next_month = today + relativedelta(months=1)
        first_of_next = next_month.replace(day=1)
        last_day = first_of_next - timedelta(days=1)

        return cls(first_day, last_day)

    @classmethod
    def last_n_months(cls, n: int) -> DateRange:
        """
        Crée une plage pour les N derniers mois (jusqu'à aujourd'hui).

        Args:
            n: Nombre de mois (doit être > 0)

        Returns:
            DateRange du 1er du mois (n-1 mois avant) jusqu'à aujourd'hui

        Raises:
            ValueError: Si n <= 0

        Examples:
            >>> dr = DateRange.last_n_months(3)  # 3 derniers mois
            >>> dr.end == date.today()
            True
        """
        if n <= 0:
            raise ValueError(f"n must be > 0, got: {n}")

        today = date.today()
        start = today - relativedelta(months=n-1)
        start = start.replace(day=1)

        return cls(start, today)

    @classmethod
    def current_year(cls) -> DateRange:
        """
        Crée une plage pour l'année courante.

        Returns:
            DateRange du 1er janvier au 31 décembre de l'année courante

        Examples:
            >>> dr = DateRange.current_year()
            >>> dr.start.month
            1
            >>> dr.end.month
            12
        """
        today = date.today()
        return cls(
            date(today.year, 1, 1),
            date(today.year, 12, 31)
        )

    # === Itération ===

    def iter_days(self) -> Iterator[date]:
        """
        Itère sur tous les jours de la plage (inclusif).

        Yields:
            date: Chaque jour de start à end

        Examples:
            >>> dr = DateRange(date(2025, 1, 29), date(2025, 2, 1))
            >>> list(dr.iter_days())
            [date(2025, 1, 29), date(2025, 1, 30), date(2025, 1, 31), date(2025, 2, 1)]
        """
        current = self.start
        while current <= self.end:
            yield current
            current += timedelta(days=1)

    def iter_months(self) -> Iterator[tuple[int, int]]:
        """
        Itère sur tous les mois de la plage (inclusif).

        Yields:
            tuple[int, int]: (year, month) pour chaque mois

        Examples:
            >>> dr = DateRange(date(2024, 11, 15), date(2025, 2, 15))
            >>> list(dr.iter_months())
            [(2024, 11), (2024, 12), (2025, 1), (2025, 2)]
        """
        current = self.start.replace(day=1)
        end_month = self.end.replace(day=1)

        while current <= end_month:
            yield (current.year, current.month)
            current += relativedelta(months=1)

    # === Représentation ===

    def __str__(self) -> str:
        """Format lisible: '2025-01-01 à 2025-12-31'."""
        return f"{self.start.isoformat()} à {self.end.isoformat()}"

    def __repr__(self) -> str:
        """Représentation technique."""
        return f"DateRange({self.start!r}, {self.end!r})"

    def to_dict(self) -> dict:
        """Sérialisation en dictionnaire."""
        return {
            "start": self.start.isoformat(),
            "end": self.end.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict) -> DateRange:
        """Désérialisation depuis un dictionnaire."""
        from datetime import datetime

        start = data["start"]
        if isinstance(start, str):
            start = datetime.fromisoformat(start).date()

        end = data["end"]
        if isinstance(end, str):
            end = datetime.fromisoformat(end).date()

        return cls(start, end)
