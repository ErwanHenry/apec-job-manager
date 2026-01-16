"""
Integration tests for LCL CSV Adapter.

Tests parsing of real LCL CSV files with various formats and edge cases.
"""
from __future__ import annotations

import pytest
from pathlib import Path
from decimal import Decimal
from uuid import uuid4
from datetime import date

from src.infrastructure.import_adapters.lcl_csv_adapter import LCLCSVAdapter, ParseError, UnsupportedFileFormat
from src.domain.value_objects.money import Money

# Path to test fixtures
FIXTURES_DIR = Path(__file__).parent.parent.parent / "fixtures"
LCL_SAMPLE = FIXTURES_DIR / "lcl_sample.csv"


@pytest.fixture
def adapter() -> LCLCSVAdapter:
    """Provide an LCL CSV adapter."""
    return LCLCSVAdapter()


@pytest.fixture
def account_id() -> str:
    """A test account ID."""
    return str(uuid4())


class TestLCLCSVAdapterProperties:
    """Tests for adapter properties."""

    def test_adapter_name(self, adapter: LCLCSVAdapter):
        """Vérifie le nom de l'adaptateur."""
        assert adapter.name == "LCL CSV"

    def test_supported_extensions(self, adapter: LCLCSVAdapter):
        """Vérifie les extensions supportées."""
        assert adapter.supported_extensions == [".csv"]

    def test_adapter_repr(self, adapter: LCLCSVAdapter):
        """Vérifie la représentation."""
        repr_str = repr(adapter)
        assert "LCLCSVAdapter" in repr_str
        assert "LCL CSV" in repr_str


class TestLCLCSVAdapterFormatDetection:
    """Tests for file format detection."""

    def test_can_parse_lcl_csv(self, adapter: LCLCSVAdapter):
        """Détecte un fichier LCL CSV valide."""
        assert adapter.can_parse(LCL_SAMPLE) is True

    def test_can_parse_wrong_extension(self, adapter: LCLCSVAdapter):
        """Rejette un fichier non-CSV."""
        wrong_file = FIXTURES_DIR / "nonexistent.txt"
        assert adapter.can_parse(wrong_file) is False

    def test_can_parse_nonexistent_file(self, adapter: LCLCSVAdapter):
        """Rejette un fichier inexistant."""
        nonexistent = FIXTURES_DIR / "nonexistent_file.csv"
        assert adapter.can_parse(nonexistent) is False


class TestLCLCSVAdapterParsing:
    """Tests for parsing LCL CSV files."""

    def test_parse_valid_file(self, adapter: LCLCSVAdapter, account_id: str):
        """Parse un fichier LCL valide."""
        transactions = adapter.parse(LCL_SAMPLE, uuid4())

        assert len(transactions) == 7
        assert all(tx.account_id is not None for tx in transactions)
        assert all(tx.import_hash for tx in transactions)

    def test_parse_transactions_values(self, adapter: LCLCSVAdapter):
        """Vérifie les valeurs parsées."""
        account_id = uuid4()
        transactions = adapter.parse(LCL_SAMPLE, account_id)

        # Vérifier la première transaction (débit)
        tx1 = transactions[0]
        assert tx1.date == date(2025, 1, 15)
        assert tx1.description == "CB CARREFOUR"
        assert tx1.amount == Money(Decimal("-42.50"))
        assert tx1.is_expense()

        # Vérifier une transaction de crédit
        salaire = [tx for tx in transactions if "SALAIRE" in tx.description][0]
        assert salaire.date == date(2025, 1, 17)
        assert salaire.amount == Money(Decimal("3500.00"))
        assert salaire.is_income()

    def test_parse_deduplication_hash_unique(self, adapter: LCLCSVAdapter):
        """Chaque transaction a un hash unique."""
        transactions = adapter.parse(LCL_SAMPLE, uuid4())

        hashes = {tx.import_hash for tx in transactions}
        assert len(hashes) == len(transactions)

    def test_parse_debit_credit_handling(self, adapter: LCLCSVAdapter):
        """Gère correctement débits et crédits."""
        transactions = adapter.parse(LCL_SAMPLE, uuid4())

        # Les débits doivent être négatifs
        debits = [tx for tx in transactions if tx.is_expense()]
        assert len(debits) > 0
        for tx in debits:
            assert tx.amount.amount < 0

        # Les crédits doivent être positifs
        credits = [tx for tx in transactions if tx.is_income()]
        assert len(credits) > 0
        for tx in credits:
            assert tx.amount.amount > 0

    def test_parse_unsupported_format_raises_error(self, adapter: LCLCSVAdapter):
        """Lève erreur pour un fichier non-LCL."""
        wrong_file = FIXTURES_DIR / "wrong_format.csv"
        account_id = uuid4()

        with pytest.raises(UnsupportedFileFormat):
            adapter.parse(wrong_file, account_id)

    def test_parse_nonexistent_file_raises_error(self, adapter: LCLCSVAdapter):
        """Lève erreur pour un fichier inexistant."""
        nonexistent = FIXTURES_DIR / "does_not_exist.csv"
        account_id = uuid4()

        with pytest.raises(ParseError, match="File not found"):
            adapter.parse(nonexistent, account_id)


