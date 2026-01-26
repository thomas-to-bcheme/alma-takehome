"""
FastAPI microservice for G-28 data extraction using Claude Vision.
"""

import base64
import logging
import os
from typing import Annotated

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.extraction import extract_with_claude, get_default_extraction_result
from app.normalization import normalize_extraction_result
from app.pdf_processing import get_image_media_type, pdf_to_images
from app.schemas import G28Data, G28ExtractionResult

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="G-28 Extraction Service",
    description="Extract structured data from G-28 immigration forms using Claude Vision",
    version="1.0.0",
)

# Configure CORS
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# Accepted file types
ACCEPTED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "service": "g28-extraction"}


@app.post("/extract")
async def extract_g28(
    file: Annotated[
        UploadFile, File(description="G-28 PDF or image file (JPEG, PNG, PDF)")
    ]
) -> G28ExtractionResult:
    """
    Extract G-28 data using Claude Vision API.

    Args:
        file: G-28 PDF or image file (max 10MB)

    Returns:
        G28ExtractionResult with success status, extracted data, confidence, and any errors

    Raises:
        HTTPException: If file type is invalid or file is too large
    """
    # Validate file type
    content_type = file.content_type or ""
    if content_type not in ACCEPTED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {content_type}. Accepted: PDF, JPEG, PNG",
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        size_mb = len(content) / (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"File too large: {size_mb:.1f}MB. Maximum: 10MB",
        )

    # Log request (without PII)
    logger.info(
        "Processing G-28 extraction request",
        extra={
            "filename": file.filename,
            "size": len(content),
            "content_type": content_type,
        },
    )

    try:
        # Convert to images based on file type
        if content_type == "application/pdf":
            base64_images = pdf_to_images(content, max_pages=4)
            media_type = "image/png"
        else:
            base64_images = [base64.b64encode(content).decode("utf-8")]
            media_type = get_image_media_type(content_type)

        # Get API configuration
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not configured")

        model = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")

        # Extract with Claude Vision
        raw_data = extract_with_claude(
            base64_images,
            api_key,
            model=model,
            media_type=media_type,
        )

        # Normalize the extracted data
        normalized_data = normalize_extraction_result(raw_data)

        # Convert to Pydantic model for validation
        g28_data = G28Data(**normalized_data)

        logger.info(
            "G-28 extraction successful",
            extra={"confidence": 0.95},
        )

        return G28ExtractionResult(
            success=True,
            data=g28_data,
            confidence=0.95,
            error=None,
        )

    except ValueError as e:
        logger.warning(f"Extraction validation error: {e}")
        return G28ExtractionResult(
            success=False,
            data=None,
            confidence=0.0,
            error=str(e),
        )
    except Exception as e:
        logger.exception("G-28 extraction failed")
        return G28ExtractionResult(
            success=False,
            data=None,
            confidence=0.0,
            error=f"Extraction failed: {str(e)}",
        )


@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception) -> JSONResponse:
    """Handle unexpected errors without exposing internals."""
    logger.exception("Unexpected error")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "data": None,
            "confidence": 0.0,
            "error": "Internal server error",
        },
    )
