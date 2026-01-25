import { NextRequest, NextResponse } from 'next/server';
import {
  ACCEPTED_MIME_TYPES,
  MAX_SIZE_BYTES,
  ERROR_CODES,
  ERROR_MESSAGES,
} from '@/lib/constants';
import type { ExtractResponse, AcceptedMimeType } from '@/types';

function isAcceptedMimeType(mimeType: string): mimeType is AcceptedMimeType {
  return ACCEPTED_MIME_TYPES.includes(mimeType as AcceptedMimeType);
}

function validateFile(file: File): { isValid: boolean; error?: string } {
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

export async function POST(request: NextRequest): Promise<NextResponse<ExtractResponse>> {
  try {
    const formData = await request.formData();

    const passportFile = formData.get('passport') as File | null;
    const g28File = formData.get('g28') as File | null;

    // Validate passport is provided
    if (!passportFile || passportFile.size === 0) {
      return NextResponse.json(
        {
          success: false,
          message: ERROR_MESSAGES[ERROR_CODES.MISSING_PASSPORT],
          error: ERROR_CODES.MISSING_PASSPORT,
        },
        { status: 400 }
      );
    }

    // Validate passport file
    const passportValidation = validateFile(passportFile);
    if (!passportValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: passportValidation.error ?? 'Invalid passport file',
          error: ERROR_CODES.INVALID_FILE_TYPE,
        },
        { status: 400 }
      );
    }

    // Validate G-28 file if provided
    if (g28File && g28File.size > 0) {
      const g28Validation = validateFile(g28File);
      if (!g28Validation.isValid) {
        return NextResponse.json(
          {
            success: false,
            message: g28Validation.error ?? 'Invalid G-28 file',
            error: ERROR_CODES.INVALID_FILE_TYPE,
          },
          { status: 400 }
        );
      }
    }

    // Mock extraction data for now
    // In production, this would call actual extraction services
    const mockData = {
      passport: {
        fullName: 'John Doe',
        dateOfBirth: '1990-01-15',
        passportNumber: 'AB1234567',
        nationality: 'United States',
        expirationDate: '2030-01-15',
      },
      g28: g28File && g28File.size > 0
        ? {
            attorneyName: 'Jane Smith',
            firmName: 'Immigration Law Partners',
            clientName: 'John Doe',
          }
        : undefined,
    };

    return NextResponse.json({
      success: true,
      message: 'Documents processed successfully',
      data: mockData,
    });
  } catch (error) {
    console.error('Extract API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR],
        error: ERROR_CODES.SERVER_ERROR,
      },
      { status: 500 }
    );
  }
}
