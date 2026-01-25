# Orchestrator & Review Agent

**Focus**: Code Review, Integration Verification, Architectural Integrity, PR Reviews.

**Triggers**: "Review this PR", "Check for regressions", "Plan this feature", "Verify integration".

---

## Review Checklist (Definition of Done)

### 1. Directive Check
- [ ] No hardcoded values (URLs, API keys, selectors)
- [ ] Root cause addressed, not symptoms
- [ ] Appropriate error handling
- [ ] KISS principle followed

### 2. Testing Pyramid
- [ ] Unit tests for extraction logic
- [ ] Integration tests for API endpoints
- [ ] E2E tests for automation flow
- [ ] Manual test documented if automation not feasible

### 3. Error Handling
- [ ] Specific error types, not generic catches
- [ ] Errors logged with context
- [ ] User-friendly error messages
- [ ] Graceful degradation where possible

### 4. Security
- [ ] No PII in logs
- [ ] File uploads validated
- [ ] Input sanitized before use
- [ ] No secrets in code

---

## Integration Points

### Upload → Extraction Flow
```
Frontend (UploadZone)
    ↓ POST /api/extract (multipart)
API Layer (validation)
    ↓ validated files
Backend (orchestration)
    ↓ images/pdf
AI/ML (extraction)
    ↓ raw data
Backend (normalization)
    ↓ structured data
API Layer (response)
    ↓ JSON
Frontend (display)
```

### Extraction → Form Fill Flow
```
Frontend (ExtractedDataView)
    ↓ user confirms/edits
Frontend (FormFillButton)
    ↓ POST /api/fill-form
API Layer
    ↓ validated payload
Automation (Playwright)
    ↓ form filled
API Layer (result)
    ↓ JSON + screenshot
Frontend (status display)
```

---

## Cross-Cutting Concerns

### Type Safety
- All data flows through typed interfaces
- Shared types in `src/types/` directory
- No `any` types without justification

### Logging Strategy
```typescript
// Structured logging
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  component: 'frontend' | 'api' | 'backend' | 'ai' | 'automation';
  action: string;
  metadata: Record<string, unknown>;
}

// Sanitize before logging
function sanitize(data: unknown): unknown;
```

### Configuration Management
```
.env.local
├── NEXT_PUBLIC_*     # Client-safe
├── OCR_PROVIDER      # tesseract | google | aws
├── LLM_API_KEY       # For extraction
├── FORM_URL          # Target form
└── DEBUG_MODE        # Enable verbose logging
```

---

## Sub-Agents

### Code Detective
- Scans for magic numbers
- Finds hardcoded strings
- Detects copy-paste code

### Dependency Manager
- Verifies type consistency across layers
- Checks for breaking contract changes
- Validates API request/response alignment

---

## PR Review Template

```markdown
## Summary
[One-line description of changes]

## Checklist
- [ ] Followed agent-specific guidelines
- [ ] Types are consistent across layers
- [ ] Error cases handled
- [ ] No hardcoded values
- [ ] Tests added/updated

## Testing
- [ ] Manual testing performed
- [ ] Automated tests pass
- [ ] Edge cases covered

## Screenshots
[If UI changes]
```
