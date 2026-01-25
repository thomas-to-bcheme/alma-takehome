# System Architecture

> Reference: `.agents/_index.md`, `.agents/orchestrator.md`

## Overview

Document automation system that extracts data from passport and G-28 immigration forms, then auto-populates a target web form.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Upload Zone │  │  Preview    │  │  Data View  │  │  Fill Form  │        │
│  │ (drag/drop) │  │  (files)    │  │  (results)  │  │  (trigger)  │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         └─────────────────┴─────────────────┴─────────────────┘             │
│                                    │                                         │
└────────────────────────────────────┼─────────────────────────────────────────┘
                                     │ HTTP
┌────────────────────────────────────┼─────────────────────────────────────────┐
│                              API LAYER                                       │
│                    ┌───────────────┴───────────────┐                        │
│                    │      Next.js API Routes       │                        │
│                    │   /api/extract  /api/fill     │                        │
│                    └───────────────┬───────────────┘                        │
│                                    │                                         │
└────────────────────────────────────┼─────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼─────────────────────────────────────────┐
│                            SERVICE LAYER                                     │
│    ┌───────────────┐    ┌──────────┴──────────┐    ┌───────────────┐        │
│    │  File Service │    │ Extraction Service  │    │  Form Service │        │
│    │  (validate,   │───▶│ (MRZ, OCR, LLM)     │───▶│  (Playwright) │        │
│    │   convert)    │    │                     │    │               │        │
│    └───────────────┘    └─────────────────────┘    └───────────────┘        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼─────────────────────────────────────────┐
│                           EXTERNAL SYSTEMS                                   │
│    ┌───────────────┐    ┌─────────────────────┐    ┌───────────────┐        │
│    │  OCR Provider │    │    LLM API          │    │  Target Form  │        │
│    │  (Tesseract/  │    │    (Claude/GPT)     │    │  (GitHub.io)  │        │
│    │   Cloud)      │    │                     │    │               │        │
│    └───────────────┘    └─────────────────────┘    └───────────────┘        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js (App Router) | 16.x |
| UI | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| Language | TypeScript | 5.x |
| Browser Automation | Playwright | Latest |
| Runtime | Node.js | 20+ |

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── extract/       # POST /api/extract
│   │   └── fill-form/     # POST /api/fill-form
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── upload/            # File upload UI
│   ├── extraction/        # Data display/edit
│   └── automation/        # Form fill controls
├── lib/                   # Shared utilities
│   ├── extraction/        # MRZ, OCR, LLM logic
│   ├── automation/        # Playwright helpers
│   └── validation/        # Input validators
└── types/                 # TypeScript interfaces
    ├── passport.ts
    ├── g28.ts
    └── api.ts
```

## Agent Responsibility Matrix

| Component | Primary Agent | Reference |
|-----------|---------------|-----------|
| Upload UI | Frontend | `.agents/frontend.md` |
| API Routes | API | `.agents/api.md` |
| File Processing | Backend | `.agents/backend.md` |
| Data Extraction | AI/ML | `.agents/ai-ml.md` |
| Form Population | Automation | `.agents/automation.md` |
| Integration | Orchestrator | `.agents/orchestrator.md` |

## Design Principles

1. **Separation of Concerns**: Each layer has clear boundaries
2. **Fail Fast**: Validate at system edges
3. **Graceful Degradation**: Return partial results when possible
4. **No Hardcoding**: All config via environment variables
5. **Type Safety**: Full TypeScript coverage
