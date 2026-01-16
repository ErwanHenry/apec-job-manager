"""E2E tests for CSV import workflow via API."""
from __future__ import annotations

from pathlib import Path
from uuid import uuid4
import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.infrastructure.persistence.database import initialize_database, DatabaseConfig, get_database
from src.infrastructure.persistence.models import Base
from src.domain.repositories.transaction_repository import TransactionRepository
from src.infrastructure.persistence.repositories.sqlite_transaction_repository import (
    SQLiteTransactionRepository,
)
from tests.factories.account_factory import AccountFactory


@pytest.fixture
def client():
    """Create a test client with in-memory SQLite."""
    # Setup in-memory database
    db_config = DatabaseConfig("sqlite:///:memory:", echo=False)
    db = initialize_database(db_config)

    # Create all tables
    from src.infrastructure.persistence.models import Base as DeclarativeBase
    db.create_all_tables(DeclarativeBase)

    # Create test client
    with TestClient(app) as client:
        yield client


@pytest.fixture
def test_csv_file(tmp_path) -> Path:
    """Create a test LCL CSV file."""
    csv_content = """Date;Date valeur;Libellé;Débit;Crédit
15/01/2025;15/01/2025;CB CARREFOUR;42,50;
20/01/2025;20/01/2025;VIR SEPA CAF;;2400,00
22/01/2025;22/01/2025;CB MONOPRIX;35,75;
25/01/2025;25/01/2025;RETRAIT GUICHET;100,00;
"""
    csv_file = tmp_path / "transactions.csv"
    csv_file.write_text(csv_content, encoding="utf-8")
    return csv_file