class TestLCLCSVAdapterFrenchFormat:
    """Tests for French number format parsing."""

    def test_parse_french_decimal_with_thousands_separator(self, adapter: LCLCSVAdapter):
        """Parse les nombres avec séparateur de milliers français."""
        # 1 234,56 (français) → 1234.56 (decimal)
        result = adapter._parse_french_decimal("1 234,56")
        assert result == Decimal("1234.56")

    def test_parse_french_decimal_no_thousands(self, adapter: LCLCSVAdapter):
        """Parse les nombres sans séparateur de milliers."""
        result = adapter._parse_french_decimal("42,50")
        assert result == Decimal("42.50")

    def test_parse_french_decimal_large_number(self, adapter: LCLCSVAdapter):
        """Parse les grands nombres français."""
        result = adapter._parse_french_decimal("1 234 567,89")
        assert result == Decimal("1234567.89")

    def test_parse_french_decimal_whole_number(self, adapter: LCLCSVAdapter):
        """Parse les nombres entiers."""
        result = adapter._parse_french_decimal("1000")
        assert result == Decimal("1000")

    def test_parse_french_decimal_empty_raises_error(self, adapter: LCLCSVAdapter):
        """Lève erreur pour une chaîne vide."""
        with pytest.raises(ValueError, match="Empty value"):
            adapter._parse_french_decimal("")

    def test_parse_french_decimal_invalid_raises_error(self, adapter: LCLCSVAdapter):
        """Lève erreur pour un format invalide."""
        with pytest.raises(ValueError, match="Cannot parse decimal"):
            adapter._parse_french_decimal("invalid123")


class TestLCLCSVAdapterAmountParsing:
    """Tests for debit/credit amount parsing."""

    def test_parse_amount_debit(self, adapter: LCLCSVAdapter):
        """Parse un débit (dépense)."""
        amount = adapter._parse_amount("42,50", "")
        assert amount == Decimal("-42.50")

    def test_parse_amount_credit(self, adapter: LCLCSVAdapter):
        """Parse un crédit (revenu)."""
        amount = adapter._parse_amount("", "3500,00")
        assert amount == Decimal("3500.00")

    def test_parse_amount_both_specified_raises_error(self, adapter: LCLCSVAdapter):
        """Lève erreur si débit ET crédit spécifiés."""
        with pytest.raises(ValueError, match="Both debit and credit"):
            adapter._parse_amount("42,50", "100,00")

    def test_parse_amount_neither_specified_raises_error(self, adapter: LCLCSVAdapter):
        """Lève erreur si ni débit ni crédit."""
        with pytest.raises(ValueError, match="Both debit and credit"):
            adapter._parse_amount("", "")

    def test_parse_amount_whitespace_handling(self, adapter: LCLCSVAdapter):
        """Gère les espaces blancs."""
        amount = adapter._parse_amount("  42,50  ", "  ")
        assert amount == Decimal("-42.50")


class TestLCLCSVAdapterEncodingDetection:
    """Tests for encoding detection."""

    def test_detect_encoding_utf8(self, adapter: LCLCSVAdapter):
        """Détecte l'encodage UTF-8."""
        encoding = adapter._detect_encoding(LCL_SAMPLE)
        assert encoding is not None
        # UTF-8 or compatible
        assert "utf" in encoding.lower() or "iso" in encoding.lower()

    def test_detect_encoding_nonexistent_returns_none(self, adapter: LCLCSVAdapter):
        """Retourne None pour un fichier inexistant."""
        nonexistent = FIXTURES_DIR / "does_not_exist.csv"
        encoding = adapter._detect_encoding(nonexistent)
        assert encoding is None
