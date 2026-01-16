"""
Query: GetProjection

Represent a user request to get a balance projection.

This is part of the application layer (use case orchestration).
Queries represent read operations and are processed by handlers.
"""
from __future__ import annotations

from dataclasses import dataclass
from src.domain.value_objects.scenario import Scenario


@dataclass
class GetProjectionQuery:
    """
    Requête pour obtenir une projection de solde.

    Cas d'usage: Utilisateur demande la projection du solde pour
    les 6 prochains mois avec un scénario donné.

    Args:
        months: Nombre de mois à projeter (1-12)
        scenario: Scénario de projection

    Examples:
        >>> query = GetProjectionQuery(
        ...     months=6,
        ...     scenario=Scenario.REALISTIC
        ... )
        >>> # result = handler.handle(query)  # Traité par ProjectionHandler
    """

    months: int = 6
    scenario: Scenario = Scenario.REALISTIC

    def __post_init__(self):
        """Valide la requête."""
        if not 1 <= self.months <= 12:
            raise ValueError("months must be between 1 and 12")
        if not isinstance(self.scenario, Scenario):
            raise ValueError("scenario must be a Scenario enum")

    def __repr__(self) -> str:
        """Représentation technique."""
        return f"GetProjectionQuery(months={self.months}, scenario={self.scenario.value})"
