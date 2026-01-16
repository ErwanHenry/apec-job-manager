"""
Domain Service: Categorization Service

Fournit la logique métier pour catégoriser automatiquement les transactions
en fonction des règles (mots-clés, historique, patterns).

Principes:
- Logique métier pure, pas de dépendances externes
- Utilise les repositories via injection de dépendances
- Retourne des résultats avec score de confiance
"""
from __future__ import annotations

import logging
from typing import Optional
from uuid import UUID

from src.domain.entities.transaction import Transaction
from src.domain.repositories.category_repository import CategoryRepository
from src.domain.repositories.transaction_repository import TransactionRepository

logger = logging.getLogger(__name__)


class CategorizationResult:
    """Résultat d'une tentative de catégorisation."""

    def __init__(
        self,
        category_id: Optional[UUID],
        confidence: float,
        reason: str,
    ):
        """
        Initialise le résultat.

        Args:
            category_id: ID de la catégorie trouvée, ou None
            confidence: Score de confiance [0.0, 1.0]
            reason: Description de la raison de la catégorisation
        """
        self.category_id = category_id
        self.confidence = confidence
        self.reason = reason

    def __repr__(self) -> str:
        return (
            f"CategorizationResult(category_id={self.category_id}, "
            f"confidence={self.confidence}, reason={self.reason!r})"
        )


class CategorizationService:
    """
    Service de catégorisation des transactions.

    Algorithme de matching:
    1. Exact keyword match → confiance 1.0
    2. Partial keyword match → confiance 0.9
    3. Historical match (même description avant) → confiance 0.8
    4. Default "Non catégorisé" → confiance 0.0

    Examples:
        >>> service = CategorizationService(category_repo, transaction_repo)
        >>> tx = Transaction(
        ...     account_id=UUID(...),
        ...     date=date(2025, 1, 15),
        ...     amount=Money(Decimal("-42.50")),
        ...     description="CB CARREFOUR"
        ... )
        >>> result = service.categorize(tx)
        >>> result.confidence
        1.0
    """

    def __init__(
        self,
        category_repository: CategoryRepository,
        transaction_repository: Optional[TransactionRepository] = None,
    ):
        """
        Initialise le service.

        Args:
            category_repository: Repository des catégories
            transaction_repository: Repository des transactions (optionnel, pour historique)
        """
        self.category_repository = category_repository
        self.transaction_repository = transaction_repository

    def categorize(
        self,
        transaction: Transaction,
    ) -> CategorizationResult:
        """
        Catégorise une transaction unique.

        Applique l'algorithme de matching:
        1. Recherche les catégories par mot-clé
        2. Retourne le meilleur match avec confiance

        Args:
            transaction: Transaction à catégoriser

        Returns:
            CategorizationResult avec catégorie et confiance
        """
        if not transaction.description:
            return CategorizationResult(
                category_id=None,
                confidence=0.0,
                reason="No description to categorize",
            )

        description_upper = transaction.description.upper().strip()

        # 1. Chercher une correspondance exacte par mot-clé
        exact_match = self._find_exact_keyword_match(description_upper)
        if exact_match:
            return CategorizationResult(
                category_id=exact_match.id,
                confidence=1.0,
                reason=f"Exact keyword match: {exact_match.name}",
            )

        # 2. Chercher une correspondance partielle
        partial_match = self._find_partial_keyword_match(description_upper)
        if partial_match:
            return CategorizationResult(
                category_id=partial_match.id,
                confidence=0.9,
                reason=f"Partial keyword match: {partial_match.name}",
            )

        # 3. Chercher dans l'historique
        if self.transaction_repository:
            historical_match = self._find_historical_match(
                transaction.account_id,
                description_upper,
            )
            if historical_match:
                return CategorizationResult(
                    category_id=historical_match,
                    confidence=0.8,
                    reason="Historical match",
                )

        # 4. Pas de match trouvé
        return CategorizationResult(
            category_id=None,
            confidence=0.0,
            reason="No matching category found",
        )

    def categorize_many(
        self,
        transactions: list[Transaction],
    ) -> list[CategorizationResult]:
        """
        Catégorise plusieurs transactions.

        Args:
            transactions: Liste de transactions

        Returns:
            Liste de CategorizationResult (même ordre que input)
        """
        results = []
        for tx in transactions:
            result = self.categorize(tx)
            results.append(result)
            logger.debug(f"Categorized {tx.description[:30]}: {result}")

        return results

    def apply_categorization(
        self,
        transaction: Transaction,
    ) -> Transaction:
        """
        Catégorise une transaction et la modifie in-place.

        Args:
            transaction: Transaction à catégoriser (modifiée in-place)

        Returns:
            La même transaction avec category_id et category_confidence définis
        """
        result = self.categorize(transaction)

        # Modifier la transaction (on suppose qu'elle n'est pas frozen)
        if hasattr(transaction, 'category_id'):
            transaction.category_id = result.category_id
            transaction.category_confidence = result.confidence

        return transaction

    # === Méthodes privées ===

    def _find_exact_keyword_match(self, description: str):
        """
        Cherche une catégorie avec correspondance exacte de mot-clé.

        Args:
            description: Description normalisée en majuscules

        Returns:
            Catégorie trouvée, ou None
        """
        categories = self.category_repository.find_all()

        for category in categories:
            if not category.keywords:
                continue

            for keyword in category.keywords:
                if description == keyword.upper().strip():
                    return category

        return None

    def _find_partial_keyword_match(self, description: str):
        """
        Cherche une catégorie avec correspondance partielle de mot-clé.

        Une correspondance partielle signifie que le mot-clé est contenu dans
        la description, ou vice-versa.

        Args:
            description: Description normalisée en majuscules

        Returns:
            Catégorie trouvée (la première), ou None
        """
        categories = self.category_repository.find_all()

        for category in categories:
            if not category.keywords:
                continue

            for keyword in category.keywords:
                keyword_upper = keyword.upper().strip()
                if keyword_upper in description or description in keyword_upper:
                    return category

        return None

    def _find_historical_match(
        self,
        account_id: UUID,
        description: str,
    ) -> Optional[UUID]:
        """
        Cherche une catégorie basée sur l'historique des transactions.

        Trouve les transactions passées avec la même description et
        retourne la catégorie la plus fréquemment utilisée.

        Args:
            account_id: ID du compte
            description: Description normalisée en majuscules

        Returns:
            ID de catégorie trouvée, ou None
        """
        if not self.transaction_repository:
            return None

        try:
            # Chercher les transactions passées avec description similaire
            similar_txs = self.transaction_repository.find_by_account(account_id)

            # Filtrer par description exacte
            matching_txs = [
                tx
                for tx in similar_txs
                if tx.description
                and tx.description.upper().strip() == description
                and tx.category_id is not None
            ]

            if not matching_txs:
                return None

            # Compter les catégories
            category_counts = {}
            for tx in matching_txs:
                cat_id = tx.category_id
                category_counts[cat_id] = category_counts.get(cat_id, 0) + 1

            # Retourner la catégorie la plus fréquente
            if category_counts:
                most_common_category = max(
                    category_counts.items(),
                    key=lambda x: x[1],
                )[0]
                return most_common_category

        except Exception as e:
            logger.warning(f"Error finding historical match: {e}")

        return None
