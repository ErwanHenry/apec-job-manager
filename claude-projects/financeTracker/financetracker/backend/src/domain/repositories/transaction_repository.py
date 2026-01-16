"""
Port: TransactionRepository

Architecture Hexagonale:
- C'est un PORT (interface) du domaine
- Définit le CONTRAT que les adapters doivent respecter
- Le domaine dépend de cette abstraction, pas des implémentations

Principes SOLID:
- ISP: Interface séparée par responsabilité (lecture vs écriture)
- DIP: Le domaine dépend d'abstractions, pas de SQLite/PostgreSQL
- SRP: Chaque méthode a une responsabilité unique
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from src.domain.entities.transaction import Transaction
from src.domain.value_objects.date_range import DateRange


class TransactionReader(ABC):
    """
    Port de lecture pour les transactions.
    
    Interface ségrégée (ISP) - contient uniquement les opérations de lecture.
    Utile pour les Query handlers qui n'ont besoin que de lire.
    """
    
    @abstractmethod
    def get_by_id(self, transaction_id: UUID) -> Optional[Transaction]:
        """
        Récupère une transaction par son ID.
        
        Args:
            transaction_id: UUID de la transaction
            
        Returns:
            Transaction si trouvée, None sinon
        """
        ...
    
    @abstractmethod
    def find_by_account(
        self, 
        account_id: UUID,
        limit: int = 100,
        offset: int = 0
    ) -> list[Transaction]:
        """
        Récupère les transactions d'un compte.
        
        Args:
            account_id: UUID du compte
            limit: Nombre max de résultats
            offset: Pagination
            
        Returns:
            Liste de transactions
        """
        ...
    
    @abstractmethod
    def find_by_date_range(
        self, 
        date_range: DateRange,
        account_id: Optional[UUID] = None
    ) -> list[Transaction]:
        """
        Récupère les transactions dans une période.
        
        Args:
            date_range: Période de recherche
            account_id: Optionnel, filtre par compte
            
        Returns:
            Liste de transactions triées par date
        """
        ...
    
    @abstractmethod
    def find_by_category(
        self, 
        category_id: UUID,
        date_range: Optional[DateRange] = None
    ) -> list[Transaction]:
        """
        Récupère les transactions d'une catégorie.
        
        Args:
            category_id: UUID de la catégorie
            date_range: Optionnel, filtre par période
            
        Returns:
            Liste de transactions
        """
        ...
    
    @abstractmethod
    def find_uncategorized(
        self,
        account_id: Optional[UUID] = None,
        limit: int = 50
    ) -> list[Transaction]:
        """
        Récupère les transactions non catégorisées.
        
        Args:
            account_id: Optionnel, filtre par compte
            limit: Nombre max de résultats
            
        Returns:
            Liste de transactions sans catégorie
        """
        ...
    
    @abstractmethod
    def count_by_account(self, account_id: UUID) -> int:
        """Compte le nombre de transactions d'un compte."""
        ...
    
    @abstractmethod
    def exists_by_hash(self, import_hash: str) -> bool:
        """
        Vérifie si une transaction avec ce hash existe.
        
        Utilisé pour le dédoublonnage à l'import.
        
        Args:
            import_hash: Hash SHA256 de la transaction
            
        Returns:
            True si existe, False sinon
        """
        ...


class TransactionWriter(ABC):
    """
    Port d'écriture pour les transactions.
    
    Interface ségrégée (ISP) - contient uniquement les opérations d'écriture.
    """
    
    @abstractmethod
    def save(self, transaction: Transaction) -> None:
        """
        Persiste une transaction (insert ou update).
        
        Args:
            transaction: Transaction à sauvegarder
        """
        ...
    
    @abstractmethod
    def save_many(self, transactions: list[Transaction]) -> int:
        """
        Persiste plusieurs transactions en batch.
        
        Args:
            transactions: Liste de transactions
            
        Returns:
            Nombre de transactions effectivement sauvegardées
        """
        ...
    
    @abstractmethod
    def delete(self, transaction_id: UUID) -> bool:
        """
        Supprime une transaction.
        
        Args:
            transaction_id: UUID de la transaction
            
        Returns:
            True si supprimée, False si non trouvée
        """
        ...
    
    @abstractmethod
    def delete_by_account(self, account_id: UUID) -> int:
        """
        Supprime toutes les transactions d'un compte.
        
        Args:
            account_id: UUID du compte
            
        Returns:
            Nombre de transactions supprimées
        """
        ...


class TransactionRepository(TransactionReader, TransactionWriter):
    """
    Port complet pour les transactions.
    
    Combine lecture et écriture.
    C'est cette interface que la plupart des services utiliseront.
    
    Architecture Hexagonale:
    - Ce PORT est dans le DOMAINE
    - Les ADAPTERS (SQLite, PostgreSQL) l'implémentent
    - Le domaine ne connaît pas les détails d'implémentation
    
    Example:
        # Dans un service domaine
        class TransactionService:
            def __init__(self, repo: TransactionRepository):
                self._repo = repo  # Injection de dépendance
            
            def get_expenses(self, date_range: DateRange) -> list[Transaction]:
                transactions = self._repo.find_by_date_range(date_range)
                return [t for t in transactions if t.is_expense()]
    """
    
    pass  # Hérite de toutes les méthodes abstraites


# === Ports spécialisés pour cas d'usage spécifiques ===

class TransactionSearchPort(ABC):
    """
    Port de recherche full-text (optionnel).
    
    Peut être implémenté différemment selon le backend:
    - SQLite FTS5
    - PostgreSQL Full-Text Search
    - Elasticsearch
    """
    
    @abstractmethod
    def search(
        self, 
        query: str, 
        account_id: Optional[UUID] = None,
        limit: int = 20
    ) -> list[Transaction]:
        """
        Recherche full-text dans les descriptions.
        
        Args:
            query: Termes de recherche
            account_id: Optionnel, filtre par compte
            limit: Nombre max de résultats
            
        Returns:
            Transactions matchant la recherche
        """
        ...


class TransactionStatsPort(ABC):
    """
    Port pour les statistiques agrégées.
    
    Séparé car peut nécessiter des optimisations spécifiques
    (vues matérialisées, cache, etc.)
    """
    
    @abstractmethod
    def sum_by_category(
        self, 
        date_range: DateRange,
        account_id: Optional[UUID] = None
    ) -> dict[UUID, float]:
        """
        Somme des transactions par catégorie.
        
        Returns:
            Dict {category_id: total}
        """
        ...
    
    @abstractmethod
    def average_by_category(
        self, 
        category_id: UUID,
        months: int = 6
    ) -> float:
        """
        Moyenne mensuelle pour une catégorie.
        
        Utilisé pour la détection d'anomalies.
        """
        ...
    
    @abstractmethod
    def monthly_totals(
        self,
        account_id: UUID,
        months: int = 12
    ) -> dict[str, dict[str, float]]:
        """
        Totaux mensuels (revenus, dépenses, solde).
        
        Returns:
            Dict {"2025-01": {"income": 3000, "expense": 2500, "balance": 500}}
        """
        ...
