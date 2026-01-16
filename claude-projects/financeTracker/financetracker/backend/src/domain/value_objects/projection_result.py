"""
Value Object: ProjectionResult

Résultat complet d'une projection de solde avec statistiques.

Contient:
- projection_points: Liste des points de projection
- starting_balance: Solde initial
- ending_balance: Solde final après projection
- min_balance: Solde minimum atteint
- max_balance: Solde maximum atteint
- average_balance: Solde moyen sur la période
- scenario: Type de scénario utilisé
"""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from src.domain.value_objects.money import Money
from src.domain.value_objects.projection_point import ProjectionPoint
from src.domain.value_objects.scenario import Scenario


@dataclass(frozen=True)
class ProjectionResult:
    """
    Résultat complet d'une projection de balance.

    Contient tous les points de projection et les statistiques agrégées.

    Examples:
        >>> result = ProjectionResult(
        ...     projection_points=[point1, point2, point3],
        ...     starting_balance=Money(Decimal("1000.00")),
        ...     scenario=Scenario.REALISTIC
        ... )
        >>> result.ending_balance
        Money(...)
        >>> result.is_critical()  # Si min_balance est négatif
        True
    """

    projection_points: list[ProjectionPoint]
    starting_balance: Money
    scenario: Scenario

    def __post_init__(self):
        """Valide et calcule les statistiques."""
        if not self.projection_points:
            raise ValueError("projection_points cannot be empty")

    @property
    def ending_balance(self) -> Money:
        """Retourne le solde final (dernier point)."""
        if self.projection_points:
            return self.projection_points[-1].balance
        return self.starting_balance

    @property
    def min_balance(self) -> Money:
        """Retourne le solde minimum atteint."""
        if not self.projection_points:
            return self.starting_balance

        min_amount = min(p.balance.amount for p in self.projection_points)
        return Money(min_amount)

    @property
    def max_balance(self) -> Money:
        """Retourne le solde maximum atteint."""
        if not self.projection_points:
            return self.starting_balance

        max_amount = max(p.balance.amount for p in self.projection_points)
        return Money(max_amount)

    @property
    def average_balance(self) -> Money:
        """Retourne le solde moyen sur la période."""
        if not self.projection_points:
            return self.starting_balance

        total = sum(p.balance.amount for p in self.projection_points)
        average = total / len(self.projection_points)
        return Money(average)

    @property
    def total_change(self) -> Money:
        """Retourne le changement total (ending - starting)."""
        change = self.ending_balance.amount - self.starting_balance.amount
        return Money(change)

    # === Prédicats ===

    def is_critical(self) -> bool:
        """
        Retourne True si la projection indique une situation critique.

        Une situation est critique si le solde minimum est négatif.
        """
        return self.min_balance.is_negative()

    def is_warning(self) -> bool:
        """
        Retourne True si la projection indique une situation d'alerte.

        Une alerte est levée si le solde minimum est positif mais faible
        (moins de 500€).
        """
        return (
            self.min_balance.is_positive()
            and self.min_balance.amount < Decimal("500.00")
        )

    def is_healthy(self) -> bool:
        """
        Retourne True si la projection indique une situation saine.

        Situation saine = solde minimum > 500€.
        """
        return self.min_balance.amount >= Decimal("500.00")

    def is_improving(self) -> bool:
        """Retourne True si le solde s'améliore (ending > starting)."""
        return self.ending_balance.amount > self.starting_balance.amount

    def is_deteriorating(self) -> bool:
        """Retourne True si le solde se détériore (ending < starting)."""
        return self.ending_balance.amount < self.starting_balance.amount

    # === Statistiques ===

    def num_days(self) -> int:
        """Retourne le nombre de jours projetés."""
        return len(self.projection_points)

    def num_negative_days(self) -> int:
        """Retourne le nombre de jours avec solde négatif."""
        return sum(1 for p in self.projection_points if p.is_negative_balance())

    def percentage_negative_days(self) -> float:
        """Retourne le pourcentage de jours avec solde négatif."""
        if not self.projection_points:
            return 0.0
        return (self.num_negative_days() / len(self.projection_points)) * 100

    # === Représentation ===

    def __repr__(self) -> str:
        """Représentation technique."""
        return (
            f"ProjectionResult(scenario={self.scenario!r}, "
            f"starting={self.starting_balance.amount}, "
            f"ending={self.ending_balance.amount}, "
            f"min={self.min_balance.amount}, points={len(self.projection_points)})"
        )

    def __str__(self) -> str:
        """Format lisible."""
        status = "CRITICAL" if self.is_critical() else "WARNING" if self.is_warning() else "HEALTHY"
        trend = "↑" if self.is_improving() else "↓" if self.is_deteriorating() else "→"
        return (
            f"Projection ({self.scenario.value}): "
            f"{self.starting_balance.amount} → {self.ending_balance.amount} {trend} "
            f"[{self.min_balance.amount}...{self.max_balance.amount}] {status}"
        )

    # === Exportation ===

    def to_dict(self) -> dict:
        """Convertit en dictionnaire pour sérialisation."""
        return {
            "scenario": self.scenario.value,
            "starting_balance": str(self.starting_balance.amount),
            "ending_balance": str(self.ending_balance.amount),
            "min_balance": str(self.min_balance.amount),
            "max_balance": str(self.max_balance.amount),
            "average_balance": str(self.average_balance.amount),
            "total_change": str(self.total_change.amount),
            "is_critical": self.is_critical(),
            "is_warning": self.is_warning(),
            "is_healthy": self.is_healthy(),
            "is_improving": self.is_improving(),
            "num_days": self.num_days(),
            "num_negative_days": self.num_negative_days(),
            "percentage_negative_days": round(self.percentage_negative_days(), 2),
            "projection_points": [
                {
                    "date": str(p.date),
                    "balance": str(p.balance.amount),
                    "net_change": str(p.net_change.amount),
                }
                for p in self.projection_points
            ],
        }
