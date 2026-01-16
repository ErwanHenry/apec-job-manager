"""
Domain Value Objects

Immuables et hashables, encapsulent la logique métier des concepts élémentaires.
"""
from src.domain.value_objects.money import Money
from src.domain.value_objects.date_range import DateRange

__all__ = [
    "Money",
    "DateRange",
]
