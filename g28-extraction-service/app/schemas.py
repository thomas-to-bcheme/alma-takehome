"""
Pydantic schemas for G-28 extraction request/response models.
"""

from pydantic import BaseModel, Field
from typing import Optional


class Address(BaseModel):
    """Address information."""

    street: str = ""
    suite: str = ""
    city: str = ""
    state: str = ""
    zip_code: str = ""

    class Config:
        populate_by_name = True


class AttorneyInfo(BaseModel):
    """Attorney/Representative information from Part 1."""

    family_name: str = ""
    given_name: str = ""
    middle_name: str = ""
    firm_name: str = ""
    address: Address = Field(default_factory=Address)
    phone: str = ""
    email: str = ""

    class Config:
        populate_by_name = True


class EligibilityInfo(BaseModel):
    """Eligibility information from Part 2."""

    is_attorney: bool = False
    bar_number: str = ""
    is_accredited_rep: bool = False

    class Config:
        populate_by_name = True


class ClientInfo(BaseModel):
    """Client information from Part 3."""

    family_name: str = ""
    given_name: str = ""
    middle_name: str = ""
    phone: str = ""
    email: str = ""
    alien_number: str = ""

    class Config:
        populate_by_name = True


class G28Data(BaseModel):
    """Complete G-28 extracted data structure."""

    attorney: AttorneyInfo = Field(default_factory=AttorneyInfo)
    eligibility: EligibilityInfo = Field(default_factory=EligibilityInfo)
    client: ClientInfo = Field(default_factory=ClientInfo)

    class Config:
        populate_by_name = True


class G28ExtractionResult(BaseModel):
    """Result of G-28 extraction."""

    success: bool
    data: Optional[G28Data] = None
    confidence: float = 0.0
    error: Optional[str] = None
