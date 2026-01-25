# System Design Documentation

End-to-end documentation for the Alma Document Automation project.

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
