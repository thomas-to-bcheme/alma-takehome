"""
Data normalization utilities for G-28 extracted data.
"""

import re
from typing import Any, Dict

# US State name to 2-letter code mapping
STATE_MAPPING = {
    "alabama": "AL",
    "alaska": "AK",
    "arizona": "AZ",
    "arkansas": "AR",
    "california": "CA",
    "colorado": "CO",
    "connecticut": "CT",
    "delaware": "DE",
    "district of columbia": "DC",
    "florida": "FL",
    "georgia": "GA",
    "hawaii": "HI",
    "idaho": "ID",
    "illinois": "IL",
    "indiana": "IN",
    "iowa": "IA",
    "kansas": "KS",
    "kentucky": "KY",
    "louisiana": "LA",
    "maine": "ME",
    "maryland": "MD",
    "massachusetts": "MA",
    "michigan": "MI",
    "minnesota": "MN",
    "mississippi": "MS",
    "missouri": "MO",
    "montana": "MT",
    "nebraska": "NE",
    "nevada": "NV",
    "new hampshire": "NH",
    "new jersey": "NJ",
    "new mexico": "NM",
    "new york": "NY",
    "north carolina": "NC",
    "north dakota": "ND",
    "ohio": "OH",
    "oklahoma": "OK",
    "oregon": "OR",
    "pennsylvania": "PA",
    "rhode island": "RI",
    "south carolina": "SC",
    "south dakota": "SD",
    "tennessee": "TN",
    "texas": "TX",
    "utah": "UT",
    "vermont": "VT",
    "virginia": "VA",
    "washington": "WA",
    "west virginia": "WV",
    "wisconsin": "WI",
    "wyoming": "WY",
}

# Reverse mapping for validation
STATE_CODES = set(STATE_MAPPING.values())


def normalize_state(state: str) -> str:
    """
    Normalize state to 2-letter code.

    Args:
        state: State name or code (e.g., "California", "CA", "calif")

    Returns:
        2-letter state code or original if not recognized
    """
    if not state:
        return ""

    state = state.strip()

    # Already a valid 2-letter code
    if len(state) == 2 and state.upper() in STATE_CODES:
        return state.upper()

    # Look up full name (case-insensitive)
    normalized = STATE_MAPPING.get(state.lower())
    if normalized:
        return normalized

    # Try partial matching for common abbreviations
    state_lower = state.lower()
    for full_name, code in STATE_MAPPING.items():
        if full_name.startswith(state_lower) or state_lower in full_name:
            return code

    # Return original if no match
    return state


def normalize_phone_e164(phone: str) -> str:
    """
    Normalize phone number to E.164 format (+1XXXXXXXXXX).

    Args:
        phone: Phone number in various formats

    Returns:
        E.164 formatted phone number or original if can't normalize
    """
    if not phone:
        return ""

    # Remove all non-digit characters
    digits = re.sub(r"\D", "", phone)

    # Handle various US formats
    if len(digits) == 10:
        return f"+1{digits}"
    elif len(digits) == 11 and digits.startswith("1"):
        return f"+{digits}"

    # Return original if can't normalize (might be international)
    return phone


def normalize_email(email: str) -> str:
    """
    Normalize email to lowercase, trimmed.

    Args:
        email: Email address

    Returns:
        Normalized email or empty string
    """
    if not email:
        return ""
    return email.strip().lower()


def normalize_alien_number(alien_number: str) -> str:
    """
    Normalize alien number format.

    Args:
        alien_number: A-number (e.g., "A123456789", "123456789")

    Returns:
        Normalized A-number with A- prefix
    """
    if not alien_number:
        return ""

    # Remove whitespace and common prefixes
    cleaned = alien_number.strip().upper()

    # Remove A- or A prefix if present for consistent handling
    if cleaned.startswith("A-"):
        cleaned = cleaned[2:]
    elif cleaned.startswith("A"):
        cleaned = cleaned[1:]

    # Keep only digits
    digits = re.sub(r"\D", "", cleaned)

    if not digits:
        return ""

    # Return with A- prefix
    return f"A-{digits}"


def deep_get(data: Dict[str, Any], *keys: str, default: Any = "") -> Any:
    """
    Safely get nested dictionary value.

    Args:
        data: Dictionary to search
        *keys: Keys to traverse
        default: Default value if not found

    Returns:
        Value at path or default
    """
    result = data
    for key in keys:
        if isinstance(result, dict) and key in result:
            result = result[key]
        else:
            return default
    return result


def normalize_extraction_result(raw_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Apply all normalizations to extracted data.

    Args:
        raw_data: Raw extraction result from Claude

    Returns:
        Normalized data structure
    """
    import copy

    result = copy.deepcopy(raw_data)

    # Normalize attorney fields
    if "attorney" in result:
        attorney = result["attorney"]

        # Normalize address
        if "address" in attorney:
            attorney["address"]["state"] = normalize_state(
                attorney["address"].get("state", "")
            )
            # Trim whitespace from address fields
            for field in ["street", "suite", "city", "zip_code"]:
                if field in attorney["address"]:
                    attorney["address"][field] = attorney["address"][field].strip()

        # Normalize contact info
        attorney["phone"] = normalize_phone_e164(attorney.get("phone", ""))
        attorney["email"] = normalize_email(attorney.get("email", ""))

        # Trim name fields
        for field in ["family_name", "given_name", "middle_name", "firm_name"]:
            if field in attorney:
                attorney[field] = attorney[field].strip()

    # Normalize eligibility fields
    if "eligibility" in result:
        eligibility = result["eligibility"]
        if "bar_number" in eligibility:
            eligibility["bar_number"] = eligibility["bar_number"].strip()

    # Normalize client fields
    if "client" in result:
        client = result["client"]
        client["phone"] = normalize_phone_e164(client.get("phone", ""))
        client["email"] = normalize_email(client.get("email", ""))
        client["alien_number"] = normalize_alien_number(client.get("alien_number", ""))

        # Trim name fields
        for field in ["family_name", "given_name", "middle_name"]:
            if field in client:
                client[field] = client[field].strip()

    return result
