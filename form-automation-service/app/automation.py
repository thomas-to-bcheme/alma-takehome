"""Playwright browser automation for form filling.

Implements singleton browser pattern with isolated contexts per request.
"""

import asyncio
import base64
import logging
import time
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

from playwright.async_api import (
    Browser,
    BrowserContext,
    Playwright,
    async_playwright,
)

from app.page_objects.form_a28_page import FormA28Page
from app.schemas import FieldResult, FillResult, FormA28Input

logger = logging.getLogger(__name__)


class BrowserManager:
    """Singleton browser manager for Playwright.

    Maintains a shared browser instance across requests,
    while creating isolated contexts for each fill operation.
    """

    _instance: Optional["BrowserManager"] = None
    _lock: asyncio.Lock = asyncio.Lock()

    def __init__(self) -> None:
        self._playwright: Optional[Playwright] = None
        self._browser: Optional[Browser] = None
        self._headless: bool = True

    @classmethod
    async def get_instance(cls, headless: bool = True) -> "BrowserManager":
        """Get or create the singleton browser manager."""
        async with cls._lock:
            if cls._instance is None:
                cls._instance = BrowserManager()
                cls._instance._headless = headless
                await cls._instance._initialize()
            return cls._instance

    async def _initialize(self) -> None:
        """Initialize Playwright and browser."""
        logger.info(f"Initializing browser (headless={self._headless})")
        self._playwright = await async_playwright().start()
        self._browser = await self._playwright.chromium.launch(
            headless=self._headless,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
            ],
        )
        logger.info("Browser initialized successfully")

    async def shutdown(self) -> None:
        """Shutdown browser and Playwright."""
        logger.info("Shutting down browser manager")
        if self._browser:
            await self._browser.close()
            self._browser = None
        if self._playwright:
            await self._playwright.stop()
            self._playwright = None
        BrowserManager._instance = None

    @asynccontextmanager
    async def new_context(self) -> AsyncGenerator[BrowserContext, None]:
        """Create an isolated browser context for a fill operation."""
        if not self._browser:
            raise RuntimeError("Browser not initialized")

        context = await self._browser.new_context(
            viewport={"width": 1280, "height": 900},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        )
        try:
            yield context
        finally:
            await context.close()


async def fill_form(
    form_data: FormA28Input,
    form_url: str,
    headless: bool = True,
) -> FillResult:
    """Fill the target form with provided data.

    Args:
        form_data: The form data to fill
        form_url: URL of the target form
        headless: Whether to run browser in headless mode

    Returns:
        FillResult with success status, filled/skipped/failed fields, and screenshot
    """
    start_time = time.time()

    try:
        # Get browser manager
        manager = await BrowserManager.get_instance(headless=headless)

        async with manager.new_context() as context:
            # Create new page
            page = await context.new_page()

            # Create page object
            form_page = FormA28Page(page, form_url)

            # Navigate to form
            await form_page.navigate()

            # Fill all fields
            await form_page.fill_form(form_data)

            # Verify form was not submitted
            if not await form_page.verify_no_submit():
                raise RuntimeError("Form appears to have been submitted unexpectedly")

            # Take screenshot
            screenshot_bytes = await form_page.take_screenshot()
            screenshot_base64 = base64.b64encode(screenshot_bytes).decode("utf-8")

            duration_ms = int((time.time() - start_time) * 1000)

            logger.info(
                f"Form fill completed: {len(form_page.filled_fields)} filled, "
                f"{len(form_page.skipped_fields)} skipped, "
                f"{len(form_page.failed_fields)} failed"
            )

            return FillResult(
                success=len(form_page.failed_fields) == 0,
                filledFields=form_page.filled_fields,
                skippedFields=form_page.skipped_fields,
                failedFields=form_page.failed_fields,
                screenshotBase64=screenshot_base64,
                durationMs=duration_ms,
                error=None,
            )

    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        logger.exception("Form fill failed")
        return FillResult(
            success=False,
            filledFields=[],
            skippedFields=[],
            failedFields=[],
            screenshotBase64=None,
            durationMs=duration_ms,
            error=str(e),
        )


async def shutdown_browser() -> None:
    """Shutdown the browser manager."""
    if BrowserManager._instance:
        await BrowserManager._instance.shutdown()
