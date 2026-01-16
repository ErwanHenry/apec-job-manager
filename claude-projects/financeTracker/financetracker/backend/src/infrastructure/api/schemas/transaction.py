"""
Pydantic Schemas for Transaction Request/Response

Used for API request validation and response serialization.
"""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, Field


class TransactionResponse(BaseModel):
    """Transaction response schema for API."""

    id: UUID
    account_id: UUID
    date: date
    value_date: date
    amount: str = Field(description="Amount as string to preserve precision")
    currency: str
    description: str
    category_id: Optional[UUID] = None
    category_confidence: float = 0.0
    is_recurring: bool = False
    recurring_id: Optional[UUID] = None
    tags: list[str] = []
    notes: str = ""
    import_hash: str = ""
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TransactionCreateRequest(BaseModel):
    """Request schema for creating a transaction."""

    account_id: UUID
    date: date
    value_date: Optional[date] = None
    amount: str = Field(description="Amount as string")
    currency: str = "EUR"
    description: str
    category_id: Optional[UUID] = None
    notes: str = ""


class TransactionUpdateRequest(BaseModel):
    """Request schema for updating a transaction."""

    category_id: Optional[UUID] = None
    notes: Optional[str] = None
    tags: Optional[list[str]] = None

    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    """Paginated list of transactions."""

    items: list[TransactionResponse]
    total: int
    page: int
    size: int
    pages: int

    @property
    def has_next(self) -> bool:
        """Check if there are more pages."""
        return page < pages

    @property
    def has_previous(self) -> bool:
        """Check if there are previous pages."""
        return page > 1
