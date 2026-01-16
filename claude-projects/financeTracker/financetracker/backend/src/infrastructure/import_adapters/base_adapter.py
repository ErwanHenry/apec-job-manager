"""
Base Import Adapter Interface

Defines the contract for all import adapters (CSV, OFX, Ofx, etc.)

Architecture Hexagonal:
- This is an adapter port for external data sources
- Different implementations handle different file formats
- All adapters must follow this interface
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional
from uuid import UUID

from src.domain.entities.transaction import Transaction


class ImportError(Exception):
    """Base exception for import errors."""
    pass


class UnsupportedFileFormat(ImportError):
    """File format not supported by any adapter."""
    pass


class ParseError(ImportError):
    """Error parsing file content."""
    pass


class ImportAdapter(ABC):
    """
    Abstract base class for all import adapters.

    Each adapter handles a specific file format (CSV, OFX, etc.)
    and converts it to domain Transaction entities.

    Examples:
        >>> adapter = LCLCSVAdapter()
        >>> if adapter.can_parse(Path("statement.csv")):
        ...     transactions = adapter.parse(Path("statement.csv"), account_id)
    """

    @abstractmethod
    def can_parse(self, file_path: Path) -> bool:
        """
        Checks if this adapter can parse the given file.

        Args:
            file_path: Path to the file to check

        Returns:
            True if this adapter can parse the file, False otherwise

        Examples:
            >>> adapter = LCLCSVAdapter()
            >>> adapter.can_parse(Path("lcl_2025_01.csv"))
            True
            >>> adapter.can_parse(Path("statement.ofx"))
            False
        """
        ...

    @abstractmethod
    def parse(
        self,
        file_path: Path,
        account_id: UUID,
        auto_categorize: bool = False
    ) -> list[Transaction]:
        """
        Parses a file and returns Transaction entities.

        Args:
            file_path: Path to the file to parse
            account_id: UUID of the account to import to
            auto_categorize: Whether to attempt automatic categorization

        Returns:
            List of Transaction entities parsed from the file

        Raises:
            UnsupportedFileFormat: If file format is not supported
            ParseError: If parsing fails

        Examples:
            >>> adapter = LCLCSVAdapter()
            >>> transactions = adapter.parse(Path("lcl_2025_01.csv"), account_id)
            >>> len(transactions)
            42
        """
        ...

    @property
    @abstractmethod
    def name(self) -> str:
        """
        Human-readable name of this adapter.

        Returns:
            Name like "LCL CSV" or "OFX"

        Examples:
            >>> adapter = LCLCSVAdapter()
            >>> adapter.name
            "LCL CSV"
        """
        ...

    @property
    @abstractmethod
    def supported_extensions(self) -> list[str]:
        """
        List of file extensions this adapter supports.

        Returns:
            Extensions like [".csv", ".txt"]

        Examples:
            >>> adapter = LCLCSVAdapter()
            >>> adapter.supported_extensions
            [".csv"]
        """
        ...

    def __repr__(self) -> str:
        """Representation of the adapter."""
        return f"<{self.__class__.__name__}: {self.name}>"
