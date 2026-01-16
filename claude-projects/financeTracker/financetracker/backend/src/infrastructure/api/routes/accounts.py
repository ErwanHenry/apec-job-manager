"""
Account API Routes

Handles account CRUD operations.
"""
from __future__ import annotations

from uuid import UUID, uuid4
from decimal import Decimal
import logging

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session

from src.domain.entities.account import Account, AccountType
from src.domain.value_objects.money import Money
from src.infrastructure.persistence.database import get_session_local
from src.infrastructure.persistence.repositories.sqlite_account_repository import (
    SQLiteAccountRepository,
)
from src.infrastructure.api.schemas.account import (
    AccountResponse,
    AccountCreateRequest,
    AccountListResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["accounts"], prefix="/accounts")


@router.get(
    "",
    response_model=AccountListResponse,
    summary="List all accounts",
)
async def list_accounts(
    session: Session = Depends(get_session_local),
) -> AccountListResponse:
    """
    Get list of all accounts.

    Returns:
    - List of account details
    """
    try:
        repo = SQLiteAccountRepository(session)
        accounts = repo.find_all()

        return AccountListResponse(
            accounts=[
                AccountResponse(
                    id=acc.id,
                    name=acc.name,
                    bank=acc.bank,
                    account_type=acc.account_type.value,
                    initial_balance=str(acc.initial_balance.amount),
                    currency=acc.initial_balance.currency,
                    is_active=acc.is_active,
                    created_at=acc.created_at,
                    updated_at=acc.updated_at,
                )
                for acc in accounts
            ],
            total=len(accounts),
        )

    except Exception as e:
        logger.error(f"Error listing accounts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve accounts",
        )


@router.post(
    "",
    response_model=AccountResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new account",
)
async def create_account(
    request: AccountCreateRequest,
    session: Session = Depends(get_session_local),
) -> AccountResponse:
    """
    Create a new account.

    Parameters:
    - **name**: Account name
    - **bank**: Bank name
    - **account_type**: Type of account (checking, savings, investment)
    - **initial_balance**: Starting balance (as string)
    - **currency**: Currency code (default: EUR)

    Returns:
    - Created account details
    """
    try:
        # Validate account type
        try:
            account_type = AccountType(request.account_type)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid account_type. Must be one of: {', '.join([t.value for t in AccountType])}",
            )

        # Parse initial balance
        try:
            initial_amount = Decimal(request.initial_balance)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Initial balance must be a valid number",
            )

        # Create account
        account = Account(
            id=uuid4(),
            name=request.name,
            bank=request.bank,
            account_type=account_type,
            initial_balance=Money(initial_amount, request.currency),
            currency=request.currency,
            is_active=True,
        )

        # Save to repository
        repo = SQLiteAccountRepository(session)
        repo.save(account)

        logger.info(f"Account created: {account.id} ({account.name})")

        return AccountResponse(
            id=account.id,
            name=account.name,
            bank=account.bank,
            account_type=account.account_type.value,
            initial_balance=str(account.initial_balance.amount),
            currency=account.initial_balance.currency,
            is_active=account.is_active,
            created_at=account.created_at,
            updated_at=account.updated_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating account: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create account",
        )


@router.get(
    "/{account_id}",
    response_model=AccountResponse,
    summary="Get account by ID",
)
async def get_account(
    account_id: UUID,
    session: Session = Depends(get_session_local),
) -> AccountResponse:
    """
    Get account details by ID.

    Parameters:
    - **account_id**: UUID of the account

    Returns:
    - Account details
    """
    try:
        repo = SQLiteAccountRepository(session)
        account = repo.get_by_id(account_id)

        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Account {account_id} not found",
            )

        return AccountResponse(
            id=account.id,
            name=account.name,
            bank=account.bank,
            account_type=account.account_type.value,
            initial_balance=str(account.initial_balance.amount),
            currency=account.initial_balance.currency,
            is_active=account.is_active,
            created_at=account.created_at,
            updated_at=account.updated_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting account: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve account",
        )
