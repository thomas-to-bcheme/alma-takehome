"""Pydantic schemas for form automation request/response models."""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class FieldStatus(str, Enum):
    """Status of a field fill operation."""
    FILLED = "filled"
    SKIPPED = "skipped"
    FAILED = "failed"


class FieldResult(BaseModel):
    """Result of filling a single field."""
    field_name: str = Field(..., alias="fieldName")
    status: FieldStatus
    value: Optional[str] = None
    error: Optional[str] = None

    class Config:
        populate_by_name = True


class AptSteFlr(str, Enum):
    """Apartment/Suite/Floor type."""
    APT = "Apt"
    STE = "Ste"
    FLR = "Flr"


class Sex(str, Enum):
    """Sex field options."""
    M = "M"
    F = "F"
    X = "X"


class SubjectToOrders(str, Enum):
    """Subject to orders options."""
    AM_NOT = "am_not"
    AM = "am"


class FormA28Input(BaseModel):
    """Input schema matching FormA28Data from TypeScript."""

    # Part 1: Attorney Info
    online_account_number: Optional[str] = Field(None, alias="onlineAccountNumber")
    attorney_last_name: str = Field(..., alias="attorneyLastName")
    attorney_first_name: str = Field(..., alias="attorneyFirstName")
    attorney_middle_name: Optional[str] = Field(None, alias="attorneyMiddleName")
    firm_name: Optional[str] = Field(None, alias="firmName")
    street: str
    apt_ste_flr: Optional[AptSteFlr] = Field(None, alias="aptSteFlr")
    apt_ste_flr_number: Optional[str] = Field(None, alias="aptSteFlrNumber")
    city: str
    state: str
    zip_code: str = Field(..., alias="zipCode")
    country: str = Field(default="United States")
    daytime_phone: str = Field(..., alias="daytimePhone")
    mobile_phone: Optional[str] = Field(None, alias="mobilePhone")
    fax: Optional[str] = Field(None, alias="fax")
    email: Optional[str] = Field(None, alias="email")

    # Part 2: Eligibility
    is_attorney: bool = Field(default=False, alias="isAttorney")
    bar_number: Optional[str] = Field(None, alias="barNumber")
    licensing_authority: Optional[str] = Field(None, alias="licensingAuthority")
    is_subject_to_orders: Optional[SubjectToOrders] = Field(None, alias="isSubjectToOrders")
    law_firm_or_organization: Optional[str] = Field(None, alias="lawFirmOrOrganization")
    is_accredited_rep: bool = Field(default=False, alias="isAccreditedRep")
    organization_name: Optional[str] = Field(None, alias="organizationName")
    accreditation_date: Optional[str] = Field(None, alias="accreditationDate")
    is_associated_with_attorney: bool = Field(default=False, alias="isAssociatedWithAttorney")
    is_law_student: bool = Field(default=False, alias="isLawStudent")
    law_student_name: Optional[str] = Field(None, alias="lawStudentName")

    # Part 3: Passport Info
    client_last_name: str = Field(..., alias="clientLastName")
    client_first_name: str = Field(..., alias="clientFirstName")
    client_middle_name: Optional[str] = Field(None, alias="clientMiddleName")
    passport_number: str = Field(..., alias="passportNumber")
    country_of_issue: str = Field(..., alias="countryOfIssue")
    date_of_issue: str = Field(..., alias="dateOfIssue")
    date_of_expiration: str = Field(..., alias="dateOfExpiration")
    date_of_birth: str = Field(..., alias="dateOfBirth")
    place_of_birth: str = Field(..., alias="placeOfBirth")
    sex: Sex
    nationality: str
    alien_number: Optional[str] = Field(None, alias="alienNumber")

    # Part 4: Client Consent
    notice_to_attorney: bool = Field(default=False, alias="noticeToAttorney")
    documents_to_attorney: bool = Field(default=False, alias="documentsToAttorney")
    documents_to_client: bool = Field(default=False, alias="documentsToClient")
    client_signature_date: str = Field(..., alias="clientSignatureDate")

    # Part 5: Attorney Signature
    attorney_signature_date: str = Field(..., alias="attorneySignatureDate")

    class Config:
        populate_by_name = True


class FillResult(BaseModel):
    """Result of form fill operation."""
    success: bool
    filled_fields: list[FieldResult] = Field(default_factory=list, alias="filledFields")
    skipped_fields: list[FieldResult] = Field(default_factory=list, alias="skippedFields")
    failed_fields: list[FieldResult] = Field(default_factory=list, alias="failedFields")
    screenshot_base64: Optional[str] = Field(None, alias="screenshotBase64")
    duration_ms: int = Field(..., alias="durationMs")
    error: Optional[str] = None

    class Config:
        populate_by_name = True
