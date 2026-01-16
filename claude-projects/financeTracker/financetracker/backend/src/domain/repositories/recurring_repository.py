"""
Port: RecurringRepository

Abstract interface for RecurringTransaction persistence.

This is a port in the hexagonal architecture - it defines
the contract that any persistence adapter must fulfill.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional, List
from uuid import UUID
from datetime import date

from src.domain.entities.recurring_transaction import RecurringTransaction


class RecurringRepository(ABC):
    """
    Port pour la persistance des transactions récurrentes.

    Any implementation must provide these methods.
    """

    @abstractmethod
    def save(self, recurring_transaction: RecurringTransaction) -> None:
        """
        Persiste une transaction récurrente.

        Args:
            recurring_transaction: RecurringTransaction entity to persist
        """
        ...

    @abstractmethod
    def delete(self, recurring_id: UUID) -> None:
        """
        Supprime une transaction récurrente.

        Args:
            recurring_id: UUID of recurring transaction to delete
        """
        ...

    @abstractmethod
    def get_by_id(self, recurring_id: UUID) -> Optional[RecurringTransaction]:
        """
        Récupère une transaction récurrente par son ID.

        Args:
            recurring_id: UUID of recurring transaction

        Returns:
            RecurringTransaction entity or None
        """
        ...

    @abstractmethod
    def find_by_account(self, account_id: UUID) -> List[RecurringTransaction]:
        """
        Récupère toutes les transactions récurrentes d'un compte.

        Args:
            account_id: UUID of account

        Returns:
            List of RecurringTransaction entities
        """
        ...

    @abstractmethod
    def find_active(self, on_date: Optional[date] = None) -> List[RecurringTransaction]:
        """
        Récupère toutes les transactions récurrentes actives.

        Une transaction est active si:
        - on_date >= start_date (ou today() si on_date est None)
        - on_date <= end_date (ou pas de fin)

        Args:
            on_date: Date de vérification (défaut: aujourd'hui)

        Returns:
            List of active RecurringTransaction entities
        """
        ...

    @abstractmethod
    def find_all(self) -> List[RecurringTransaction]:
        """
        Récupère toutes les transactions récurrentes.

        Returns:
            List of all RecurringTransaction entities
        """
        ...
