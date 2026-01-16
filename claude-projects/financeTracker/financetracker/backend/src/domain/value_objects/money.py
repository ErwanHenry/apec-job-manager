"""
Value Object: Money

Principes SOLID appliqués:
- SRP: Représente uniquement un montant monétaire
- OCP: Extensible via héritage (ex: MoneyWithTax)
- LSP: Peut être substitué partout où Money est attendu
- ISP: Interface minimale, pas de méthodes inutiles
- DIP: Aucune dépendance externe

Caractéristiques:
- Immuable (frozen dataclass)
- Utilise Decimal pour précision financière
- Hashable (utilisable dans sets/dicts)
"""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Union


@dataclass(frozen=True)
class Money:
    """
    Représente une somme d'argent avec sa devise.
    
    Immuable - toutes les opérations retournent une nouvelle instance.
    Utilise Decimal pour éviter les erreurs d'arrondi des floats.
    
    Examples:
        >>> m1 = Money(Decimal("100.00"))
        >>> m2 = Money(Decimal("50.50"))
        >>> m1 + m2
        Money(amount=Decimal('150.50'), currency='EUR')
        
        >>> expense = Money(Decimal("-42.50"))
        >>> expense.is_negative()
        True
    """
    
    amount: Decimal
    currency: str = "EUR"
    
    def __post_init__(self) -> None:
        """Validation et normalisation à la création."""
        # Convertir en Decimal si ce n'est pas déjà le cas
        if not isinstance(self.amount, Decimal):
            object.__setattr__(self, "amount", Decimal(str(self.amount)))
        
        # Arrondir à 2 décimales (standard monétaire)
        rounded = self.amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        object.__setattr__(self, "amount", rounded)
        
        # Valider la devise
        if not self.currency or len(self.currency) != 3:
            raise ValueError(f"Currency must be 3 characters, got: {self.currency}")
    
    # === Opérations arithmétiques ===
    
    def __add__(self, other: Money) -> Money:
        """Addition de deux montants."""
        self._check_same_currency(other)
        return Money(self.amount + other.amount, self.currency)
    
    def __sub__(self, other: Money) -> Money:
        """Soustraction de deux montants."""
        self._check_same_currency(other)
        return Money(self.amount - other.amount, self.currency)
    
    def __mul__(self, factor: Union[int, float, Decimal]) -> Money:
        """Multiplication par un scalaire."""
        return Money(self.amount * Decimal(str(factor)), self.currency)
    
    def __rmul__(self, factor: Union[int, float, Decimal]) -> Money:
        """Multiplication par un scalaire (ordre inversé)."""
        return self.__mul__(factor)
    
    def __neg__(self) -> Money:
        """Négation du montant."""
        return Money(-self.amount, self.currency)
    
    def __abs__(self) -> Money:
        """Valeur absolue."""
        return Money(abs(self.amount), self.currency)
    
    # === Comparaisons ===
    
    def __lt__(self, other: Money) -> bool:
        self._check_same_currency(other)
        return self.amount < other.amount
    
    def __le__(self, other: Money) -> bool:
        self._check_same_currency(other)
        return self.amount <= other.amount
    
    def __gt__(self, other: Money) -> bool:
        self._check_same_currency(other)
        return self.amount > other.amount
    
    def __ge__(self, other: Money) -> bool:
        self._check_same_currency(other)
        return self.amount >= other.amount
    
    # === Prédicats ===
    
    def is_negative(self) -> bool:
        """Retourne True si le montant est négatif (dépense)."""
        return self.amount < 0
    
    def is_positive(self) -> bool:
        """Retourne True si le montant est positif (revenu)."""
        return self.amount > 0
    
    def is_zero(self) -> bool:
        """Retourne True si le montant est zéro."""
        return self.amount == 0
    
    # === Factory methods ===
    
    @classmethod
    def zero(cls, currency: str = "EUR") -> Money:
        """Crée un montant de zéro."""
        return cls(Decimal("0"), currency)
    
    @classmethod
    def from_cents(cls, cents: int, currency: str = "EUR") -> Money:
        """Crée un montant à partir de centimes."""
        return cls(Decimal(cents) / 100, currency)
    
    @classmethod
    def from_float(cls, value: float, currency: str = "EUR") -> Money:
        """
        Crée un montant à partir d'un float.
        
        Note: Préférer Decimal pour éviter les erreurs d'arrondi.
        """
        return cls(Decimal(str(value)), currency)
    
    # === Helpers ===
    
    def _check_same_currency(self, other: Money) -> None:
        """Vérifie que les deux montants ont la même devise."""
        if self.currency != other.currency:
            raise ValueError(
                f"Cannot operate on different currencies: "
                f"{self.currency} vs {other.currency}"
            )
    
    # === Représentation ===
    
    def __str__(self) -> str:
        """Format lisible: '1 234,56 EUR'."""
        # Format français avec séparateur de milliers
        formatted = f"{self.amount:,.2f}".replace(",", " ").replace(".", ",")
        return f"{formatted} {self.currency}"
    
    def __repr__(self) -> str:
        """Représentation technique."""
        return f"Money({self.amount!r}, {self.currency!r})"
    
    def to_dict(self) -> dict:
        """Sérialisation en dictionnaire."""
        return {
            "amount": str(self.amount),
            "currency": self.currency,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> Money:
        """Désérialisation depuis un dictionnaire."""
        return cls(
            amount=Decimal(data["amount"]),
            currency=data.get("currency", "EUR"),
        )
