# Alma Document Automation

> AI/ML Engineering Take-Home Assignment

## Table of Contents

- [Executive Summary](#executive-summary)
- [Project Purpose](#project-purpose)
- [Feature Objectives](#feature-objectives)
- [Development Methodology](#development-methodology)
- [Repository Structure](#repository-structure)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Tech Stack](#tech-stack)

---

## Executive Summary

This repository contains a document automation web application that extracts structured data from **passport** and **G-28 immigration forms**, then auto-populates a target web form using browser automation. The project demonstrates end-to-end AI/ML engineering capabilities including document processing, multi-strategy data extraction (MRZ, OCR, LLM), and intelligent form population.

**Target Form:** https://mendrika-alma.github.io/form-submission/

### Key Capabilities

| Capability | Description |
|------------|-------------|
| Document Upload | Accept PDF and image files (JPEG, PNG) up to 10MB |
| Data Extraction | MRZ parsing → OCR → LLM vision (fallback chain) |
| Multi-Country Support | Handle passports from various countries |
| Form Automation | Playwright-based browser automation |
| Robustness | Tolerate document variations without code changes |

---

## Project Purpose

This take-home assignment for [Alma](https://tryalma.ai) simulates a real-world document automation process that reduces manual data entry effort in immigration workflows. The application demonstrates:

1. **AI/ML Integration** - Combining traditional computer vision (MRZ, OCR) with modern LLM capabilities
2. **Production Patterns** - Type-safe, testable, maintainable code architecture
3. **Browser Automation** - Reliable form population using Playwright
4. **Agentic Development** - Systematic AI-assisted coding with Claude Code

---

## Feature Objectives

Based on the Product Requirements Document (PRD), the following deliverables must be met:

### 1. File Upload Interface

- [x] Web interface for document upload (Next.js/React)
- [x] Support PDF and image formats (JPEG, PNG)
- [x] Drag-and-drop functionality
- [x] File validation (type, size)

### 2. Data Extraction

- [x] **MRZ Extraction** - Parse Machine Readable Zone from passports
- [x] **OCR Processing** - Extract text from documents
- [x] **LLM-Based Extraction** - Vision model fallback for complex cases

**Fields to Extract:**

| Source | Fields |
|--------|--------|
| Passport | Full name, DOB, nationality, passport number, expiration, sex |
| G-28 Form | Attorney name, firm, address, client name, A-number |

### 3. Form Population

- [x] Navigate to target form URL via Playwright
- [x] Accurately fill fields with extracted data
- [x] Handle different input types (text, date, select)
- [x] **Do NOT submit or digitally sign the form**

### 4. Robustness Requirements

- [x] Handle passports from various countries
- [x] Tolerate minor document formatting variations
- [x] Graceful handling of missing data
- [x] No hardcoded field positions or values

### 5. Deliverables Checklist

- [x] Local web interface with minimal setup
- [x] Working source code in GitHub repository
- [x] Clear setup instructions
- [ ] Screen recording of workflow (Loom) - **Pending**

---

## Development Methodology

### Planning → Implementation → Validation (PIV)

This project follows a systematic **PIV workflow** optimized for AI-assisted development with Claude Code:

```
┌─────────────────────────────────────────────────────────────────┐
│                         PLANNING                                 │
│  Frontload context, define architecture, create agent guides    │
├─────────────────────────────────────────────────────────────────┤
│  • /init → Generate CLAUDE.md foundation                        │
│  • Cross-reference boilerplate best practices                   │
│  • Create .agents/ for domain specialization                    │
│  • Write system_design_docs/ specifications                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       IMPLEMENTATION                             │
│  Execute with combined context from planning artifacts          │
├─────────────────────────────────────────────────────────────────┤
│  • Load CLAUDE.md (automatic)                                   │
│  • Load relevant .agents/*.md for task domain                   │
│  • Reference system_design_docs/ for specifications             │
│  • Build features following established patterns                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        VALIDATION                                │
│  Verify compliance with directives and boundaries               │
├─────────────────────────────────────────────────────────────────┤
│  • Check against Development Directives                         │
│  • Verify agent boundaries respected                            │
│  • Run tests (unit, integration, E2E)                           │
│  • Orchestrator review for cross-cutting concerns               │
└─────────────────────────────────────────────────────────────────┘
```

### Claude Code Best Practices Applied

| Practice | Implementation |
|----------|----------------|
| **CLAUDE.md as Foundation** | Project context, directives, tech stack, data flow |
| **Agent Specialization** | Domain-specific guides in `.agents/` for focused context |
| **Markdown-as-Context** | Human-readable, version-controlled AI guidance |
| **Progressive Context** | Generic → Project → Task-specific layering |
| **Immutable Directives** | Non-negotiable rules enforced across all agents |

### Frontloaded Planning

Before writing implementation code, extensive planning artifacts were created:

```
Planning Artifacts Created
├── CLAUDE.md                    # Foundation context for Claude Code
├── .agents/                     # 6 specialized agent guides
│   ├── _index.md               # Routing rules
│   ├── backend.md              # File processing patterns
│   ├── frontend.md             # UI component specs
│   ├── api.md                  # Endpoint contracts
│   ├── ai-ml.md                # Extraction strategies
│   ├── automation.md           # Playwright patterns
│   └── orchestrator.md         # Review checklists
└── system_design_docs/          # 8 detailed specifications
    ├── ARCHITECTURE.md
    ├── DATA_FLOW.md
    ├── API_SPEC.md
    ├── COMPONENTS.md
    ├── EXTRACTION.md
    ├── AUTOMATION.md
    ├── DEPLOYMENT.md
    └── guardrails.md
```

**Why Frontload Planning?**
- Reduces implementation ambiguity
- Enables parallel agent execution
- Creates reusable context for AI-assisted development
- Establishes clear boundaries and contracts

---

## Repository Structure

```
alma/
├── CLAUDE.md                   # AI guidance (start here)
├── README.md                   # This file
├── .agents/                    # Domain-specific agent guides
├── system_design_docs/         # Detailed specifications
├── src/
│   └── app/                    # Next.js App Router
├── public/                     # Static assets
├── G-28.pdf                    # Sample G-28 form
├── package.json
└── tsconfig.json
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
# Clone repository
git clone git@github.com:thomas-to-bcheme/alma-takehome.git
cd alma-takehome

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:3000

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |

### Docker Services

The backend extraction and automation services run in Docker containers.

```bash
# Start all backend services
docker compose up -d

# Check service health
docker compose ps

# View logs
docker compose logs -f
```

| Service | Port | Health Check |
|---------|------|--------------|
| passporteye | 8000 | http://localhost:8000/health |
| g28-extraction | 8001 | http://localhost:8001/health |
| form-automation | 8002 | http://localhost:8002/health |

---

## Documentation

| Document | Description |
|----------|-------------|
| [`CLAUDE.md`](./CLAUDE.md) | AI guidance, directives, project overview |
| [`.agents/_index.md`](./.agents/_index.md) | Agent routing and descriptions |
| [`system_design_docs/`](./system_design_docs/) | Detailed technical specifications |

### System Design Documents

| Document | Contents |
|----------|----------|
| [`ARCHITECTURE.md`](./system_design_docs/ARCHITECTURE.md) | System layers, tech decisions |
| [`DATA_FLOW.md`](./system_design_docs/DATA_FLOW.md) | End-to-end data pipeline |
| [`API_SPEC.md`](./system_design_docs/API_SPEC.md) | Endpoint contracts |
| [`COMPONENTS.md`](./system_design_docs/COMPONENTS.md) | React component hierarchy |
| [`EXTRACTION.md`](./system_design_docs/EXTRACTION.md) | MRZ, OCR, LLM strategies |
| [`AUTOMATION.md`](./system_design_docs/AUTOMATION.md) | Playwright patterns |
| [`DEPLOYMENT.md`](./system_design_docs/DEPLOYMENT.md) | Setup and deployment |

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 16.1.4 |
| UI | React | 19.2.3 |
| Styling | Tailwind CSS | v4 |
| Language | TypeScript (strict) | 5.x |
| Browser Automation | Playwright | Latest |
| Deployment | Vercel | - |

---

## License

This project is a take-home assignment for Alma. All rights reserved.

---

## Contact

For questions about this submission, please contact the repository owner.
