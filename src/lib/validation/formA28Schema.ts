import { z } from 'zod';

// =============================================================================
// PART 1: Attorney/Representative Information
// =============================================================================

const attorneyInfoSchema = z.object({
  // Online account number (USCIS Online Account Number)
  onlineAccountNumber: z.string().optional(),

  // Name fields
  attorneyLastName: z.string().min(1, 'Last name is required'),
  attorneyFirstName: z.string().min(1, 'First name is required'),
  attorneyMiddleName: z.string().optional(),

  // Address fields
  firmName: z.string().optional(),
  street: z.string().min(1, 'Street address is required'),
  suite: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(5, 'ZIP code is required'),
  country: z.string().default('United States'),

  // Contact fields
  daytimePhone: z.string().min(10, 'Daytime phone is required'),
  mobilePhone: z.string().optional(),
  fax: z.string().optional(),
  email: z.string().email('Valid email is required'),
});

// =============================================================================
// PART 2: Eligibility (defined inline in combined schema due to refinements)
// =============================================================================

// =============================================================================
// PART 3: Passport/Client Information
// =============================================================================

const passportInfoSchema = z.object({
  clientLastName: z.string().min(1, 'Last name is required'),
  clientFirstName: z.string().min(1, 'First name is required'),
  clientMiddleName: z.string().optional(),

  passportNumber: z.string().min(1, 'Passport number is required'),
  passportCountry: z.string().min(1, 'Issuing country is required'),
  passportIssueDate: z.string().optional(),
  passportExpirationDate: z.string().min(1, 'Expiration date is required'),

  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  placeOfBirth: z.string().optional(),
  sex: z.enum(['M', 'F', 'X'], { message: 'Please select sex' }),
  nationality: z.string().min(1, 'Nationality is required'),

  alienNumber: z.string().optional(),
});

// =============================================================================
// PART 4: Client Consent
// =============================================================================

const clientConsentSchema = z.object({
  // Legacy fields - kept optional for backward compatibility (hidden from UI)
  consentRepresentation: z.boolean().optional(),
  consentDisclosure: z.boolean().optional(),
  consentSignature: z.boolean().optional(),
  clientSignature: z.string().optional(),

  // Notification preferences (B. Options Regarding Receipt of Notices and Documents)
  notifyAttorneyOriginals: z.boolean().default(false),
  notifyAttorneyImportant: z.boolean().default(false),
  notifyClientMailing: z.boolean().default(false),

  // 2. Date of Signature
  clientSignatureDate: z.string().min(1, 'Signature date is required'),
});

// =============================================================================
// PART 5: Attorney Signature
// =============================================================================

const attorneySignatureSchema = z.object({
  // Legacy fields - kept optional for backward compatibility (hidden from UI)
  attorneyDeclaration: z.boolean().optional(),
  attorneySignature: z.string().optional(),

  // Date of Signature (only visible field)
  attorneySignatureDate: z.string().min(1, 'Signature date is required'),
});

// =============================================================================
// COMBINED FORM SCHEMA
// =============================================================================

export const formA28Schema = z.object({
  // Part 1: Attorney Info
  ...attorneyInfoSchema.shape,

  // Part 2: Eligibility (needs special handling due to refine)
  // 1.a - Attorney checkbox
  isAttorney: z.boolean().default(false),
  // 1.b - Bar Number (shown when isAttorney)
  barNumber: z.string().optional(),
  // 1.c - Subject to orders radio (shown when isAttorney)
  isSubjectToOrders: z.enum(['am_not', 'am']).optional(),
  // 1.d - Law Firm or Organization name (shown when isAttorney)
  lawFirmOrOrganization: z.string().optional(),

  // 2.a - Accredited rep checkbox
  isAccreditedRep: z.boolean().default(false),
  // 2.b - Organization name (shown when isAccreditedRep)
  organizationName: z.string().optional(),
  // 2.c - Accreditation date (shown when isAccreditedRep)
  accreditationDate: z.string().optional(),

  // 3 - Associated with attorney checkbox
  isAssociatedWithAttorney: z.boolean().default(false),

  // 4.a - Law student checkbox
  isLawStudent: z.boolean().default(false),
  // 4.b - Law student name (shown when isLawStudent)
  lawStudentName: z.string().optional(),

  // Legacy fields - kept optional for backward compatibility (hidden from UI)
  licensingAuthority: z.string().optional(),
  isRepresentativeCapacity: z.boolean().optional(),
  supervisingAttorneyName: z.string().optional(),

  // Part 3: Passport Info
  ...passportInfoSchema.shape,

  // Part 4: Client Consent
  ...clientConsentSchema.shape,

  // Part 5: Attorney Signature
  ...attorneySignatureSchema.shape,
}).refine(
  (data) => {
    if (data.isAttorney && !data.barNumber) {
      return false;
    }
    return true;
  },
  {
    message: 'Bar number is required for attorneys',
    path: ['barNumber'],
  }
);

export type FormA28Data = z.infer<typeof formA28Schema>;

// =============================================================================
// DEFAULT VALUES
// =============================================================================

export const defaultFormA28Values: Partial<FormA28Data> = {
  // Attorney Info
  onlineAccountNumber: '',
  attorneyLastName: '',
  attorneyFirstName: '',
  attorneyMiddleName: '',
  firmName: '',
  street: '',
  suite: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'United States',
  daytimePhone: '',
  mobilePhone: '',
  fax: '',
  email: '',

  // Eligibility - Part 2
  isAttorney: false,
  barNumber: '',
  isSubjectToOrders: undefined,
  lawFirmOrOrganization: '',
  isAccreditedRep: false,
  organizationName: '',
  accreditationDate: '',
  isAssociatedWithAttorney: false,
  isLawStudent: false,
  lawStudentName: '',
  // Legacy fields (hidden from UI)
  licensingAuthority: '',
  isRepresentativeCapacity: false,
  supervisingAttorneyName: '',

  // Passport Info
  clientLastName: '',
  clientFirstName: '',
  clientMiddleName: '',
  passportNumber: '',
  passportCountry: '',
  passportIssueDate: '',
  passportExpirationDate: '',
  dateOfBirth: '',
  placeOfBirth: '',
  sex: undefined,
  nationality: '',
  alienNumber: '',

  // Client Consent - Part 4
  notifyAttorneyOriginals: false,
  notifyAttorneyImportant: false,
  notifyClientMailing: false,
  clientSignatureDate: '',
  // Legacy fields (hidden from UI)
  consentRepresentation: false,
  consentDisclosure: false,
  consentSignature: false,
  clientSignature: '',

  // Attorney Signature - Part 5
  attorneySignatureDate: '',
  // Legacy fields (hidden from UI)
  attorneyDeclaration: false,
  attorneySignature: '',
};
