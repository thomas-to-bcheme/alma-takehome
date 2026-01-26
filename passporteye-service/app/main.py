"""
FastAPI microservice for passport MRZ extraction using PassportEye.
"""

import os
import logging
from typing import Annotated

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.extraction import extract_from_image, ExtractionResult

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="PassportEye Extraction Service",
    description="MRZ extraction from passport images using PassportEye + Tesseract OCR",
    version="1.0.0",
)

# Configure CORS
# In production, replace "*" with your Vercel domain(s)
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
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "service": "passporteye"}


@app.post("/extract")
async def extract_passport(
    file: Annotated[UploadFile, File(description="Passport image file (JPEG, PNG, or PDF)")]
) -> ExtractionResult:
    """
    Extract MRZ data from a passport image.

    Args:
        file: Passport image file (JPEG, PNG, or PDF, max 10MB)

    Returns:
        ExtractionResult with success status, extracted data, confidence score, and any errors

    Raises:
        HTTPException: If file type is invalid or file is too large
    """
    # Validate file type
    content_type = file.content_type or ""
    if content_type not in ACCEPTED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {content_type}. Accepted: JPEG, PNG, PDF",
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

    # Extract MRZ data
    logger.info(
        "Processing passport extraction request",
        extra={"filename": file.filename, "size": len(content), "content_type": content_type},
    )

    result = extract_from_image(content, file.filename or "image.jpg")

    # Log result (without PII)
    if result["success"]:
        logger.info(
            "Extraction successful",
            extra={"confidence": result["confidence"]},
        )
    else:
        logger.warning(
            "Extraction failed",
            extra={"error": result["error"]},
        )

    return result


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
