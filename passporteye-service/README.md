# PassportEye Extraction Service

Python microservice for extracting MRZ data from passport images using [PassportEye](https://github.com/konstantint/PassportEye) and Tesseract OCR.

## Local Development

```bash
# Build and run with Docker
docker build -t passporteye-service .
docker run -p 8000:8000 passporteye-service

# Test the endpoint
curl -X POST -F "file=@passport.jpg" http://localhost:8000/extract
```

## API Endpoints

### `GET /health`
Health check endpoint.

**Response:**
```json
{"status": "healthy", "service": "passporteye"}
```

### `POST /extract`
Extract MRZ data from a passport image.

**Request:** `multipart/form-data`
- `file`: Passport image (JPEG, PNG, or PDF, max 10MB)

**Response:**
```json
{
  "success": true,
  "data": {
    "documentType": "P",
    "issuingCountry": "USA",
    "surname": "SMITH",
    "givenNames": "JOHN",
    "documentNumber": "123456789",
    "nationality": "USA",
    "dateOfBirth": "1990-01-15",
    "sex": "M",
    "expirationDate": "2030-01-15"
  },
  "confidence": 0.98,
  "error": null
}
```

## Deployment

### Railway
```bash
railway login
railway init
railway up
```

### Render
1. Create a new Web Service
2. Connect your repository
3. Set the root directory to `passporteye-service`
4. Render will auto-detect the Dockerfile

### Environment Variables
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins (default: `*`)

## Architecture

```
┌─────────────────────────────────────┐
│  FastAPI (app/main.py)              │
│  - File upload handling             │
│  - CORS configuration               │
│  - Input validation                 │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Extraction (app/extraction.py)     │
│  - PassportEye MRZ detection        │
│  - Date format conversion           │
│  - Field mapping to schema          │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Tesseract OCR (system)             │
│  - Installed via Dockerfile         │
└─────────────────────────────────────┘
```
