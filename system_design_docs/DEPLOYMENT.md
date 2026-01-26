# Deployment Guide

> Reference: `.agents/orchestrator.md`

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

### Local Development

```bash
# Clone repository
git clone git@github.com:thomas-to-bcheme/alma-takehome.git
cd alma-takehome

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev
```

Open http://localhost:3000

---

## Environment Variables

### Required

```bash
# .env.local

# Target form URL
FORM_URL=https://mendrika-alma.github.io/form-submission/

# LLM API (for vision extraction fallback)
LLM_PROVIDER=anthropic          # or 'openai'
LLM_API_KEY=sk-ant-...          # API key
LLM_MODEL=claude-3-sonnet-20240229
```

### Optional

```bash
# OCR Configuration
OCR_PROVIDER=tesseract          # tesseract | google-vision | aws-textract
GOOGLE_VISION_API_KEY=          # If using Google Vision
AWS_ACCESS_KEY_ID=              # If using AWS Textract
AWS_SECRET_ACCESS_KEY=

# Automation
HEADLESS=true                   # Browser mode
SCREENSHOT_DIR=./screenshots

# Debug
DEBUG_MODE=false                # Enable verbose logging
LOG_LEVEL=info                  # debug | info | warn | error
```

---

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |
| `npm run test:e2e` | Run E2E tests |

---

## Project Structure

```
alma-takehome/
├── .agents/                 # Agent specifications
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/           # API routes
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/        # React components
│   ├── lib/               # Utilities
│   └── types/             # TypeScript types
├── public/                 # Static assets
├── screenshots/            # Automation screenshots
├── test/                   # Test files
│   ├── fixtures/          # Test documents
│   └── e2e/               # E2E tests
├── system_design_docs/     # Documentation
├── CLAUDE.md              # AI guidance
├── package.json
├── tsconfig.json
└── .env.local             # Environment (not committed)
```

---

## Deployment Architecture Decision

### Why Not Vercel (Free Tier)

The initial plan was to deploy the Next.js frontend on Vercel. However, the **Vercel free tier did not meet security criteria** for this project:

| Constraint | Vercel Free Tier Limitation |
|------------|----------------------------|
| **Function Timeout** | 10 seconds max (extraction needs 30-60s) |
| **Serverless Cold Starts** | Unpredictable latency for ML models |
| **System Dependencies** | Cannot install Tesseract, OpenCV, MRZ libs |
| **Playwright Support** | Requires workarounds with chromium-min |
| **API Key Exposure** | Environment variable security concerns |
| **Egress Limits** | 100GB/month insufficient for document processing |

### Adopted Architecture: Local Frontend + Dockerized Python Backend

To meet deliverables while maintaining security and reliability, the following architecture was implemented:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS FRONTEND (TypeScript)                     │
│                       localhost:3000                                 │
│  • React UI for document upload                                      │
│  • API route proxies to backend services                             │
│  • Ready for AWS deployment (ECS, Amplify, or EC2)                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│   PASSPORTEYE     │ │  G28-EXTRACTION   │ │  FORM-AUTOMATION  │
│   Python + Docker │ │  Python + Docker  │ │  Python + Docker  │
│   localhost:8000  │ │  localhost:8001   │ │  localhost:8002   │
│                   │ │                   │ │                   │
│  • MRZ parsing    │ │  • PDF processing │ │  • Playwright     │
│  • PassportEye    │ │  • OCR extraction │ │  • Form filling   │
│  • Image proc.    │ │  • LLM vision     │ │  • Browser ctrl   │
└───────────────────┘ └───────────────────┘ └───────────────────┘
```

### Benefits of This Approach

| Benefit | Description |
|---------|-------------|
| **Full Python Ecosystem** | Access to PassportEye, Tesseract, OpenCV, PDF libraries |
| **No Function Limits** | Long-running extraction without timeouts |
| **Security Isolation** | Each service runs in isolated container |
| **Local Development** | Complete workflow testable on localhost |
| **AWS Ready** | Docker images ready for ECS/Fargate deployment |

---

## Python Backend Services (Docker)

### Service Overview

| Service | Port | Purpose | Key Dependencies |
|---------|------|---------|------------------|
| `passporteye` | 8000 | Passport MRZ extraction | PassportEye, OpenCV, Tesseract |
| `g28-extraction` | 8001 | G-28 form data extraction | PyPDF2, pdf2image, Anthropic SDK |
| `form-automation` | 8002 | Browser automation | Playwright, FastAPI |

### docker-compose.yml (Production)

```yaml
version: '3.8'

services:
  # Next.js Frontend
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - PASSPORTEYE_URL=http://passporteye:8000
      - G28_EXTRACTION_URL=http://g28-extraction:8001
      - FORM_AUTOMATION_URL=http://form-automation:8002
    depends_on:
      - passporteye
      - g28-extraction
      - form-automation

  # Passport MRZ Extraction Service
  passporteye:
    build:
      context: ./services/passporteye
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # G-28 Form Extraction Service
  g28-extraction:
    build:
      context: ./services/g28-extraction
      dockerfile: Dockerfile
    ports:
      - "8001:8001"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Form Automation Service
  form-automation:
    build:
      context: ./services/form-automation
      dockerfile: Dockerfile
    ports:
      - "8002:8002"
    environment:
      - FORM_URL=${FORM_URL}
      - HEADLESS=true
    volumes:
      - ./screenshots:/app/screenshots
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8002/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Python Service Dockerfile Template

