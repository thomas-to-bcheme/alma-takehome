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
    FieldMapping("online_account_number", "#online-account", FieldType.TEXT),
    FieldMapping("attorney_last_name", "#family-name", FieldType.TEXT, required=True),
    FieldMapping("attorney_first_name", "#given-name", FieldType.TEXT, required=True),
    FieldMapping("attorney_middle_name", "#middle-name", FieldType.TEXT),
    FieldMapping("street", "#street-number", FieldType.TEXT, required=True),
    FieldMapping("apt_ste_flr", "#apt", FieldType.CHECKBOX),  # Checkboxes: #apt, #ste, #flr
    FieldMapping("apt_ste_flr_number", "#apt-number", FieldType.TEXT),
    FieldMapping("city", "#city", FieldType.TEXT, required=True),
    FieldMapping("state", "#state", FieldType.SELECT, required=True),
    FieldMapping("zip_code", "#zip", FieldType.TEXT, required=True),
    FieldMapping("country", "#country", FieldType.TEXT),
    FieldMapping("daytime_phone", "#daytime-phone", FieldType.TEL, required=True),
    FieldMapping("mobile_phone", "#mobile-phone", FieldType.TEL),
    FieldMapping("email", "#email", FieldType.EMAIL),
]

# Part 2: Eligibility Information
ELIGIBILITY_FIELDS: list[FieldMapping] = [
    FieldMapping("is_attorney", "#attorney-eligible", FieldType.CHECKBOX, value_for_true="checked"),
    FieldMapping("bar_number", "#bar-number", FieldType.TEXT),
    FieldMapping("licensing_authority", "#licensing-authority", FieldType.TEXT),
    FieldMapping("is_subject_to_orders", "#not-subject", FieldType.CHECKBOX),  # #not-subject or #am-subject
    FieldMapping("law_firm_or_organization", "#law-firm", FieldType.TEXT),
    FieldMapping("is_accredited_rep", "#accredited-rep", FieldType.CHECKBOX, value_for_true="checked"),
    FieldMapping("organization_name", "#recognized-org", FieldType.TEXT),
    FieldMapping("accreditation_date", "#accreditation-date", FieldType.DATE),
    FieldMapping("is_associated_with_attorney", "#associated-with", FieldType.CHECKBOX, value_for_true="checked"),
    FieldMapping("is_law_student", "#law-student", FieldType.CHECKBOX, value_for_true="checked"),
    FieldMapping("law_student_name", "#student-name", FieldType.TEXT),
]

# Part 3: Passport/Client Information
PASSPORT_FIELDS: list[FieldMapping] = [
    FieldMapping("client_last_name", "#passport-surname", FieldType.TEXT, required=True),
    FieldMapping("client_first_name", "#passport-given-names", FieldType.TEXT, required=True),
    # Note: client_middle_name uses same ID as first name in target form (form quirk)
    FieldMapping("client_middle_name", "#passport-given-names", FieldType.TEXT),
    FieldMapping("passport_number", "#passport-number", FieldType.TEXT, required=True),
    FieldMapping("country_of_issue", "#passport-country", FieldType.TEXT, required=True),
    FieldMapping("date_of_issue", "#passport-issue-date", FieldType.DATE, required=True),
    FieldMapping("date_of_expiration", "#passport-expiry-date", FieldType.DATE, required=True),
    FieldMapping("date_of_birth", "#passport-dob", FieldType.DATE, required=True),
    FieldMapping("place_of_birth", "#passport-pob", FieldType.TEXT, required=True),
    FieldMapping("sex", "#passport-sex", FieldType.SELECT, required=True),
    FieldMapping("nationality", "#passport-nationality", FieldType.TEXT, required=True),
    # Note: alien_number field not present in target form
]

# Part 4: Client Consent
CLIENT_CONSENT_FIELDS: list[FieldMapping] = [
    FieldMapping("notice_to_attorney", "#notices-to-attorney", FieldType.CHECKBOX, value_for_true="checked"),
    FieldMapping("documents_to_attorney", "#documents-to-attorney", FieldType.CHECKBOX, value_for_true="checked"),
    FieldMapping("documents_to_client", "#docs-to-me", FieldType.CHECKBOX, value_for_true="checked"),
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
