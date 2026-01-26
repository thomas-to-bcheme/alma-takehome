"""
PassportEye wrapper for MRZ extraction from passport images.
"""

import os
import tempfile
import logging
from typing import Literal
from typing_extensions import TypedDict

from passporteye import read_mrz

logger = logging.getLogger(__name__)


class PassportData(TypedDict):
    """Extracted passport data matching the Next.js schema."""
    documentType: str
    issuingCountry: str
    surname: str
    givenNames: str
    documentNumber: str
    nationality: str
    dateOfBirth: str  # YYYY-MM-DD format
    sex: Literal["M", "F", "X"]
    expirationDate: str  # YYYY-MM-DD format


class ExtractionResult(TypedDict):
    """Result of passport extraction."""
    success: bool
    data: PassportData | None
    confidence: float
    error: str | None


from datetime import datetime

def format_dob_yymmdd_to_iso(date_str: str) -> str:
    """
    Convert MRZ date of birth (YYMMDD) to ISO format (YYYY-MM-DD).
    DOB must be in the past, so we pick the century that results in a past date.
    """
    if not date_str or len(date_str) != 6:
        return ""

    year = int(date_str[:2])
    month = date_str[2:4]
    day = date_str[4:6]

    current_year = datetime.now().year
    current_century = (current_year // 100) * 100  # e.g., 2000

    # Try current century first (2000s)
    full_year = current_century + year

    # If the resulting date is in the future, use previous century
    if full_year > current_year:
        full_year = (current_century - 100) + year

    return f"{full_year}-{month}-{day}"


def format_expiration_yymmdd_to_iso(date_str: str) -> str:
    """
    Convert MRZ expiration date (YYMMDD) to ISO format (YYYY-MM-DD).
    Expiration dates are typically in the future or recent past (within ~10 years).
    Passports are valid for up to 10 years, so we use a window approach.
    """
    if not date_str or len(date_str) != 6:
        return ""

    year = int(date_str[:2])
    month = date_str[2:4]
    day = date_str[4:6]

    current_year = datetime.now().year
    current_century = (current_year // 100) * 100  # e.g., 2000

    # Expiration dates should be within a reasonable window
    # Max ~10 years in future, ~10 years in past (for expired passports)
    full_year_2000s = current_century + year
    full_year_1900s = (current_century - 100) + year

    # Choose the year that falls within reasonable bounds
    # Prefer 2000s if it's within 20 years of current year
    if abs(full_year_2000s - current_year) <= 20:
        full_year = full_year_2000s
    else:
        full_year = full_year_1900s

    return f"{full_year}-{month}-{day}"


def normalize_sex(sex: str | None) -> Literal["M", "F", "X"]:
    """Normalize sex field to M/F/X."""
    if not sex:
        return "X"

    normalized = sex.upper().strip()
    if normalized in ("M", "MALE"):
        return "M"
    if normalized in ("F", "FEMALE"):
        return "F"
    return "X"


def extract_from_image(file_content: bytes, filename: str) -> ExtractionResult:
    """
    Extract passport data from an image using PassportEye.

    Args:
        file_content: Raw bytes of the image file
        filename: Original filename (used for extension detection)

    Returns:
        ExtractionResult with success status, data, and confidence
    """
    # Create temp file with proper extension for PassportEye
    ext = os.path.splitext(filename)[1] if filename else ".jpg"
    if not ext:
        ext = ".jpg"

    try:
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp_file:
            tmp_file.write(file_content)
            tmp_path = tmp_file.name

        # Run PassportEye MRZ extraction
        mrz = read_mrz(tmp_path)

        if mrz is None:
            return {
                "success": False,
                "data": None,
                "confidence": 0.0,
                "error": "No MRZ detected in image",
            }

        # Convert to dictionary for access
        mrz_data = mrz.to_dict()

        # Map PassportEye fields to our schema
        # PassportEye field names: type, country, surname, names, number, nationality,
        # date_of_birth, sex, expiration_date, personal_number, check_*
        passport_data: PassportData = {
            "documentType": mrz_data.get("type", "P"),
            "issuingCountry": mrz_data.get("country", ""),
            "surname": mrz_data.get("surname", ""),
            "givenNames": mrz_data.get("names", ""),
            "documentNumber": mrz_data.get("number", ""),
            "nationality": mrz_data.get("nationality", ""),
            "dateOfBirth": format_dob_yymmdd_to_iso(mrz_data.get("date_of_birth", "")),
            "sex": normalize_sex(mrz_data.get("sex")),
            "expirationDate": format_expiration_yymmdd_to_iso(mrz_data.get("expiration_date", "")),
        }

        # Calculate confidence based on check digit validity
        valid_checks = mrz_data.get("valid_score", 0)
        # PassportEye provides a valid_score from 0-100
        confidence = min(valid_checks / 100.0, 1.0) if valid_checks else 0.98

        logger.info(
            "Successfully extracted MRZ data",
            extra={"confidence": confidence, "country": passport_data["issuingCountry"]},
        )

        return {
            "success": True,
            "data": passport_data,
            "confidence": confidence,
            "error": None,
        }

    except Exception as e:
        logger.exception("PassportEye extraction failed")
        return {
            "success": False,
            "data": None,
            "confidence": 0.0,
            "error": str(e),
        }
    finally:
        # Clean up temp file
        try:
            os.unlink(tmp_path)
        except (OSError, UnboundLocalError):
            pass
