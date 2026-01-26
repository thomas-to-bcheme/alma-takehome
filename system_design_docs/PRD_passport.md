# PRD: Passport Data Extraction

## Overview

This document describes the passport extraction pipeline that extracts structured data from passport images using MRZ (Machine Readable Zone) detection and OCR.

## Goals

1. Extract passport holder data from uploaded passport images (JPEG, PNG, PDF)
2. Return structured data matching the target form schema
3. Provide high-accuracy MRZ parsing with fallback to general OCR
4. Support local development and cloud deployment

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Next.js Application                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  /api/extract (route.ts)                                             │   │
│  │  - Receives passport image via multipart/form-data                   │   │
│  │  - Routes to extraction pipeline                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Extraction Pipeline (pipeline.ts)                                   │   │
│  │  - Orchestrates extraction flow                                      │   │
│  │  - Aggregates results from multiple sources                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│            ┌───────────────────────┼───────────────────────┐               │
│            ▼                       ▼                       ▼               │
│  ┌─────────────────┐   ┌─────────────────────┐   ┌─────────────────┐      │
│  │ PassportEye     │   │ MRZ Parser          │   │ NuExtract       │      │
│  │ Client          │   │ (TypeScript)        │   │ Client          │      │
│  │                 │   │ - ICAO 9303 parsing │   │ - LLM fallback  │      │
│  └────────┬────────┘   └─────────────────────┘   └─────────────────┘      │
│           │                                                                 │
└───────────┼─────────────────────────────────────────────────────────────────┘
            │
            ▼ HTTP
┌─────────────────────────────────────────────────────────────────────────────┐
│  PassportEye Microservice (Python/FastAPI)                                  │
│  - Tesseract OCR for MRZ detection                                          │
│  - PassportEye library for MRZ extraction                                   │
│  - Deployed as Docker container                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Extraction Flow

1. **Image Upload**: User uploads passport image via drag-and-drop or file picker
2. **PassportEye Extraction** (Primary):
   - Image sent to PassportEye microservice
   - Tesseract OCR detects MRZ zone
   - PassportEye parses MRZ fields per ICAO 9303 standard
   - Returns structured data with confidence score
3. **MRZ Parser Validation**:
   - TypeScript parser validates MRZ checksums
   - Extracts additional fields if needed
4. **NuExtract Fallback**:
   - If PassportEye fails (no MRZ detected, low confidence)
   - LLM-based extraction analyzes full passport image
   - Returns structured data from visual analysis

## File Structure

```
passporteye-service/
├── Dockerfile              # Container definition with Tesseract
├── requirements.txt        # Python dependencies
├── README.md               # Service documentation
└── app/
    ├── __init__.py
    ├── main.py             # FastAPI routes, CORS, validation
    └── extraction.py       # PassportEye wrapper, date formatting

src/lib/extraction/
├── passporteye-client.ts   # HTTP client for microservice
├── nuextract-client.ts     # LLM extraction client
├── pipeline.ts             # Orchestrates extraction flow
└── mrz/
    └── parser.ts           # TypeScript MRZ parser (ICAO 9303)

src/app/api/extract/
└── route.ts                # Next.js API route
```

## Environment Variables

### Next.js Application

```bash
# PassportEye Microservice
PASSPORTEYE_API_URL=http://localhost:8000/extract  # Microservice endpoint
PASSPORTEYE_ENABLED=true                           # Enable/disable (fallback to NuExtract)
PASSPORTEYE_TIMEOUT_MS=30000                       # Request timeout

# NuExtract (fallback)
NUEXTRACT_API_URL=https://api.nuextract.ai/v1
NUEXTRACT_API_KEY=<your-key>
NUEXTRACT_TIMEOUT_MS=30000
```

### PassportEye Microservice

```bash
ALLOWED_ORIGINS=http://localhost:3000   # Comma-separated CORS origins
```

## Data Schema

### PassportData

```typescript
interface PassportData {
  documentType: string;      // "P" for passport
  issuingCountry: string;    // ISO 3166-1 alpha-3 (e.g., "USA")
  surname: string;           // Family name (uppercase)
  givenNames: string;        // Given names (space-separated)
  documentNumber: string;    // Passport number
  nationality: string;       // ISO 3166-1 alpha-3
  dateOfBirth: string;       // YYYY-MM-DD
  sex: "M" | "F" | "X";      // Sex indicator
  expirationDate: string;    // YYYY-MM-DD
}
```

### ExtractionResult

```typescript
interface ExtractionResult {
  success: boolean;
  data: PassportData | null;
  confidence: number;        // 0.0 to 1.0
  error: string | null;
}
```

## Deployment Options

### Local Development (Docker Compose)

```bash
# Start PassportEye service
docker compose up -d

# Start Next.js dev server
npm run dev

# Verify services
curl http://localhost:8000/health
curl http://localhost:3000/api/health
```

### Cloud Deployment

#### Railway

```bash
cd passporteye-service
railway login
railway init
railway up
```

Update `PASSPORTEYE_API_URL` in Vercel/hosting env to Railway URL.

#### Render

1. Create new Web Service on Render
2. Connect repository
3. Set root directory to `passporteye-service`
4. Render auto-detects Dockerfile
5. Add `ALLOWED_ORIGINS` env var with your production domain

## API Endpoints

### PassportEye Service

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/extract` | Extract MRZ from image |

### Next.js API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/extract` | Full extraction pipeline |

## Verification Steps

1. **Health Check**
   ```bash
   curl http://localhost:8000/health
   # {"status": "healthy", "service": "passporteye"}
   ```

2. **Direct PassportEye Test**
   ```bash
   curl -X POST -F "file=@test_passport.jpg" http://localhost:8000/extract
   ```

3. **Full Pipeline Test**
   ```bash
   curl -X POST -F "passport=@test_passport.jpg" http://localhost:3000/api/extract
   ```

4. **Fallback Verification**
   - Upload non-passport image
   - Confirm "PassportEye extraction failed" warning
   - Confirm NuExtract fallback triggered

5. **UI Test**
   - Open http://localhost:3000
   - Upload passport via drag-and-drop
   - Verify extracted data displays correctly

## MRZ Format Reference

### TD3 (Passport) - 2 lines x 44 characters

```
P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<
L898902C36UTO7408122F1204159ZE184226B<<<<<10
```

Line 1:
- Position 1: Document type (P = Passport)
- Position 2: Type subcode (< = none)
- Positions 3-5: Issuing country (ISO 3166-1 alpha-3)
- Positions 6-44: Name (SURNAME<<GIVEN<NAMES)

Line 2:
- Positions 1-9: Document number
- Position 10: Check digit
- Positions 11-13: Nationality
- Positions 14-19: Date of birth (YYMMDD)
- Position 20: Check digit
- Position 21: Sex (M/F/<)
- Positions 22-27: Expiration date (YYMMDD)
- Position 28: Check digit
- Positions 29-42: Optional data
- Position 43: Check digit
- Position 44: Overall check digit

## References

- [ICAO 9303 Machine Readable Travel Documents](https://www.icao.int/publications/pages/publication.aspx?docnum=9303)
- [PassportEye Library](https://github.com/konstantint/PassportEye)
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
