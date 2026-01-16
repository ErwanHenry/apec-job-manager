"""
SQLite Category Repository Implementation

Implement the CategoryRepository port using SQLAlchemy and SQLite.
"""
from __future__ import annotations

from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import logging

from src.domain.entities.category import Category, CategoryType
from src.domain.repositories.category_repository import CategoryRepository
from src.infrastructure.persistence.models import CategoryModel

logger = logging.getLogger(__name__)


class SQLiteCategoryRepository(CategoryRepository):
    """Implémentation SQLite du port CategoryRepository."""

    def __init__(self, session: Session):
        """
        Initialize repository with database session.

        Args:
            session: SQLAlchemy Session
        """
        self._session = session

    # === Écriture ===

    def save(self, category: Category) -> None:
        """Persiste une catégorie."""
        try:
            model = self._to_model(category)
            self._session.merge(model)
            self._session.flush()
            logger.debug(f"Category saved: {category.id}")
        except SQLAlchemyError as e:
            self._session.rollback()
            logger.error(f"Error saving category: {e}")
            raise

    def delete(self, category_id: UUID) -> None:
        """Supprime une catégorie."""
        try:
            model = self._session.query(CategoryModel).filter_by(
                id=str(category_id)
            ).first()

            if model:
                self._session.delete(model)
                self._session.flush()
                logger.debug(f"Category deleted: {category_id}")
        except SQLAlchemyError as e:
            self._session.rollback()
            logger.error(f"Error deleting category: {e}")
            raise

    # === Lecture ===

    def get_by_id(self, category_id: UUID) -> Optional[Category]:
        """Récupère une catégorie par son ID."""
        try:
            model = self._session.query(CategoryModel).filter_by(
                id=str(category_id)
            ).first()

            return self._to_entity(model) if model else None
        except SQLAlchemyError as e:
            logger.error(f"Error getting category: {e}")
            raise

    def find_by_name(self, name: str) -> Optional[Category]:
        """Récupère une catégorie par son nom."""
        try:
            model = self._session.query(CategoryModel).filter_by(
                name=name
            ).first()

            return self._to_entity(model) if model else None
        except SQLAlchemyError as e:
            logger.error(f"Error finding category by name: {e}")
            raise

    def find_by_type(self, category_type: CategoryType) -> List[Category]:
        """Récupère toutes les catégories d'un type."""
        try:
            models = self._session.query(CategoryModel).filter_by(
                category_type=category_type.value
            ).order_by(CategoryModel.name).all()

            return [self._to_entity(m) for m in models]
        except SQLAlchemyError as e:
            logger.error(f"Error finding categories by type: {e}")
            raise

    def find_roots(self) -> List[Category]:
        """Récupère toutes les catégories racines (sans parent)."""
        try:
            models = self._session.query(CategoryModel).filter_by(
                parent_id=None
            ).order_by(CategoryModel.name).all()

            return [self._to_entity(m) for m in models]
        except SQLAlchemyError as e:
            logger.error(f"Error finding root categories: {e}")
            raise

    def find_children(self, parent_id: UUID) -> List[Category]:
        """Récupère les enfants directs d'une catégorie."""
        try:
            models = self._session.query(CategoryModel).filter_by(
                parent_id=str(parent_id)
            ).order_by(CategoryModel.name).all()

            return [self._to_entity(m) for m in models]
        except SQLAlchemyError as e:
            logger.error(f"Error finding child categories: {e}")
            raise

    def find_by_keyword(self, keyword: str) -> List[Category]:
        """
        Récupère les catégories contenant un mot-clé.

        Recherche dans le JSON keywords.
        """
        try:
            # SQLite ne supporte pas bien la recherche JSON
            # On charge toutes les catégories et on filtre en mémoire
            models = self._session.query(CategoryModel).all()

            results = []
            for model in models:
                entity = self._to_entity(model)
                if entity.matches_keyword(keyword):
                    results.append(entity)

            return results
        except SQLAlchemyError as e:
            logger.error(f"Error finding categories by keyword: {e}")
            raise

    def find_all(self) -> List[Category]:
        """Récupère toutes les catégories."""
        try:
            models = self._session.query(CategoryModel).order_by(
                CategoryModel.name
            ).all()

            return [self._to_entity(m) for m in models]
        except SQLAlchemyError as e:
            logger.error(f"Error finding all categories: {e}")
            raise

    # === Mappers ===

    def _to_model(self, entity: Category) -> CategoryModel:
        """Convertit une entité de domaine en modèle SQLAlchemy."""
        return CategoryModel(
            id=str(entity.id),
            name=entity.name,
            category_type=entity.category_type.value,
            parent_id=str(entity.parent_id) if entity.parent_id else None,
            icon=entity.icon,
            color=entity.color,
            keywords=entity.keywords,
            budget_default=entity.budget_default,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    def _to_entity(self, model: CategoryModel) -> Category:
        """Convertit un modèle SQLAlchemy en entité de domaine."""
        from uuid import UUID

        return Category(
            id=UUID(model.id),
            name=model.name,
            category_type=CategoryType(model.category_type),
            parent_id=UUID(model.parent_id) if model.parent_id else None,
            icon=model.icon,
            color=model.color,
            keywords=model.keywords or [],
            budget_default=model.budget_default,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
