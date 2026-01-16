"""
Projection API Routes

Handles balance projection queries.
"""
from __future__ import annotations

from typing import Optional
import logging

from fastapi import APIRouter, HTTPException, status, Query

from src.application.queries.get_projection import GetProjectionQuery
from src.domain.value_objects.scenario import Scenario
from src.infrastructure.api.dependencies import get_projection_handler
from src.infrastructure.api.schemas.projection import ProjectionResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["projection"])


@router.get(
    "/projection",
    response_model=ProjectionResponse,
    summary="Get balance projection",
    description="Calculate balance projection for specified number of months and scenario",
)
async def get_projection(
    months: int = Query(6, ge=1, le=12, description="Number of months to project"),
    scenario: str = Query(
        "realistic",
        description="Scenario: pessimistic, realistic, or optimistic",
    ),
) -> ProjectionResponse:
    """
    Get balance projection for the specified period.

    Calculates projected balance based on:
    - Current account balances
    - Active recurring transactions
    - Specified scenario (pessimistic, realistic, optimistic)

    Parameters:
    - **months**: Number of months to project (1-12, default: 6)
    - **scenario**: Projection scenario type (default: realistic)
      - pessimistic: Exclude variable income, add variance to expenses
      - realistic: Use average amounts
      - optimistic: Include max income, reduce variable expenses

    Returns:
    - Detailed projection with daily/monthly balance points and statistics
    """
    try:
        # Validate scenario
        try:
            scenario_enum = Scenario(scenario)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid scenario. Must be one of: {', '.join([s.value for s in Scenario])}",
            )

        # Create and execute query
        query = GetProjectionQuery(months=months, scenario=scenario_enum)
        handler = get_projection_handler()
        result = handler.handle(query)

        logger.info(
            f"Projection calculated: months={months}, scenario={scenario}, "
            f"starting={result.starting_balance}, ending={result.ending_balance}"
        )

        return ProjectionResponse(
            scenario=result.scenario,
            starting_balance=result.starting_balance,
            ending_balance=result.ending_balance,
            min_balance=result.min_balance,
            max_balance=result.max_balance,
            average_balance=result.average_balance,
            total_change=result.total_change,
            is_critical=result.is_critical,
            is_warning=result.is_warning,
            is_healthy=result.is_healthy,
            is_improving=result.is_improving,
            num_days=result.num_days,
            num_negative_days=result.num_negative_days,
            percentage_negative_days=result.percentage_negative_days,
            projection_points=[
                {
                    "date": str(p.date),
                    "balance": p.balance,
                    "net_change": p.net_change,
                }
                for p in result.projection_points
            ],
        )

    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Projection validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Projection error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate projection",
        )
