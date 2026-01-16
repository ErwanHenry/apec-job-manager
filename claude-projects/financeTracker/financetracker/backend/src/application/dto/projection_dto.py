"""
DTO: ProjectionDTO

Data Transfer Objects for projection results.

Used to return projection data to the user/API.
"""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal


@dataclass
class ProjectionPointDTO:
    """
    Un point de données dans une projection.

    Attributes:
        date: Date de projection (ISO format)
        balance: Solde à cette date
        net_change: Changement net depuis le jour précédent
    """

    date: str
    balance: str
    net_change: str

    def to_dict(self) -> dict:
        """Convertit en dictionnaire."""
        return {
            "date": self.date,
            "balance": self.balance,
            "net_change": self.net_change,
        }


@dataclass
class ProjectionDTO:
    """
    Résultat complet d'une projection.

    Contains all projection data and statistics.

    Attributes:
        scenario: Type de scénario (pessimistic, realistic, optimistic)
        starting_balance: Solde initial
        ending_balance: Solde final
        min_balance: Solde minimum
        max_balance: Solde maximum
        average_balance: Solde moyen
        total_change: Changement total
        is_critical: True si situation critique
        is_warning: True si alerte
        is_healthy: True si situation saine
        is_improving: True si amélioration
        num_days: Nombre de jours projetés
        num_negative_days: Nombre de jours avec solde négatif
        percentage_negative_days: Pourcentage de jours négatifs
        projection_points: Liste des points de projection
    """

    scenario: str
    starting_balance: str
    ending_balance: str
    min_balance: str
    max_balance: str
    average_balance: str
    total_change: str
    is_critical: bool
    is_warning: bool
    is_healthy: bool
    is_improving: bool
    num_days: int
    num_negative_days: int
    percentage_negative_days: float
    projection_points: list[ProjectionPointDTO]

    def to_dict(self) -> dict:
        """Convertit en dictionnaire pour sérialisation JSON."""
        return {
            "scenario": self.scenario,
            "starting_balance": self.starting_balance,
            "ending_balance": self.ending_balance,
            "min_balance": self.min_balance,
            "max_balance": self.max_balance,
            "average_balance": self.average_balance,
            "total_change": self.total_change,
            "is_critical": self.is_critical,
            "is_warning": self.is_warning,
            "is_healthy": self.is_healthy,
            "is_improving": self.is_improving,
            "num_days": self.num_days,
            "num_negative_days": self.num_negative_days,
            "percentage_negative_days": self.percentage_negative_days,
            "projection_points": [p.to_dict() for p in self.projection_points],
        }

    @staticmethod
    def from_projection_result(result) -> ProjectionDTO:
        """
        Crée un DTO depuis un ProjectionResult domain object.

        Args:
            result: ProjectionResult entity

        Returns:
            ProjectionDTO prêt pour sérialisation
        """
        return ProjectionDTO(
            scenario=result.scenario.value,
            starting_balance=str(result.starting_balance.amount),
            ending_balance=str(result.ending_balance.amount),
            min_balance=str(result.min_balance.amount),
            max_balance=str(result.max_balance.amount),
            average_balance=str(result.average_balance.amount),
            total_change=str(result.total_change.amount),
            is_critical=result.is_critical(),
            is_warning=result.is_warning(),
            is_healthy=result.is_healthy(),
            is_improving=result.is_improving(),
            num_days=result.num_days(),
            num_negative_days=result.num_negative_days(),
            percentage_negative_days=result.percentage_negative_days(),
            projection_points=[
                ProjectionPointDTO(
                    date=str(p.date),
                    balance=str(p.balance.amount),
                    net_change=str(p.net_change.amount),
                )
                for p in result.projection_points
            ],
        )

    def __str__(self) -> str:
        """Format lisible."""
        return (
            f"Projection ({self.scenario}): "
            f"{self.starting_balance} → {self.ending_balance} "
            f"[{self.min_balance}...{self.max_balance}]"
        )
