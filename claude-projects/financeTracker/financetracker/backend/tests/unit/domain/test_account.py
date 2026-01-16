"""
Test suite for Account entity.

Tests l'identité, les validations, et les comportements métier.
"""
from __future__ import annotations

import pytest
from decimal import Decimal
from uuid import uuid4
from datetime import date

from src.domain.entities.account import Account, AccountType
from src.domain.value_objects.money import Money


class TestAccountCreation:
    """Tests pour la création d'un Account."""

    def test_create_valid_account(self):
        """Crée un compte valide avec les champs obligatoires."""
        account_id = uuid4()
        name = "LCL Courant"
        account_type = AccountType.CHECKING

        account = Account(
            id=account_id,
            name=name,
            bank="LCL",
            account_type=account_type,
            initial_balance=Money(Decimal("1000.00")),
            currency="EUR",
        )

        assert account.id == account_id
        assert account.name == name
        assert account.bank == "LCL"
        assert account.account_type == account_type
        assert account.initial_balance == Money(Decimal("1000.00"))
        assert account.currency == "EUR"
        assert account.is_active is True

    def test_create_account_with_defaults(self):
        """Crée un compte avec defaults générés automatiquement."""
        account = Account(
            name="Mon Épargne",
            bank="BNP",
            account_type=AccountType.SAVINGS,
        )

        assert account.id is not None
        assert account.name == "Mon Épargne"
        assert account.initial_balance == Money.zero()
        assert account.currency == "EUR"
        assert account.is_active is True

    def test_invalid_empty_name(self):
        """Lève ValueError si le nom est vide."""
        with pytest.raises(ValueError, match="name cannot be empty"):
            Account(
                name="",
                bank="LCL",
                account_type=AccountType.CHECKING,
            )

    def test_invalid_currency(self):
        """Lève ValueError si devise n'est pas valide."""
        with pytest.raises(ValueError, match="currency must be 3 characters"):
            Account(
                name="Test",
                bank="LCL",
                account_type=AccountType.CHECKING,
                currency="INVALID",
            )

    def test_immutable(self):
        """Account est immuable (frozen dataclass)."""
        account = Account(
            name="Test",
            bank="LCL",
            account_type=AccountType.CHECKING,
        )

        with pytest.raises(AttributeError):
            account.name = "Changed"


class TestAccountType:
    """Tests pour l'enum AccountType."""

    def test_account_type_values(self):
        """Vérifie que tous les types d'accounts existent."""
        assert AccountType.CHECKING.value == "checking"
        assert AccountType.SAVINGS.value == "savings"
        assert AccountType.INVESTMENT.value == "investment"

    def test_account_type_from_string(self):
        """Crée AccountType à partir d'une string."""
        assert AccountType("checking") == AccountType.CHECKING
        assert AccountType("savings") == AccountType.SAVINGS
        assert AccountType("investment") == AccountType.INVESTMENT


class TestAccountMethods:
    """Tests pour les méthodes métier du Account."""

    def test_is_checking(self):
        """Vérifie si c'est un compte courant."""
        checking = Account(
            name="Courant",
            bank="LCL",
            account_type=AccountType.CHECKING,
        )
        savings = Account(
            name="Épargne",
            bank="LCL",
            account_type=AccountType.SAVINGS,
        )

        assert checking.is_checking() is True
        assert savings.is_checking() is False

    def test_is_savings(self):
        """Vérifie si c'est un compte épargne."""
        savings = Account(
            name="Épargne",
            bank="LCL",
            account_type=AccountType.SAVINGS,
        )
        checking = Account(
            name="Courant",
            bank="LCL",
            account_type=AccountType.CHECKING,
        )

        assert savings.is_savings() is True
        assert checking.is_savings() is False

    def test_is_investment(self):
        """Vérifie si c'est un compte d'investissement."""
        investment = Account(
            name="Bourse",
            bank="Interactive Brokers",
            account_type=AccountType.INVESTMENT,
        )
        checking = Account(
            name="Courant",
            bank="LCL",
            account_type=AccountType.CHECKING,
        )

        assert investment.is_investment() is True
        assert checking.is_investment() is False

    def test_deactivate(self):
        """Désactive un compte."""
        account = Account(
            name="Vieux compte",
            bank="LCL",
            account_type=AccountType.CHECKING,
            is_active=True,
        )

        # Impossible de modifier, mais on peut créer une version désactivée
        deactivated = Account(
            id=account.id,
            name=account.name,
            bank=account.bank,
            account_type=account.account_type,
            initial_balance=account.initial_balance,
            is_active=False,
        )

        assert deactivated.is_active is False

    def test_get_import_hash(self):
        """Génère un hash pour déduplication à l'import."""
        account = Account(
            name="LCL Courant",
            bank="LCL",
            account_type=AccountType.CHECKING,
        )

        # Le hash doit être basé sur (bank, account_type, name)
        hash1 = account.get_import_hash()
        assert isinstance(hash1, str)
        assert len(hash1) == 64  # SHA256 hex = 64 chars

        # Même account = même hash
        account2 = Account(
            name="LCL Courant",
            bank="LCL",
            account_type=AccountType.CHECKING,
        )
        assert account.get_import_hash() == account2.get_import_hash()

        # Différents comptes = différents hashes
        account3 = Account(
            name="BNP Courant",
            bank="BNP",
            account_type=AccountType.CHECKING,
        )
        assert account.get_import_hash() != account3.get_import_hash()


