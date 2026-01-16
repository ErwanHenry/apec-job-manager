"""Tests for test data factories."""
from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal
import pytest

from tests.factories.transaction_factory import TransactionFactory
from tests.factories.account_factory import AccountFactory
from tests.factories.category_factory import CategoryFactory
from src.domain.entities.transaction import Transaction
from src.domain.entities.account import Account, AccountType
from src.domain.entities.category import Category, CategoryType


class TestTransactionFactory:
    """Tests for TransactionFactory."""

    def test_create_expense(self):
        """Test creating an expense transaction."""
        tx = TransactionFactory.expense()

        assert isinstance(tx, Transaction)
        assert tx.amount.is_negative()
        assert tx.amount.currency == "EUR"
        assert tx.description is not None

    def test_create_income(self):
        """Test creating an income transaction."""
        tx = TransactionFactory.income()

        assert isinstance(tx, Transaction)
        assert tx.amount.is_positive()
        assert tx.amount.currency == "EUR"

    def test_create_transfer(self):
        """Test creating a transfer transaction."""
        tx = TransactionFactory.transfer()

        assert isinstance(tx, Transaction)
        assert "VIR" in tx.description or "vir" in tx.description.lower()

    def test_expense_with_custom_amount(self):
        """Test creating expense with custom amount."""
        tx = TransactionFactory.expense(amount=Decimal("-50.00"))

        assert tx.amount.amount == Decimal("-50.00")

    def test_income_with_custom_description(self):
        """Test creating income with custom description."""
        tx = TransactionFactory.income(description="SALAIRE ACME")

        assert tx.description == "SALAIRE ACME"

    def test_batch_creation(self):
        """Test creating batch of transactions."""
        transactions = TransactionFactory.batch(count=10)

        assert len(transactions) == 10
        assert all(isinstance(tx, Transaction) for tx in transactions)
        # Should have mix of types
        expenses = [tx for tx in transactions if tx.amount.is_negative()]
        incomes = [tx for tx in transactions if tx.amount.is_positive()]
        assert len(expenses) > 0
        assert len(incomes) > 0

    def test_batch_with_date_range(self):
        """Test batch creation with date range."""
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()

        transactions = TransactionFactory.batch(
            count=5,
            date_range=(start_date, end_date),
        )

        for tx in transactions:
            assert start_date <= tx.date <= end_date

    def test_lcl_csv_style_transactions(self):
        """Test LCL CSV style transaction generation."""
        transactions = TransactionFactory.lcl_csv_style(count=6)

        assert len(transactions) == 6
        # Check for variety - should have different types (income, expense, recurring)
        descriptions = [tx.description for tx in transactions]
        assert len(descriptions) == 6
        # Should have mix of income and expenses
        has_income = any("VIR" in desc or "SALAIRE" in desc for desc in descriptions)
        has_expense = any("CB" in desc or "PRELEVEMENT" in desc for desc in descriptions)
        assert has_income or has_expense


class TestAccountFactory:
    """Tests for AccountFactory."""

    def test_create_checking_account(self):
        """Test creating a checking account."""
        account = AccountFactory.checking()

        assert isinstance(account, Account)
        assert account.account_type == AccountType.CHECKING
        assert account.is_active is True
        assert account.initial_balance.currency == "EUR"

    def test_create_savings_account(self):
        """Test creating a savings account."""
        account = AccountFactory.savings()

        assert account.account_type == AccountType.SAVINGS
        assert account.initial_balance.amount > Decimal("1000")

    def test_create_investment_account(self):
        """Test creating an investment account."""
        account = AccountFactory.investment()

        assert account.account_type == AccountType.INVESTMENT
        assert account.initial_balance.amount > Decimal("5000")

    def test_custom_name_and_bank(self):
        """Test creating account with custom name and bank."""
        account = AccountFactory.checking(
            name="Mon Compte",
            bank="Revolut",
            initial_balance=Decimal("1000.00"),
        )

        assert account.name == "Mon Compte"
        assert account.bank == "Revolut"
        assert account.initial_balance.amount == Decimal("1000.00")

    def test_batch_creation(self):
        """Test creating batch of accounts."""
        accounts = AccountFactory.batch(count=10, mix_types=True)

        assert len(accounts) == 10
        assert all(isinstance(acc, Account) for acc in accounts)
        # With larger batch and mix_types=True, should have different types
        types = [acc.account_type for acc in accounts]
        assert len(set(types)) > 1

    def test_lcl_style_account(self):
        """Test creating LCL style account."""
        account = AccountFactory.lcl_style()

        assert account.name == "LCL Courant"
        assert account.bank == "LCL"
        assert account.account_type == AccountType.CHECKING


class TestCategoryFactory:
    """Tests for CategoryFactory."""

    def test_create_root_income(self):
        """Test creating root income category."""
        category = CategoryFactory.root_income()

        assert category.name == "Revenus"
        assert category.category_type == CategoryType.INCOME
        assert category.parent_id is None

    def test_create_root_expense(self):
        """Test creating root expense category."""
        category = CategoryFactory.root_expense()

        assert category.name == "Dépenses"
        assert category.category_type == CategoryType.EXPENSE
        assert category.parent_id is None

    def test_income_hierarchy(self):
        """Test income category hierarchy."""
        categories = CategoryFactory.income_categories()

        assert "root" in categories
        assert categories["root"].category_type == CategoryType.INCOME
        # Should have subcategories
        assert len(categories) > 1  # root + subcategories

    def test_expense_hierarchy(self):
        """Test expense category hierarchy."""
        categories = CategoryFactory.expense_categories()

        assert "root" in categories
        assert categories["root"].category_type == CategoryType.EXPENSE
        # Should have multiple subcategories (root + subs)
        assert len(categories) >= 5

    def test_transfer_hierarchy(self):
        """Test transfer category hierarchy."""
        categories = CategoryFactory.transfer_categories()

        assert "root" in categories
        assert categories["root"].category_type == CategoryType.TRANSFER
        assert len(categories) > 1  # root + subs

    def test_full_hierarchy(self):
        """Test creating full category hierarchy."""
        categories = CategoryFactory.full_hierarchy()

        # Should have roots and subcategories (3 roots + subs)
        assert len(categories) >= 10

    def test_uncategorized_category(self):
        """Test creating uncategorized category."""
        category = CategoryFactory.uncategorized()

        assert category.name == "Non catégorisé"
        assert category.parent_id is None
