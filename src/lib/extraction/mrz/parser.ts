import type { PassportData, ExtractionError } from '@/types';

/**
 * MRZ (Machine Readable Zone) Parser for TD3 format passports
 *
 * TD3 format has two lines of 44 characters each.
 * Line 1: Document type, issuing country, name
 * Line 2: Document number, nationality, DOB, sex, expiration, personal number
 */

/**
 * Country code mapping from ISO 3166-1 alpha-3 to full names
 */
const COUNTRY_CODES: Readonly<Record<string, string>> = {
  USA: 'United States',
  GBR: 'United Kingdom',
  CAN: 'Canada',
  AUS: 'Australia',
  DEU: 'Germany',
  FRA: 'France',
  JPN: 'Japan',
  CHN: 'China',
  IND: 'India',
  MEX: 'Mexico',
  BRA: 'Brazil',
  KOR: 'South Korea',
  ESP: 'Spain',
  ITA: 'Italy',
  NLD: 'Netherlands',
  CHE: 'Switzerland',
  SWE: 'Sweden',
  NOR: 'Norway',
  DNK: 'Denmark',
  FIN: 'Finland',
  POL: 'Poland',
  PRT: 'Portugal',
  AUT: 'Austria',
  BEL: 'Belgium',
  IRL: 'Ireland',
  NZL: 'New Zealand',
  SGP: 'Singapore',
  HKG: 'Hong Kong',
  TWN: 'Taiwan',
  PHL: 'Philippines',
  VNM: 'Vietnam',
  THA: 'Thailand',
  MYS: 'Malaysia',
  IDN: 'Indonesia',
  ARE: 'United Arab Emirates',
  SAU: 'Saudi Arabia',
  ISR: 'Israel',
  TUR: 'Turkey',
  RUS: 'Russia',
  UKR: 'Ukraine',
  ZAF: 'South Africa',
  EGY: 'Egypt',
  NGA: 'Nigeria',
  ARG: 'Argentina',
  CHL: 'Chile',
  COL: 'Colombia',
  PER: 'Peru',
};

/**
 * Result of MRZ parsing attempt
 */
export interface MRZParseResult {
  readonly success: boolean;
  readonly data: PassportData | null;
  readonly confidence: number;
  readonly errors: readonly ExtractionError[];
}

/**
 * Calculate MRZ check digit using the ICAO 9303 algorithm
 * Weights cycle through 7, 3, 1
 */
function calculateCheckDigit(data: string): number {
  const weights = [7, 3, 1];
  let sum = 0;

  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    let value: number;

    if (char === '<') {
      value = 0;
    } else if (char >= '0' && char <= '9') {
      value = parseInt(char, 10);
    } else if (char >= 'A' && char <= 'Z') {
      value = char.charCodeAt(0) - 55; // A=10, B=11, etc.
    } else {
      value = 0; // Invalid characters treated as 0
    }

    sum += value * weights[i % 3];
  }

  return sum % 10;
}

/**
 * Validate a field against its check digit
 */
function validateCheckDigit(data: string, checkDigit: string): boolean {
  const expected = calculateCheckDigit(data);
  const actual = parseInt(checkDigit, 10);
  return expected === actual;
}

/**
 * Convert MRZ date (YYMMDD) to ISO format (YYYY-MM-DD)
 * Assumes dates in the past century for DOB, future for expiration
 */
function parseMRZDate(mrzDate: string, isExpiration: boolean): string {
  if (mrzDate.length !== 6 || !/^\d{6}$/.test(mrzDate)) {
    return '';
  }

  const yy = parseInt(mrzDate.slice(0, 2), 10);
  const mm = mrzDate.slice(2, 4);
  const dd = mrzDate.slice(4, 6);

  // Determine century: expiration dates are future, DOB is past
  const currentYear = new Date().getFullYear();
  const currentCentury = Math.floor(currentYear / 100) * 100;

  let year: number;
  if (isExpiration) {
    // Expiration: assume current or next century
    year = yy + currentCentury;
    if (year < currentYear - 10) {
      year += 100; // Far past expiration -> must be next century
    }
  } else {
    // DOB: assume past century
    year = yy + currentCentury;
    if (year > currentYear) {
      year -= 100; // Future DOB -> must be previous century
    }
  }

  return `${year}-${mm}-${dd}`;
}

/**
 * Parse name from MRZ format (SURNAME<<GIVEN<NAMES)
 */
