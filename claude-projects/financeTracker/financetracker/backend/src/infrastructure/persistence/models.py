"""
SQLAlchemy ORM Models

Mapping des entités de domaine aux tables SQL.

Architecture:
- Utilise declarative_base pour simplifier
- Héritage optionnel si besoin de table commune
- Indexes explicites pour les requêtes courantes
- Types SQLAlchemy appropriés pour les champs
"""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Date,
    Integer,
    Float,
    Boolean,
    Numeric,
    ForeignKey,
    Index,
    JSON,
    create_engine,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class TransactionModel(Base):
    """
    Modèle SQLAlchemy pour les transactions bancaires.

    Corresponds to domain.entities.Transaction
    """

    __tablename__ = "transactions"

    # === Identité ===
    id = Column(String(36), primary_key=True)
    account_id = Column(String(36), ForeignKey("accounts.id"), nullable=False)

    # === Données principales ===
    date = Column(Date, nullable=False, index=True)
    value_date = Column(Date, nullable=True)
    amount = Column(Numeric(12, 2), nullable=False)  # Montant décimal
    currency = Column(String(3), nullable=False, default="EUR")
    description = Column(String(500), nullable=False)

    # === Catégorisation ===
    category_id = Column(String(36), ForeignKey("categories.id"), nullable=True, index=True)
    category_confidence = Column(Float, nullable=False, default=0.0)

    # === Récurrence ===
    is_recurring = Column(Boolean, nullable=False, default=False)
    recurring_id = Column(String(36), ForeignKey("recurring_transactions.id"), nullable=True)

    # === Métadonnées ===
    tags = Column(JSON, nullable=False, default=[])  # List of strings
    notes = Column(String(1000), nullable=False, default="")
    import_hash = Column(String(64), nullable=False, unique=True, index=True)

    # === Timestamps ===
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

    # === Relationships ===
    account = relationship("AccountModel", back_populates="transactions")
    category = relationship("CategoryModel", back_populates="transactions")
    recurring = relationship("RecurringTransactionModel", back_populates="transactions")

    __table_args__ = (
        Index("idx_transaction_date_account", "date", "account_id"),
        Index("idx_transaction_category", "category_id"),
    )

    def __repr__(self) -> str:
        return f"<TransactionModel({self.id}, {self.date}, {self.amount} {self.currency})>"


class AccountModel(Base):
    """
    Modèle SQLAlchemy pour les comptes bancaires.

    Corresponds to domain.entities.Account
    """

    __tablename__ = "accounts"

    # === Identité ===
    id = Column(String(36), primary_key=True)

    # === Données principales ===
    name = Column(String(255), nullable=False, index=True)
    bank = Column(String(255), nullable=False)
    account_type = Column(String(50), nullable=False)  # checking, savings, investment

    # === Soldes ===
    initial_balance = Column(Numeric(12, 2), nullable=False, default=0)
    currency = Column(String(3), nullable=False, default="EUR")

    # === Statut ===
    is_active = Column(Boolean, nullable=False, default=True)

    # === Timestamps ===
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

    # === Relationships ===
    transactions = relationship(
        "TransactionModel",
        back_populates="account",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    recurring_transactions = relationship(
        "RecurringTransactionModel",
        back_populates="account",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_account_name_bank", "name", "bank"),
    )

    def __repr__(self) -> str:
        return f"<AccountModel({self.id}, {self.name}, {self.account_type})>"


class CategoryModel(Base):
    """
    Modèle SQLAlchemy pour les catégories.

    Corresponds to domain.entities.Category
    Structure hiérarchique via parent_id.
    """

    __tablename__ = "categories"

    # === Identité ===
    id = Column(String(36), primary_key=True)

    # === Données principales ===
    name = Column(String(255), nullable=False, index=True)
    category_type = Column(String(50), nullable=False, index=True)  # income, expense, transfer, savings

    # === Hiérarchie ===
    parent_id = Column(String(36), ForeignKey("categories.id"), nullable=True, index=True)

    # === Métadonnées visuelles ===
    icon = Column(String(100), nullable=True)
    color = Column(String(7), nullable=True)  # Hex color #RRGGBB

    # === Règles de catégorisation ===
    keywords = Column(JSON, nullable=False, default=[])  # List of keywords

    # === Budgétisation ===
    budget_default = Column(Numeric(10, 2), nullable=True)

    # === Timestamps ===
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

    # === Relationships ===
    transactions = relationship(
        "TransactionModel",
        back_populates="category",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    children = relationship(
        "CategoryModel",
        remote_side=[id],
        backref="parent",
        cascade="all, delete-orphan",
        single_parent=True  # Permet delete-orphan sur une relation many-to-one
    )

    __table_args__ = (
        Index("idx_category_type_parent", "category_type", "parent_id"),
    )

    def __repr__(self) -> str:
        return f"<CategoryModel({self.id}, {self.name}, {self.category_type})>"


class RecurringTransactionModel(Base):
    """
    Modèle SQLAlchemy pour les transactions récurrentes.

    Corresponds to domain.entities.RecurringTransaction
    """

    __tablename__ = "recurring_transactions"

    # === Identité ===
    id = Column(String(36), primary_key=True)
    account_id = Column(String(36), ForeignKey("accounts.id"), nullable=False, index=True)

    # === Données principales ===
    name = Column(String(255), nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="EUR")
    category_id = Column(String(36), ForeignKey("categories.id"), nullable=False, index=True)

    # === Récurrence ===
    frequency = Column(String(50), nullable=False)  # daily, weekly, monthly, yearly
    day_of_month = Column(Integer, nullable=False)

    # === Période ===
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=True)

    # === Variance ===
    is_variable = Column(Boolean, nullable=False, default=False)
    variance_percent = Column(Float, nullable=False, default=0.0)

    # === Timestamps ===
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

    # === Relationships ===
    account = relationship("AccountModel", back_populates="recurring_transactions")
    category = relationship("CategoryModel")
    transactions = relationship(
        "TransactionModel",
        back_populates="recurring",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_recurring_account_active", "account_id", "start_date", "end_date"),
    )

    def __repr__(self) -> str:
        return f"<RecurringTransactionModel({self.id}, {self.name}, {self.frequency})>"


class CategoryKeywordModel(Base):
    """
    Modèle optionnel pour stocker des mots-clés de catégorisation.

    Utilisé pour la catégorisation automatique avec machine learning.
    """

    __tablename__ = "category_keywords"

    # === Identité ===
    id = Column(String(36), primary_key=True)
    category_id = Column(String(36), ForeignKey("categories.id"), nullable=False, index=True)

    # === Données ===
    keyword = Column(String(255), nullable=False, index=True)
    confidence = Column(Float, nullable=False, default=1.0)  # 0.0 à 1.0

    # === Timestamps ===
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

    # === Relationships ===
    category = relationship("CategoryModel")

    def __repr__(self) -> str:
        return f"<CategoryKeywordModel({self.category_id}, {self.keyword})>"