class TestAccountComparison:
    """Tests pour la comparaison."""

    def test_equal_accounts(self):
        """Deux comptes avec même ID sont égaux."""
        account_id = uuid4()
        acc1 = Account(
            id=account_id,
            name="LCL Courant",
            bank="LCL",
            account_type=AccountType.CHECKING,
        )
        acc2 = Account(
            id=account_id,
            name="LCL Courant - Renommé",  # Même ID mais nom différent
            bank="LCL",
            account_type=AccountType.CHECKING,
        )

        assert acc1 == acc2

    def test_different_accounts(self):
        """Deux comptes avec ID différents ne sont pas égaux."""
        acc1 = Account(
            name="LCL Courant",
            bank="LCL",
            account_type=AccountType.CHECKING,
        )
        acc2 = Account(
            name="LCL Courant",
            bank="LCL",
            account_type=AccountType.CHECKING,
        )

        assert acc1 != acc2

    def test_hashable(self):
        """Account est hashable (utilisable en set/dict)."""
        account_id = uuid4()
        acc1 = Account(
            id=account_id,
            name="LCL Courant",
            bank="LCL",
            account_type=AccountType.CHECKING,
        )
        acc2 = Account(
            id=account_id,
            name="LCL Courant",
            bank="LCL",
            account_type=AccountType.CHECKING,
        )
        acc3 = Account(
            name="BNP Courant",
            bank="BNP",
            account_type=AccountType.CHECKING,
        )

        s = {acc1, acc2, acc3}

        # acc1 et acc2 sont identiques donc set n'en a que 2
        assert len(s) == 2


class TestAccountSerialization:
    """Tests pour la sérialisation."""

    def test_to_dict(self):
        """Convertit en dictionnaire."""
        account_id = uuid4()
        account = Account(
            id=account_id,
            name="LCL Courant",
            bank="LCL",
            account_type=AccountType.CHECKING,
            initial_balance=Money(Decimal("1234.56")),
            currency="EUR",
        )

        data = account.to_dict()

        assert data["id"] == str(account_id)
        assert data["name"] == "LCL Courant"
        assert data["bank"] == "LCL"
        assert data["account_type"] == "checking"
        assert data["currency"] == "EUR"
        assert data["is_active"] is True

    def test_from_dict(self):
        """Crée depuis un dictionnaire."""
        account_id = str(uuid4())
        data = {
            "id": account_id,
            "name": "LCL Courant",
            "bank": "LCL",
            "account_type": "checking",
            "initial_balance": {
                "amount": "1234.56",
                "currency": "EUR",
            },
            "currency": "EUR",
            "is_active": True,
        }

        account = Account.from_dict(data)

        assert str(account.id) == account_id
        assert account.name == "LCL Courant"
        assert account.bank == "LCL"
        assert account.account_type == AccountType.CHECKING
        assert account.initial_balance == Money(Decimal("1234.56"), "EUR")