```dockerfile
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libgl1-mesa-glx \
    libglib2.0-0 \
    poppler-utils \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Running Backend Services

```bash
# Start all backend services
docker compose up -d

# Check service health
docker compose ps

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Health Checks

```bash
# Verify all services are running
curl http://localhost:8000/health  # passporteye
curl http://localhost:8001/health  # g28-extraction
curl http://localhost:8002/health  # form-automation
```

---

## AWS Deployment (Production Ready)

### Recommended AWS Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AWS CLOUD                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Application Load Balancer                  │   │
│  │                      (SSL Termination)                        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│          ┌───────────────────┼───────────────────┐                  │
│          ▼                   ▼                   ▼                  │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐         │
│  │  ECS Fargate  │   │  ECS Fargate  │   │  ECS Fargate  │         │
│  │   Frontend    │   │  passporteye  │   │ g28-extraction│         │
│  │  (Next.js)    │   │   (Python)    │   │   (Python)    │         │
│  └───────────────┘   └───────────────┘   └───────────────┘         │
│          │                   │                   │                  │
│          └───────────────────┼───────────────────┘                  │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    ECS Fargate                                │   │
│  │               form-automation (Python)                        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    AWS Secrets Manager                        │   │
│  │            (API Keys, Credentials)                            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Deployment Options

| Option | Use Case | Complexity |
|--------|----------|------------|
| **ECS Fargate** | Production, auto-scaling | Medium |
| **EC2 + Docker Compose** | Simple, cost-effective | Low |
| **EKS (Kubernetes)** | Enterprise, multi-team | High |
| **AWS Amplify (Frontend)** | Frontend only, quick setup | Low |

### ECS Fargate Deployment Steps

1. **Push Docker images to ECR**
   ```bash
   # Authenticate
   aws ecr get-login-password --region us-east-1 | \
     docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

   # Tag and push each service
   docker tag passporteye:latest <account>.dkr.ecr.us-east-1.amazonaws.com/passporteye:latest
   docker push <account>.dkr.ecr.us-east-1.amazonaws.com/passporteye:latest
   ```

2. **Create ECS Task Definitions** for each service

3. **Configure ALB** with target groups for each service

4. **Store secrets in AWS Secrets Manager**
   ```bash
   aws secretsmanager create-secret \
     --name alma/api-keys \
     --secret-string '{"ANTHROPIC_API_KEY":"sk-ant-..."}'
   ```

5. **Deploy ECS Services** with desired task count

### EC2 Quick Deploy (Development/Staging)

```bash
# On EC2 instance (Amazon Linux 2023)
sudo yum install -y docker git
sudo systemctl start docker
sudo usermod -aG docker ec2-user

# Clone and deploy
git clone <repository>
cd alma-takehome
docker compose up -d
```

---

## Vercel Deployment (Frontend Only - Not Recommended)

> **Note:** This approach is documented for reference but **not recommended** due to security limitations on the free tier. Use the Docker + AWS approach above for production.

### Automatic Deployment

1. Push to GitHub
2. Import repository in Vercel dashboard
3. Configure environment variables
4. Deploy

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Production deployment
vercel --prod
```

### Vercel Configuration

```json
// vercel.json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 60
    }
  },
  "env": {
    "FORM_URL": "@form_url",
    "LLM_API_KEY": "@llm_api_key"
  }
}
```

### Important: Playwright on Vercel

Playwright requires system dependencies. For Vercel deployment:

1. Use API routes for extraction only
2. Run browser automation locally or via a separate service
3. Or use Vercel Functions with chromium-min

```bash
npm install @sparticuz/chromium playwright-core
```

---

## Next.js Frontend Dockerfile

### Dockerfile.frontend

```dockerfile
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

---

## Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run with UI
npx playwright test --ui

# Run specific test
npx playwright test extraction.spec.ts
```

### Test Documents

Place test documents in `test/fixtures/`:

```
test/fixtures/
├── passports/
│   ├── us_passport.jpg
│   └── uk_passport.pdf
└── g28/
    └── g28_sample.pdf
```

---

## Monitoring

### Health Check

```bash
curl http://localhost:3000/api/health
```

### Logs

```bash
# Development
npm run dev

# Docker
docker-compose logs -f app
```

### Structured Logging

All logs follow format:
```json
{
  "timestamp": "2024-01-25T12:00:00.000Z",
  "level": "info",
  "component": "extraction",
  "action": "mrz_parsed",
  "metadata": { "confidence": 0.98 }
}
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Playwright not found | Run `npx playwright install chromium` |
| LLM timeout | Check API key, increase timeout |
| OCR low confidence | Ensure good image quality |
| Form fields not found | Check target form hasn't changed |

### Debug Mode

```bash
# Enable debug logging
DEBUG_MODE=true npm run dev

# Run automation with visible browser
HEADLESS=false npm run dev
```
