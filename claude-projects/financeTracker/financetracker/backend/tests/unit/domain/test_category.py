"""
Test suite for Category entity.

Tests la structure hiérarchique, les validations, et les comportements métier.
"""
from __future__ import annotations

import pytest
from datetime import datetime
from typing import Optional
from uuid import uuid4

from src.domain.entities.category import Category, CategoryType


class TestCategoryCreation:
    """Tests pour la création d'une Category."""

    def test_create_root_category(self):
        """Crée une catégorie racine (pas de parent)."""
        category_id = uuid4()

        category = Category(
            id=category_id,
            name="Dépenses",
            category_type=CategoryType.EXPENSE,
            parent_id=None,
        )

        assert category.id == category_id
        assert category.name == "Dépenses"
        assert category.category_type == CategoryType.EXPENSE
        assert category.parent_id is None
        assert category.is_root() is True

    def test_create_child_category(self):
        """Crée une catégorie enfant avec parent."""
        parent_id = uuid4()
        child_id = uuid4()

        category = Category(
            id=child_id,
            name="Alimentation",
            category_type=CategoryType.EXPENSE,
            parent_id=parent_id,
        )

        assert category.parent_id == parent_id
        assert category.is_root() is False

    def test_create_category_with_optional_fields(self):
        """Crée une catégorie avec champs optionnels (icon, color)."""
        category = Category(
            name="Épargne",
            category_type=CategoryType.SAVINGS,
            icon="piggy-bank",
            color="#2ecc71",
            budget_default=500.00,
        )

        assert category.icon == "piggy-bank"
        assert category.color == "#2ecc71"
        assert category.budget_default == 500.00

    def test_invalid_empty_name(self):
        """Lève ValueError si le nom est vide."""
        with pytest.raises(ValueError, match="name cannot be empty"):
            Category(
                name="",
                category_type=CategoryType.EXPENSE,
            )

    def test_circular_parent_reference_prevented(self):
        """Empêche les références circulaires (parent = id)."""
        category_id = uuid4()

        with pytest.raises(ValueError, match="parent_id cannot be the same as id"):
            Category(
                id=category_id,
                name="Test",
                category_type=CategoryType.EXPENSE,
                parent_id=category_id,
            )

    def test_immutable(self):
        """Category est immuable (frozen dataclass)."""
        category = Category(
            name="Alimentation",
            category_type=CategoryType.EXPENSE,
        )

        with pytest.raises(AttributeError):
            category.name = "Courses"


class TestCategoryType:
    """Tests pour l'enum CategoryType."""

    def test_category_type_values(self):
        """Vérifie que tous les types de catégories existent."""
        assert CategoryType.INCOME.value == "income"
        assert CategoryType.EXPENSE.value == "expense"
        assert CategoryType.TRANSFER.value == "transfer"
        assert CategoryType.SAVINGS.value == "savings"

    def test_category_type_from_string(self):
        """Crée CategoryType à partir d'une string."""
        assert CategoryType("income") == CategoryType.INCOME
        assert CategoryType("expense") == CategoryType.EXPENSE


class TestCategoryMethods:
    """Tests pour les méthodes métier."""

    def test_is_root(self):
        """Vérifie si c'est une catégorie racine."""
        root = Category(
            name="Dépenses",
            category_type=CategoryType.EXPENSE,
            parent_id=None,
        )
        child = Category(
            name="Alimentation",
            category_type=CategoryType.EXPENSE,
            parent_id=uuid4(),
        )

        assert root.is_root() is True
        assert child.is_root() is False

    def test_is_expense(self):
        """Vérifie si c'est une catégorie de dépense."""
        expense = Category(
            name="Courses",
            category_type=CategoryType.EXPENSE,
        )
        income = Category(
            name="Salaire",
            category_type=CategoryType.INCOME,
        )

        assert expense.is_expense() is True
        assert income.is_expense() is False

    def test_is_income(self):
        """Vérifie si c'est une catégorie de revenu."""
        income = Category(
            name="Salaire",
            category_type=CategoryType.INCOME,
        )
        expense = Category(
            name="Courses",
            category_type=CategoryType.EXPENSE,
        )

        assert income.is_income() is True
        assert expense.is_income() is False

    def test_matches_keyword_exact(self):
        """Détecte une correspondance exacte avec un mot-clé."""
        category = Category(
            name="Alimentation",
            category_type=CategoryType.EXPENSE,
        )

        # Mot-clé dans la liste
        category_with_keywords = Category(
            name="Alimentation",
            category_type=CategoryType.EXPENSE,
            keywords=["CARREFOUR", "SUPERMARCHE", "MARCHE"],
        )

        assert category_with_keywords.matches_keyword("CARREFOUR") is True
        assert category_with_keywords.matches_keyword("SUPERMARCHE") is True
        assert category_with_keywords.matches_keyword("AUTRE") is False

    def test_matches_keyword_partial(self):
        """Détecte une correspondance partielle avec un mot-clé."""
        category = Category(
            name="Restaurant",
            category_type=CategoryType.EXPENSE,
            keywords=["RESTAURANT", "PIZZERIA", "CAFE"],
        )

        # Test partial match (contains)
        assert category.matches_keyword("RANT") is True  # Partial: RANT in RESTAURANT
        assert category.matches_keyword("PIZZ") is True  # Partial: PIZZ in PIZZERIA
        assert category.matches_keyword("NOTHING") is False

    def test_matches_keyword_case_insensitive(self):
        """Les correspondances ne tiennent pas compte de la casse."""
        category = Category(
            name="Restaurant",
            category_type=CategoryType.EXPENSE,
            keywords=["Restaurant", "Pizzeria"],
        )

        assert category.matches_keyword("restaurant") is True
        assert category.matches_keyword("RESTAURANT") is True
        assert category.matches_keyword("ReSt") is True


