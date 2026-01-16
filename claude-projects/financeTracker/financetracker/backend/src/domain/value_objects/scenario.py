"""
Value Object: Scenario

Énumération des scénarios de projection.

Types de scénarios:
- Pessimistic: Excluded recurring income, added variance to expenses
- Realistic: Average amounts based on historical data
- Optimistic: Included all income, reduced variable expenses
"""
from __future__ import annotations

from enum import Enum


class Scenario(str, Enum):
    """
    Énumération des scénarios de projection.

    Examples:
        >>> scenario = Scenario.REALISTIC
        >>> scenario == Scenario.REALISTIC
        True
        >>> Scenario.PESSIMISTIC.value
        'pessimistic'
    """

    PESSIMISTIC = "pessimistic"
    REALISTIC = "realistic"
    OPTIMISTIC = "optimistic"

    def is_pessimistic(self) -> bool:
        """Retourne True si c'est le scénario pessimiste."""
        return self == Scenario.PESSIMISTIC

    def is_realistic(self) -> bool:
        """Retourne True si c'est le scénario réaliste."""
        return self == Scenario.REALISTIC

    def is_optimistic(self) -> bool:
        """Retourne True si c'est le scénario optimiste."""
        return self == Scenario.OPTIMISTIC
