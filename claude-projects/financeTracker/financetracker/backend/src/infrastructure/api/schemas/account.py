"""
Pydantic Schemas for Account Request/Response
"""
from __future__ import annotations

from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class AccountResponse(BaseModel):
    """Account response schema for API."""

    id: UUID
    name: str
    bank: str
    account_type: str
    initial_balance: str
    currency: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AccountCreateRequest(BaseModel):
    """Request schema for creating an account."""

    name: str = Field(..., min_length=1, max_length=100)
    bank: str = Field(..., min_length=1, max_length=100)
    account_type: str = Field(..., description="checking, savings, or investment")
    initial_balance: str = Field(default="0", description="Initial balance as string")
    currency: str = Field(default="EUR", max_length=3)


class AccountListResponse(BaseModel):
    """List of accounts response."""

    accounts: list[AccountResponse]
    total: int

    class Config:
        from_attributes = True
