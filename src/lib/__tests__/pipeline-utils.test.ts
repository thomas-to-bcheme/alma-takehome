import { describe, it, expect } from 'vitest';
import { normalizeDate, normalizeSex } from '../extraction/pipeline';

describe('Pipeline Utilities', () => {
  describe('normalizeDate', () => {
    it('should pass through YYYY-MM-DD format', () => {
      expect(normalizeDate('2024-01-15')).toBe('2024-01-15');
      expect(normalizeDate('1990-12-31')).toBe('1990-12-31');
    });

    it('should convert DD/MM/YYYY to YYYY-MM-DD', () => {
      expect(normalizeDate('15/01/2024')).toBe('2024-01-15');
      expect(normalizeDate('1/5/2024')).toBe('2024-05-01');
    });

    it('should convert DD.MM.YYYY to YYYY-MM-DD', () => {
      expect(normalizeDate('15.01.2024')).toBe('2024-01-15');
      expect(normalizeDate('1.5.2024')).toBe('2024-05-01');
    });

    it('should return null for null input', () => {
      expect(normalizeDate(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(normalizeDate(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(normalizeDate('')).toBeNull();
    });

    it('should return original for unrecognized format', () => {
      expect(normalizeDate('Jan 15, 2024')).toBe('Jan 15, 2024');
      expect(normalizeDate('invalid')).toBe('invalid');
    });

    it('should pad single digit day and month', () => {
      expect(normalizeDate('5/3/2024')).toBe('2024-03-05');
    });
  });

  describe('normalizeSex', () => {
    it('should normalize M', () => {
      expect(normalizeSex('M')).toBe('M');
      expect(normalizeSex('m')).toBe('M');
    });

    it('should normalize MALE to M', () => {
      expect(normalizeSex('MALE')).toBe('M');
      expect(normalizeSex('male')).toBe('M');
      expect(normalizeSex('Male')).toBe('M');
    });

    it('should normalize F', () => {
      expect(normalizeSex('F')).toBe('F');
      expect(normalizeSex('f')).toBe('F');
    });

    it('should normalize FEMALE to F', () => {
      expect(normalizeSex('FEMALE')).toBe('F');
      expect(normalizeSex('female')).toBe('F');
      expect(normalizeSex('Female')).toBe('F');
    });

    it('should normalize X', () => {
      expect(normalizeSex('X')).toBe('X');
      expect(normalizeSex('x')).toBe('X');
    });

    it('should normalize OTHER to X', () => {
      expect(normalizeSex('OTHER')).toBe('X');
      expect(normalizeSex('other')).toBe('X');
      expect(normalizeSex('Other')).toBe('X');
    });

    it('should return null for null input', () => {
      expect(normalizeSex(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(normalizeSex(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(normalizeSex('')).toBeNull();
    });

    it('should return null for invalid values', () => {
      expect(normalizeSex('invalid')).toBeNull();
      expect(normalizeSex('N/A')).toBeNull();
      expect(normalizeSex('unknown')).toBeNull();
    });

    it('should handle whitespace', () => {
      expect(normalizeSex(' M ')).toBe('M');
      expect(normalizeSex('  FEMALE  ')).toBe('F');
    });
  });
});
