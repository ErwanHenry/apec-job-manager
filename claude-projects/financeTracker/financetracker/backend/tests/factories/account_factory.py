"""Factory for generating realistic Account test data."""
from __future__ import annotations

from decimal import Decimal
from uuid import uuid4
import random

from faker import Faker

from src.domain.entities.account import Account, AccountType
from src.domain.value_objects.money import Money

fake = Faker("fr_FR")


class AccountFactory:
    """Factory for creating realistic Account entities."""

    @staticmethod
    def checking(
        name: str = None,
        bank: str = None,
        initial_balance: Decimal = None,
    ) -> Account:
        """Create a checking account."""
        if name is None:
            name = "Compte Chèques " + fake.company()

        if bank is None:
            bank = random.choice(["LCL", "BNP Paribas", "Societe Generale", "Crédit Mutuel"])

        if initial_balance is None:
            initial_balance = Decimal(str(round(random.uniform(500, 5000), 2)))

        return Account(
            id=uuid4(),
            name=name,
            bank=bank,
            account_type=AccountType.CHECKING,
            initial_balance=Money(initial_balance, "EUR"),
            currency="EUR",
            is_active=True,
        )

    @staticmethod
    def savings(
        name: str = None,
        bank: str = None,
        initial_balance: Decimal = None,
    ) -> Account:
        """Create a savings account."""
        if name is None:
            name = "Livret A"

        if bank is None:
            bank = random.choice(["LCL", "BNP Paribas", "Caisse d'Epargne"])

        if initial_balance is None:
            initial_balance = Decimal(str(round(random.uniform(1000, 50000), 2)))

        return Account(
            id=uuid4(),
            name=name,
            bank=bank,
            account_type=AccountType.SAVINGS,
            initial_balance=Money(initial_balance, "EUR"),
            currency="EUR",
            is_active=True,
        )

    @staticmethod
    def investment(
        name: str = None,
        bank: str = None,
        initial_balance: Decimal = None,
    ) -> Account:
        """Create an investment account."""
        if name is None:
            name = "PEA " + fake.company()

        if bank is None:
            bank = random.choice(["Degiro", "Interactivebrokers", "BNP Paribas Fortis"])

        if initial_balance is None:
            initial_balance = Decimal(str(round(random.uniform(5000, 100000), 2)))

        return Account(
            id=uuid4(),
            name=name,
            bank=bank,
            account_type=AccountType.INVESTMENT,
            initial_balance=Money(initial_balance, "EUR"),
            currency="EUR",
            is_active=True,
        )

    @staticmethod
    def batch(
        count: int = 3,
        mix_types: bool = True,
    ) -> list[Account]:
        """Create a batch of realistic accounts."""
        accounts = []

        for i in range(count):
            if mix_types:
                account_type = random.choice([
                    AccountFactory.checking(),
                    AccountFactory.savings(),
                    AccountFactory.investment(),
                ])
                accounts.append(account_type)
            else:
                accounts.append(AccountFactory.checking())

        return accounts

    @staticmethod
    def lcl_style(
        name: str = "LCL Courant",
        initial_balance: Decimal = None,
    ) -> Account:
        """Create an account styled like a typical LCL account."""
        if initial_balance is None:
            initial_balance = Decimal("2500.00")

        return Account(
            id=uuid4(),
            name=name,
            bank="LCL",
            account_type=AccountType.CHECKING,
            initial_balance=Money(initial_balance, "EUR"),
            currency="EUR",
            is_active=True,
        )
