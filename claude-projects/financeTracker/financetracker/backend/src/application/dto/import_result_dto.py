"""
DTO: ImportResultDTO

Data Transfer Object for import results.

Used to return results from import operations to the user/API.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from uuid import UUID


@dataclass
class ImportResultDTO:
    """
    Résultat d'une opération d'importation.

    Contains statistics about what was imported, skipped, and any errors.

    Attributes:
        account_id: UUID du compte importé
        imported_count: Nombre de transactions importées
        skipped_count: Nombre de transactions ignorées (doublons, etc.)
        error_count: Nombre d'erreurs pendant l'import
        categorized_count: Nombre de transactions catégorisées
        errors: Liste des messages d'erreur
    """

    account_id: UUID
    imported_count: int = 0
    skipped_count: int = 0
    error_count: int = 0
    categorized_count: int = 0
    errors: list[str] = field(default_factory=list)

    @property
    def total_processed(self) -> int:
        """Total des transactions traitées."""
        return self.imported_count + self.skipped_count + self.error_count

    @property
    def success_rate(self) -> float:
        """Pourcentage de succès."""
        if self.total_processed == 0:
            return 0.0
        return (self.imported_count / self.total_processed) * 100

    @property
    def categorization_rate(self) -> float:
        """Pourcentage de transactions catégorisées."""
        if self.imported_count == 0:
            return 0.0
        return (self.categorized_count / self.imported_count) * 100

    def to_dict(self) -> dict:
        """Convertit en dictionnaire pour sérialisation JSON."""
        return {
            "account_id": str(self.account_id),
            "imported_count": self.imported_count,
            "skipped_count": self.skipped_count,
            "error_count": self.error_count,
            "categorized_count": self.categorized_count,
            "total_processed": self.total_processed,
            "success_rate": round(self.success_rate, 2),
            "categorization_rate": round(self.categorization_rate, 2),
            "errors": self.errors,
        }

    def __str__(self) -> str:
        """Format lisible."""
        return (
            f"Import: {self.imported_count} imported, "
            f"{self.skipped_count} skipped, {self.error_count} errors "
            f"({self.success_rate:.1f}% success)"
        )
