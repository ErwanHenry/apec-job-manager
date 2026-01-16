"""Factory for generating realistic Transaction test data."""
from __future__ import annotations

from datetime import date, datetime, timedelta
from decimal import Decimal
from uuid import uuid4
import random

from faker import Faker

from src.domain.entities.transaction import Transaction
from src.domain.value_objects.money import Money

fake = Faker("fr_FR")


class TransactionFactory:
    """Factory for creating realistic Transaction entities."""

    @staticmethod
    def expense(
        account_id=None,
        amount: Decimal = None,
        description: str = None,
        date_obj: date = None,
        category_id=None,
    ) -> Transaction:
        """Create an expense transaction."""
        if account_id is None:
            account_id = uuid4()

        if amount is None:
            amount = Decimal(str(round(random.uniform(-100, -10), 2)))
        elif amount > 0:
            amount = -amount

        if description is None:
            vendors = [
                "CARREFOUR",
                "MONOPRIX",
                "BOULANGERIE",
                "PHARMACIE",
                "SPOTIFY",
                "NETFLIX",
                "ESSENCE",
                "RESTAURANT",
            ]
            description = fake.word() + " " + random.choice(vendors)

        if date_obj is None:
            date_obj = date.today() - timedelta(days=random.randint(0, 30))

        return Transaction(
            account_id=account_id,
            date=date_obj,
            value_date=date_obj,
            amount=Money(amount, "EUR"),
            description=description,
            category_id=category_id,
        )

    @staticmethod
    def income(
        account_id=None,
        amount: Decimal = None,
        description: str = None,
        date_obj: date = None,
        category_id=None,
    ) -> Transaction:
        """Create an income transaction."""
        if account_id is None:
            account_id = uuid4()

        if amount is None:
            amount = Decimal(str(round(random.uniform(100, 5000), 2)))
        elif amount < 0:
            amount = -amount

        if description is None:
            sources = ["SALAIRE", "FREELANCE", "REMBOURSEMENT", "DIVIDENDE"]
            description = random.choice(sources) + " " + fake.company()

        if date_obj is None:
            date_obj = date.today() - timedelta(days=random.randint(0, 30))

        return Transaction(
            account_id=account_id,
            date=date_obj,
            value_date=date_obj,
            amount=Money(amount, "EUR"),
            description=description,
            category_id=category_id,
        )

    @staticmethod
    def transfer(
        account_id=None,
        amount: Decimal = None,
        description: str = None,
        date_obj: date = None,
    ) -> Transaction:
        """Create a transfer transaction."""
        if account_id is None:
            account_id = uuid4()

        if amount is None:
            # Transfers can be positive or negative
            amount = Decimal(str(round(random.uniform(-500, 500), 2)))

        if description is None:
            description = "VIR SEPA " + fake.name()

        if date_obj is None:
            date_obj = date.today() - timedelta(days=random.randint(0, 30))

        return Transaction(
            account_id=account_id,
            date=date_obj,
            value_date=date_obj,
            amount=Money(amount, "EUR"),
            description=description,
        )

    @staticmethod
    def batch(
        count: int = 10,
        account_id=None,
        date_range: tuple[date, date] = None,
    ) -> list[Transaction]:
        """Create a batch of realistic transactions."""
        if account_id is None:
            account_id = uuid4()

        transactions = []
        for _ in range(count):
            # Mix of income, expense, and transfers
            tx_type = random.choice(["expense", "income", "transfer"])

            if date_range:
                start_date, end_date = date_range
                days_diff = (end_date - start_date).days
                random_date = start_date + timedelta(days=random.randint(0, days_diff))
            else:
                random_date = None

            if tx_type == "income":
                tx = TransactionFactory.income(
                    account_id=account_id,
                    date_obj=random_date,
                )
            elif tx_type == "transfer":
                tx = TransactionFactory.transfer(
                    account_id=account_id,
                    date_obj=random_date,
                )
            else:
                tx = TransactionFactory.expense(
                    account_id=account_id,
                    date_obj=random_date,
                )

            transactions.append(tx)

        return transactions

    @staticmethod
    def lcl_csv_style(
        account_id=None,
        count: int = 5,
    ) -> list[Transaction]:
        """Create transactions that look like LCL CSV exports."""
        if account_id is None:
            account_id = uuid4()

        transactions = []
        lcl_vendors = [
            "CB CARREFOUR",
            "CB MONOPRIX",
            "VIR SEPA EMPLOYEUR",
            "PRELEVEMENT NETFLIX",
            "DEPOT CHEQUE",
            "RETRAIT GUICHET",
            "FRAIS DE GESTION",
        ]

        for i in range(count):
            if i % 3 == 0:
                # Income
                tx = Transaction(
                    account_id=account_id,
                    date=date.today() - timedelta(days=30 - i),
                    value_date=date.today() - timedelta(days=30 - i),
                    amount=Money(Decimal("2500.00"), "EUR"),
                    description="VIR SEPA EMPLOYEUR ACME",
                )
            elif i % 3 == 1:
                # Expense
                vendor = random.choice(lcl_vendors[:3])
                tx = Transaction(
                    account_id=account_id,
                    date=date.today() - timedelta(days=30 - i),
                    value_date=date.today() - timedelta(days=30 - i),
                    amount=Money(Decimal(str(-random.randint(10, 100))), "EUR"),
                    description=vendor,
                )
            else:
                # Subscription/recurring
                vendor = random.choice(lcl_vendors[4:])
                tx = Transaction(
                    account_id=account_id,
                    date=date.today() - timedelta(days=30 - i),
                    value_date=date.today() - timedelta(days=30 - i),
                    amount=Money(Decimal(str(-random.randint(5, 20))), "EUR"),
                    description=vendor,
                    is_recurring=True,
                )

            transactions.append(tx)

        return transactions
