"""Page Object Model for Form A-28 target form.

Target form: https://mendrika-alma.github.io/form-submission/

This module provides a clean abstraction over the form's DOM,
encapsulating all selectors and fill logic.
"""

import logging
from typing import Optional
from playwright.async_api import Page, TimeoutError as PlaywrightTimeout

from app.field_mapping import (
    FieldMapping,
    FieldType,
    ALL_FIELD_MAPPINGS,
    get_field_mapping,
)
from app.schemas import FieldResult, FieldStatus, FormA28Input

logger = logging.getLogger(__name__)


class FormA28Page:
    """Page Object for the A-28 immigration form."""

    def __init__(self, page: Page, form_url: str) -> None:
        self.page = page
        self.form_url = form_url
        self.filled_fields: list[FieldResult] = []
        self.skipped_fields: list[FieldResult] = []
        self.failed_fields: list[FieldResult] = []

    async def navigate(self) -> None:
        """Navigate to the form URL."""
        logger.info(f"Navigating to {self.form_url}")
        await self.page.goto(self.form_url, wait_until="networkidle")
        logger.info("Page loaded successfully")

    async def fill_form(self, data: FormA28Input) -> None:
        """Fill all form fields with provided data."""
        data_dict = data.model_dump(by_alias=False)

        for mapping in ALL_FIELD_MAPPINGS:
            value = data_dict.get(mapping.field_name)
            await self._fill_field(mapping, value)

    async def _fill_field(
        self, mapping: FieldMapping, value: Optional[str | bool]
    ) -> None:
        """Fill a single form field."""
        field_name = mapping.field_name
        selector = mapping.selector

        # Skip empty optional fields
        if value is None or value == "":
            if not mapping.required:
                self.skipped_fields.append(
                    FieldResult(
                        fieldName=field_name,
                        status=FieldStatus.SKIPPED,
                        value=None,
                        error="Empty optional field",
                    )
                )
                return
            else:
                self.failed_fields.append(
                    FieldResult(
                        fieldName=field_name,
                        status=FieldStatus.FAILED,
                        value=None,
                        error="Required field is empty",
                    )
                )
                return

        try:
            # Check if element exists
            element = await self.page.query_selector(selector)
            if not element:
                # Try alternative selectors for common patterns
                element = await self._try_alternative_selectors(mapping)
                if not element:
                    logger.warning(f"Element not found: {selector}")
                    self.skipped_fields.append(
                        FieldResult(
                            fieldName=field_name,
                            status=FieldStatus.SKIPPED,
                            value=str(value),
                            error=f"Selector not found: {selector}",
                        )
                    )
                    return

            # Fill based on field type
            if mapping.field_type == FieldType.TEXT:
                await self._fill_text_field(selector, str(value))
            elif mapping.field_type == FieldType.EMAIL:
                await self._fill_text_field(selector, str(value))
            elif mapping.field_type == FieldType.TEL:
                await self._fill_text_field(selector, str(value))
            elif mapping.field_type == FieldType.DATE:
                await self._fill_date_field(selector, str(value))
            elif mapping.field_type == FieldType.SELECT:
                await self._fill_select_field(selector, str(value))
            elif mapping.field_type == FieldType.CHECKBOX:
                await self._fill_checkbox_field(selector, bool(value))
            elif mapping.field_type == FieldType.RADIO:
                await self._fill_radio_field(selector, str(value))

            self.filled_fields.append(
                FieldResult(
                    fieldName=field_name,
                    status=FieldStatus.FILLED,
                    value=str(value),
                    error=None,
                )
            )
            logger.debug(f"Filled {field_name} with value: {value}")

        except PlaywrightTimeout:
            self.failed_fields.append(
                FieldResult(
                    fieldName=field_name,
                    status=FieldStatus.FAILED,
                    value=str(value),
                    error="Timeout waiting for element",
                )
            )
            logger.error(f"Timeout filling {field_name}")
        except Exception as e:
            self.failed_fields.append(
                FieldResult(
                    fieldName=field_name,
                    status=FieldStatus.FAILED,
                    value=str(value),
                    error=str(e),
                )
            )
            logger.error(f"Error filling {field_name}: {e}")

    async def _try_alternative_selectors(
        self, mapping: FieldMapping
    ) -> Optional[object]:
        """Try alternative selector patterns."""
        # Common alternative patterns based on field name
        field_name = mapping.field_name
        alternatives = [
            f'[name="{field_name}"]',
            f'[data-field="{field_name}"]',
            f'#{field_name.replace("_", "-")}',
            f'input[placeholder*="{field_name.replace("_", " ")}"]',
        ]

        for alt_selector in alternatives:
            element = await self.page.query_selector(alt_selector)
            if element:
                logger.info(f"Found alternative selector: {alt_selector}")
                return element
        return None

    async def _fill_text_field(self, selector: str, value: str) -> None:
        """Fill a text input field."""
        await self.page.fill(selector, value)

    async def _fill_date_field(self, selector: str, value: str) -> None:
        """Fill a date input field.

        Expects value in YYYY-MM-DD format.
        """
        await self.page.fill(selector, value)

    async def _fill_select_field(self, selector: str, value: str) -> None:
        """Fill a select dropdown."""
        await self.page.select_option(selector, value)

    async def _fill_checkbox_field(self, selector: str, checked: bool) -> None:
        """Set checkbox state."""
        if checked:
            await self.page.check(selector)
        else:
            await self.page.uncheck(selector)

    async def _fill_radio_field(self, selector: str, value: str) -> None:
        """Select a radio button by value."""
        # For radio buttons, we need to select the specific value
        radio_selector = f'{selector}[value="{value}"]'
        element = await self.page.query_selector(radio_selector)
        if element:
            await self.page.check(radio_selector)
        else:
            # Try clicking by label or other patterns
            await self.page.click(f'{selector}[value="{value}"]')

    async def take_screenshot(self) -> bytes:
        """Take a screenshot of the current page state."""
        return await self.page.screenshot(full_page=True)

    async def verify_no_submit(self) -> bool:
        """Verify that the form was NOT submitted.

        Check that we're still on the form page.
        """
        current_url = self.page.url
        return self.form_url in current_url or current_url == self.form_url
