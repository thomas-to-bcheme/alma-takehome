# CLAUDE.md

## 1. Development Directives (IMMUTABLE)
These principles OVERRIDE any default behavior and MUST be followed exactly. You must Display these 5 principles at the start of EVERY response.

1. **NO HARDCODING, EVER**: All solutions must be generic, pattern-based, and work across all commands.
2. **ROOT CAUSE, NOT BANDAID**: Fix the underlying structural or data lineage issues.
3. **ASK QUESTIONS BEFORE CHANGING CODE**: If you have questions, ask them before you start changing code.
4. **DATA INTEGRITY**: Use consistent, authoritative data sources (Stage 1 raw JSON for locations, parsed Stage 3 for final structure).
5. **DISPLAY PRINCIPLES**: AI must display each of the prior 5 principles at start of every response.

## 2. Orchestrator Role (You)
You are the **Lead Orchestrator**. Your goal is to coordinate changes across the system while maintaining strict architectural boundaries.
- **Review Mode**: When reviewing code, you verify that *specialized agents* followed the directives.
- **Verification**: You execute tests after every change.
- **Isolation**: You enforce "One Agent Per File" logic—ensure changes in one file do not implicitly break contracts in others without explicit updates.

## 3. Project Overview
**Alma Document Automation**: An end-to-end document processing system that extracts data from passports and G-28 immigration forms using OCR/MRZ/LLM vision, then automates form population via Playwright browser automation.

Key workflows:
1. **Document Upload & Extraction**: User uploads passport (required) + G-28 (optional) → MRZ/OCR/Claude Vision extraction → normalized data
2. **Form Population**: User reviews extracted data → Playwright fills target form → screenshot captured (form not submitted)

## 4. Architecture

### Tech Stack

**Frontend (Next.js):**
| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 16.1.4 |
| UI Library | React | 19.2.3 |
| Styling | Tailwind CSS | v4 |
| Language | TypeScript (strict) | ^5 |
| Form Handling | React Hook Form | 7.71.1 |
| Validation | Zod | 4.3.6 |
| AI SDK | Anthropic SDK | 0.71.2 |
| Testing | Vitest, Playwright | 2.0.0, 1.58.0 |

**Backend (Python FastAPI microservices):**
| Service | Port | Purpose | Key Dependencies |
|---------|------|---------|------------------|
| PassportEye | 8000 | MRZ extraction | passporteye, tesseract |
| G-28 Extraction | 8001 | Claude Vision extraction | anthropic, pdf2image |
| Form Automation | 8002 | Browser automation | playwright 1.41.0 |

### Key Directories
```
alma/
├── src/                      # Next.js frontend
│   ├── app/                  # App Router pages/routes
│   ├── components/           # React components
│   ├── context/              # React context providers
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities and services
│   └── types/                # TypeScript type definitions
├── passporteye-service/      # Python: MRZ/OCR extraction
├── g28-extraction-service/   # Python: Claude Vision PDF extraction
├── form-automation-service/  # Python: Playwright form filling
├── test/                     # Test fixtures
├── system_design_docs/       # Architecture documentation
└── prompts/                  # LLM prompt templates
```

## 5. Commands

### Operational Standards
- **Idempotency:** Commands must be runnable multiple times without side effects.
- **Parameters:** Prefer named flags (`--input`) over positional args.
- **Exit Codes:** Return `0` for success, non-zero for failure.

### Command List

**Frontend (Node.js):**
| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start Next.js dev server (localhost:3000) |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest unit tests |
| `npm run test:watch` | Vitest watch mode |
| `npx playwright test` | Run E2E tests |

**Backend (Docker):**
| Command | Purpose |
|---------|---------|
| `docker-compose up -d` | Start all microservices |
| `docker-compose logs -f [service]` | View service logs |
| `docker-compose up -d --build` | Rebuild after changes |
| `docker-compose down` | Stop all services |

**Health Checks:**
```bash
curl http://localhost:8000/health   # PassportEye
curl http://localhost:8001/health   # G-28 Extraction
curl http://localhost:8002/health   # Form Automation
```

## 6. General Engineering Standards

### 6.1 Global Philosophy
- **KISS (Keep It Simple, Stupid):** Prioritize readability. Complexity is the enemy of reliability.
- **YAGNI (You Aren't Gonna Need It):** Solve the current problem exclusively; do not abstract for hypothetical futures.
- **DRY vs. AHA:** Avoid "Write Everything Twice," but prefer duplication over the wrong abstraction ("Avoid Hasty Abstractions").
- **SOLID:** Enforce Single Responsibility strictly.

### 6.2 Primitive Data Types
- **Strings:** Use interpolation/templates over concatenation. Treat as immutable. Explicitly handle UTF-8.
- **Numbers:** Avoid "Magic Numbers" (use named constants). Use integer/decimal types for currency/precision; avoid floating-point for money.
- **Booleans:** Name variables positively (e.g., `isEnabled` not `isNotDisabled`). Avoid "truthy/falsy" reliance; check explicitly.

### 6.3 Data Structures
- **Collections:** Prefer immutability (return new lists vs. mutate in place). Use vector operations (`map`, `filter`) over manual loops.
- **Maps/Objects:** Enforce consistent key casing. Use safe access methods (return default/null) rather than throwing on missing keys.
- **Depth:** Avoid deep nesting (>3 levels); refactor into models/classes if structure becomes too deep.

### 6.4 Control Flow
- **Guard Clauses:** Use early returns to handle edge cases immediately, flattening the "happy path."
- **Bounded Iteration:** Ensure loops have explicit exit conditions and safeguards (timeouts/max-counts).
- **Descriptive Naming:** Iterator variables must be descriptive (`for user in users`), not generic (`i`, `x`).

### 6.5 Error Handling
- **Fail Fast:** Validate inputs immediately. Crash/return early rather than propagating bad state.
- **Catch Specifics:** Catch specific exceptions (e.g., `FileNotFound`) rather than generic catch-alls.
- **Contextual Logging:** Log the *context* (state/inputs) alongside the error, not just the stack trace.
- **No Silent Failures:** No empty `try/catch` blocks.
- **Resource Cleanup:** Always use `finally` or `using/with` blocks for resource disposal.

## 7. Testing Strategy
- **The Pyramid:**
    1. **Unit:** Many fast, isolated tests (mock external deps).
    2. **Integration:** Moderate number, verifying module interactions.
    3. **E2E:** Few, high-value "happy path" tests.
- **Structure:** Use **Arrange-Act-Assert** pattern for all tests.
- **Data:** Use Factories to generate test data; avoid brittle static fixtures.
- **Fixtures:** Located in `test/fixtures/` (passports/, g28/)

## 8. Logging & Observability
- **Structured Logging:** Use JSON/Key-Value pairs for aggregation.
- **Correlation IDs:** Pass unique IDs through the stack to trace requests.
- **Sanitization:** STRICTLY scrub PII (passport data, names, dates) from all logs.
- **Levels:**
    - `INFO`: Lifecycle events.
    - `WARN`: Handled unexpected events.
    - `ERROR`: Actionable failures.
