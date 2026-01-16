"""Factory for generating realistic Category test data."""
from __future__ import annotations

from uuid import uuid4

from src.domain.entities.category import Category, CategoryType


class CategoryFactory:
    """Factory for creating realistic Category entities."""

    @staticmethod
    def root_income() -> Category:
        """Create root income category."""
        return Category(
            id=uuid4(),
            name="Revenus",
            category_type=CategoryType.INCOME,
            parent_id=None,
        )

    @staticmethod
    def root_expense() -> Category:
        """Create root expense category."""
        return Category(
            id=uuid4(),
            name="Dépenses",
            category_type=CategoryType.EXPENSE,
            parent_id=None,
        )

    @staticmethod
    def root_transfer() -> Category:
        """Create root transfer category."""
        return Category(
            id=uuid4(),
            name="Transferts",
            category_type=CategoryType.TRANSFER,
            parent_id=None,
        )

    @staticmethod
    def income_categories() -> dict[str, Category]:
        """Create a standard income category hierarchy."""
        root = CategoryFactory.root_income()
        categories = {"root": root}

        subcategories = [
            ("Salaire", ["Employeur", "Bonus", "Primes"]),
            ("Freelance", ["Projets", "Hourly"]),
            ("Investissements", ["Dividendes", "Intérêts", "Gains"]),
        ]

        for sub_name, keywords in subcategories:
            sub = Category(
                id=uuid4(),
                name=sub_name,
                category_type=CategoryType.INCOME,
                parent_id=root.id,
            )
            categories[sub_name] = sub

        return categories

    @staticmethod
    def expense_categories() -> dict[str, Category]:
        """Create a standard expense category hierarchy."""
        root = CategoryFactory.root_expense()
        categories = {"root": root}

        subcategories = [
            ("Courses", ["Alimentation", "Supermarché", "Marché"]),
            ("Transport", ["Essence", "Transports en commun", "Maintenance"]),
            ("Logement", ["Loyer", "Charges", "Électricité", "Internet"]),
            ("Loisirs", ["Cinéma", "Restaurants", "Sports", "Hobbies"]),
            ("Santé", ["Médecin", "Pharmacie", "Dentiste", "Assurances"]),
            ("Shopping", ["Vêtements", "Chaussures", "Électronique"]),
            ("Abonnements", ["Netflix", "Spotify", "Gym", "Cloud"]),
        ]

        for sub_name, keywords in subcategories:
            sub = Category(
                id=uuid4(),
                name=sub_name,
                category_type=CategoryType.EXPENSE,
                parent_id=root.id,
            )
            categories[sub_name] = sub

        return categories

    @staticmethod
    def transfer_categories() -> dict[str, Category]:
        """Create a standard transfer category hierarchy."""
        root = CategoryFactory.root_transfer()
        categories = {"root": root}

        subcategories = [
            ("Épargne", ["Livret A", "LDDS", "Investissements"]),
            ("Virement", ["Personnes", "Autres comptes"]),
        ]

        for sub_name, keywords in subcategories:
            sub = Category(
                id=uuid4(),
                name=sub_name,
                category_type=CategoryType.TRANSFER,
                parent_id=root.id,
            )
            categories[sub_name] = sub

        return categories

    @staticmethod
    def full_hierarchy() -> dict[str, Category]:
        """Create a complete category hierarchy (income + expense + transfer)."""
        categories = {}

        categories.update(CategoryFactory.income_categories())
        categories.update(CategoryFactory.expense_categories())
        categories.update(CategoryFactory.transfer_categories())

        return categories

    @staticmethod
    def uncategorized() -> Category:
        """Create the 'Uncategorized' category."""
        return Category(
            id=uuid4(),
            name="Non catégorisé",
            category_type=CategoryType.EXPENSE,
            parent_id=None,
        )
