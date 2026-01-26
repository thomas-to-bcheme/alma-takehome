"""
PDF to image conversion using pdf2image.
"""

import base64
import io
import logging
from typing import List

from pdf2image import convert_from_bytes
from PIL import Image

logger = logging.getLogger(__name__)


def pdf_to_images(pdf_bytes: bytes, max_pages: int = 4, dpi: int = 300) -> List[str]:
    """
    Convert PDF to base64-encoded PNG images.

    Args:
        pdf_bytes: Raw PDF file content
        max_pages: Maximum pages to process (G-28 is typically 2-4 pages)
        dpi: Resolution for conversion (300 recommended for OCR)

    Returns:
        List of base64-encoded PNG images
    """
    logger.info(f"Converting PDF to images (max_pages={max_pages}, dpi={dpi})")

    images = convert_from_bytes(
        pdf_bytes,
        dpi=dpi,
        fmt="png",
        first_page=1,
        last_page=max_pages,
    )

    base64_images = []
    for i, img in enumerate(images):
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        base64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
        base64_images.append(base64_str)
        logger.info(f"Converted page {i + 1}, size: {len(base64_str)} bytes")

    return base64_images


def image_to_base64(image_bytes: bytes, content_type: str) -> str:
    """
    Convert image bytes to base64 string.

    Args:
        image_bytes: Raw image file content
        content_type: MIME type of the image

    Returns:
        Base64-encoded image string
    """
    return base64.b64encode(image_bytes).decode("utf-8")


def get_image_media_type(content_type: str) -> str:
    """
    Get the media type for Claude Vision API from content type.

    Args:
        content_type: MIME type (e.g., 'image/jpeg', 'image/png')

    Returns:
        Media type string for Claude API
    """
    media_type_map = {
        "image/jpeg": "image/jpeg",
        "image/jpg": "image/jpeg",
        "image/png": "image/png",
    }
    return media_type_map.get(content_type, "image/png")
