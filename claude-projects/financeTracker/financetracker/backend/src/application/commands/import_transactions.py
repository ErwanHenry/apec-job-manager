"""
Command: ImportTransactions

Represent a user request to import transactions from a CSV file.

This is part of the application layer (use case orchestration).
Commands represent user intent and are processed by handlers.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from uuid import UUID


@dataclass
class ImportTransactionsCommand:
    """
    Commande pour importer des transactions depuis un fichier CSV.

    Cas d'usage: Utilisateur upload un fichier CSV (LCL) et le système
    importe les transactions dans son compte.

    Args:
        file_path: Chemin du fichier CSV
        account_id: UUID du compte d'importation
        auto_categorize: Si True, catégoriser automatiquement

    Examples:
        >>> cmd = ImportTransactionsCommand(
        ...     file_path=Path("lcl_2025_01.csv"),
        ...     account_id=UUID(...),
        ...     auto_categorize=True
        ... )
        >>> # handler.handle(cmd)  # Traité par ImportHandler
    """

    file_path: Path
    account_id: UUID
    auto_categorize: bool = True

    def __post_init__(self):
        """Valide la commande."""
        if not self.file_path or not str(self.file_path).strip():
            raise ValueError("file_path cannot be empty")
        if not self.account_id:
            raise ValueError("account_id is required")

    def __repr__(self) -> str:
        """Représentation technique."""
        return (
            f"ImportTransactionsCommand("
            f"file={self.file_path.name}, "
            f"account={self.account_id}, "
            f"auto_cat={self.auto_categorize})"
        )
