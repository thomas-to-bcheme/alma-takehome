"""Field mappings from FormA28Data to target form CSS selectors.

Target form: https://mendrika-alma.github.io/form-submission/

This module defines the mapping between our form data fields and the
CSS selectors used in the target form.
"""

from typing import NamedTuple, Optional
from enum import Enum


class FieldType(str, Enum):
    """Type of form field."""
    TEXT = "text"
    SELECT = "select"
    RADIO = "radio"
    CHECKBOX = "checkbox"
    DATE = "date"
    EMAIL = "email"
    TEL = "tel"


class FieldMapping(NamedTuple):
    """Mapping of a form field to its CSS selector."""
    field_name: str
    selector: str
    field_type: FieldType
    required: bool = False
    # For radio/checkbox, the value that should be selected
    value_for_true: Optional[str] = None


# Part 1: Attorney/Representative Information
ATTORNEY_FIELDS: list[FieldMapping] = [
    FieldMapping("online_account_number", "#attorney-online-account", FieldType.TEXT),
    FieldMapping("attorney_last_name", "#attorney-last-name", FieldType.TEXT, required=True),
    FieldMapping("attorney_first_name", "#attorney-first-name", FieldType.TEXT, required=True),
    FieldMapping("attorney_middle_name", "#attorney-middle-name", FieldType.TEXT),
    FieldMapping("street", "#attorney-street", FieldType.TEXT, required=True),
    FieldMapping("apt_ste_flr", "#attorney-apt-type", FieldType.SELECT),
    FieldMapping("apt_ste_flr_number", "#attorney-apt-number", FieldType.TEXT),
    FieldMapping("city", "#attorney-city", FieldType.TEXT, required=True),
    FieldMapping("state", "#attorney-state", FieldType.SELECT, required=True),
    FieldMapping("zip_code", "#attorney-zip", FieldType.TEXT, required=True),
    FieldMapping("country", "#attorney-country", FieldType.TEXT),
    FieldMapping("daytime_phone", "#attorney-daytime-phone", FieldType.TEL, required=True),
    FieldMapping("mobile_phone", "#attorney-mobile-phone", FieldType.TEL),
    FieldMapping("email", "#attorney-email", FieldType.EMAIL),
]

# Part 2: Eligibility Information
ELIGIBILITY_FIELDS: list[FieldMapping] = [
    FieldMapping("is_attorney", "#eligibility-attorney", FieldType.CHECKBOX, value_for_true="checked"),
    FieldMapping("bar_number", "#eligibility-bar-number", FieldType.TEXT),
    FieldMapping("licensing_authority", "#eligibility-licensing-authority", FieldType.TEXT),
    FieldMapping("is_subject_to_orders", 'input[name="subject-to-orders"]', FieldType.RADIO),
    FieldMapping("law_firm_or_organization", "#eligibility-law-firm", FieldType.TEXT),
    FieldMapping("is_accredited_rep", "#eligibility-accredited-rep", FieldType.CHECKBOX, value_for_true="checked"),
    FieldMapping("organization_name", "#eligibility-organization-name", FieldType.TEXT),
    FieldMapping("accreditation_date", "#eligibility-accreditation-date", FieldType.DATE),
    FieldMapping("is_associated_with_attorney", "#eligibility-associated-attorney", FieldType.CHECKBOX, value_for_true="checked"),
    FieldMapping("is_law_student", "#eligibility-law-student", FieldType.CHECKBOX, value_for_true="checked"),
    FieldMapping("law_student_name", "#eligibility-law-student-name", FieldType.TEXT),
]

# Part 3: Passport/Client Information
PASSPORT_FIELDS: list[FieldMapping] = [
    FieldMapping("client_last_name", "#client-last-name", FieldType.TEXT, required=True),
    FieldMapping("client_first_name", "#client-first-name", FieldType.TEXT, required=True),
    FieldMapping("client_middle_name", "#client-middle-name", FieldType.TEXT),
    FieldMapping("passport_number", "#passport-number", FieldType.TEXT, required=True),
    FieldMapping("country_of_issue", "#passport-country-issue", FieldType.TEXT, required=True),
    FieldMapping("date_of_issue", "#passport-date-issue", FieldType.DATE, required=True),
    FieldMapping("date_of_expiration", "#passport-date-expiration", FieldType.DATE, required=True),
    FieldMapping("date_of_birth", "#client-date-of-birth", FieldType.DATE, required=True),
    FieldMapping("place_of_birth", "#client-place-of-birth", FieldType.TEXT, required=True),
    FieldMapping("sex", 'input[name="client-sex"]', FieldType.RADIO, required=True),
    FieldMapping("nationality", "#client-nationality", FieldType.TEXT, required=True),
    FieldMapping("alien_number", "#client-alien-number", FieldType.TEXT),
]

# Part 4: Client Consent
CLIENT_CONSENT_FIELDS: list[FieldMapping] = [
    FieldMapping("notice_to_attorney", "#consent-notice-attorney", FieldType.CHECKBOX, value_for_true="checked"),
    FieldMapping("documents_to_attorney", "#consent-docs-attorney", FieldType.CHECKBOX, value_for_true="checked"),
    FieldMapping("documents_to_client", "#consent-docs-client", FieldType.CHECKBOX, value_for_true="checked"),
    FieldMapping("client_signature_date", "#client-signature-date", FieldType.DATE, required=True),
]

# Part 5: Attorney Signature
ATTORNEY_SIGNATURE_FIELDS: list[FieldMapping] = [
    FieldMapping("attorney_signature_date", "#attorney-signature-date", FieldType.DATE, required=True),
]

# All field mappings combined
ALL_FIELD_MAPPINGS: list[FieldMapping] = (
    ATTORNEY_FIELDS +
    ELIGIBILITY_FIELDS +
    PASSPORT_FIELDS +
    CLIENT_CONSENT_FIELDS +
    ATTORNEY_SIGNATURE_FIELDS
)


def get_field_mapping(field_name: str) -> Optional[FieldMapping]:
    """Get the field mapping for a given field name."""
    for mapping in ALL_FIELD_MAPPINGS:
        if mapping.field_name == field_name:
            return mapping
    return None


def get_required_fields() -> list[FieldMapping]:
    """Get all required field mappings."""
    return [m for m in ALL_FIELD_MAPPINGS if m.required]
