# G-28 Extraction Service

FastAPI microservice that extracts structured data from G-28 immigration forms (Notice of Entry of Appearance as Attorney or Accredited Representative) using Claude Vision API.

## Features

- PDF to image conversion at 300 DPI
- Claude Vision API for structured data extraction
- Automatic normalization (E.164 phone, 2-letter state codes)
- Health check endpoint
- CORS support for frontend integration

## Prerequisites

- Python 3.11+
- poppler-utils (for pdf2image)
- Anthropic API key

### Installing poppler

**macOS:**
```bash
brew install poppler
```

**Ubuntu/Debian:**
```bash
apt-get install poppler-utils
```

**Windows:**
Download from: http://blog.alivate.com.au/poppler-windows/

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

## Running

### Development
```bash
uvicorn app.main:app --port 8001 --reload
```

### Production (Docker)
```bash
docker build -t g28-extraction-service .
docker run -p 8001:8001 --env-file .env g28-extraction-service
```

## API Endpoints

### Health Check
```
GET /health
```
Response:
```json
{"status": "healthy", "service": "g28-extraction"}
```

### Extract G-28 Data
```
POST /extract
Content-Type: multipart/form-data
```
Body: `file` - G-28 PDF or image file (max 10MB)

Response:
```json
{
  "success": true,
  "data": {
    "attorney": {
      "family_name": "Smith",
      "given_name": "John",
      "firm_name": "Smith Law Firm",
      "address": {
        "street": "123 Main St",
        "city": "Los Angeles",
        "state": "CA",
        "zip_code": "90001"
      },
      "phone": "+12135551234",
      "email": "john@smithlaw.com"
    },
    "eligibility": {
      "is_attorney": true,
      "bar_number": "123456"
    },
    "client": {
      "family_name": "Doe",
      "given_name": "Jane",
      "alien_number": "A-123456789"
    }
  },
  "confidence": 0.95,
  "error": null
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| ANTHROPIC_API_KEY | Yes | - | Anthropic API key |
| ANTHROPIC_MODEL | No | claude-sonnet-4-20250514 | Claude model to use |
| ALLOWED_ORIGINS | No | * | CORS allowed origins (comma-separated) |
| LOG_LEVEL | No | INFO | Logging level |

## Integration

This service integrates with the alma frontend via the TypeScript client at `src/lib/extraction/g28-claude-client.ts`.

Configure the frontend:
```bash
# .env.local
G28_CLAUDE_API_URL=http://localhost:8001/extract
G28_CLAUDE_TIMEOUT_MS=60000
G28_CLAUDE_ENABLED=true
```

## License

Proprietary - Internal use only
