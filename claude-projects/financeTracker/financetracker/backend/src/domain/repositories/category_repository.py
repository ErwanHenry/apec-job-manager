"""
Port: CategoryRepository

Abstract interface for Category persistence.

This is a port in the hexagonal architecture - it defines
the contract that any persistence adapter must fulfill.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional, List
from uuid import UUID

from src.domain.entities.category import Category, CategoryType


class CategoryRepository(ABC):
    """
    Port pour la persistance des catégories.

    Any implementation must provide these methods.
    """

    @abstractmethod
    def save(self, category: Category) -> None:
        """
        Persiste une catégorie unique.

        Args:
            category: Category entity to persist
        """
        ...

    @abstractmethod
    def delete(self, category_id: UUID) -> None:
        """
        Supprime une catégorie.

        Args:
            category_id: UUID of category to delete
        """
        ...

    @abstractmethod
    def get_by_id(self, category_id: UUID) -> Optional[Category]:
        """
        Récupère une catégorie par son ID.

        Args:
            category_id: UUID of category

        Returns:
            Category entity or None
        """
        ...

    @abstractmethod
    def find_by_name(self, name: str) -> Optional[Category]:
        """
        Récupère une catégorie par son nom.

        Args:
            name: Category name

        Returns:
            Category entity or None
        """
        ...

    @abstractmethod
    def find_by_type(self, category_type: CategoryType) -> List[Category]:
        """
        Récupère toutes les catégories d'un type.

        Args:
            category_type: CategoryType enum value

        Returns:
            List of Category entities
        """
        ...

    @abstractmethod
    def find_roots(self) -> List[Category]:
        """
        Récupère toutes les catégories racines (sans parent).

        Returns:
            List of root Category entities
        """
        ...

    @abstractmethod
    def find_children(self, parent_id: UUID) -> List[Category]:
        """
        Récupère les enfants directs d'une catégorie.

        Args:
            parent_id: UUID of parent category

        Returns:
            List of child Category entities
        """
        ...

    @abstractmethod
    def find_by_keyword(self, keyword: str) -> List[Category]:
        """
        Récupère les catégories contenant un mot-clé.

        Args:
            keyword: Keyword to search for

        Returns:
            List of matching Category entities
        """
        ...

    @abstractmethod
    def find_all(self) -> List[Category]:
        """
        Récupère toutes les catégories.

        Returns:
            List of all Category entities
        """
        ...
