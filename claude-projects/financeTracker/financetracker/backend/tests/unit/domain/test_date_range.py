"""
Test suite for DateRange value object.

Teste l'immuabilité, les validations, et les comportements métier.
"""
from __future__ import annotations

import pytest
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta

from src.domain.value_objects.date_range import DateRange


class TestDateRangeCreation:
    """Tests pour la création d'une DateRange."""

    def test_create_valid_date_range(self):
        """Crée une plage valide: start <= end."""
        start = date(2025, 1, 1)
        end = date(2025, 12, 31)

        dr = DateRange(start, end)

        assert dr.start == start
        assert dr.end == end

    def test_create_single_day_range(self):
        """Crée une plage d'un seul jour: start == end."""
        day = date(2025, 1, 15)

        dr = DateRange(day, day)

        assert dr.start == day
        assert dr.end == day
        assert dr.days() == 1

    def test_invalid_range_start_after_end(self):
        """Lève ValueError si start > end."""
        start = date(2025, 12, 31)
        end = date(2025, 1, 1)

        with pytest.raises(ValueError, match="start must be <= end"):
            DateRange(start, end)

    def test_immutable(self):
        """DateRange est immutable (frozen dataclass)."""
        dr = DateRange(date(2025, 1, 1), date(2025, 12, 31))

        with pytest.raises(AttributeError):
            dr.start = date(2025, 2, 1)


class TestDateRangeDuration:
    """Tests pour le calcul de durée."""

    def test_days_single_day(self):
        """Compte: 1 jour pour une plage d'un jour."""
        day = date(2025, 1, 15)
        dr = DateRange(day, day)

        assert dr.days() == 1

    def test_days_multiple(self):
        """Compte: 31 jours pour 31 janvier + 1er février."""
        start = date(2025, 1, 1)
        end = date(2025, 1, 31)
        dr = DateRange(start, end)

        assert dr.days() == 31

    def test_days_year(self):
        """Compte les jours dans une année."""
        start = date(2025, 1, 1)
        end = date(2025, 12, 31)
        dr = DateRange(start, end)

        assert dr.days() == 365

    def test_months_single_month(self):
        """Compte: 1 mois pour une plage dans le même mois."""
        start = date(2025, 1, 1)
        end = date(2025, 1, 31)
        dr = DateRange(start, end)

        assert dr.months() == 1

    def test_months_multiple(self):
        """Compte: 12 mois pour une année complète."""
        start = date(2025, 1, 1)
        end = date(2025, 12, 31)
        dr = DateRange(start, end)

        assert dr.months() == 12

    def test_months_partial(self):
        """Compte: 2 mois pour janvier + février."""
        start = date(2025, 1, 15)
        end = date(2025, 2, 15)
        dr = DateRange(start, end)

        assert dr.months() == 2  # Janvier 15-31 + février 1-15


class TestDateRangeContainment:
    """Tests pour la vérification de contenance."""

    def test_contains_start_date(self):
        """Contient la date de début."""
        dr = DateRange(date(2025, 1, 1), date(2025, 1, 31))

        assert dr.contains(date(2025, 1, 1))

    def test_contains_end_date(self):
        """Contient la date de fin."""
        dr = DateRange(date(2025, 1, 1), date(2025, 1, 31))

        assert dr.contains(date(2025, 1, 31))

    def test_contains_middle_date(self):
        """Contient une date au milieu."""
        dr = DateRange(date(2025, 1, 1), date(2025, 1, 31))

        assert dr.contains(date(2025, 1, 15))

    def test_not_contains_before_start(self):
        """N'inclut pas une date avant le début."""
        dr = DateRange(date(2025, 1, 1), date(2025, 1, 31))

        assert not dr.contains(date(2024, 12, 31))

    def test_not_contains_after_end(self):
        """N'inclut pas une date après la fin."""
        dr = DateRange(date(2025, 1, 1), date(2025, 1, 31))

        assert not dr.contains(date(2025, 2, 1))


