"""
SQLite Transaction Repository Implementation

Implement the TransactionRepository port using SQLAlchemy and SQLite.

Architecture:
- Implements domain.repositories.TransactionRepository port
- Mappers between domain entities and SQLAlchemy models
- Proper transaction handling and error management
"""
from __future__ import annotations

from typing import Optional, List
from decimal import Decimal
from uuid import UUID
from datetime import date

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
import logging

from src.domain.entities.transaction import Transaction
from src.domain.repositories.transaction_repository import TransactionRepository
from src.domain.value_objects.date_range import DateRange
from src.domain.value_objects.money import Money
from src.infrastructure.persistence.models import TransactionModel

logger = logging.getLogger(__name__)


class SQLiteTransactionRepository(TransactionRepository):
    """
    Implémentation SQLite du port TransactionRepository.

    Gère la persistance des transactions via SQLAlchemy ORM.
    """

    def __init__(self, session: Session):
        """
        Initialize repository with database session.

        Args:
            session: SQLAlchemy Session
        """
        self._session = session

    # === Écriture ===

    def save(self, transaction: Transaction) -> None:
        """
        Persiste une transaction unique.

        Args:
            transaction: Transaction entity from domain

        Raises:
            IntegrityError: Si import_hash est déjà en base
        """
        try:
            model = self._to_model(transaction)
            self._session.merge(model)
            self._session.flush()
            logger.debug(f"Transaction saved: {transaction.id}")
        except IntegrityError as e:
            self._session.rollback()
            if "import_hash" in str(e):
                logger.warning(f"Duplicate transaction import_hash: {transaction.import_hash}")
                raise ValueError(f"Transaction already exists: {transaction.import_hash}") from e
            raise
        except SQLAlchemyError as e:
            self._session.rollback()
            logger.error(f"Error saving transaction: {e}")
            raise

    def save_many(self, transactions: List[Transaction]) -> int:
        """
        Persiste plusieurs transactions en une seule transaction DB.

        Atomique: tout ou rien.

        Args:
            transactions: List of Transaction entities

        Returns:
            Nombre de transactions sauvegardées

        Raises:
            IntegrityError: Si l'un des import_hash existe déjà
        """
        if not transactions:
            return 0

        try:
            count = 0
            for transaction in transactions:
                model = self._to_model(transaction)
                self._session.merge(model)
                count += 1

            self._session.flush()
            logger.debug(f"{count} transactions saved")
            return count
        except IntegrityError as e:
            self._session.rollback()
            logger.error(f"Duplicate transaction detected: {e}")
            raise ValueError(f"Duplicate transaction detected") from e
        except SQLAlchemyError as e:
            self._session.rollback()
            logger.error(f"Error saving transactions: {e}")
            raise

    def delete(self, transaction_id: UUID) -> bool:
        """
        Supprime une transaction.

        Args:
            transaction_id: UUID de la transaction

        Returns:
            True si supprimée, False si non trouvée
        """
        try:
            model = self._session.query(TransactionModel).filter_by(
                id=str(transaction_id)
            ).first()

            if model:
                self._session.delete(model)
                self._session.flush()
                logger.debug(f"Transaction deleted: {transaction_id}")
                return True

            return False
        except SQLAlchemyError as e:
            self._session.rollback()
            logger.error(f"Error deleting transaction: {e}")
            raise

    def delete_by_account(self, account_id: UUID) -> int:
        """
        Supprime toutes les transactions d'un compte.

        Args:
            account_id: UUID du compte

        Returns:
            Nombre de transactions supprimées
        """
        try:
            count = self._session.query(TransactionModel).filter(
                TransactionModel.account_id == str(account_id)
            ).delete()

            self._session.flush()
            logger.debug(f"Deleted {count} transactions for account {account_id}")
            return count
        except SQLAlchemyError as e:
            self._session.rollback()
            logger.error(f"Error deleting transactions by account: {e}")
            raise

    # === Lecture ===

    def get_by_id(self, transaction_id: UUID) -> Optional[Transaction]:
        """
        Récupère une transaction par son ID.

        Args:
            transaction_id: UUID de la transaction

        Returns:
            Transaction entity or None
        """
        try:
            model = self._session.query(TransactionModel).filter_by(
                id=str(transaction_id)
            ).first()

            return self._to_entity(model) if model else None
        except SQLAlchemyError as e:
            logger.error(f"Error getting transaction: {e}")
            raise

    def find_by_date_range(self, date_range: DateRange, account_id: Optional[UUID] = None) -> List[Transaction]:
        """
        Récupère les transactions dans une plage de dates.

        Args:
            date_range: DateRange object
            account_id: Optional filter by account

        Returns:
            List of Transaction entities
        """
        try:
            query = self._session.query(TransactionModel).filter(
                TransactionModel.date >= date_range.start,
                TransactionModel.date <= date_range.end,
            )

            if account_id:
                query = query.filter(TransactionModel.account_id == str(account_id))

            models = query.order_by(TransactionModel.date.asc()).all()
            return [self._to_entity(m) for m in models]
        except SQLAlchemyError as e:
            logger.error(f"Error finding transactions by date range: {e}")
            raise

    def find_by_category(self, category_id: UUID, date_range: Optional[DateRange] = None) -> List[Transaction]:
        """
        Récupère toutes les transactions d'une catégorie.

        Args:
            category_id: UUID de la catégorie
            date_range: Optional date filter

        Returns:
            List of Transaction entities
        """
        try:
            query = self._session.query(TransactionModel).filter(
                TransactionModel.category_id == str(category_id)
            )

            if date_range:
                query = query.filter(
                    TransactionModel.date >= date_range.start,
                    TransactionModel.date <= date_range.end,
                )

            models = query.order_by(TransactionModel.date.desc()).all()
            return [self._to_entity(m) for m in models]
        except SQLAlchemyError as e:
            logger.error(f"Error finding transactions by category: {e}")
            raise

    def find_uncategorized(self, account_id: Optional[UUID] = None, limit: int = 50) -> List[Transaction]:
        """
        Récupère les transactions non catégorisées.

        Args:
            account_id: Optional filter by account
            limit: Nombre max de résultats

        Returns:
            List of uncategorized Transaction entities
        """
        try:
            query = self._session.query(TransactionModel).filter(
                TransactionModel.category_id == None
            )

            if account_id:
                query = query.filter(TransactionModel.account_id == str(account_id))

            models = query.order_by(
                TransactionModel.date.desc()
            ).limit(limit).all()

            return [self._to_entity(m) for m in models]
        except SQLAlchemyError as e:
            logger.error(f"Error finding uncategorized transactions: {e}")
            raise

    def find_by_account(
        self,
        account_id: UUID,
        date_range: Optional[DateRange] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Transaction]:
        """
        Récupère les transactions d'un compte.

        Args:
            account_id: UUID du compte
            date_range: Optional date filter
            limit: Pagination limit (default 100)
            offset: Pagination offset (default 0)

        Returns:
            List of Transaction entities
        """
        try:
            query = self._session.query(TransactionModel).filter(
                TransactionModel.account_id == str(account_id)
            )

            if date_range:
                query = query.filter(
                    TransactionModel.date >= date_range.start,
                    TransactionModel.date <= date_range.end,
                )

            models = query.order_by(
                TransactionModel.date.desc()
            ).limit(limit).offset(offset).all()

            return [self._to_entity(m) for m in models]
        except SQLAlchemyError as e:
            logger.error(f"Error finding transactions by account: {e}")
            raise

    def exists_by_hash(self, import_hash: str) -> bool:
        """
        Vérifie si une transaction existe déjà (par import_hash).

        Utilisé pour la déduplication à l'import.

        Args:
            import_hash: SHA256 hash of (date|amount|description)

        Returns:
            True si la transaction existe
        """
        try:
            exists = self._session.query(
                self._session.query(TransactionModel).filter_by(
                    import_hash=import_hash
                ).exists()
            ).scalar()
            return exists
        except SQLAlchemyError as e:
            logger.error(f"Error checking transaction hash: {e}")
            raise

    # === Statistiques ===

    def count_by_account(self, account_id: UUID) -> int:
        """
        Compte le nombre de transactions d'un compte.

        Args:
            account_id: UUID du compte

        Returns:
            Number of transactions
        """
        try:
            count = self._session.query(TransactionModel).filter(
                TransactionModel.account_id == str(account_id)
            ).count()
            return count
        except SQLAlchemyError as e:
            logger.error(f"Error counting transactions: {e}")
            raise

    def get_balance_at_date(self, account_id: UUID, check_date: date) -> Money:
        """
        Calcule le solde au 31 décembre d'une année.

        Args:
            account_id: UUID du compte
            check_date: Date de calcul

        Returns:
            Money object representing balance
        """
        try:
            result = self._session.query(
                TransactionModel.currency,
                Decimal(0)  # Placeholder, see calculation below
            ).filter(
                TransactionModel.account_id == str(account_id),
                TransactionModel.date <= check_date,
            ).first()

            if not result:
                return Money.zero()

            # Calcul du solde
            from sqlalchemy import func
            balance_result = self._session.query(
                func.sum(TransactionModel.amount)
            ).filter(
                TransactionModel.account_id == str(account_id),
                TransactionModel.date <= check_date,
            ).scalar()

            amount = Decimal(str(balance_result or 0))
            currency = result[0] if result else "EUR"

            return Money(amount, currency)
        except SQLAlchemyError as e:
            logger.error(f"Error calculating balance: {e}")
            raise

    # === Mappers (Domain ↔ Model) ===

    def _to_model(self, entity: Transaction) -> TransactionModel:
        """
        Convertit une entité de domaine en modèle SQLAlchemy.

        Args:
            entity: Transaction entity from domain

        Returns:
            TransactionModel instance
        """
        return TransactionModel(
            id=str(entity.id),
            account_id=str(entity.account_id),
            date=entity.date,
            value_date=entity.value_date,
            amount=entity.amount.amount,
            currency=entity.amount.currency,
            description=entity.description,
            category_id=str(entity.category_id) if entity.category_id else None,
            category_confidence=entity.category_confidence,
            is_recurring=entity.is_recurring,
            recurring_id=str(entity.recurring_id) if entity.recurring_id else None,
            tags=entity.tags,
            notes=entity.notes,
            import_hash=entity.import_hash,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    def _to_entity(self, model: TransactionModel) -> Transaction:
        """
        Convertit un modèle SQLAlchemy en entité de domaine.

        Args:
            model: TransactionModel instance

        Returns:
            Transaction entity
        """
        from uuid import UUID

        return Transaction(
            id=UUID(model.id),
            account_id=UUID(model.account_id),
            date=model.date,
            value_date=model.value_date,
            amount=Money(model.amount, model.currency),
            description=model.description,
            category_id=UUID(model.category_id) if model.category_id else None,
            category_confidence=model.category_confidence,
            is_recurring=model.is_recurring,
            recurring_id=UUID(model.recurring_id) if model.recurring_id else None,
            tags=model.tags or [],
            notes=model.notes,
            import_hash=model.import_hash,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
