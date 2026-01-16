"""
Seed initial data for FinanceTracker development.

Creates default category hierarchy and sample accounts.

Usage:
    python scripts/seed_data.py
"""
from __future__ import annotations

import logging
from pathlib import Path
from decimal import Decimal

# Add backend to path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.config import settings
from src.infrastructure.persistence.database import initialize_database, DatabaseConfig
from src.infrastructure.persistence.models import Base
from src.infrastructure.persistence.repositories.sqlite_account_repository import (
    SQLiteAccountRepository,
)
from src.infrastructure.persistence.repositories.sqlite_category_repository import (
    SQLiteCategoryRepository,
)
from src.domain.entities.category import Category, CategoryType
from src.domain.entities.account import Account, AccountType
from src.domain.value_objects.money import Money

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_categories(session) -> dict[str, Category]:
    """Create default category hierarchy."""
    logger.info("Creating default categories...")

    repo = SQLiteCategoryRepository(session)
    categories = {}

    # Income categories
    income_root = Category(
        name="Revenus",
        category_type=CategoryType.INCOME,
        parent_id=None,
    )
    repo.save(income_root)
    categories["income_root"] = income_root

    income_subs = [
        ("Salaire", ["EMPLOYEUR", "SALAIRE", "RMUNERATION"]),
        ("Freelance", ["FREELANCE", "FACTURATION", "MISSION"]),
        ("Autres revenus", ["DIVIDENDE", "INTERETS", "REMBOURSEMENT"]),
    ]

    for sub_name, keywords in income_subs:
        sub = Category(
            name=sub_name,
            category_type=CategoryType.INCOME,
            parent_id=income_root.id,
        )
        repo.save(sub)
        categories[f"income_{sub_name}"] = sub
        logger.info(f"  ✓ Created category: {income_root.name} > {sub_name}")

    # Expense categories
    expense_root = Category(
        name="Dépenses",
        category_type=CategoryType.EXPENSE,
        parent_id=None,
    )
    repo.save(expense_root)
    categories["expense_root"] = expense_root

    expense_subs = [
        (
            "Courses",
            ["CARREFOUR", "MONOPRIX", "LECLERC", "SUPERMARCHE", "BOULANGERIE"],
        ),
        (
            "Transport",
            ["ESSENCE", "RATP", "SNCF", "PARKING", "AUTOROUTE"],
        ),
        (
            "Logement",
            ["LOYER", "EDF", "INTERNET", "EAU", "CHARGES"],
        ),
        (
            "Loisirs",
            ["CINEMA", "RESTAURANT", "SPOTIFY", "NETFLIX", "GYM"],
        ),
        (
            "Santé",
            ["PHARMACIE", "MEDECIN", "DENTISTE", "HOPITAL", "ASSURANCE"],
        ),
        (
            "Shopping",
            ["VETEMENTS", "CHAUSSURES", "AMAZON", "DECATHLON"],
        ),
        (
            "Abonnements",
            ["NETFLIX", "SPOTIFY", "CANAL", "ADOBE", "GITHUB"],
        ),
    ]

    for sub_name, keywords in expense_subs:
        sub = Category(
            name=sub_name,
            category_type=CategoryType.EXPENSE,
            parent_id=expense_root.id,
        )
        repo.save(sub)
        categories[f"expense_{sub_name}"] = sub
        logger.info(f"  ✓ Created category: {expense_root.name} > {sub_name}")

    # Transfer categories
    transfer_root = Category(
        name="Transferts",
        category_type=CategoryType.TRANSFER,
        parent_id=None,
    )
    repo.save(transfer_root)
    categories["transfer_root"] = transfer_root

    transfer_subs = [
        ("Épargne", ["LIVRET", "INVESTISSEMENT", "PLACEMENT"]),
        ("Autres comptes", ["VIREMENT", "VIR SEPA"]),
    ]

    for sub_name, keywords in transfer_subs:
        sub = Category(
            name=sub_name,
            category_type=CategoryType.TRANSFER,
            parent_id=transfer_root.id,
        )
        repo.save(sub)
        categories[f"transfer_{sub_name}"] = sub
        logger.info(f"  ✓ Created category: {transfer_root.name} > {sub_name}")

    logger.info(f"✅ Created {len(categories)} categories")
    return categories


def seed_accounts(session) -> list[Account]:
    """Create sample accounts."""
    logger.info("Creating sample accounts...")

    repo = SQLiteAccountRepository(session)
    accounts = []

    # LCL Checking account
    lcl_account = Account(
        name="LCL Courant",
        bank="LCL",
        account_type=AccountType.CHECKING,
        initial_balance=Money(Decimal("2500.00"), "EUR"),
        currency="EUR",
        is_active=True,
    )
    repo.save(lcl_account)
    accounts.append(lcl_account)
    logger.info(f"  ✓ Created account: {lcl_account.name} ({lcl_account.bank})")

    # Savings account
    savings_account = Account(
        name="Livret A",
        bank="LCL",
        account_type=AccountType.SAVINGS,
        initial_balance=Money(Decimal("10000.00"), "EUR"),
        currency="EUR",
        is_active=True,
    )
    repo.save(savings_account)
    accounts.append(savings_account)
    logger.info(f"  ✓ Created account: {savings_account.name}")

    logger.info(f"✅ Created {len(accounts)} accounts")
    return accounts


def main():
    """Seed the database."""
    logger.info("=" * 50)
    logger.info("🌱 Seeding FinanceTracker database")
    logger.info("=" * 50)

    try:
        # Initialize database
        db_config = DatabaseConfig(
            database_url=settings.database_url,
            echo=settings.debug,
        )
        db = initialize_database(db_config)

        # Create all tables
        logger.info("Creating database tables...")
        db.create_all_tables(Base)
        logger.info("✅ Database tables created")

        # Get session
        with db.get_session_context() as session:
            # Seed data
            seed_categories(session)
            seed_accounts(session)

        logger.info("")
        logger.info("=" * 50)
        logger.info("✅ Database seeding completed!")
        logger.info("=" * 50)
        logger.info("")
        logger.info("Next steps:")
        logger.info("1. Start the API: python -m uvicorn src.main:app --reload")
        logger.info("2. Visit http://localhost:8000/docs for API documentation")
        logger.info("3. Import a CSV file via POST /api/v1/import")
        logger.info("")

    except Exception as e:
        logger.error(f"❌ Seeding failed: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    main()