function parseName(mrzName: string): { surname: string; givenNames: string } {
  // Remove trailing fillers
  const cleaned = mrzName.replace(/<+$/, '');

  // Split on << (separator between surname and given names)
  const parts = cleaned.split('<<');

  const surname = (parts[0] || '').replace(/</g, ' ').trim();
  const givenNames = (parts[1] || '').replace(/</g, ' ').trim();

  return { surname, givenNames };
}

/**
 * Normalize country code to full name
 */
function normalizeCountry(code: string): string {
  const normalized = code.toUpperCase().replace(/</g, '');
  return COUNTRY_CODES[normalized] || normalized;
}

/**
 * Detect MRZ lines in text
 * Returns the two lines if found, null otherwise
 */
export function detectMRZLines(text: string): [string, string] | null {
  // Split into lines and clean
  const lines = text
    .split('\n')
    .map((line) => line.trim().toUpperCase())
    .filter((line) => line.length >= 44);

  // Find lines that match MRZ pattern
  // Line 1 starts with P (passport) and contains mostly letters and <
  // Line 2 contains alphanumeric and <
  const mrzPattern = /^[A-Z0-9<]{44}$/;

  for (let i = 0; i < lines.length - 1; i++) {
    const line1 = lines[i].slice(0, 44);
    const line2 = lines[i + 1].slice(0, 44);

    if (
      mrzPattern.test(line1) &&
      mrzPattern.test(line2) &&
      (line1.startsWith('P') || line1.startsWith('I'))
    ) {
      return [line1, line2];
    }
  }

  return null;
}

/**
 * Parse MRZ lines and extract passport data
 */
export function parseMRZ(mrzLines: [string, string]): MRZParseResult {
  const [line1, line2] = mrzLines;
  const errors: ExtractionError[] = [];

  // Line 1: P<ISSNAME<<GIVEN<NAMES<<<...
  const documentType = line1[0];
  const issuingCountryCode = line1.slice(2, 5);
  const nameSection = line1.slice(5, 44);
  const { surname, givenNames } = parseName(nameSection);

  // Line 2: DOCNUM___CNATDOB_SEXP_____PN____________C
  const documentNumber = line2.slice(0, 9).replace(/</g, '');
  const docCheckDigit = line2[9];
  const nationalityCode = line2.slice(10, 13);
  const dobRaw = line2.slice(13, 19);
  const dobCheckDigit = line2[19];
  const sex = line2[20] as 'M' | 'F' | 'X';
  const expirationRaw = line2.slice(21, 27);
  const expCheckDigit = line2[27];

  // Validate check digits
  if (!validateCheckDigit(line2.slice(0, 9), docCheckDigit)) {
    errors.push({
      type: 'MRZ_INVALID_CHECK',
      message: 'Document number check digit mismatch',
      field: 'documentNumber',
    });
  }

  if (!validateCheckDigit(dobRaw, dobCheckDigit)) {
    errors.push({
      type: 'MRZ_INVALID_CHECK',
      message: 'Date of birth check digit mismatch',
      field: 'dateOfBirth',
    });
  }

  if (!validateCheckDigit(expirationRaw, expCheckDigit)) {
    errors.push({
      type: 'MRZ_INVALID_CHECK',
      message: 'Expiration date check digit mismatch',
      field: 'expirationDate',
    });
  }

  // Parse dates
  const dateOfBirth = parseMRZDate(dobRaw, false);
  const expirationDate = parseMRZDate(expirationRaw, true);

  // Build result
  const data: PassportData = {
    documentType: documentType === 'P' ? 'P' : documentType,
    issuingCountry: normalizeCountry(issuingCountryCode),
    surname,
    givenNames,
    documentNumber: documentNumber || '',
    nationality: normalizeCountry(nationalityCode),
    dateOfBirth,
    sex: (['M', 'F', 'X'] as const).includes(sex as 'M' | 'F' | 'X')
      ? (sex as 'M' | 'F' | 'X')
      : 'X',
    expirationDate,
  };

  // Calculate confidence based on errors
  const confidence = errors.length === 0 ? 0.98 : Math.max(0.5, 0.98 - errors.length * 0.15);

  return {
    success: errors.length === 0,
    data,
    confidence,
    errors,
  };
}

/**
 * Attempt to extract passport data from text using MRZ parsing
 */
export function extractFromMRZ(text: string): MRZParseResult {
  const mrzLines = detectMRZLines(text);

  if (!mrzLines) {
    return {
      success: false,
      data: null,
      confidence: 0,
      errors: [
        {
          type: 'MRZ_NOT_FOUND',
          message: 'No valid MRZ lines detected in the document',
        },
      ],
    };
  }

  return parseMRZ(mrzLines);
}
