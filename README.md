# System Design Documentation

End-to-end documentation for the Alma Document Automation project.
Loom demonstration of the upload workflow can be found here:
https://www.loom.com/share/f5c60dc0a14f492c98c54494d4b0a42f

---

## Quick Start

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | Next.js runtime |
| npm/pnpm | latest | Package management |
| Docker | 20+ | Backend microservices |
| Docker Compose | 2.0+ | Service orchestration |
| Tesseract OCR | 4.x | MRZ extraction (for local dev) |

### 1. Start Backend Services (Docker)

```bash
# Start all microservices in detached mode
docker-compose up -d

# Verify services are running
docker-compose ps

# Expected output:
#   passporteye      running   0.0.0.0:8000->8000
#   g28-extraction   running   0.0.0.0:8001->8001
#   form-automation  running   0.0.0.0:8002->8002
```

### 2. Start Frontend (Next.js)

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:3000
```

### 3. Verify Setup

```bash
# Health checks
curl http://localhost:8000/health   # PassportEye
curl http://localhost:8001/health   # G-28 Extraction
curl http://localhost:8002/health   # Form Automation

# Test extraction pipeline
curl -X POST -F "file=@test/fixtures/passports/valid/specimen.jpg" \
  http://localhost:8000/extract
```

---

## Tech Stack

### Frontend

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 16.1.4 |
| UI Library | React | 19.2.3 |
| Styling | Tailwind CSS | v4 |
| Language | TypeScript (strict) | ^5 |
| Form Handling | React Hook Form | 7.71.1 |
| Validation | Zod | 4.3.6 |
| Testing | Vitest | 2.0.0 |
| E2E Testing | Playwright | 1.58.0 |

### Backend Services (Python FastAPI)

| Service | Port | Purpose | Key Dependencies |
|---------|------|---------|------------------|
| PassportEye | 8000 | MRZ extraction | passporteye, tesseract |
| G-28 Extraction | 8001 | Claude Vision extraction | anthropic, pdf2image |
| Form Automation | 8002 | Browser automation | playwright 1.41.0 |

### Deployment Platforms

| Environment | Platform | Notes |
|-------------|----------|-------|
| Frontend | Vercel | Next.js serverless deployment |
| Backend | Docker (local) | Development environment |
| Backend | Railway/Render | Production microservices |

---

## Docker Services

### Service Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   PassportEye   │     │ G-28 Extraction │     │ Form Automation │
│     :8000       │     │     :8001       │     │     :8002       │
│                 │     │                 │     │                 │
│  MRZ + OCR      │     │  Claude Vision  │     │   Playwright    │
│  Extraction     │     │  PDF Parsing    │     │   Fill Forms    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service-name]

# Rebuild after changes
docker-compose up -d --build

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Environment Variables

Each service requires specific environment variables. See `.env.example` for templates:

| Service | Required Variables |
|---------|-------------------|
| PassportEye | `TESSERACT_PATH` |
| G-28 Extraction | `ANTHROPIC_API_KEY` |
| Form Automation | `TARGET_FORM_URL` |

---

## Testing

### Unit Tests (Vitest)

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### E2E Tests (Playwright)

```bash
# Install browsers (first time)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run with UI
npx playwright test --ui
```

### Test Fixtures

Test fixtures are located in `test/fixtures/`:

```
test/fixtures/
├── passports/
│   ├── valid/           # Valid passport images
│   │   └── specimen.jpg # ICAO specimen for MRZ testing
│   ├── invalid/         # Malformed/corrupted files
│   └── edge-cases/      # Blurry, rotated, low-res
└── g28/
    ├── valid/           # Valid G-28 forms
    └── invalid/         # Incomplete/damaged forms
```

### Manual Testing

```bash
# Test PassportEye extraction
curl -X POST -F "file=@test/fixtures/passports/valid/specimen.jpg" \
  http://localhost:8000/extract

# Test G-28 extraction
curl -X POST -F "file=@test/fixtures/g28/valid/sample.pdf" \
  http://localhost:8001/extract

# Test full pipeline (Next.js API)
curl -X POST -F "passport=@test/fixtures/passports/valid/specimen.jpg" \
  http://localhost:3000/api/extract
```

---

## Quick Links

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System overview, tech stack, directory structure |
| [DATA_FLOW.md](./DATA_FLOW.md) | End-to-end data flow, schemas, error states |
| [API_SPEC.md](./API_SPEC.md) | REST API endpoints, request/response contracts |
| [COMPONENTS.md](./COMPONENTS.md) | Frontend components, state management |
| [EXTRACTION.md](./EXTRACTION.md) | MRZ, OCR, LLM extraction pipeline |
| [AUTOMATION.md](./AUTOMATION.md) | Playwright browser automation |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Setup, environment, deployment |

## Agent References

All documentation cross-references the agent specifications in `.agents/`:

| Agent | File | Focus |
|-------|------|-------|
| Backend | `.agents/backend.md` | File processing, data transformation |
| Frontend | `.agents/frontend.md` | Upload UI, state, components |
| API | `.agents/api.md` | Endpoints, validation, contracts |
| AI/ML | `.agents/ai-ml.md` | OCR, MRZ parsing, LLM extraction |
| Automation | `.agents/automation.md` | Playwright, form population |
| Orchestrator | `.agents/orchestrator.md` | Code review, integration |

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                          │
│   Upload Zone → Preview → Extracted Data → Fill Form         │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                      API LAYER                               │
│        POST /api/extract    POST /api/fill-form              │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                    SERVICE LAYER                             │
│   File Service → Extraction Service → Automation Service     │
│                  (MRZ → OCR → LLM)       (Playwright)        │
└─────────────────────────────────────────────────────────────┘
```

## Key Workflows

### 1. Document Upload & Extraction

1. User uploads passport (required) and G-28 form (optional)
2. Server validates file type and size
3. Extraction pipeline processes documents:
   - MRZ parsing (highest accuracy)
   - OCR fallback
   - LLM vision fallback
4. Normalized data returned to frontend

### 2. Form Population

1. User reviews/edits extracted data
2. User triggers form fill
3. Playwright navigates to target form
4. Fields populated based on mapping
5. Screenshot captured (form NOT submitted)

## Development Principles

1. **No Hardcoding**: All config via environment variables
2. **Fail Fast**: Validate at boundaries
3. **Graceful Degradation**: Return partial results
4. **Type Safety**: Full TypeScript coverage
5. **PII Protection**: Scrub sensitive data from logs
