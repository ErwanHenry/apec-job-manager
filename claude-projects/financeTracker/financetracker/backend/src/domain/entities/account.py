"""
Entity: Account

Représente un compte bancaire individuel avec ses propriétés.

Principes DDD:
- Entité avec identité unique (UUID)
- Encapsule les règles métier d'un compte
- Immuable (on crée une nouvelle instance pour modifier)
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from src.domain.value_objects.money import Money


class AccountType(str, Enum):
    """Énumération des types de comptes."""

    CHECKING = "checking"
    SAVINGS = "savings"
    INVESTMENT = "investment"


@dataclass(frozen=True)
class Account:
    """
    Représente un compte bancaire unique.

    Invariants:
    - id est toujours défini
    - name ne peut pas être vide
    - currency est un code ISO 4217 (3 caractères)
    - account_type est l'un des AccountType énumérés

    Examples:
        >>> account = Account(
        ...     name="LCL Courant",
        ...     bank="LCL",
        ...     account_type=AccountType.CHECKING,
        ...     initial_balance=Money(Decimal("1000.00"))
        ... )
        >>> account.is_checking()
        True
    """

    # === Identité ===
    id: UUID = field(default_factory=uuid4)

    # === Données principales ===
    name: str = ""
    bank: str = ""
    account_type: AccountType = AccountType.CHECKING
    initial_balance: Money = field(default_factory=lambda: Money.zero())
    currency: str = "EUR"

    # === Statut ===
    is_active: bool = True

    # === Métadonnées ===
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self) -> None:
        """Validation des invariants à la création."""
        self._validate()

    def _validate(self) -> None:
        """Valide les invariants de l'entité."""
        # Name ne peut pas être vide
        if not self.name or not self.name.strip():
            raise ValueError("name cannot be empty")

        # Currency doit être un code ISO 4217 (3 caractères)
        if len(self.currency) != 3:
            raise ValueError(
                f"currency must be 3 characters (ISO 4217), got: {self.currency}"
            )

    # === Prédicats (type de compte) ===

    def is_checking(self) -> bool:
        """Retourne True si c'est un compte courant."""
        return self.account_type == AccountType.CHECKING

    def is_savings(self) -> bool:
        """Retourne True si c'est un compte épargne."""
        return self.account_type == AccountType.SAVINGS

    def is_investment(self) -> bool:
        """Retourne True si c'est un compte d'investissement."""
        return self.account_type == AccountType.INVESTMENT

    # === Calcul du hash de déduplication ===

    def get_import_hash(self) -> str:
        """
        Génère un hash unique pour détecter les doublons à l'import.

        Basé sur: bank + account_type + name
        (Ces caractéristiques identifient un compte de manière unique)

        Returns:
            str: SHA256 hex digest

        Examples:
            >>> acc1 = Account(name="LCL", bank="LCL", account_type=AccountType.CHECKING)
            >>> acc2 = Account(name="LCL", bank="LCL", account_type=AccountType.CHECKING)
            >>> acc1.get_import_hash() == acc2.get_import_hash()
            True
        """
        data = f"{self.bank}|{self.account_type.value}|{self.name}"
        return hashlib.sha256(data.encode()).hexdigest()

    # === Comparaison ===

    def __eq__(self, other: object) -> bool:
        """Deux comptes sont égaux si même ID."""
        if not isinstance(other, Account):
            return NotImplemented
        return self.id == other.id

    def __hash__(self) -> int:
        """Hash basé sur l'ID."""
        return hash(self.id)

    # === Représentation ===

    def __str__(self) -> str:
        """Format lisible: 'LCL Courant (Checking)'."""
        return f"{self.name} ({self.account_type.value.capitalize()})"

    def __repr__(self) -> str:
        """Représentation technique."""
        return (
            f"Account(id={self.id!r}, name={self.name!r}, "
            f"bank={self.bank!r}, type={self.account_type!r})"
        )

    # === Sérialisation ===

    def to_dict(self) -> dict:
        """Convertit en dictionnaire pour sérialisation."""
        return {
            "id": str(self.id),
            "name": self.name,
            "bank": self.bank,
            "account_type": self.account_type.value,
            "initial_balance": self.initial_balance.to_dict(),
            "currency": self.currency,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict) -> Account:
        """Crée une instance depuis un dictionnaire."""
        from uuid import UUID

        account_id = data.get("id")
        if isinstance(account_id, str):
            account_id = UUID(account_id)

        initial_balance = data.get("initial_balance")
        if isinstance(initial_balance, dict):
            initial_balance = Money.from_dict(initial_balance)
        elif initial_balance is None:
            initial_balance = Money.zero()

        account_type = data.get("account_type", "checking")
        if isinstance(account_type, str):
            account_type = AccountType(account_type)

        return cls(
            id=account_id,
            name=data.get("name", ""),
            bank=data.get("bank", ""),
            account_type=account_type,
            initial_balance=initial_balance,
            currency=data.get("currency", "EUR"),
            is_active=data.get("is_active", True),
        )