class TestDateRangeOverlap:
    """Tests pour la détection de chevauchement."""

    def test_overlaps_identical_ranges(self):
        """Deux plages identiques se chevauchent."""
        dr1 = DateRange(date(2025, 1, 1), date(2025, 1, 31))
        dr2 = DateRange(date(2025, 1, 1), date(2025, 1, 31))

        assert dr1.overlaps(dr2)
        assert dr2.overlaps(dr1)

    def test_overlaps_partial_overlap(self):
        """Deux plages avec chevauchement partiel."""
        dr1 = DateRange(date(2025, 1, 1), date(2025, 1, 20))
        dr2 = DateRange(date(2025, 1, 15), date(2025, 1, 31))

        assert dr1.overlaps(dr2)
        assert dr2.overlaps(dr1)

    def test_overlaps_touching_boundaries(self):
        """Deux plages qui se touchent (adjacent) se chevauchent."""
        dr1 = DateRange(date(2025, 1, 1), date(2025, 1, 31))
        dr2 = DateRange(date(2025, 1, 31), date(2025, 2, 28))

        assert dr1.overlaps(dr2)
        assert dr2.overlaps(dr1)

    def test_no_overlap_completely_before(self):
        """Deux plages complètement séparées (l'une avant l'autre)."""
        dr1 = DateRange(date(2025, 1, 1), date(2025, 1, 15))
        dr2 = DateRange(date(2025, 1, 20), date(2025, 1, 31))

        assert not dr1.overlaps(dr2)
        assert not dr2.overlaps(dr1)

    def test_one_range_contained_in_other(self):
        """Une plage entièrement contenue dans une autre."""
        dr1 = DateRange(date(2025, 1, 1), date(2025, 1, 31))
        dr2 = DateRange(date(2025, 1, 10), date(2025, 1, 20))

        assert dr1.overlaps(dr2)
        assert dr2.overlaps(dr1)


class TestDateRangeFactoryMethods:
    """Tests pour les factory methods."""

    def test_this_month(self):
        """Crée une plage pour le mois courant."""
        dr = DateRange.this_month()

        today = date.today()
        assert dr.start.month == today.month
        assert dr.start.year == today.year
        assert dr.start.day == 1

        # Dernier jour du mois
        next_month = today + relativedelta(months=1)
        first_of_next = next_month.replace(day=1)
        last_of_month = first_of_next - timedelta(days=1)
        assert dr.end == last_of_month

    def test_last_n_months(self):
        """Crée une plage pour les N derniers mois."""
        dr = DateRange.last_n_months(3)

        today = date.today()
        end_date = today
        start_date = today - relativedelta(months=2)
        start_date = start_date.replace(day=1)

        assert dr.end == end_date
        assert dr.start.day == 1

    def test_last_n_months_zero(self):
        """last_n_months(0) lève ValueError."""
        with pytest.raises(ValueError, match="n must be > 0"):
            DateRange.last_n_months(0)

    def test_current_year(self):
        """Crée une plage pour l'année courante."""
        dr = DateRange.current_year()

        today = date.today()
        assert dr.start == date(today.year, 1, 1)
        assert dr.end == date(today.year, 12, 31)


class TestDateRangeIteration:
    """Tests pour l'itération sur les dates."""

    def test_daily_iteration(self):
        """Itère sur tous les jours de la plage."""
        start = date(2025, 1, 28)
        end = date(2025, 2, 1)
        dr = DateRange(start, end)

        days = list(dr.iter_days())

        expected = [
            date(2025, 1, 28),
            date(2025, 1, 29),
            date(2025, 1, 30),
            date(2025, 1, 31),
            date(2025, 2, 1),
        ]
        assert days == expected

    def test_daily_iteration_single_day(self):
        """Itération sur un seul jour."""
        day = date(2025, 1, 15)
        dr = DateRange(day, day)

        days = list(dr.iter_days())

        assert days == [day]

    def test_monthly_iteration(self):
        """Itère sur tous les mois de la plage."""
        start = date(2024, 11, 15)
        end = date(2025, 2, 15)
        dr = DateRange(start, end)

        months = list(dr.iter_months())

        # Format: (year, month, first_day, last_day)
        assert len(months) == 4
        assert months[0] == (2024, 11)
        assert months[1] == (2024, 12)
        assert months[2] == (2025, 1)
        assert months[3] == (2025, 2)


class TestDateRangeEquality:
    """Tests pour la comparaison."""

    def test_equal_ranges(self):
        """Deux plages identiques sont égales."""
        dr1 = DateRange(date(2025, 1, 1), date(2025, 12, 31))
        dr2 = DateRange(date(2025, 1, 1), date(2025, 12, 31))

        assert dr1 == dr2

    def test_different_ranges_not_equal(self):
        """Deux plages différentes ne sont pas égales."""
        dr1 = DateRange(date(2025, 1, 1), date(2025, 12, 31))
        dr2 = DateRange(date(2025, 1, 1), date(2025, 12, 30))

        assert dr1 != dr2

    def test_hashable(self):
        """DateRange est hashable (utilisable en set/dict)."""
        dr1 = DateRange(date(2025, 1, 1), date(2025, 12, 31))
        dr2 = DateRange(date(2025, 1, 1), date(2025, 12, 31))
        dr3 = DateRange(date(2025, 1, 1), date(2025, 6, 30))

        s = {dr1, dr2, dr3}

        # dr1 et dr2 sont identiques donc set n'en a que 2
        assert len(s) == 2
