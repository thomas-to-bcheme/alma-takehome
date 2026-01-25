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

## Vercel Deployment

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

### Platform Considerations & Decision

**Initial Approach:**
Vercel was evaluated as a lightweight deployment tool with server capabilities built on AWS for demonstration purposes.

**Findings:**
- Payment plans are required for additional security features and configuration overhead
- Pro/Enterprise tiers needed for: longer function timeouts, increased memory limits, advanced security controls
- These costs are not justified for a takehome exercise scope

**Decision:**
Vercel is **not recommended** for this project's deployment given the scope constraints. Instead:

1. **Assumption:** Alma has an internal AWS deployment suite (ECS, Lambda, App Runner, etc.)
2. **Frontend Preparation:** The Next.js frontend is cloud-agnostic and prepared for deployment on AWS or other providers
3. **No AWS Wrapper:** Avoid Vercel/Netlify-style wrappers when direct cloud provider access is available

**Recommended Production Path:**
- AWS ECS/Fargate for containerized deployment (use Docker config below)
- AWS Lambda + API Gateway for serverless API routes
- S3 + CloudFront for static frontend assets
- Or equivalent internal infrastructure at Alma

---

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:20-slim

# Install Playwright dependencies
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Install Playwright browsers
RUN npx playwright install chromium

EXPOSE 3000

CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - FORM_URL=${FORM_URL}
      - LLM_PROVIDER=${LLM_PROVIDER}
      - LLM_API_KEY=${LLM_API_KEY}
      - HEADLESS=true
    volumes:
      - ./screenshots:/app/screenshots
```

### Run with Docker

```bash
# Build
docker-compose build

# Run
docker-compose up

# Run in background
docker-compose up -d
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
