"""
Value Object: ProjectionPoint

Représente un point de données dans une projection de solde.

Chaque point contient:
- date: Date de projection
- balance: Solde calculé à cette date
- net_change: Changement net depuis le jour précédent
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from src.domain.value_objects.money import Money


@dataclass(frozen=True)
class ProjectionPoint:
    """
    Représente un point de données dans une projection.

    Invariants:
    - date est une date valide
    - balance est une valeur monétaire
    - net_change peut être positif ou négatif

    Examples:
        >>> point = ProjectionPoint(
        ...     date=date(2025, 2, 1),
        ...     balance=Money(Decimal("1234.56")),
        ...     net_change=Money(Decimal("50.00"))
        ... )
        >>> point.date
        datetime.date(2025, 2, 1)
        >>> point.balance.amount
        Decimal('1234.56')
    """

    date: date
    balance: Money
    net_change: Money

    def is_positive_balance(self) -> bool:
        """Retourne True si le solde est positif."""
        return self.balance.is_positive()

    def is_negative_balance(self) -> bool:
        """Retourne True si le solde est négatif."""
        return self.balance.is_negative()

    def __repr__(self) -> str:
        """Représentation technique."""
        return (
            f"ProjectionPoint(date={self.date!r}, balance={self.balance.amount}, "
            f"change={self.net_change.amount})"
        )

    def __str__(self) -> str:
        """Format lisible."""
        change_str = f"+{self.net_change.amount}" if self.net_change.is_positive() else f"{self.net_change.amount}"
        return f"{self.date}: {self.balance.amount} ({change_str})"
