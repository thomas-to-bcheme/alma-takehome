"""FastAPI application for form automation service.

Provides endpoints for health check and form filling.
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.automation import fill_form, shutdown_browser
from app.schemas import FillResult, FormA28Input

# Configure logging
logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler for startup/shutdown."""
    logger.info("Form automation service starting up")
    yield
    logger.info("Form automation service shutting down")
    await shutdown_browser()


app = FastAPI(
    title="Form Automation Service",
    description="Automate form filling using Playwright",
    version="1.0.0",
    lifespan=lifespan,
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

# Target form URL from environment
TARGET_FORM_URL = os.environ.get(
    "TARGET_FORM_URL",
    "https://mendrika-alma.github.io/form-submission/",
)
HEADLESS = os.environ.get("HEADLESS", "true").lower() == "true"


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "form-automation",
        "target_form": TARGET_FORM_URL,
    }


@app.post("/fill", response_model=FillResult)
async def fill_target_form(form_data: FormA28Input) -> FillResult:
    """Fill the target form with provided data.

    Accepts FormA28Data JSON and returns fill result with screenshot.
    Does NOT submit the form.
    """
    logger.info("Received form fill request")

    try:
        result = await fill_form(
            form_data=form_data,
            form_url=TARGET_FORM_URL,
            headless=HEADLESS,
        )

        if not result.success and result.error:
            logger.error(f"Form fill failed: {result.error}")

        return result

    except Exception as e:
        logger.exception("Unexpected error during form fill")
        raise HTTPException(
            status_code=500,
            detail=f"Form fill failed: {str(e)}",
        )


@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception) -> JSONResponse:
    """Handle unexpected errors."""
    logger.exception("Unexpected error")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "filledFields": [],
            "skippedFields": [],
            "failedFields": [],
            "screenshotBase64": None,
            "durationMs": 0,
            "error": "Internal server error",
        },
    )
