"""
Pydantic Schemas for Import Request/Response
"""
from __future__ import annotations

from uuid import UUID
from typing import Optional
from pydantic import BaseModel, Field


class ImportResultResponse(BaseModel):
    """Response schema for import operation."""

    account_id: UUID
    imported_count: int = 0
    skipped_count: int = 0
    error_count: int = 0
    categorized_count: int = 0
    total_processed: int
    success_rate: float
    categorization_rate: float
    errors: list[str] = []

    class Config:
        from_attributes = True
