import { z } from 'zod';

// =============================================================================
// PART 1: Attorney/Representative Information
// =============================================================================

const attorneyInfoSchema = z.object({
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
  phone: z.string().min(10, 'Phone number is required'),
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
  sex: z.enum(['M', 'F', 'X'], { message: 'Please select sex' }),
  nationality: z.string().min(1, 'Nationality is required'),

  alienNumber: z.string().optional(),
});

// =============================================================================
// PART 4: Client Consent
// =============================================================================

const clientConsentSchema = z.object({
  consentRepresentation: z.boolean().refine((val) => val === true, {
    message: 'Consent to representation is required',
  }),
  consentDisclosure: z.boolean().refine((val) => val === true, {
    message: 'Consent to disclosure is required',
  }),
  consentSignature: z.boolean().refine((val) => val === true, {
    message: 'Signature consent is required',
  }),

  clientSignature: z.string().min(1, 'Client signature is required'),
  clientSignatureDate: z.string().min(1, 'Signature date is required'),
});

// =============================================================================
// PART 5: Attorney Signature
// =============================================================================

const attorneySignatureSchema = z.object({
  attorneyDeclaration: z.boolean().refine((val) => val === true, {
    message: 'Declaration acceptance is required',
  }),
  attorneySignature: z.string().min(1, 'Attorney signature is required'),
  attorneySignatureDate: z.string().min(1, 'Signature date is required'),
});

// =============================================================================
// COMBINED FORM SCHEMA
// =============================================================================

export const formA28Schema = z.object({
  // Part 1: Attorney Info
  ...attorneyInfoSchema.shape,

  // Part 2: Eligibility (needs special handling due to refine)
  isAttorney: z.boolean().default(false),
  isAccreditedRep: z.boolean().default(false),
  isLawStudent: z.boolean().default(false),
  isRepresentativeCapacity: z.boolean().default(false),
  barNumber: z.string().optional(),
  licensingAuthority: z.string().optional(),

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
).refine(
  (data) => {
    if (data.isAttorney && !data.licensingAuthority) {
      return false;
    }
    return true;
  },
  {
    message: 'Licensing authority is required for attorneys',
    path: ['licensingAuthority'],
  }
);

export type FormA28Data = z.infer<typeof formA28Schema>;

// =============================================================================
// DEFAULT VALUES
// =============================================================================

export const defaultFormA28Values: Partial<FormA28Data> = {
  // Attorney Info
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
  phone: '',
  fax: '',
  email: '',

  // Eligibility
  isAttorney: false,
  isAccreditedRep: false,
  isLawStudent: false,
  isRepresentativeCapacity: false,
  barNumber: '',
  licensingAuthority: '',

  // Passport Info
  clientLastName: '',
  clientFirstName: '',
  clientMiddleName: '',
  passportNumber: '',
  passportCountry: '',
  passportIssueDate: '',
  passportExpirationDate: '',
  dateOfBirth: '',
  sex: undefined,
  nationality: '',
  alienNumber: '',

  // Client Consent
  consentRepresentation: false,
  consentDisclosure: false,
  consentSignature: false,
  clientSignature: '',
  clientSignatureDate: '',

  // Attorney Signature
  attorneyDeclaration: false,
  attorneySignature: '',
  attorneySignatureDate: '',
};
