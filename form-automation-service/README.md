# Form Automation Service

FastAPI microservice for automating form filling using Playwright.

## Overview

This service receives form data via REST API and uses Playwright to:
1. Navigate to the target form URL
2. Fill all form fields with provided data
3. Take a screenshot of the filled form
4. Return the result (without submitting)

**Important:** This service does NOT submit forms. It only fills fields and returns a screenshot.

## Quick Start

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Run the server
uvicorn app.main:app --port 8002 --reload
```

### Docker

```bash
# Build image
docker build -t form-automation-service .

# Run container
docker run -p 8002:8002 \
  -e TARGET_FORM_URL=https://mendrika-alma.github.io/form-submission/ \
  -e HEADLESS=true \
  form-automation-service
```

## API Endpoints

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "form-automation",
  "target_form": "https://mendrika-alma.github.io/form-submission/"
}
```

### Fill Form

```bash
POST /fill
Content-Type: application/json
```

Request body (FormA28Data):
```json
{
  "attorneyLastName": "Smith",
  "attorneyFirstName": "John",
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "daytimePhone": "+12125551234",
  "clientLastName": "Doe",
  "clientFirstName": "Jane",
  "passportNumber": "AB1234567",
  "countryOfIssue": "United States",
  "dateOfIssue": "2020-01-15",
  "dateOfExpiration": "2030-01-15",
  "dateOfBirth": "1990-05-20",
  "placeOfBirth": "Los Angeles",
  "sex": "F",
  "nationality": "American",
  "clientSignatureDate": "2025-01-25",
  "attorneySignatureDate": "2025-01-25"
}
```

Response:
```json
{
  "success": true,
  "filledFields": [
    {"fieldName": "attorneyLastName", "status": "filled", "value": "Smith"}
  ],
  "skippedFields": [
    {"fieldName": "fax", "status": "skipped", "error": "Empty optional field"}
  ],
  "failedFields": [],
  "screenshotBase64": "iVBORw0KGgo...",
  "durationMs": 3500
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TARGET_FORM_URL` | `https://mendrika-alma.github.io/form-submission/` | URL of form to fill |
| `ALLOWED_ORIGINS` | `*` | CORS allowed origins (comma-separated) |
| `HEADLESS` | `true` | Run browser in headless mode |
| `LOG_LEVEL` | `INFO` | Logging verbosity |

## Architecture

```
form-automation-service/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI routes
│   ├── schemas.py           # Pydantic models
│   ├── automation.py        # Playwright orchestration
│   ├── field_mapping.py     # Form field → CSS selectors
│   └── page_objects/
│       ├── __init__.py
│       └── form_a28_page.py # Page Object Model
├── Dockerfile
├── requirements.txt
├── .env.example
└── README.md
```

### Key Patterns

1. **Singleton Browser**: Browser instance is shared across requests for performance
2. **Isolated Contexts**: Each fill operation gets a fresh browser context
3. **Page Object Model**: Form interactions abstracted in `FormA28Page` class
4. **Field Mapping**: Centralized mapping from data fields to CSS selectors

## Safety

- Form is **never submitted** - only fields are filled
- Screenshot confirms filled state before returning
- Verification checks that page URL hasn't changed (no redirect)
- Non-root user in Docker container
