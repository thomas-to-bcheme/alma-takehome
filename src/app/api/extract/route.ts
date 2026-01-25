import { NextRequest, NextResponse } from 'next/server';
import {
  ACCEPTED_MIME_TYPES,
  MAX_SIZE_BYTES,
  MAX_SIZE_MB,
} from '@/lib/constants';
import type { ExtractResponse, AcceptedMimeType } from '@/types';

function isAcceptedMimeType(mimeType: string): mimeType is AcceptedMimeType {
  return ACCEPTED_MIME_TYPES.includes(mimeType as AcceptedMimeType);
}

interface FileValidation {
  valid: boolean;
  error?: {
    type: string;
    message: string;
  };
}

function validateFile(file: File): FileValidation {
  if (!isAcceptedMimeType(file.type)) {
    return {
      valid: false,
      error: {
        type: 'INVALID_FILE_TYPE',
        message: `File must be PDF, JPEG, or PNG. Received: ${file.type}`,
      },
    };
  }

  if (file.size > MAX_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: {
        type: 'FILE_TOO_LARGE',
        message: `File exceeds ${MAX_SIZE_MB}MB limit. Size: ${sizeMB}MB`,
      },
    };
  }

  return { valid: true };
}

export async function POST(request: NextRequest): Promise<NextResponse<ExtractResponse>> {
  try {
    const formData = await request.formData();

    const passportFile = formData.get('passport') as File | null;
    const g28File = formData.get('g28') as File | null;

    // Validate passport is provided (required)
    if (!passportFile || passportFile.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_FILE',
            message: 'Passport file is required',
            field: 'passport',
          },
        },
        { status: 400 }
      );
    }

    // Validate passport file type and size
    const passportValidation = validateFile(passportFile);
    if (!passportValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: passportValidation.error!.type,
            message: passportValidation.error!.message,
            field: 'passport',
          },
        },
        { status: 400 }
      );
    }

    // Validate G-28 file if provided
    if (g28File && g28File.size > 0) {
      const g28Validation = validateFile(g28File);
      if (!g28Validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: g28Validation.error!.type,
              message: g28Validation.error!.message,
              field: 'g28',
            },
          },
          { status: 400 }
        );
      }
    }

    // Mock extraction data for now
    // In production, this would call actual extraction services
    // Using backend-aligned field names: surname, givenNames, documentNumber
    const mockData = {
      passport: {
        documentType: 'P',
        issuingCountry: 'USA',
        surname: 'DOE',
        givenNames: 'JOHN',
        documentNumber: 'AB1234567',
        nationality: 'USA',
        dateOfBirth: '1990-01-15',
        sex: 'M' as const,
        expirationDate: '2030-01-15',
        extractionMethod: 'mrz' as const,
        confidence: 0.95,
      },
      g28:
        g28File && g28File.size > 0
          ? {
              attorneyName: 'Jane Smith',
              firmName: 'Immigration Law Partners',
              street: '123 Legal Ave',
              city: 'San Francisco',
              state: 'CA',
              zipCode: '94102',
              phone: '(415) 555-1234',
              email: 'jane.smith@immigrationlaw.com',
              clientName: 'John Doe',
              alienNumber: 'A123456789',
            }
          : undefined,
    };

    return NextResponse.json({
      success: true,
      data: mockData,
    });
  } catch (error) {
    // Log error without PII
    console.error('Extract API error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during extraction',
        },
      },
      { status: 500 }
    );
  }
}
