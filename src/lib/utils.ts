import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  ACCEPTED_MIME_TYPES,
  MAX_SIZE_BYTES,
  ERROR_CODES,
  ERROR_MESSAGES,
} from './constants';
import type { AcceptedMimeType, FileValidationResult } from '@/types';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Check if a MIME type is accepted
 */
export function isAcceptedMimeType(mimeType: string): mimeType is AcceptedMimeType {
  return ACCEPTED_MIME_TYPES.includes(mimeType as AcceptedMimeType);
}

/**
 * Validate a file for upload
 */
export function validateFile(file: File): FileValidationResult {
  if (!isAcceptedMimeType(file.type)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES[ERROR_CODES.INVALID_FILE_TYPE],
    };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return {
      isValid: false,
      error: ERROR_MESSAGES[ERROR_CODES.FILE_TOO_LARGE],
    };
  }

  return { isValid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toUpperCase() ?? '' : '';
}
