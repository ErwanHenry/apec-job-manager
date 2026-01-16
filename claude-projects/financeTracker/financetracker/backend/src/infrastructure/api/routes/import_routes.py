"""
Import API Routes

Handles CSV file imports with automatic deduplication and categorization.
"""
from __future__ import annotations

from pathlib import Path
from uuid import UUID
import logging
import tempfile

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from fastapi.responses import JSONResponse

from src.application.commands.import_transactions import ImportTransactionsCommand
from src.infrastructure.api.dependencies import get_import_handler
from src.infrastructure.api.schemas.import_request import ImportResultResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["import"])


@router.post(
    "/import",
    response_model=ImportResultResponse,
    summary="Import CSV transactions",
    description="Upload a CSV file to import transactions with deduplication and auto-categorization",
    responses={
        200: {"description": "Import completed"},
        400: {"description": "Invalid file format"},
        422: {"description": "Validation error"},
    },
)
async def import_transactions(
    file: UploadFile = File(..., description="CSV file to import"),
    account_id: UUID = Form(..., description="Target account UUID"),
    auto_categorize: bool = Form(True, description="Automatically categorize transactions"),
) -> ImportResultResponse:
    """
    Import transactions from a CSV file.

    Supports:
    - LCL CSV format (French bank export)
    - Automatic duplicate detection via import_hash
    - Automatic categorization (optional)

    Parameters:
    - **file**: CSV file (multipart upload)
    - **account_id**: UUID of the target account
    - **auto_categorize**: Whether to auto-categorize (default: true)

    Returns:
    - Import statistics (imported, skipped, errors, categorized)
    """
    logger.info(f"Import request: file={file.filename}, account_id={account_id}")

    # Validate file
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided",
        )

    if not file.content_type or "csv" not in file.content_type.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Expected CSV.",
        )

    try:
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".csv",
            prefix=f"import_{account_id}_",
        ) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = Path(tmp.name)

        # Process import
        handler = get_import_handler()
        command = ImportTransactionsCommand(
            file_path=tmp_path,
            account_id=account_id,
            auto_categorize=auto_categorize,
        )

        result = handler.handle(command)
        logger.info(
            f"Import complete: imported={result.imported_count}, "
            f"skipped={result.skipped_count}, errors={result.error_count}"
        )

        # Clean up temp file
        tmp_path.unlink(missing_ok=True)

        return ImportResultResponse(
            account_id=result.account_id,
            imported_count=result.imported_count,
            skipped_count=result.skipped_count,
            error_count=result.error_count,
            categorized_count=result.categorized_count,
            total_processed=result.total_processed,
            success_rate=result.success_rate,
            categorization_rate=result.categorization_rate,
            errors=result.errors,
        )

    except ValueError as e:
        logger.error(f"Import validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Import error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Import failed: {str(e)}",
        )
