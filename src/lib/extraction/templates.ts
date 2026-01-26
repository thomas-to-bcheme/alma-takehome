/**
 * NuExtract JSON templates for structured data extraction
 *
 * NuExtract uses these templates to understand what fields to extract.
 * Empty strings indicate fields we want extracted; the API fills in values.
 */

/**
 * Passport extraction template
 * Used for extracting data from passport images/PDFs
 */
export const PASSPORT_TEMPLATE = {
  surname: '',
  givenNames: '',
  documentNumber: '',
  dateOfBirth: '',
  expirationDate: '',
  sex: '',
  nationality: '',
  issuingCountry: '',
} as const;

export type PassportTemplate = typeof PASSPORT_TEMPLATE;

/**
 * G-28 form extraction template
 * Used for extracting attorney/representative information
 */
export const G28_TEMPLATE = {
  attorneyName: '',
  firmName: '',
  street: '',
  suite: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  fax: '',
  email: '',
  clientName: '',
  barNumber: '',
  licensingAuthority: '',
  clientPhone: '',
  clientEmail: '',
} as const;

export type G28Template = typeof G28_TEMPLATE;

/**
 * Get the appropriate template based on document type
 */
export function getTemplateForDocumentType(
  type: 'passport' | 'g28'
): PassportTemplate | G28Template {
  return type === 'passport' ? PASSPORT_TEMPLATE : G28_TEMPLATE;
}
