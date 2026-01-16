"""
Domain Service: Projection Service

Fournit la logique de projection du solde bancaire sur une période future.

Algorithme:
1. Récupère le solde initial (somme des comptes)
2. Récupère les transactions récurrentes actives
3. Pour chaque jour de la période:
   - Vérifie quelles transactions récurrentes déclenchent
   - Applique les montants selon le scénario
   - Calcule le nouveau solde
4. Retourne ProjectionResult avec points et statistiques

Scénarios:
- Pessimiste: Exclut les revenus variables, ajoute variance aux dépenses
- Réaliste: Utilise les montants moyens basés sur l'historique
- Optimiste: Inclut tous les revenus, réduit les dépenses variables
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Optional
from uuid import UUID

from src.domain.entities.recurring_transaction import RecurringTransaction
from src.domain.repositories.account_repository import AccountRepository
from src.domain.repositories.recurring_repository import RecurringRepository
from src.domain.repositories.transaction_repository import TransactionRepository
from src.domain.value_objects.date_range import DateRange
from src.domain.value_objects.money import Money
from src.domain.value_objects.projection_point import ProjectionPoint
from src.domain.value_objects.projection_result import ProjectionResult
from src.domain.value_objects.scenario import Scenario

logger = logging.getLogger(__name__)


class ProjectionService:
    """
    Service de projection du solde bancaire.

    Calcule la projection du solde sur N mois en tenant compte des
    transactions récurrentes et des scénarios de variance.

    Examples:
        >>> service = ProjectionService(
        ...     account_repo=account_repo,
        ...     recurring_repo=recurring_repo,
        ...     transaction_repo=transaction_repo
        ... )
        >>> result = service.project(
        ...     months=6,
        ...     scenario=Scenario.REALISTIC
        ... )
        >>> result.is_healthy()
        True
    """

    def __init__(
        self,
        account_repository: AccountRepository,
        recurring_repository: RecurringRepository,
        transaction_repository: Optional[TransactionRepository] = None,
    ):
        """
        Initialise le service.

        Args:
            account_repository: Repository des comptes
            recurring_repository: Repository des transactions récurrentes
            transaction_repository: Repository des transactions (optionnel)
        """
        self.account_repository = account_repository
        self.recurring_repository = recurring_repository
        self.transaction_repository = transaction_repository

    def project(
        self,
        months: int = 6,
        scenario: Scenario = Scenario.REALISTIC,
        from_date: Optional[date] = None,
    ) -> ProjectionResult:
        """
        Projette le solde bancaire sur N mois.

        Args:
            months: Nombre de mois à projeter (1-12)
            scenario: Scénario de projection (pessimiste, réaliste, optimiste)
            from_date: Date de début (défaut: aujourd'hui)

        Returns:
            ProjectionResult avec points de projection et statistiques

        Raises:
            ValueError: Si months n'est pas entre 1 et 12
        """
        if not 1 <= months <= 12:
            raise ValueError("months must be between 1 and 12")

        if from_date is None:
            from_date = date.today()

        # Calculer la plage de projection
        to_date = DateRange.current_year().end  # Simplification: jusque fin année
        if from_date.month + months <= 12:
            to_date = date(from_date.year, from_date.month + months, 1)
            if from_date.day > 1:
                to_date = date(from_date.year, from_date.month + months, min(from_date.day, 28))
        else:
            target_month = (from_date.month + months - 1) % 12 + 1
            target_year = from_date.year + (from_date.month + months - 1) // 12
            to_date = date(target_year, target_month, 1)

        # Récupérer le solde initial
        starting_balance = self._calculate_starting_balance()
        logger.info(f"Starting projection from {from_date} with balance {starting_balance.amount}")

        # Récupérer les transactions récurrentes
        recurring_txs = self.recurring_repository.find_active()
        logger.info(f"Found {len(recurring_txs)} active recurring transactions")

        # Générer les points de projection
        projection_points = self._generate_projection_points(
            from_date=from_date,
            to_date=to_date,
            starting_balance=starting_balance,
            recurring_transactions=recurring_txs,
            scenario=scenario,
        )

        logger.info(f"Generated {len(projection_points)} projection points")

        return ProjectionResult(
            projection_points=projection_points,
            starting_balance=starting_balance,
            scenario=scenario,
        )

    def project_multiple_scenarios(
        self,
        months: int = 6,
        from_date: Optional[date] = None,
    ) -> dict[str, ProjectionResult]:
        """
        Projette pour les trois scénarios simultanément.

        Args:
            months: Nombre de mois à projeter
            from_date: Date de début

        Returns:
            Dict {scenario_name: ProjectionResult}

        Examples:
            >>> results = service.project_multiple_scenarios(months=6)
            >>> results["pessimistic"].is_critical()
            True
            >>> results["optimistic"].is_healthy()
            True
        """
        if from_date is None:
            from_date = date.today()

        return {
            Scenario.PESSIMISTIC.value: self.project(
                months=months,
                scenario=Scenario.PESSIMISTIC,
                from_date=from_date,
            ),
            Scenario.REALISTIC.value: self.project(
                months=months,
                scenario=Scenario.REALISTIC,
                from_date=from_date,
            ),
            Scenario.OPTIMISTIC.value: self.project(
                months=months,
                scenario=Scenario.OPTIMISTIC,
                from_date=from_date,
            ),
        }

    # === Méthodes privées ===

    def _calculate_starting_balance(self) -> Money:
        """
        Calcule le solde initial comme somme de tous les comptes.

        Returns:
            Money avec le solde initial
        """
        accounts = self.account_repository.find_all()
        total = Decimal("0.00")

        for account in accounts:
            if account.is_active:
                # Récupérer le solde du compte
                if self.transaction_repository:
                    transactions = self.transaction_repository.find_by_account(
                        account.id,
                        limit=1000,  # Limiter pour performance
                    )
                    balance = account.initial_balance
                    for tx in transactions:
                        balance = balance + tx.amount.amount
                    total += balance
                else:
                    total += account.initial_balance

        return Money(total)

    def _generate_projection_points(
        self,
        from_date: date,
        to_date: date,
        starting_balance: Money,
        recurring_transactions: list[RecurringTransaction],
        scenario: Scenario,
    ) -> list[ProjectionPoint]:
        """
        Génère les points de projection jour par jour.

        Args:
            from_date: Date de début
            to_date: Date de fin
            starting_balance: Solde initial
            recurring_transactions: Liste de transactions récurrentes
            scenario: Scénario de projection

        Returns:
            Liste de ProjectionPoint triée par date
        """
        points = []
        current_balance = starting_balance.amount
        current_date = from_date

        while current_date <= to_date:
            # Vérifier quelles transactions récurrentes déclenchent
            net_change = Decimal("0.00")

            for recurring_tx in recurring_transactions:
                if recurring_tx.should_trigger_on(current_date):
                    amount = self._get_scenario_amount(
                        recurring_tx.amount,
                        is_income=recurring_tx.amount.is_positive(),
                        scenario=scenario,
                    )
                    net_change += amount

            # Calculer le nouveau solde
            new_balance = current_balance + net_change
            current_balance = new_balance

            # Créer le point de projection
            point = ProjectionPoint(
                date=current_date,
                balance=Money(new_balance),
                net_change=Money(net_change),
            )
            points.append(point)

            # Passer au jour suivant
            current_date += timedelta(days=1)

        return points

    def _get_scenario_amount(
        self,
        amount: Money,
        is_income: bool,
        scenario: Scenario,
    ) -> Decimal:
        """
        Applique la logique du scénario au montant.

        Règles:
        - Pessimiste: Exclut les revenus variables, ajoute 10% aux dépenses
        - Réaliste: Utilise le montant tel quel
        - Optimiste: Inclut tous les revenus, réduit les dépenses de 10%

        Args:
            amount: Montant de la transaction
            is_income: True si c'est un revenu
            scenario: Scénario à appliquer

        Returns:
            Montant ajusté selon le scénario
        """
        if scenario == Scenario.PESSIMISTIC:
            if is_income:
                # Pour le scénario pessimiste, réduire les revenus de 20%
                return amount.amount * Decimal("0.80")
            else:
                # Augmenter les dépenses de 10%
                return amount.amount * Decimal("1.10")

        elif scenario == Scenario.REALISTIC:
            # Utiliser le montant tel quel
            return amount.amount

        elif scenario == Scenario.OPTIMISTIC:
            if is_income:
                # Augmenter les revenus de 10%
                return amount.amount * Decimal("1.10")
            else:
                # Réduire les dépenses de 10%
                return amount.amount * Decimal("0.90")

        return amount.amount
