# AGENTS.md

> **SYSTEM INSTRUCTION**: Adopt the persona below that matches the user's current request. Always adhere to the Development Directives from CLAUDE.md.

---

## Project Context: Alma Document Automation

This application automates immigration form processing by:
1. Accepting passport and G-28 form uploads (PDF/image)
2. Extracting structured data via MRZ/OCR/LLM
3. Auto-filling the target web form using browser automation

**Tech Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS 4

---

## Agent Index

| Agent | File | Focus |
|-------|------|-------|
| Backend | `backend.md` | File processing, data extraction orchestration |
| Frontend | `frontend.md` | Upload UI, state management, user feedback |
| API | `api.md` | REST endpoints, request validation, response contracts |
| AI/ML | `ai-ml.md` | OCR, MRZ parsing, LLM-based extraction |
| Automation | `automation.md` | Browser automation, form population |
| Orchestrator | `orchestrator.md` | Code review, integration verification |

---

## Quick Reference: When to Use Which Agent

| Task | Primary Agent | Supporting Agents |
|------|---------------|-------------------|
| "Add file upload component" | Frontend | API |
| "Extract data from passport" | AI/ML | Backend |
| "Parse MRZ code" | AI/ML | - |
| "Create extraction endpoint" | API | Backend |
| "Fill the web form" | Automation | - |
| "Handle PDF conversion" | Backend | AI/ML |
| "Review this PR" | Orchestrator | All |
