"""
LCL CSV Import Adapter

Parses CSV files from LCL (Le Crédit Lyonnais) bank.

Format:
    Date;Date valeur;Libellé;Débit;Crédit
    15/01/2025;15/01/2025;CB CARREFOUR;42,50;
    20/01/2025;20/01/2025;VIR SEPA CAF;;2400,00

Features:
- French number format (1 234,56 → 1234.56)
- Encoding detection (UTF-8, ISO-8859-1)
- Automatic debit/credit handling
- Import hash generation for deduplication
"""
from __future__ import annotations

import csv
import logging
from pathlib import Path
from decimal import Decimal, InvalidOperation
from datetime import datetime
from uuid import UUID
from typing import Optional

import chardet

from src.infrastructure.import_adapters.base_adapter import ImportAdapter, ParseError, UnsupportedFileFormat
from src.domain.entities.transaction import Transaction
from src.domain.value_objects.money import Money

logger = logging.getLogger(__name__)


class LCLCSVAdapter(ImportAdapter):
    """
    Adapter pour les fichiers CSV de LCL.

    Gère:
    - Détection d'encodage (UTF-8, ISO-8859-1)
    - Format français (virgule décimale, espace milliers)
    - Débits/Crédits séparés en deux colonnes
    - Génération de hash de déduplication
    """

    # Configuration
    EXPECTED_HEADERS = ["Date", "Date valeur", "Libellé", "Débit", "Crédit"]
    DELIMITER = ";"
    DATE_FORMAT = "%d/%m/%Y"
    SUPPORTED_ENCODINGS = ["utf-8", "iso-8859-1", "cp1252"]

    @property
    def name(self) -> str:
        """Nom de l'adaptateur."""
        return "LCL CSV"

    @property
    def supported_extensions(self) -> list[str]:
        """Extensions supportées."""
        return [".csv"]

    def can_parse(self, file_path: Path) -> bool:
        """
        Vérifie si le fichier peut être parsé par cet adaptateur.

        Cherche les en-têtes LCL spécifiques.

        Args:
            file_path: Chemin du fichier

        Returns:
            True si les en-têtes correspondent
        """
        if file_path.suffix.lower() != ".csv":
            return False

        try:
            # Détecter l'encodage
            encoding = self._detect_encoding(file_path)
            if not encoding:
                return False

            # Lire la première ligne
            with open(file_path, "r", encoding=encoding) as f:
                reader = csv.reader(f, delimiter=self.DELIMITER)
                headers = next(reader, None)

                if not headers:
                    return False

                # Vérifier les en-têtes
                headers_normalized = [h.strip() for h in headers]
                return headers_normalized == self.EXPECTED_HEADERS

        except Exception as e:
            logger.debug(f"Error checking LCL CSV format: {e}")
            return False

    def parse(
        self,
        file_path: Path,
        account_id: UUID,
        auto_categorize: bool = False
    ) -> list[Transaction]:
        """
        Parse un fichier CSV LCL et retourne les transactions.

        Args:
            file_path: Chemin du fichier
            account_id: UUID du compte d'importation
            auto_categorize: Si True, essayer de catégoriser automatiquement

        Returns:
            Liste de Transaction entities

        Raises:
            UnsupportedFileFormat: Si le format n'est pas LCL CSV
            ParseError: Si le parsing échoue
        """
        if not file_path.exists():
            raise ParseError(f"File not found: {file_path}")

        if not self.can_parse(file_path):
            raise UnsupportedFileFormat(f"File is not LCL CSV format: {file_path}")

        try:
            # Détecter l'encodage
            encoding = self._detect_encoding(file_path)
            if not encoding:
                raise ParseError(f"Could not detect file encoding: {file_path}")

            logger.info(f"Parsing LCL CSV file with {encoding} encoding: {file_path}")

            transactions = []
            errors = []

            with open(file_path, "r", encoding=encoding) as f:
                reader = csv.DictReader(f, delimiter=self.DELIMITER)

                for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                    try:
                        # Ignorer les lignes vides
                        if not any(row.values()):
                            continue

                        tx = self._parse_row(row, account_id)
                        if tx:
                            transactions.append(tx)

                    except ValueError as e:
                        error_msg = f"Row {row_num}: {str(e)}"
                        errors.append(error_msg)
                        logger.warning(f"Error parsing row: {error_msg}")

            if errors:
                logger.warning(f"Parsing completed with {len(errors)} errors: {errors}")

            logger.info(f"Successfully parsed {len(transactions)} transactions from {file_path}")
            return transactions

        except (UnsupportedFileFormat, ParseError):
            raise
        except Exception as e:
            logger.error(f"Error parsing LCL CSV file: {e}")
            raise ParseError(f"Error parsing file: {e}") from e

    def _detect_encoding(self, file_path: Path) -> Optional[str]:
        """
        Détecte l'encodage du fichier.

        Args:
            file_path: Chemin du fichier

        Returns:
            Nom de l'encodage détecté, ou None
        """
        try:
            with open(file_path, "rb") as f:
                raw_data = f.read(10000)  # Read first 10KB

            detected = chardet.detect(raw_data)
            detected_encoding = detected.get("encoding", "").lower()

            # Vérifier que c'est un encodage supporté
            if detected_encoding and any(supported in detected_encoding for supported in self.SUPPORTED_ENCODINGS):
                return detected_encoding

            # Sinon, essayer UTF-8
            try:
                raw_data.decode("utf-8")
                return "utf-8"
            except UnicodeDecodeError:
                pass

            # Essayer ISO-8859-1 (jamais échoue, c'est un fallback)
            return "iso-8859-1"

        except Exception as e:
            logger.error(f"Error detecting encoding: {e}")
            return None

    def _parse_row(self, row: dict, account_id: UUID) -> Optional[Transaction]:
        """
        Parse une ligne de CSV et retourne une Transaction.

        Args:
            row: Dictionnaire des colonnes
            account_id: UUID du compte

        Returns:
            Transaction entity ou None si ligne vide

        Raises:
            ValueError: Si une valeur ne peut pas être parsée
        """
        # Extraire les champs
        date_str = row.get("Date", "").strip()
        description = row.get("Libellé", "").strip()
        debit_str = row.get("Débit", "").strip()
        credit_str = row.get("Crédit", "").strip()

        # Validation
        if not date_str or not description:
            return None

        if not debit_str and not credit_str:
            return None

        # Parser la date
        try:
            tx_date = datetime.strptime(date_str, self.DATE_FORMAT).date()
        except ValueError as e:
            raise ValueError(f"Invalid date format '{date_str}': {e}")

        # Parser le montant (débit négatif, crédit positif)
        amount = self._parse_amount(debit_str, credit_str)

        # Créer la transaction
        tx = Transaction(
            account_id=account_id,
            date=tx_date,
            amount=Money(amount),
            description=description,
            value_date=None,  # LCL CSV n'inclut pas value_date explicitement
        )

        # Générer le hash de déduplication
        tx.ensure_import_hash()

        return tx

    def _parse_amount(self, debit_str: str, credit_str: str) -> Decimal:
        """
        Parse le montant à partir des colonnes Débit/Crédit.

        Format français: 1 234,56

        Args:
            debit_str: Valeur colonne Débit (vide si crédit)
            credit_str: Valeur colonne Crédit (vide si débit)

        Returns:
            Decimal montant (négatif si débit, positif si crédit)

        Raises:
            ValueError: Si le format ne peut pas être parsé
        """
        debit_str = debit_str.strip()
        credit_str = credit_str.strip()

        # Déterminer si débit ou crédit
        if debit_str and not credit_str:
            # Débit = dépense = négatif
            amount = self._parse_french_decimal(debit_str)
            return -amount
        elif credit_str and not debit_str:
            # Crédit = revenu = positif
            amount = self._parse_french_decimal(credit_str)
            return amount
        else:
            raise ValueError(f"Both debit and credit specified or both empty")

    @staticmethod
    def _parse_french_decimal(value_str: str) -> Decimal:
        """
        Parse un nombre français (virgule décimale, espace milliers).

        Exemples:
            "1 234,56" → Decimal("1234.56")
            "42,50" → Decimal("42.50")
            "1000" → Decimal("1000")

        Args:
            value_str: Chaîne à parser

        Returns:
            Decimal

        Raises:
            ValueError: Si le format ne peut pas être parsé
        """
        value_str = value_str.strip()

        if not value_str:
            raise ValueError("Empty value")

        try:
            # Remplacer séparateur décimal français (virgule) par point
            # Supprimer les espaces de milliers
            value_normalized = value_str.replace(" ", "").replace(",", ".")

            return Decimal(value_normalized)
        except (InvalidOperation, ValueError) as e:
            raise ValueError(f"Cannot parse decimal '{value_str}': {e}")
