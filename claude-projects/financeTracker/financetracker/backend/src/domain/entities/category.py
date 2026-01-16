"""
Entity: Category

Représente une catégorie hiérarchique pour les transactions.

Principes DDD:
- Entité avec identité unique
- Structure hiérarchique: parent_id pour les enfants
- Encapsule la logique métier de catégorisation
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4


class CategoryType(str, Enum):
    """Énumération des types de catégories."""

    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"
    SAVINGS = "savings"


@dataclass(frozen=True)
class Category:
    """
    Représente une catégorie unique avec structure hiérarchique optionnelle.

    Invariants:
    - id est toujours défini
    - name ne peut pas être vide
    - parent_id ne peut pas être égal à id (pas de boucle)
    - category_type est l'un des CategoryType énumérés

    Examples:
        >>> root = Category(
        ...     name="Dépenses",
        ...     category_type=CategoryType.EXPENSE
        ... )
        >>> child = Category(
        ...     name="Alimentation",
        ...     category_type=CategoryType.EXPENSE,
        ...     parent_id=root.id,
        ...     keywords=["CARREFOUR", "SUPERMARCHE"]
        ... )
        >>> root.is_root()
        True
        >>> child.matches_keyword("CARREFOUR")
        True
    """

    # === Identité ===
    id: UUID = field(default_factory=uuid4)

    # === Données principales ===
    name: str = ""
    category_type: CategoryType = CategoryType.EXPENSE

    # === Hiérarchie ===
    parent_id: Optional[UUID] = None

    # === Métadonnées visuelles ===
    icon: Optional[str] = None
    color: Optional[str] = None

    # === Règles de catégorisation ===
    keywords: list[str] = field(default_factory=list)

    # === Budgétisation ===
    budget_default: Optional[float] = None

    # === Timestamps ===
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

        # parent_id ne peut pas être l'id
        if self.parent_id is not None and self.parent_id == self.id:
            raise ValueError("parent_id cannot be the same as id (circular reference)")

    # === Prédicats ===

    def is_root(self) -> bool:
        """Retourne True si c'est une catégorie racine (pas de parent)."""
        return self.parent_id is None

    def is_expense(self) -> bool:
        """Retourne True si c'est une catégorie de dépense."""
        return self.category_type == CategoryType.EXPENSE

    def is_income(self) -> bool:
        """Retourne True si c'est une catégorie de revenu."""
        return self.category_type == CategoryType.INCOME

    def is_transfer(self) -> bool:
        """Retourne True si c'est un transfert."""
        return self.category_type == CategoryType.TRANSFER

    def is_savings(self) -> bool:
        """Retourne True si c'est une catégorie d'épargne."""
        return self.category_type == CategoryType.SAVINGS

    # === Correspondance avec mots-clés ===

    def matches_keyword(self, text: str) -> bool:
        """
        Vérifie si le texte correspond à un mot-clé de la catégorie.

        La correspondance est insensible à la casse et peut être partielle.
        Par exemple, "RANT" correspondra à "RESTAURANT".

        Args:
            text: Texte à vérifier

        Returns:
            True si le texte contient un mot-clé ou si un mot-clé contient le texte

        Examples:
            >>> cat = Category(
            ...     name="Restaurant",
            ...     category_type=CategoryType.EXPENSE,
            ...     keywords=["RESTAURANT", "CAFE", "PIZZERIA"]
            ... )
            >>> cat.matches_keyword("RESTAURANT")
            True
            >>> cat.matches_keyword("restaurant")  # case-insensitive
            True
            >>> cat.matches_keyword("RANT")  # partial
            True
            >>> cat.matches_keyword("OTHER")
            False
        """
        if not self.keywords or not text:
            return False

        text_upper = text.upper().strip()

        for keyword in self.keywords:
            keyword_upper = keyword.upper().strip()

            # Exact match
            if text_upper == keyword_upper:
                return True

            # Partial match (either direction)
            if text_upper in keyword_upper or keyword_upper in text_upper:
                return True

        return False

    # === Comparaison ===

    def __eq__(self, other: object) -> bool:
        """Deux catégories sont égales si même ID."""
        if not isinstance(other, Category):
            return NotImplemented
        return self.id == other.id

    def __hash__(self) -> int:
        """Hash basé sur l'ID."""
        return hash(self.id)

    # === Représentation ===

    def __str__(self) -> str:
        """Format lisible: 'Alimentation (expense)'."""
        return f"{self.name} ({self.category_type.value})"

    def __repr__(self) -> str:
        """Représentation technique."""
        return (
            f"Category(id={self.id!r}, name={self.name!r}, "
            f"type={self.category_type!r}, parent={self.parent_id!r})"
        )

    # === Sérialisation ===

    def to_dict(self) -> dict:
        """Convertit en dictionnaire pour sérialisation."""
        return {
            "id": str(self.id),
            "name": self.name,
            "category_type": self.category_type.value,
            "parent_id": str(self.parent_id) if self.parent_id else None,
            "icon": self.icon,
            "color": self.color,
            "keywords": self.keywords,
            "budget_default": self.budget_default,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict) -> Category:
        """Crée une instance depuis un dictionnaire."""
        from uuid import UUID

        category_id = data.get("id")
        if isinstance(category_id, str):
            category_id = UUID(category_id)

        parent_id = data.get("parent_id")
        if isinstance(parent_id, str):
            parent_id = UUID(parent_id)

        category_type = data.get("category_type", "expense")
        if isinstance(category_type, str):
            category_type = CategoryType(category_type)

        return cls(
            id=category_id,
            name=data.get("name", ""),
            category_type=category_type,
            parent_id=parent_id,
            icon=data.get("icon"),
            color=data.get("color"),
            keywords=data.get("keywords", []),
            budget_default=data.get("budget_default"),
        )
