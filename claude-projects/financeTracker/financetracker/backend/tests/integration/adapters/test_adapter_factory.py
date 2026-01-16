"""
Integration tests for Adapter Factory.

Tests the adapter registry and discovery mechanism.
"""
from __future__ import annotations

import pytest
from pathlib import Path

from src.infrastructure.import_adapters.adapter_factory import AdapterFactory
from src.infrastructure.import_adapters.lcl_csv_adapter import LCLCSVAdapter
from src.infrastructure.import_adapters.base_adapter import UnsupportedFileFormat

# Path to test fixtures
FIXTURES_DIR = Path(__file__).parent.parent.parent / "fixtures"
LCL_SAMPLE = FIXTURES_DIR / "lcl_sample.csv"


@pytest.fixture
def factory() -> AdapterFactory:
    """Provide an adapter factory."""
    return AdapterFactory()


class TestAdapterFactoryRegistry:
    """Tests for adapter registration."""

    def test_factory_has_default_adapters(self, factory: AdapterFactory):
        """La factory a des adaptateurs par défaut."""
        adapters = factory.get_adapters()
        assert len(adapters) > 0

    def test_factory_has_lcl_adapter(self, factory: AdapterFactory):
        """La factory contient l'adaptateur LCL."""
        adapters = factory.get_adapters()
        adapter_names = [a.name for a in adapters]
        assert "LCL CSV" in adapter_names

    def test_register_custom_adapter(self, factory: AdapterFactory):
        """Enregistre un adaptateur personnalisé."""
        initial_count = len(factory.get_adapters())

        # Créer un adaptateur mockito
        class DummyAdapter(LCLCSVAdapter):
            @property
            def name(self) -> str:
                return "Dummy"

        dummy = DummyAdapter()
        factory.register_adapter(dummy)

        adapters = factory.get_adapters()
        assert len(adapters) == initial_count + 1

        names = [a.name for a in adapters]
        assert "Dummy" in names


class TestAdapterFactoryDiscovery:
    """Tests for adapter discovery mechanism."""

    def test_get_adapter_for_lcl_csv(self, factory: AdapterFactory):
        """Trouve l'adaptateur LCL pour un fichier CSV LCL."""
        adapter = factory.get_adapter(LCL_SAMPLE)
        assert isinstance(adapter, LCLCSVAdapter)

    def test_get_adapter_unsupported_format_raises_error(self, factory: AdapterFactory):
        """Lève erreur pour un format non supporté."""
        wrong_file = FIXTURES_DIR / "unsupported.xyz"

        with pytest.raises(UnsupportedFileFormat, match="No adapter found"):
            factory.get_adapter(wrong_file)

    def test_get_adapter_nonexistent_file_raises_error(self, factory: AdapterFactory):
        """Lève erreur pour un fichier inexistant."""
        nonexistent = FIXTURES_DIR / "does_not_exist.csv"

        with pytest.raises(UnsupportedFileFormat, match="File not found"):
            factory.get_adapter(nonexistent)


class TestAdapterFactorySupportedFormats:
    """Tests for supported formats reporting."""

    def test_get_supported_formats(self, factory: AdapterFactory):
        """Retourne une description des formats supportés."""
        formats = factory._get_supported_formats()

        assert "LCL CSV" in formats
        assert ".csv" in formats

    def test_supported_formats_non_empty(self, factory: AdapterFactory):
        """Les formats supportés ne sont pas vides."""
        formats = factory._get_supported_formats()
        assert len(formats) > 0
