"""
Handler: ProjectionHandler

Handles GetProjectionQuery in the application layer.

Orchestrates: account balance → recurring transactions → projection calculation
"""
from __future__ import annotations

import logging

from src.application.queries.get_projection import GetProjectionQuery
from src.application.dto.projection_dto import ProjectionDTO
from src.domain.repositories.account_repository import AccountRepository
from src.domain.repositories.recurring_repository import RecurringRepository
from src.domain.repositories.transaction_repository import TransactionRepository
from src.domain.services.projection_service import ProjectionService

logger = logging.getLogger(__name__)


class ProjectionHandler:
    """
    Handler pour la requête de projection de solde.

    Processus:
    1. Charger tous les comptes (pour le solde initial)
    2. Charger les transactions récurrentes actives
    3. Appeler ProjectionService
    4. Convertir en DTO pour sérialisation

    Examples:
        >>> handler = ProjectionHandler(
        ...     account_repo=account_repo,
        ...     recurring_repo=recurring_repo,
        ...     transaction_repo=transaction_repo
        ... )
        >>> query = GetProjectionQuery(months=6, scenario=Scenario.REALISTIC)
        >>> result_dict = handler.handle(query)
    """

    def __init__(
        self,
        account_repository: AccountRepository,
        recurring_repository: RecurringRepository,
        transaction_repository: TransactionRepository,
    ):
        """
        Initialise le handler.

        Args:
            account_repository: Repository des comptes
            recurring_repository: Repository des transactions récurrentes
            transaction_repository: Repository des transactions
        """
        self.account_repository = account_repository
        self.recurring_repository = recurring_repository
        self.transaction_repository = transaction_repository
        self.projection_service = ProjectionService(
            account_repository=account_repository,
            recurring_repository=recurring_repository,
            transaction_repository=transaction_repository,
        )

    def handle(self, query: GetProjectionQuery) -> ProjectionDTO:
        """
        Traite la requête de projection.

        Args:
            query: Requête de projection

        Returns:
            ProjectionDTO avec les données de projection

        Raises:
            ValueError: Si les paramètres sont invalides
        """
        logger.info(
            f"Calculating projection: months={query.months}, "
            f"scenario={query.scenario.value}"
        )

        try:
            # Appeler le service de projection
            projection_result = self.projection_service.project(
                months=query.months,
                scenario=query.scenario,
            )

            logger.info(
                f"Projection complete: "
                f"starting={projection_result.starting_balance.amount}, "
                f"ending={projection_result.ending_balance.amount}, "
                f"min={projection_result.min_balance.amount}, "
                f"status={'CRITICAL' if projection_result.is_critical() else 'OK'}"
            )

            # Convertir en DTO
            dto = ProjectionDTO.from_projection_result(projection_result)

            return dto

        except Exception as e:
            logger.error(f"Projection error: {e}")
            raise
