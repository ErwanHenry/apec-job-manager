"""
Pydantic Schemas for Projection Request/Response
"""
from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional


class ProjectionPointResponse(BaseModel):
    """Single point in projection data."""

    date: str
    balance: str
    net_change: str

    class Config:
        from_attributes = True


class ProjectionResponse(BaseModel):
    """Complete projection response."""

    scenario: str
    starting_balance: str
    ending_balance: str
    min_balance: str
    max_balance: str
    average_balance: str
    total_change: str
    is_critical: bool
    is_warning: bool
    is_healthy: bool
    is_improving: bool
    num_days: int
    num_negative_days: int
    percentage_negative_days: float
    projection_points: list[ProjectionPointResponse]

    class Config:
        from_attributes = True


class ProjectionQueryRequest(BaseModel):
    """Request parameters for projection query."""

    months: int = Field(6, ge=1, le=12, description="Number of months to project (1-12)")
    scenario: str = Field(
        "realistic",
        description="Scenario type: pessimistic, realistic, or optimistic"
    )
