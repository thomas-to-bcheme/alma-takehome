# Backend PRD: NuExtract API Integration

## Overview

Integrate the [NuExtract](https://nuextract.ai/) hosted API to extract structured data from uploaded passport and G-28 documents. The API extracts directly to JSON (no Markdown parsing needed).

**Pricing:** $5 per million tokens (includes free trial)

## Why NuExtract over NuMarkdown?

| Model | Output | Hosting | Best For |
|-------|--------|---------|----------|
| **NuExtract** (via API) | Structured JSON | Hosted at nuextract.ai | Document extraction |
| NuMarkdown | Markdown text | Self-hosted (GPU required) | Document-to-Markdown conversion |

NuExtract outputs structured JSON directly, eliminating the need to parse Markdown into fields.

## Architecture

```
Frontend (React) → POST /api/extract → Next.js API Route → NuExtract API
                                              ↓
                                    Returns structured JSON
                                              ↓
                                    Validate & normalize
                                              ↓
                                    Return PassportData/G28Data
```

## File Structure

```
src/
├── lib/
│   ├── config/
│   │   └── extraction.ts          # Env config loader
│   └── extraction/
│       ├── pipeline.ts            # Extraction orchestrator
│       ├── nuextract-client.ts    # API client
│       ├── templates.ts           # Extraction templates
│       └── mrz/
│           └── parser.ts          # MRZ parsing (fallback)
├── types/
│   └── extraction.ts              # PassportData, G28Data types
└── app/api/
    └── extract/
        └── route.ts               # POST handler
```

## Environment Variables

```bash
# .env.local
NUEXTRACT_API_URL=https://api.nuextract.ai/v1  # Your project endpoint
NUEXTRACT_API_KEY=sk-xxx                        # Your API key
NUEXTRACT_TIMEOUT_MS=30000
```

## Implementation Details

### Extraction Templates

NuExtract uses JSON templates to specify what to extract:

```typescript
export const PASSPORT_TEMPLATE = {
  surname: "",
  givenNames: "",
  documentNumber: "",
  dateOfBirth: "",
  expirationDate: "",
  sex: "",
  nationality: "",
  issuingCountry: "",
};

export const G28_TEMPLATE = {
  attorneyName: "",
  firmName: "",
  street: "",
  city: "",
  state: "",
  zipCode: "",
  phone: "",
  email: "",
  clientName: "",
  alienNumber: "",
};
```

### Extraction Pipeline

1. **MRZ Detection**: Attempt to parse MRZ lines from passport images (highest accuracy)
2. **NuExtract Fallback**: If MRZ not found, call NuExtract API with image
3. **Normalization**: Convert dates to YYYY-MM-DD, normalize country codes
4. **Validation**: Validate extracted data with Zod schemas

### NuExtract Response Format

NuExtract returns JSON directly matching the template:

```json
{
  "surname": "DOE",
  "givenNames": "JOHN MICHAEL",
  "documentNumber": "123456789",
  "dateOfBirth": "1990-05-15",
  "expirationDate": "2030-05-14",
  "sex": "M",
  "nationality": "United States",
  "issuingCountry": "United States"
}
```

## Verification Steps

1. Create project at nuextract.ai
2. Add API credentials to `.env.local`
3. Run Next.js: `npm run dev`
4. Upload test passport image via frontend
5. Verify extracted fields match expected values
6. Check API response includes all template fields

## References

- [NuExtract Platform](https://numind.ai/blog/nuextract-platform-the-new-information-extraction)
- [NuMind HuggingFace](https://huggingface.co/numind)
- `system_design_docs/API_SPEC.md` - Endpoint contracts
- `system_design_docs/EXTRACTION.md` - Extraction pipeline details
