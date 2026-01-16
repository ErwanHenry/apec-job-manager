"""
Port: AccountRepository

Abstract interface for Account persistence.

This is a port in the hexagonal architecture - it defines
the contract that any persistence adapter must fulfill.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional, List
from uuid import UUID

from src.domain.entities.account import Account


class AccountRepository(ABC):
    """
    Port pour la persistance des comptes bancaires.

    Any implementation must provide these methods.
    """

    @abstractmethod
    def save(self, account: Account) -> None:
        """
        Persiste un compte unique.

        Args:
            account: Account entity to persist
        """
        ...

    @abstractmethod
    def delete(self, account_id: UUID) -> None:
        """
        Supprime un compte.

        Args:
            account_id: UUID of account to delete
        """
        ...

    @abstractmethod
    def get_by_id(self, account_id: UUID) -> Optional[Account]:
        """
        Récupère un compte par son ID.

        Args:
            account_id: UUID of account

        Returns:
            Account entity or None
        """
        ...

    @abstractmethod
    def find_by_name(self, name: str) -> Optional[Account]:
        """
        Récupère un compte par son nom.

        Args:
            name: Account name

        Returns:
            Account entity or None
        """
        ...

    @abstractmethod
    def find_by_bank(self, bank: str) -> List[Account]:
        """
        Récupère tous les comptes d'une banque.

        Args:
            bank: Bank name

        Returns:
            List of Account entities
        """
        ...

    @abstractmethod
    def find_active(self) -> List[Account]:
        """
        Récupère tous les comptes actifs.

        Returns:
            List of active Account entities
        """
        ...

    @abstractmethod
    def find_all(self) -> List[Account]:
        """
        Récupère tous les comptes.

        Returns:
            List of all Account entities
        """
        ...
