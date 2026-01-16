"""
Entity: Transaction

Principes DDD appliqués:
- Entité avec identité unique (UUID)
- Encapsulation des règles métier
- Méthodes qui expriment le langage ubiquitaire

Principes SOLID:
- SRP: Gère uniquement les données et règles d'une transaction
- OCP: Extensible via méthodes, pas de modification du cœur
- LSP: Substituable par des sous-classes si nécessaire
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Optional
from uuid import UUID, uuid4

from src.domain.value_objects.money import Money


@dataclass
class Transaction:
    """
    Représente une opération bancaire unique.
    
    Invariants:
    - id est toujours défini (généré si non fourni)
    - amount ne peut pas être None
    - date ne peut pas être dans le futur
    - category_confidence est entre 0 et 1
    
    Examples:
        >>> tx = Transaction(
        ...     account_id=uuid4(),
        ...     date=date.today(),
        ...     amount=Money(Decimal("-42.50")),
        ...     description="CB CARREFOUR"
        ... )
        >>> tx.is_expense()
        True
    """
    
    # === Identité ===
    id: UUID = field(default_factory=uuid4)
    account_id: UUID = field(default_factory=uuid4)
    
    # === Données principales ===
    date: date = field(default_factory=date.today)
    amount: Money = field(default_factory=lambda: Money.zero())
    description: str = ""
    
    # === Données optionnelles ===
    value_date: Optional[date] = None
    category_id: Optional[UUID] = None
    category_confidence: float = 0.0
    
    # === Récurrence ===
    is_recurring: bool = False
    recurring_id: Optional[UUID] = None
    
    # === Métadonnées ===
    tags: list[str] = field(default_factory=list)
    notes: str = ""
    import_hash: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    
    def __post_init__(self) -> None:
        """Validation des invariants à la création."""
        self._validate()
    
    def _validate(self) -> None:
        """Valide les invariants de l'entité."""
        # Date ne peut pas être dans le futur (sauf si c'est une prévision)
        if self.date > date.today() and not self.is_recurring:
            raise ValueError(
                f"Transaction date cannot be in the future: {self.date}"
            )
        
        # Confidence entre 0 et 1
        if not 0.0 <= self.category_confidence <= 1.0:
            raise ValueError(
                f"category_confidence must be between 0 and 1, "
                f"got: {self.category_confidence}"
            )
    
    # === Comportements métier ===
    
    def is_expense(self) -> bool:
        """Retourne True si c'est une dépense (montant négatif)."""
        return self.amount.is_negative()
    
    def is_income(self) -> bool:
        """Retourne True si c'est un revenu (montant positif)."""
        return self.amount.is_positive()
    
    def is_categorized(self) -> bool:
        """Retourne True si une catégorie est assignée."""
        return self.category_id is not None
    
    def is_manually_categorized(self) -> bool:
        """Retourne True si catégorisé manuellement (confidence = 1.0)."""
        return self.is_categorized() and self.category_confidence == 1.0
    
    def is_auto_categorized(self) -> bool:
        """Retourne True si catégorisé automatiquement."""
        return self.is_categorized() and self.category_confidence < 1.0
    
    # === Commandes (mutations) ===
    
    def assign_category(
        self, 
        category_id: UUID, 
        confidence: float = 1.0,
        *,
        manual: bool = False
    ) -> None:
        """
        Assigne une catégorie à la transaction.
        
        Args:
            category_id: ID de la catégorie
            confidence: Score de confiance (0.0 à 1.0)
            manual: Si True, force confidence à 1.0
        
        Raises:
            ValueError: Si confidence n'est pas entre 0 et 1
        """
        if not 0.0 <= confidence <= 1.0:
            raise ValueError(f"Confidence must be between 0 and 1, got: {confidence}")
        
        self.category_id = category_id
        self.category_confidence = 1.0 if manual else confidence
        self._touch()
    
    def remove_category(self) -> None:
        """Retire la catégorie assignée."""
        self.category_id = None
        self.category_confidence = 0.0
        self._touch()
    
    def add_tag(self, tag: str) -> None:
        """Ajoute un tag si non présent."""
        tag = tag.strip().lower()
        if tag and tag not in self.tags:
            self.tags.append(tag)
            self._touch()
    
    def remove_tag(self, tag: str) -> None:
        """Retire un tag s'il est présent."""
        tag = tag.strip().lower()
        if tag in self.tags:
            self.tags.remove(tag)
            self._touch()
    
    def add_note(self, note: str) -> None:
        """Ajoute une note (remplace l'existante)."""
        self.notes = note.strip()
        self._touch()
    
    def mark_as_recurring(self, recurring_id: UUID) -> None:
        """Marque comme issue d'une récurrence."""
        self.is_recurring = True
        self.recurring_id = recurring_id
        self._touch()
    
    def _touch(self) -> None:
        """Met à jour le timestamp de modification."""
        self.updated_at = datetime.now()
    
    # === Calcul du hash de déduplication ===
    
    def compute_import_hash(self) -> str:
        """
        Calcule un hash unique pour détecter les doublons à l'import.
        
        Basé sur: date + montant + 50 premiers caractères du libellé
        """
        data = f"{self.date}|{self.amount.amount}|{self.description[:50]}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    def ensure_import_hash(self) -> None:
        """Calcule et stocke le hash si non défini."""
        if not self.import_hash:
            self.import_hash = self.compute_import_hash()
    
    # === Comparaison ===
    
    def __eq__(self, other: object) -> bool:
        """Deux transactions sont égales si même ID."""
        if not isinstance(other, Transaction):
            return NotImplemented
        return self.id == other.id
    
    def __hash__(self) -> int:
        """Hash basé sur l'ID."""
        return hash(self.id)
    
    # === Sérialisation ===
    
    def to_dict(self) -> dict:
        """Convertit en dictionnaire pour sérialisation."""
        return {
            "id": str(self.id),
            "account_id": str(self.account_id),
            "date": self.date.isoformat(),
            "amount": self.amount.to_dict(),
            "description": self.description,
            "value_date": self.value_date.isoformat() if self.value_date else None,
            "category_id": str(self.category_id) if self.category_id else None,
            "category_confidence": self.category_confidence,
            "is_recurring": self.is_recurring,
            "recurring_id": str(self.recurring_id) if self.recurring_id else None,
            "tags": self.tags,
            "notes": self.notes,
            "import_hash": self.import_hash,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
