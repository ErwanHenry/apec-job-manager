"""
Import Adapter Factory

Registry and factory for all import adapters.

Provides a simple way to get the right adapter for a file
without needing to know about specific implementations.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

from src.infrastructure.import_adapters.base_adapter import ImportAdapter, UnsupportedFileFormat
from src.infrastructure.import_adapters.lcl_csv_adapter import LCLCSVAdapter

logger = logging.getLogger(__name__)


class AdapterFactory:
    """
    Factory pour obtenir l'adaptateur approprié pour un fichier.

    Gère l'enregistrement et la découverte des adapters.

    Examples:
        >>> factory = AdapterFactory()
        >>> adapter = factory.get_adapter(Path("lcl_export.csv"))
        >>> adapter.name
        "LCL CSV"
    """

    def __init__(self):
        """Initialize adapter registry."""
        self._adapters: list[ImportAdapter] = [
            LCLCSVAdapter(),
            # Additional adapters can be registered here
            # OFXAdapter(),
            # BoursoramaCSVAdapter(),
        ]

    def get_adapter(self, file_path: Path) -> ImportAdapter:
        """
        Obtient un adaptateur capable de parser le fichier.

        Itère sur les adapters enregistrés et retourne le premier
        qui peut parser le fichier.

        Args:
            file_path: Chemin du fichier

        Returns:
            ImportAdapter capable de parser le fichier

        Raises:
            UnsupportedFileFormat: Si aucun adaptateur ne peut parser le fichier

        Examples:
            >>> factory = AdapterFactory()
            >>> adapter = factory.get_adapter(Path("lcl_2025_01.csv"))
            >>> isinstance(adapter, LCLCSVAdapter)
            True
        """
        if not file_path.exists():
            raise UnsupportedFileFormat(f"File not found: {file_path}")

        # Itérer sur les adapters
        for adapter in self._adapters:
            try:
                if adapter.can_parse(file_path):
                    logger.debug(f"Using adapter {adapter.name} for {file_path.name}")
                    return adapter
            except Exception as e:
                logger.debug(f"Adapter {adapter.name} check failed: {e}")
                continue

        # Aucun adaptateur ne peut parser le fichier
        raise UnsupportedFileFormat(
            f"No adapter found for file: {file_path.name}\n"
            f"Supported formats: {self._get_supported_formats()}"
        )

    def register_adapter(self, adapter: ImportAdapter) -> None:
        """
        Enregistre un nouvel adaptateur.

        Args:
            adapter: ImportAdapter instance
        """
        self._adapters.append(adapter)
        logger.info(f"Registered adapter: {adapter.name}")

    def get_adapters(self) -> list[ImportAdapter]:
        """
        Retourne tous les adaptateurs enregistrés.

        Returns:
            List of ImportAdapter instances
        """
        return self._adapters.copy()

    def _get_supported_formats(self) -> str:
        """
        Retourne une description des formats supportés.

        Returns:
            String like "LCL CSV (*.csv)"
        """
        formats = []
        for adapter in self._adapters:
            ext_list = ", ".join(adapter.supported_extensions)
            formats.append(f"{adapter.name} ({ext_list})")

        return ", ".join(formats)
