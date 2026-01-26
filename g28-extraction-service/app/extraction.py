"""
Claude Vision API integration for G-28 data extraction.
"""

import json
import logging
from typing import Any, Dict, List

import anthropic

logger = logging.getLogger(__name__)

EXTRACTION_PROMPT = """Analyze this G-28 immigration form image and extract the following information as JSON.

Extract these fields if visible:

{
  "attorney": {
    "family_name": "",
    "given_name": "",
    "middle_name": "",
    "firm_name": "",
    "address": {
      "street": "",
      "suite": "",
      "city": "",
      "state": "",
      "zip_code": ""
    },
    "phone": "",
    "email": ""
  },
  "eligibility": {
    "is_attorney": false,
    "bar_number": "",
    "is_accredited_rep": false
  },
  "client": {
    "family_name": "",
    "given_name": "",
    "middle_name": "",
    "phone": "",
    "email": "",
    "alien_number": ""
  }
}

Rules:
- Return ONLY valid JSON, no markdown code blocks or explanation
- Use empty string "" for fields not found or not visible
- Use false for boolean fields if checkbox is not checked or not visible
- Extract phone numbers exactly as written (will be normalized later)
- Extract state names or codes exactly as written (will be normalized later)
- For alien numbers, include any prefix (A-, A) if present
- Extract names exactly as written on the form
- If the form has multiple pages, combine information from all pages
"""


def extract_with_claude(
    base64_images: List[str],
    api_key: str,
    model: str = "claude-sonnet-4-20250514",
    media_type: str = "image/png",
) -> Dict[str, Any]:
    """
    Extract G-28 data using Claude Vision API.

    Args:
        base64_images: List of base64-encoded images
        api_key: Anthropic API key
        model: Claude model to use
        media_type: Media type of images (image/png, image/jpeg)

    Returns:
        Extracted data dictionary

    Raises:
        ValueError: If API call fails or response can't be parsed
    """
    client = anthropic.Anthropic(api_key=api_key)

    # Build content with all page images
    content: List[Dict[str, Any]] = []
    for i, img_base64 in enumerate(base64_images):
        content.append(
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": media_type,
                    "data": img_base64,
                },
            }
        )
        content.append({"type": "text", "text": f"Page {i + 1} of G-28 form"})

    content.append({"type": "text", "text": EXTRACTION_PROMPT})

    logger.info(
        f"Calling Claude API with {len(base64_images)} images, model={model}"
    )

    try:
        response = client.messages.create(
            model=model,
            max_tokens=4096,
            messages=[{"role": "user", "content": content}],
        )
    except anthropic.AuthenticationError as e:
        logger.error(f"Anthropic authentication error: {e}")
        raise ValueError(f"AUTH_ERROR: Invalid API key - {e}")
    except anthropic.BadRequestError as e:
        error_msg = str(e).lower()
        if "credit balance" in error_msg or "billing" in error_msg or "purchase credits" in error_msg:
            logger.error(f"Anthropic billing error: {e}")
            raise ValueError(f"BILLING_ERROR: Insufficient API credits - {e}")
        logger.error(f"Anthropic bad request error: {e}")
        raise ValueError(f"API_ERROR: Bad request - {e}")
    except anthropic.RateLimitError as e:
        logger.error(f"Anthropic rate limit error: {e}")
        raise ValueError(f"RATE_LIMIT_ERROR: API rate limited - {e}")
    except anthropic.APIError as e:
        logger.error(f"Anthropic API error: {e}")
        raise ValueError(f"API_ERROR: Claude API error - {e}")

    # Extract text from response
    response_text = response.content[0].text
    logger.info(f"Claude response length: {len(response_text)} chars")

    # Parse JSON from response
    # Handle potential markdown code blocks
    json_text = response_text.strip()
    if json_text.startswith("```json"):
        json_text = json_text[7:]
    if json_text.startswith("```"):
        json_text = json_text[3:]
    if json_text.endswith("```"):
        json_text = json_text[:-3]
    json_text = json_text.strip()

    try:
        result = json.loads(json_text)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {e}")
        logger.error(f"Response text: {response_text[:500]}...")
        raise ValueError(f"Failed to parse Claude response as JSON: {e}")

    return result


def get_default_extraction_result() -> Dict[str, Any]:
    """
    Return a default empty extraction result structure.

    Returns:
        Empty extraction structure
    """
    return {
        "attorney": {
            "family_name": "",
            "given_name": "",
            "middle_name": "",
            "firm_name": "",
            "address": {
                "street": "",
                "suite": "",
                "city": "",
                "state": "",
                "zip_code": "",
            },
            "phone": "",
            "email": "",
        },
        "eligibility": {
            "is_attorney": False,
            "bar_number": "",
            "is_accredited_rep": False,
        },
        "client": {
            "family_name": "",
            "given_name": "",
            "middle_name": "",
            "phone": "",
            "email": "",
            "alien_number": "",
        },
    }
