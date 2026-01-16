"""
Fixtures pytest globales pour tous les tests.

Ce fichier est automatiquement chargé par pytest.
"""
import pytest
from datetime import date
from decimal import Decimal
from uuid import uuid4

# Import des factories quand elles seront créées
# from tests.factories import TransactionFactory, AccountFactory, CategoryFactory


@pytest.fixture
def sample_account_id():
    """UUID d'un compte de test."""
    return uuid4()


@pytest.fixture
def today():
    """Date du jour."""
    return date.today()


@pytest.fixture
def sample_amount():
    """Montant de test."""
    return Decimal("100.00")


# === Database fixtures (pour tests intégration) ===

@pytest.fixture
def in_memory_db():
    """
    Base SQLite en mémoire pour les tests d'intégration.
    
    Usage:
        def test_something(in_memory_db):
            session = in_memory_db
            # ... tests
    """
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    # Import du Base quand il sera créé
    # from src.infrastructure.persistence.models import Base
    
    engine = create_engine("sqlite:///:memory:", echo=False)
    # Base.metadata.create_all(engine)
    
    Session = sessionmaker(bind=engine)
    session = Session()
    
    yield session
    
    session.close()


# === API fixtures (pour tests E2E) ===

@pytest.fixture
def test_client():
    """
    Client HTTP pour les tests E2E.
    
    Usage:
        async def test_endpoint(test_client):
            response = await test_client.get("/health")
            assert response.status_code == 200
    """
    from httpx import AsyncClient, ASGITransport
    from src.main import app
    
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


# === Markers ===

def pytest_configure(config):
    """Configure custom markers."""
    config.addinivalue_line("markers", "unit: Unit tests (fast, no I/O)")
    config.addinivalue_line("markers", "integration: Integration tests (DB, files)")
    config.addinivalue_line("markers", "e2e: End-to-end tests (full app)")
    config.addinivalue_line("markers", "slow: Slow tests (>1s)")
