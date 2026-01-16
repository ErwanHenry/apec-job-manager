"""
Transaction API Routes

Handles transaction listing, retrieval, and updates.
"""
from __future__ import annotations

from datetime import date
from uuid import UUID
from typing import Optional
import logging

from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session

from src.domain.value_objects.date_range import DateRange
from src.infrastructure.persistence.database import get_session_local
from src.infrastructure.persistence.repositories.sqlite_transaction_repository import (
    SQLiteTransactionRepository,
)
from src.infrastructure.api.schemas.transaction import (
    TransactionResponse,
    TransactionListResponse,
    TransactionUpdateRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["transactions"], prefix="/transactions")


@router.get(
    "",
    response_model=TransactionListResponse,
    summary="List transactions",
    description="Get paginated list of transactions with optional filters",
)
async def list_transactions(
    account_id: Optional[UUID] = Query(None, description="Filter by account ID"),
    date_from: Optional[date] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    category_id: Optional[UUID] = Query(None, description="Filter by category ID"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    size: int = Query(100, ge=1, le=500, description="Page size (max 500)"),
    session: Session = Depends(get_session_local),
) -> TransactionListResponse:
    """
    Get paginated list of transactions.

    Parameters:
    - **account_id**: Filter by account (optional)
    - **date_from**: Filter transactions from this date (optional)
    - **date_to**: Filter transactions to this date (optional)
    - **category_id**: Filter by category (optional)
    - **page**: Page number for pagination (default: 1)
    - **size**: Number of items per page (default: 100, max: 500)

    Returns:
    - Paginated list of transactions with metadata
    """
    try:
        repo = SQLiteTransactionRepository(session)

        # Build filters
        if date_from and date_to:
            date_range = DateRange(date_from, date_to)
        elif date_from:
            date_range = DateRange(date_from, date.today())
        elif date_to:
            # Assume one year back if only date_to is provided
            import datetime
            one_year_ago = date_to.replace(year=date_to.year - 1)
            date_range = DateRange(one_year_ago, date_to)
        else:
            date_range = None

        # Fetch transactions based on filters
        if account_id:
            offset = (page - 1) * size
            transactions = repo.find_by_account(
                account_id=account_id,
                date_range=date_range,
                limit=size,
                offset=offset,
            )
            # Count for pagination
            total = repo.count_by_account(account_id)
        elif category_id:
            transactions = repo.find_by_category(
                category_id=category_id,
                date_range=date_range,
            )
            total = len(transactions)
        elif date_range:
            transactions = repo.find_by_date_range(date_range)
            total = len(transactions)
        else:
            # Return empty if no filters
            transactions = []
            total = 0

        # Calculate pagination
        pages = (total + size - 1) // size

        return TransactionListResponse(
            items=[
                TransactionResponse(
                    id=tx.id,
                    account_id=tx.account_id,
                    date=tx.date,
                    value_date=tx.value_date,
                    amount=str(tx.amount.amount),
                    currency=tx.amount.currency,
                    description=tx.description,
                    category_id=tx.category_id,
                    category_confidence=tx.category_confidence,
                    is_recurring=tx.is_recurring,
                    recurring_id=tx.recurring_id,
                    tags=tx.tags,
                    notes=tx.notes,
                    import_hash=tx.import_hash,
                    created_at=tx.created_at,
                    updated_at=tx.updated_at,
                )
                for tx in transactions
            ],
            total=total,
            page=page,
            size=size,
            pages=pages,
        )

    except Exception as e:
        logger.error(f"Error listing transactions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve transactions",
        )


@router.get(
    "/{transaction_id}",
    response_model=TransactionResponse,
    summary="Get transaction by ID",
)
async def get_transaction(
    transaction_id: UUID,
    session: Session = Depends(get_session_local),
) -> TransactionResponse:
    """
    Get a single transaction by its ID.

    Parameters:
    - **transaction_id**: UUID of the transaction

    Returns:
    - Transaction details
    """
    try:
        repo = SQLiteTransactionRepository(session)
        transaction = repo.get_by_id(transaction_id)

        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transaction {transaction_id} not found",
            )

        return TransactionResponse(
            id=transaction.id,
            account_id=transaction.account_id,
            date=transaction.date,
            value_date=transaction.value_date,
            amount=str(transaction.amount.amount),
            currency=transaction.amount.currency,
            description=transaction.description,
            category_id=transaction.category_id,
            category_confidence=transaction.category_confidence,
            is_recurring=transaction.is_recurring,
            recurring_id=transaction.recurring_id,
            tags=transaction.tags,
            notes=transaction.notes,
            import_hash=transaction.import_hash,
            created_at=transaction.created_at,
            updated_at=transaction.updated_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting transaction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve transaction",
        )


@router.put(
    "/{transaction_id}/category",
    response_model=TransactionResponse,
    summary="Assign category to transaction",
)
async def update_transaction_category(
    transaction_id: UUID,
    request: TransactionUpdateRequest,
    session: Session = Depends(get_session_local),
) -> TransactionResponse:
    """
    Update transaction category assignment.

    Parameters:
    - **transaction_id**: UUID of the transaction
    - **category_id**: New category UUID (optional)
    - **notes**: Transaction notes (optional)

    Returns:
    - Updated transaction
    """
    try:
        repo = SQLiteTransactionRepository(session)
        transaction = repo.get_by_id(transaction_id)

        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transaction {transaction_id} not found",
            )

        # Update fields
        if request.category_id:
            transaction.category_id = request.category_id
        if request.notes is not None:
            transaction.notes = request.notes
        if request.tags is not None:
            transaction.tags = request.tags

        # Save changes
        repo.save(transaction)

        return TransactionResponse(
            id=transaction.id,
            account_id=transaction.account_id,
            date=transaction.date,
            value_date=transaction.value_date,
            amount=str(transaction.amount.amount),
            currency=transaction.amount.currency,
            description=transaction.description,
            category_id=transaction.category_id,
            category_confidence=transaction.category_confidence,
            is_recurring=transaction.is_recurring,
            recurring_id=transaction.recurring_id,
            tags=transaction.tags,
            notes=transaction.notes,
            import_hash=transaction.import_hash,
            created_at=transaction.created_at,
            updated_at=transaction.updated_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating transaction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update transaction",
        )
