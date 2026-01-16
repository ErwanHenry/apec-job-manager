"""
SQLite Account Repository Implementation

Implement the AccountRepository port using SQLAlchemy and SQLite.
"""
from __future__ import annotations

from typing import Optional, List
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import logging

from src.domain.entities.account import Account, AccountType
from src.domain.repositories.account_repository import AccountRepository
from src.domain.value_objects.money import Money
from src.infrastructure.persistence.models import AccountModel

logger = logging.getLogger(__name__)


class SQLiteAccountRepository(AccountRepository):
    """Implémentation SQLite du port AccountRepository."""

    def __init__(self, session: Session):
        """
        Initialize repository with database session.

        Args:
            session: SQLAlchemy Session
        """
        self._session = session

    # === Écriture ===

    def save(self, account: Account) -> None:
        """Persiste un compte."""
        try:
            model = self._to_model(account)
            self._session.merge(model)
            self._session.flush()
            logger.debug(f"Account saved: {account.id}")
        except SQLAlchemyError as e:
            self._session.rollback()
            logger.error(f"Error saving account: {e}")
            raise

    def delete(self, account_id: UUID) -> None:
        """Supprime un compte."""
        try:
            model = self._session.query(AccountModel).filter_by(
                id=str(account_id)
            ).first()

            if model:
                self._session.delete(model)
                self._session.flush()
                logger.debug(f"Account deleted: {account_id}")
        except SQLAlchemyError as e:
            self._session.rollback()
            logger.error(f"Error deleting account: {e}")
            raise

    # === Lecture ===

    def get_by_id(self, account_id: UUID) -> Optional[Account]:
        """Récupère un compte par son ID."""
        try:
            model = self._session.query(AccountModel).filter_by(
                id=str(account_id)
            ).first()

            return self._to_entity(model) if model else None
        except SQLAlchemyError as e:
            logger.error(f"Error getting account: {e}")
            raise

    def find_by_name(self, name: str) -> Optional[Account]:
        """Récupère un compte par son nom."""
        try:
            model = self._session.query(AccountModel).filter_by(
                name=name
            ).first()

            return self._to_entity(model) if model else None
        except SQLAlchemyError as e:
            logger.error(f"Error finding account by name: {e}")
            raise

    def find_by_bank(self, bank: str) -> List[Account]:
        """Récupère tous les comptes d'une banque."""
        try:
            models = self._session.query(AccountModel).filter_by(
                bank=bank
            ).order_by(AccountModel.name).all()

            return [self._to_entity(m) for m in models]
        except SQLAlchemyError as e:
            logger.error(f"Error finding accounts by bank: {e}")
            raise

    def find_active(self) -> List[Account]:
        """Récupère tous les comptes actifs."""
        try:
            models = self._session.query(AccountModel).filter_by(
                is_active=True
            ).order_by(AccountModel.name).all()

            return [self._to_entity(m) for m in models]
        except SQLAlchemyError as e:
            logger.error(f"Error finding active accounts: {e}")
            raise

    def find_all(self) -> List[Account]:
        """Récupère tous les comptes."""
        try:
            models = self._session.query(AccountModel).order_by(
                AccountModel.name
            ).all()

            return [self._to_entity(m) for m in models]
        except SQLAlchemyError as e:
            logger.error(f"Error finding all accounts: {e}")
            raise

    # === Mappers ===

    def _to_model(self, entity: Account) -> AccountModel:
        """Convertit une entité de domaine en modèle SQLAlchemy."""
        return AccountModel(
            id=str(entity.id),
            name=entity.name,
            bank=entity.bank,
            account_type=entity.account_type.value,
            initial_balance=entity.initial_balance.amount,
            currency=entity.initial_balance.currency,
            is_active=entity.is_active,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    def _to_entity(self, model: AccountModel) -> Account:
        """Convertit un modèle SQLAlchemy en entité de domaine."""
        from uuid import UUID

        return Account(
            id=UUID(model.id),
            name=model.name,
            bank=model.bank,
            account_type=AccountType(model.account_type),
            initial_balance=Money(model.initial_balance, model.currency),
            currency=model.currency,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
