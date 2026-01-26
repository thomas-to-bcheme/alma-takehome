import { describe, it, expect } from 'vitest';
import {
  calculateCheckDigit,
  parseMRZDate,
  detectMRZLines,
  parseMRZ,
  extractFromMRZ,
} from '../extraction/mrz/parser';

describe('MRZ Parser', () => {
  describe('calculateCheckDigit', () => {
    it('should calculate check digit for numeric string', () => {
      // Example: "123456789" with weights 7,3,1,7,3,1,7,3,1
      // (1*7 + 2*3 + 3*1 + 4*7 + 5*3 + 6*1 + 7*7 + 8*3 + 9*1) % 10
      // = (7 + 6 + 3 + 28 + 15 + 6 + 49 + 24 + 9) % 10 = 147 % 10 = 7
      expect(calculateCheckDigit('123456789')).toBe(7);
    });

    it('should calculate check digit for alphanumeric string', () => {
      // 'AB' where A=10, B=11
      // (10*7 + 11*3) % 10 = (70 + 33) % 10 = 103 % 10 = 3
      expect(calculateCheckDigit('AB')).toBe(3);
    });

    it('should treat filler characters as 0', () => {
      // '<' = 0, so '<<' = (0*7 + 0*3) % 10 = 0
      expect(calculateCheckDigit('<<')).toBe(0);
    });

    it('should handle mixed alphanumeric with fillers', () => {
      // 'A<1' = A(10)*7 + <(0)*3 + 1*1 = 70 + 0 + 1 = 71 % 10 = 1
      expect(calculateCheckDigit('A<1')).toBe(1);
    });

    it('should handle passport document number format', () => {
      // Real example: document number "L898902C3"
      // L=21, 8=8, 9=9, 8=8, 9=9, 0=0, 2=2, C=12, 3=3
      // (21*7 + 8*3 + 9*1 + 8*7 + 9*3 + 0*1 + 2*7 + 12*3 + 3*1)
      // = (147 + 24 + 9 + 56 + 27 + 0 + 14 + 36 + 3) = 316 % 10 = 6
      expect(calculateCheckDigit('L898902C3')).toBe(6);
    });
  });

  describe('parseMRZDate', () => {
    it('should parse DOB date as past century', () => {
      // Someone born in '90 would be 1990, not 2090
      const result = parseMRZDate('900115', false);
      expect(result).toBe('1990-01-15');
    });

    it('should parse recent DOB correctly', () => {
      // Someone born in '05 would be 2005
      const result = parseMRZDate('050620', false);
      expect(result).toBe('2005-06-20');
    });

    it('should parse expiration date as future/current century', () => {
      // Expiration in '30 would be 2030
      const result = parseMRZDate('300115', true);
      expect(result).toBe('2030-01-15');
    });

    it('should return empty string for invalid date format', () => {
      expect(parseMRZDate('12345', false)).toBe('');
      expect(parseMRZDate('1234567', false)).toBe('');
      expect(parseMRZDate('ABCDEF', false)).toBe('');
    });
  });

  describe('detectMRZLines', () => {
    it('should detect valid TD3 MRZ lines', () => {
      const text = `
Some header text
P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<
L898902C36UTO7408122F1204159ZE184226B<<<<<10
Some footer text
`;
      const result = detectMRZLines(text);
      expect(result).not.toBeNull();
      expect(result?.[0]).toBe('P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<');
      expect(result?.[1]).toBe('L898902C36UTO7408122F1204159ZE184226B<<<<<10');
    });

    it('should return null when no MRZ found', () => {
      const text = 'This is just regular text without any MRZ data';
      expect(detectMRZLines(text)).toBeNull();
    });

    it('should return null for lines that are too short', () => {
      const text = 'P<UTOERIKSSON<<ANNA\nL898902C36UTO';
      expect(detectMRZLines(text)).toBeNull();
    });
  });

  describe('parseMRZ', () => {
    it('should parse valid MRZ lines correctly', () => {
      const mrzLines: [string, string] = [
        'P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<',
        'L898902C36UTO7408122F1204159ZE184226B<<<<<10',
      ];

      const result = parseMRZ(mrzLines);

      expect(result.data).not.toBeNull();
      expect(result.data?.surname).toBe('ERIKSSON');
      expect(result.data?.givenNames).toBe('ANNA MARIA');
      expect(result.data?.documentNumber).toBe('L898902C3');
      expect(result.data?.nationality).toBe('UTO');
      expect(result.data?.sex).toBe('F');
    });

    it('should handle name with multiple given names', () => {
      const mrzLines: [string, string] = [
        'P<FRAMARTIN<<JEAN<PAUL<PIERRE<<<<<<<<<<<<<<<<',
        'AB1234567<8FRA9001011M2512315<<<<<<<<<<<<<<00',
      ];

      const result = parseMRZ(mrzLines);

      expect(result.data?.surname).toBe('MARTIN');
      expect(result.data?.givenNames).toBe('JEAN PAUL PIERRE');
    });

    it('should report check digit errors', () => {
      // Invalid check digit for document number
      const mrzLines: [string, string] = [
        'P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<',
        'L898902C39UTO7408122F1204159ZE184226B<<<<<10', // Changed 6 to 9
      ];

      const result = parseMRZ(mrzLines);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.field === 'documentNumber')).toBe(true);
    });
  });

  describe('extractFromMRZ', () => {
    it('should extract passport data from text with MRZ', () => {
      const text = `
PASSPORT
Surname: ERIKSSON
Given Names: ANNA MARIA

P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<
L898902C36UTO7408122F1204159ZE184226B<<<<<10
`;

      const result = extractFromMRZ(text);

      expect(result.success).toBe(true);
      expect(result.data?.surname).toBe('ERIKSSON');
      expect(result.data?.givenNames).toBe('ANNA MARIA');
    });

    it('should return error when no MRZ found', () => {
      const text = 'Regular document without MRZ';

      const result = extractFromMRZ(text);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors.some((e) => e.type === 'MRZ_NOT_FOUND')).toBe(true);
    });
  });
});
