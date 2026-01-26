import type { PassportData, G28Data } from '@/types';
import type { FormA28Data } from '@/lib/validation/formA28Schema';
import { defaultFormA28Values } from '@/lib/validation/formA28Schema';

interface ExtractedData {
  readonly passport?: PassportData;
  readonly g28?: G28Data;
}

/**
 * Maps extracted passport and G-28 data to the FormA28 schema.
 * Missing fields are filled with default values.
 */
export function mapExtractedToForm(extracted: ExtractedData): Partial<FormA28Data> {
  const result: Partial<FormA28Data> = { ...defaultFormA28Values };

  // Map passport data to client info (Part 3)
  if (extracted.passport) {
    const passport = extracted.passport;

    // Split surname and given names
    result.clientLastName = passport.surname || '';

    // Given names might contain multiple names; split into first and middle
    const givenNameParts = (passport.givenNames || '').split(' ');
    result.clientFirstName = givenNameParts[0] || '';
    result.clientMiddleName = givenNameParts.slice(1).join(' ') || '';

    // Passport details
    result.passportNumber = passport.documentNumber || '';
    result.passportCountry = passport.issuingCountry || '';
    result.passportExpirationDate = passport.expirationDate || '';

    // Personal info
    result.dateOfBirth = passport.dateOfBirth || '';
    result.sex = passport.sex as 'M' | 'F' | 'X' | undefined;
    result.nationality = passport.nationality || '';
  }

  // Map G-28 data to attorney info (Part 1) and some client info
  if (extracted.g28) {
    const g28 = extracted.g28;

    // Parse attorney name (could be "Last, First Middle" or "First Last")
    const attorneyNameParts = parseAttorneyName(g28.attorneyName || '');
    result.attorneyLastName = attorneyNameParts.lastName;
    result.attorneyFirstName = attorneyNameParts.firstName;
    result.attorneyMiddleName = attorneyNameParts.middleName;

    // Firm and address
    result.firmName = g28.firmName || '';
    result.street = g28.street || '';
    result.city = g28.city || '';
    result.state = g28.state || '';
    result.zipCode = g28.zipCode || '';

    // Contact
    result.phone = g28.phone || '';
    result.email = g28.email || '';

    // Client's alien number
    result.alienNumber = g28.alienNumber || '';

    // If G-28 has attorney info, likely an attorney
    if (g28.attorneyName) {
      result.isAttorney = true;
    }
  }

  return result;
}

/**
 * Parse an attorney name string into parts.
 * Handles formats like "Smith, John David" or "John David Smith"
 */
function parseAttorneyName(fullName: string): {
  firstName: string;
  lastName: string;
  middleName: string;
} {
  const trimmed = fullName.trim();

  if (!trimmed) {
    return { firstName: '', lastName: '', middleName: '' };
  }

  // Check for "Last, First Middle" format
  if (trimmed.includes(',')) {
    const [lastName, rest] = trimmed.split(',').map((s) => s.trim());
    const firstMiddle = (rest || '').split(' ');
    return {
      lastName: lastName || '',
      firstName: firstMiddle[0] || '',
      middleName: firstMiddle.slice(1).join(' ') || '',
    };
  }

  // Assume "First Middle Last" format
  const parts = trimmed.split(' ');
  if (parts.length === 1) {
    return { firstName: '', lastName: parts[0], middleName: '' };
  }
  if (parts.length === 2) {
    return { firstName: parts[0], lastName: parts[1], middleName: '' };
  }

  // Three or more parts: first is first, last is last, middle is everything in between
  return {
    firstName: parts[0],
    lastName: parts[parts.length - 1],
    middleName: parts.slice(1, -1).join(' '),
  };
}
