# Agent Registry

> **SYSTEM INSTRUCTION**: Use this index to route tasks to the appropriate agent. Each agent inherits the 5 Development Directives from `CLAUDE.md`.

## Quick Routing Table

| Task Type | Primary Agent | Secondary |
|-----------|---------------|-----------|
| Database/schema changes | backend | api |
| UI component work | frontend | uiux |
| API endpoint changes | api | backend |
| LLM/extraction work | ai-ml | backend |
| Code review | orchestrator | [domain] |
| Form automation | automation | api |
| Test strategy/coverage | qa | [domain] |
| Design system updates | uiux | frontend |
| Docker/deployment | ops | — |

## Agents

| Agent | File | Focus |
|-------|------|-------|
| Orchestrator | `orchestrator.md` | Code review, integration, architecture |
| Frontend | `frontend.md` | React, Next.js, UI components |
| Backend | `backend.md` | File processing, data transformation |
| API | `api.md` | Endpoints, contracts, validation |
| AI/ML | `ai-ml.md` | Extraction pipelines, Claude Vision |
| Automation | `automation.md` | Playwright form filling |
| QA | `qa.md` | Testing, coverage, verification |
| UI/UX | `uiux.md` | Design system, accessibility |
| Ops | `ops.md` | Docker, deployment, configuration |

## Escalation Triggers

- **QA → Domain Agent**: Bug fix required in production code
- **Domain Agent → QA**: Test coverage needed for new feature
- **Any Agent → Orchestrator**: Architectural decision needed
- **Frontend → UI/UX**: Visual design decision needed
- **Backend → API**: Contract changes affect external consumers
- **Any Agent → Ops**: Deployment or pipeline changes needed

## Handoff Protocol

```
HANDOFF REQUIRED:
- From: [current agent]
- To: [target agent]
- Reason: [why escalation is needed]
- Context: [relevant file paths, line numbers]
- Expected Outcome: [what the target agent should deliver]
```