class TestImportFlowViaAPI:
    """E2E tests for import workflow through API."""

    def test_health_check(self, client: TestClient):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    def test_create_account_and_import_csv(
        self,
        client: TestClient,
        test_csv_file: Path,
    ):
        """
        E2E test: Create account → Import CSV → Verify transactions imported.
        """
        # 1. Create account
        account_data = {
            "name": "Test Account",
            "bank": "LCL",
            "account_type": "checking",
            "initial_balance": "2500.00",
            "currency": "EUR",
        }

        account_response = client.post("/api/v1/accounts", json=account_data)
        assert account_response.status_code == 201
        account = account_response.json()
        account_id = account["id"]
        assert account["name"] == "Test Account"
        assert account["bank"] == "LCL"

        # 2. Import CSV
        with open(test_csv_file, "rb") as f:
            files = {"file": ("transactions.csv", f, "text/csv")}
            form_data = {
                "account_id": account_id,
                "auto_categorize": "false",
            }
            import_response = client.post(
                "/api/v1/import",
                files=files,
                data=form_data,
            )

        assert import_response.status_code == 200
        import_result = import_response.json()
        assert import_result["imported_count"] == 4
        assert import_result["skipped_count"] == 0
        assert import_result["error_count"] == 0
        assert import_result["total_processed"] == 4
        assert import_result["success_rate"] == 100.0

        # 3. Verify transactions were imported
        list_response = client.get(
            f"/api/v1/transactions?account_id={account_id}"
        )
        assert list_response.status_code == 200
        transactions_list = list_response.json()
        assert transactions_list["total"] == 4
        assert len(transactions_list["items"]) == 4

        # Verify transaction details
        transactions = transactions_list["items"]
        # Sort by date to make assertions predictable
        transactions = sorted(transactions, key=lambda t: t["date"])

        # First transaction: expense
        assert transactions[0]["description"] == "CB CARREFOUR"
        assert transactions[0]["amount"] == "-42.50"

        # Second transaction: income
        assert transactions[1]["description"] == "VIR SEPA CAF"
        assert transactions[1]["amount"] == "2400.00"

    def test_duplicate_import_detection(
        self,
        client: TestClient,
        test_csv_file: Path,
    ):
        """
        E2E test: Import same CSV twice → Verify duplicates are skipped.
        """
        # 1. Create account
        account_data = {
            "name": "Duplicate Test",
            "bank": "LCL",
            "account_type": "checking",
            "initial_balance": "1000.00",
        }
        account_response = client.post("/api/v1/accounts", json=account_data)
        account_id = account_response.json()["id"]

        # 2. Import CSV first time
        with open(test_csv_file, "rb") as f:
            files = {"file": ("transactions.csv", f, "text/csv")}
            form_data = {"account_id": account_id, "auto_categorize": "false"}
            first_import = client.post("/api/v1/import", files=files, data=form_data)

        assert first_import.json()["imported_count"] == 4

        # 3. Import same CSV second time
        with open(test_csv_file, "rb") as f:
            files = {"file": ("transactions.csv", f, "text/csv")}
            form_data = {"account_id": account_id, "auto_categorize": "false"}
            second_import = client.post("/api/v1/import", files=files, data=form_data)

        assert second_import.json()["imported_count"] == 0
        assert second_import.json()["skipped_count"] == 4

    def test_get_projection(self, client: TestClient):
        """
        E2E test: Get projection with default parameters.
        """
        response = client.get("/api/v1/projection")

        assert response.status_code == 200
        projection = response.json()
        assert projection["scenario"] == "realistic"
        assert "starting_balance" in projection
        assert "ending_balance" in projection
        assert "projection_points" in projection
        assert len(projection["projection_points"]) > 0

    def test_get_projection_all_scenarios(self, client: TestClient):
        """
        E2E test: Get projection for all scenario types.
        """
        for scenario in ["pessimistic", "realistic", "optimistic"]:
            response = client.get(f"/api/v1/projection?scenario={scenario}")

            assert response.status_code == 200
            projection = response.json()
            assert projection["scenario"] == scenario

    def test_transaction_update_category(
        self,
        client: TestClient,
        test_csv_file: Path,
    ):
        """
        E2E test: Import → Get transaction → Update category.
        """
        # 1. Create account and import
        account_data = {
            "name": "Category Test",
            "bank": "LCL",
            "account_type": "checking",
            "initial_balance": "1000.00",
        }
        account_response = client.post("/api/v1/accounts", json=account_data)
        account_id = account_response.json()["id"]

        # 2. Import CSV
        with open(test_csv_file, "rb") as f:
            files = {"file": ("transactions.csv", f, "text/csv")}
            form_data = {"account_id": account_id, "auto_categorize": "false"}
            client.post("/api/v1/import", files=files, data=form_data)

        # 3. Get transactions
        list_response = client.get(f"/api/v1/transactions?account_id={account_id}")
        transactions = list_response.json()["items"]
        assert len(transactions) > 0

        transaction_id = transactions[0]["id"]

        # 4. Update category
        category_id = str(uuid4())
        update_data = {
            "category_id": category_id,
            "notes": "Updated via API",
        }
        update_response = client.put(
            f"/api/v1/transactions/{transaction_id}/category",
            json=update_data,
        )

        assert update_response.status_code == 200
        updated_tx = update_response.json()
        assert updated_tx["category_id"] == category_id
        assert updated_tx["notes"] == "Updated via API"

    def test_list_transactions_pagination(
        self,
        client: TestClient,
        test_csv_file: Path,
    ):
        """
        E2E test: Test pagination in transaction listing.
        """
        # Setup: Create account and import
        account_data = {
            "name": "Pagination Test",
            "bank": "LCL",
            "account_type": "checking",
            "initial_balance": "5000.00",
        }
        account_response = client.post("/api/v1/accounts", json=account_data)
        account_id = account_response.json()["id"]

        with open(test_csv_file, "rb") as f:
            files = {"file": ("transactions.csv", f, "text/csv")}
            form_data = {"account_id": account_id}
            client.post("/api/v1/import", files=files, data=form_data)

        # Test pagination
        page1 = client.get(f"/api/v1/transactions?account_id={account_id}&page=1&size=2")
        assert page1.status_code == 200
        data = page1.json()
        assert data["page"] == 1
        assert data["size"] == 2
        assert data["total"] == 4
        assert data["pages"] == 2
        assert len(data["items"]) == 2