class TestCategoryComparison:
    """Tests pour la comparaison."""

    def test_equal_categories(self):
        """Deux catégories avec même ID sont égales."""
        category_id = uuid4()
        cat1 = Category(
            id=category_id,
            name="Alimentation",
            category_type=CategoryType.EXPENSE,
        )
        cat2 = Category(
            id=category_id,
            name="Courses",  # Nom différent mais même ID
            category_type=CategoryType.EXPENSE,
        )

        assert cat1 == cat2

    def test_different_categories(self):
        """Deux catégories avec ID différents ne sont pas égales."""
        cat1 = Category(
            name="Alimentation",
            category_type=CategoryType.EXPENSE,
        )
        cat2 = Category(
            name="Alimentation",
            category_type=CategoryType.EXPENSE,
        )

        assert cat1 != cat2

    def test_hashable(self):
        """Category est hashable (utilisable en set/dict)."""
        category_id = uuid4()
        cat1 = Category(
            id=category_id,
            name="Alimentation",
            category_type=CategoryType.EXPENSE,
        )
        cat2 = Category(
            id=category_id,
            name="Alimentation",
            category_type=CategoryType.EXPENSE,
        )
        cat3 = Category(
            name="Restaurant",
            category_type=CategoryType.EXPENSE,
        )

        s = {cat1, cat2, cat3}

        # cat1 et cat2 sont identiques donc set n'en a que 2
        assert len(s) == 2


class TestCategorySerialization:
    """Tests pour la sérialisation."""

    def test_to_dict(self):
        """Convertit en dictionnaire."""
        category_id = uuid4()
        parent_id = uuid4()

        category = Category(
            id=category_id,
            name="Alimentation",
            category_type=CategoryType.EXPENSE,
            parent_id=parent_id,
            icon="apple",
            color="#FF5733",
            keywords=["CARREFOUR", "MONOPRIX"],
            budget_default=200.00,
        )

        data = category.to_dict()

        assert data["id"] == str(category_id)
        assert data["name"] == "Alimentation"
        assert data["category_type"] == "expense"
        assert data["parent_id"] == str(parent_id)
        assert data["icon"] == "apple"
        assert data["color"] == "#FF5733"
        assert data["keywords"] == ["CARREFOUR", "MONOPRIX"]
        assert data["budget_default"] == 200.00

    def test_from_dict(self):
        """Crée depuis un dictionnaire."""
        category_id = str(uuid4())
        parent_id = str(uuid4())

        data = {
            "id": category_id,
            "name": "Alimentation",
            "category_type": "expense",
            "parent_id": parent_id,
            "icon": "apple",
            "color": "#FF5733",
            "keywords": ["CARREFOUR", "MONOPRIX"],
            "budget_default": 200.00,
        }

        category = Category.from_dict(data)

        assert str(category.id) == category_id
        assert category.name == "Alimentation"
        assert category.category_type == CategoryType.EXPENSE
        assert str(category.parent_id) == parent_id
        assert category.icon == "apple"
        assert category.color == "#FF5733"
        assert category.keywords == ["CARREFOUR", "MONOPRIX"]
        assert category.budget_default == 200.00

    def test_from_dict_with_none_parent(self):
        """Crée depuis un dict avec parent_id=None."""
        data = {
            "id": str(uuid4()),
            "name": "Dépenses",
            "category_type": "expense",
            "parent_id": None,
        }

        category = Category.from_dict(data)

        assert category.parent_id is None
        assert category.is_root() is True


class TestCategoryHierarchy:
    """Tests pour la structure hiérarchique."""

    def test_create_hierarchy(self):
        """Crée une hiérarchie de catégories."""
        # Racine
        expenses_id = uuid4()
        expenses = Category(
            id=expenses_id,
            name="Dépenses",
            category_type=CategoryType.EXPENSE,
        )

        # Enfants
        food = Category(
            name="Alimentation",
            category_type=CategoryType.EXPENSE,
            parent_id=expenses_id,
        )
        transport = Category(
            name="Transport",
            category_type=CategoryType.EXPENSE,
            parent_id=expenses_id,
        )

        # Petits-enfants
        groceries = Category(
            name="Courses",
            category_type=CategoryType.EXPENSE,
            parent_id=food.id,
        )

        assert expenses.is_root() is True
        assert food.parent_id == expenses_id
        assert groceries.parent_id == food.id
        assert groceries.parent_id != expenses_id

    def test_default_categories(self):
        """Crée les catégories par défaut (hiérarchie standard)."""
        # Cette fonction sera utilisée par le seed data
        income_root = Category(
            name="Revenus",
            category_type=CategoryType.INCOME,
        )
        income_salary = Category(
            name="Salaire",
            category_type=CategoryType.INCOME,
            parent_id=income_root.id,
            keywords=["VIREMENT", "PAYE", "SALAIRE"],
        )

        assert income_root.is_root() is True
        assert income_salary.parent_id == income_root.id
        assert income_salary.matches_keyword("VIREMENT") is True
