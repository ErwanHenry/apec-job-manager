"""
Handler: ImportTransactionsHandler

Handles ImportTransactionsCommand in the application layer.

Orchestrates: adapter factory → parsing → deduplication → categorization → persistence
"""
from __future__ import annotations

import logging
from pathlib import Path
from uuid import UUID

from src.application.commands.import_transactions import ImportTransactionsCommand
from src.application.dto.import_result_dto import ImportResultDTO
from src.domain.repositories.category_repository import CategoryRepository
from src.domain.repositories.transaction_repository import TransactionRepository
from src.infrastructure.import_adapters.adapter_factory import AdapterFactory
from src.domain.services.categorization_service import CategorizationService

logger = logging.getLogger(__name__)


class ImportTransactionsHandler:
    """
    Handler pour la commande d'importation de transactions.

    Processus:
    1. Utiliser l'AdapterFactory pour parser le fichier
    2. Vérifier les doublons via import_hash
    3. Catégoriser automatiquement si demandé
    4. Persister les nouvelles transactions
    5. Retourner le résumé

    Examples:
        >>> handler = ImportTransactionsHandler(
        ...     adapter_factory=factory,
        ...     transaction_repo=tx_repo,
        ...     category_repo=cat_repo
        ... )
        >>> cmd = ImportTransactionsCommand(...)
        >>> result = handler.handle(cmd)
        >>> print(result.imported_count)
    """

    def __init__(
        self,
        adapter_factory: AdapterFactory,
        transaction_repository: TransactionRepository,
        category_repository: CategoryRepository,
    ):
        """
        Initialise le handler.

        Args:
            adapter_factory: Factory pour obtenir le bon adapter
            transaction_repository: Repository pour persister les transactions
            category_repository: Repository pour les catégories (pour catégorisation)
        """
        self.adapter_factory = adapter_factory
        self.transaction_repository = transaction_repository
        self.category_repository = category_repository
        self.categorization_service = CategorizationService(
            category_repository=category_repository,
            transaction_repository=transaction_repository,
        )

    def handle(self, command: ImportTransactionsCommand) -> ImportResultDTO:
        """
        Traite la commande d'importation.

        Args:
            command: Commande d'importation

        Returns:
            ImportResultDTO avec statistiques d'importation

        Raises:
            FileNotFoundError: Si le fichier n'existe pas
            UnsupportedFileFormat: Si le format n'est pas supporté
        """
        logger.info(
            f"Starting import: file={command.file_path}, "
            f"account={command.account_id}, "
            f"auto_categorize={command.auto_categorize}"
        )

        result = ImportResultDTO(account_id=command.account_id)

        try:
            # 1. Valider que le fichier existe
            if not command.file_path.exists():
                raise FileNotFoundError(f"File not found: {command.file_path}")

            # 2. Utiliser l'adapter factory pour parser
            adapter = self.adapter_factory.get_adapter(command.file_path)
            logger.info(f"Using adapter: {adapter.name}")

            # 3. Parser les transactions
            parsed_transactions = adapter.parse(
                command.file_path,
                command.account_id,
                auto_categorize=False,  # On catégorise après
            )
            logger.info(f"Parsed {len(parsed_transactions)} transactions from file")

            # 4. Traiter chaque transaction
            transactions_to_import = []

            for tx in parsed_transactions:
                # Vérifier les doublons
                if self.transaction_repository.exists_by_hash(tx.import_hash):
                    result.skipped_count += 1
                    logger.debug(f"Skipping duplicate: {tx.import_hash[:8]}...")
                    continue

                # Catégoriser si demandé
                if command.auto_categorize:
                    categorization_result = self.categorization_service.categorize(tx)
                    if categorization_result.category_id:
                        tx.category_id = categorization_result.category_id
                        tx.category_confidence = categorization_result.confidence
                        result.categorized_count += 1
                        logger.debug(
                            f"Categorized: {categorization_result.reason} "
                            f"(confidence={categorization_result.confidence})"
                        )

                transactions_to_import.append(tx)

            # 5. Persister les transactions
            if transactions_to_import:
                try:
                    imported = self.transaction_repository.save_many(
                        transactions_to_import
                    )
                    result.imported_count = imported
                    logger.info(f"Successfully imported {imported} transactions")
                except Exception as e:
                    error_msg = f"Error persisting transactions: {str(e)}"
                    result.error_count = len(transactions_to_import)
                    result.errors.append(error_msg)
                    logger.error(error_msg)
                    raise

        except FileNotFoundError as e:
            result.error_count += 1
            result.errors.append(str(e))
            logger.error(f"File error: {e}")
            raise
        except Exception as e:
            result.error_count += 1
            result.errors.append(f"Import failed: {str(e)}")
            logger.error(f"Import error: {e}")
            raise

        logger.info(
            f"Import complete: imported={result.imported_count}, "
            f"skipped={result.skipped_count}, errors={result.error_count}, "
            f"categorized={result.categorized_count}"
        )

        return result
