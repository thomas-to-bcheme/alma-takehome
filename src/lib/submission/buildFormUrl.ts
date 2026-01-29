import type { FormA28Data } from '@/lib/validation/formA28Schema';

const TARGET_FORM_URL = 'https://mendrika-alma.github.io/form-submission/';

/**
 * Build the target form URL with data encoded in the URL hash.
 * Opens the form at mendrika-alma.github.io/form-submission/ with
 * pre-filled data via base64-encoded JSON in the URL hash.
 *
 * The Chrome extension (alma-form-filler-extension) reads this hash
 * and fills the form fields automatically.
 *
 * URL format: https://mendrika-alma.github.io/form-submission/#data=<base64-json>
 */
export function buildFormUrl(data: FormA28Data): string {
  // Filter out undefined/null/empty values to minimize payload
  const filteredData: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && value !== '') {
      filteredData[key] = value;
    }
  }

  // Encode as base64 JSON
  const jsonString = JSON.stringify(filteredData);
  const base64Data = btoa(jsonString);

  return `${TARGET_FORM_URL}#data=${base64Data}`;
}

/**
 * Build the target form URL with query parameters from form data.
 * This is the legacy method - use buildFormUrl() instead for extension support.
 *
 * @deprecated Use buildFormUrl() with Chrome extension instead
 */
export function buildFormUrlWithQueryParams(data: FormA28Data): string {
  const FIELD_TO_PARAM: Record<string, string> = {
    // Part 1: Attorney Info
    onlineAccountNumber: 'online-account',
    attorneyLastName: 'family-name',
    attorneyFirstName: 'given-name',
    attorneyMiddleName: 'middle-name',
    street: 'street-number',
    aptSteFlrNumber: 'apt-number',
    city: 'city',
    state: 'state',
    zipCode: 'zip',
    country: 'country',
    daytimePhone: 'daytime-phone',
    mobilePhone: 'mobile-phone',
    email: 'email',

    // Part 2: Eligibility
    barNumber: 'bar-number',
    licensingAuthority: 'licensing-authority',
    lawFirmOrOrganization: 'law-firm',
    organizationName: 'recognized-org',
    accreditationDate: 'accreditation-date',
    lawStudentName: 'student-name',

    // Part 3: Passport/Client Info
    clientLastName: 'passport-surname',
    clientFirstName: 'passport-given-names',
    clientMiddleName: 'passport-middle-name',
    passportNumber: 'passport-number',
    countryOfIssue: 'passport-country',
    nationality: 'passport-nationality',
    dateOfBirth: 'passport-dob',
    placeOfBirth: 'passport-pob',
    sex: 'passport-sex',
    dateOfIssue: 'passport-issue-date',
    dateOfExpiration: 'passport-expiry-date',

    // Part 4: Client Consent
    clientSignatureDate: 'client-signature-date',

    // Part 5: Attorney Signature
    attorneySignatureDate: 'attorney-signature-date',
  };

  const params = new URLSearchParams();

  // Map text/date/select fields
  for (const [formField, paramName] of Object.entries(FIELD_TO_PARAM)) {
    const value = data[formField as keyof FormA28Data];
    if (value !== undefined && value !== null && value !== '') {
      params.set(paramName, String(value));
    }
  }

  // Handle checkbox fields (booleans)
  if (data.isAttorney) params.set('attorney-eligible', 'true');
  if (data.isAccreditedRep) params.set('accredited-rep', 'true');
  if (data.isAssociatedWithAttorney) params.set('associated-with', 'true');
  if (data.isLawStudent) params.set('law-student', 'true');
  if (data.noticeToAttorney) params.set('notices-to-attorney', 'true');
  if (data.documentsToAttorney) params.set('documents-to-attorney', 'true');
  if (data.documentsToClient) params.set('docs-to-me', 'true');

  // Handle isSubjectToOrders radio
  if (data.isSubjectToOrders) {
    params.set('subject-to-orders', data.isSubjectToOrders === 'am' ? 'am' : 'not');
  }

  // Handle aptSteFlr checkbox group
  if (data.aptSteFlr) {
    params.set('apt-type', data.aptSteFlr.toLowerCase());
  }

  return `${TARGET_FORM_URL}?${params.toString()}`;
}
