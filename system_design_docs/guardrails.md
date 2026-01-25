# Claude Code Guardrails & Prompting Strategies

> This document outlines the safety guardrails and prompting strategies implemented for agentic coding in this project.

---

## Overview

This project employs Claude Code for agentic development with carefully designed constraints to ensure safe, predictable, and reversible operations. The core principle follows a **restricted CRUD model** where Create, Read, and Update operations are permitted, but Delete operations require explicit human validation.

---

## 1. Setup Boilerplate System

### Purpose
Project and programming language agnostic best practices are enforced through a boilerplate system located in `system_design_docs/setup/`.

### Components

| File | Purpose |
|------|---------|
| `AGENTS_boilerplate.md` | Defines agent personas, triggers, and domain-specific guidelines |
| `CLAUDE_boilerplate.md` | Establishes development directives and coding standards |
| `systematic_agentic_coding.md` | Documents the agentic workflow methodology |

### Language-Agnostic Principles
The boilerplate enforces principles that apply regardless of tech stack:

1. **Schema First** - Define data structures before implementation
2. **No Hardcoding** - Configuration via environment variables
3. **Fail Fast** - Validate at boundaries, reject invalid input early
4. **Pattern Adherence** - Repository, Container/Presenter, Chain of Responsibility
5. **SOLID Principles** - Single responsibility, dependency injection

---

## 2. CRUD Permission Model

### Philosophy
Agentic coding operates under the principle that **additive operations are safe; destructive operations require human oversight**.

```
┌─────────────────────────────────────────────────────────┐
│                    CRUD Operations                       │
├─────────────┬─────────────┬─────────────┬───────────────┤
│   CREATE    │    READ     │   UPDATE    │    DELETE     │
│     ✅      │     ✅      │     ✅      │      ❌       │
│  Automated  │  Automated  │  Automated  │ Human Required│
└─────────────┴─────────────┴─────────────┴───────────────┘
```

### Allowed Operations (Automated)

#### Create (Init/Add)
- Create new files
- Create new directories
- Create new git branches
- Create new commits
- Create pull requests
- Create issues
- Deploy to new environments

#### Read
- Read any file
- View git history
- List directory contents
- Fetch remote data
- View logs and diagnostics

#### Update (Edit)
- Edit existing files
- Modify configurations
- Update dependencies
- Amend documentation
- Push to remote branches

### Restricted Operations (Human Validation Required)

#### Delete
- ❌ `git reset` - Discards commits
- ❌ `git restore` - Discards file changes
- ❌ `gh repo delete` - Removes repositories
- ❌ `gh gist delete` - Removes gists
- ❌ `gh release delete` - Removes releases
- ❌ `gh issue delete` - Removes issues
- ❌ `vercel env rm` - Removes environment variables
- ❌ `vercel domains rm` - Removes domains
- ❌ `rm`, `rmdir` - File system deletion
- ❌ `DROP`, `DELETE FROM` - Database operations

---

## 3. Permission Configuration

### Implementation
Permissions are enforced via `.claude/settings.local.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(gh pr create:*)",
      "Bash(vercel deploy:*)"
      // ... other non-destructive commands
    ]
  }
}
```

### Explicit Exclusions
The following patterns are intentionally **NOT** included:

```json
// NEVER ALLOW - Destructive Git Operations
"Bash(git reset:*)"      // Can lose commits
"Bash(git restore:*)"    // Can lose changes
"Bash(git clean:*)"      // Deletes untracked files
"Bash(git push --force:*)" // Rewrites remote history

// NEVER ALLOW - Broad Wildcards with Delete Access
"Bash(gh repo:*)"        // Includes delete
"Bash(gh gist:*)"        // Includes delete
"Bash(vercel:*)"         // Includes rm commands
```

### Granular Command Patterns
Instead of broad wildcards, use specific safe subcommands:

```json
// Instead of "gh repo:*", allow specific operations:
"Bash(gh repo view:*)",
"Bash(gh repo clone:*)",
"Bash(gh repo create:*)"

// Instead of "vercel env:*", allow specific operations:
"Bash(vercel env pull:*)",
"Bash(vercel env add:*)",
"Bash(vercel env ls:*)"
```

---

## 4. Prompting Strategies

### Agent Initialization
Each coding session begins with agent context from `.agents/AGENTS.md`:

```markdown
> **SYSTEM INSTRUCTION**: Adopt the persona below that matches
> the user's current request. Always adhere to the Development
> Directives from CLAUDE.md.
```

### Task-Specific Agents
Route tasks to specialized agents to enforce domain boundaries:

| User Request | Agent | Guardrails Applied |
|--------------|-------|-------------------|
| "Add upload component" | Frontend | Component isolation, no global state |
| "Create API endpoint" | API | Input validation, contract stability |
| "Extract passport data" | AI/ML | No hardcoded models, fail fast |
| "Fill web form" | Automation | No form submission, screenshot verification |

### Defensive Prompting Patterns

#### 1. Explicit Constraints
```
"Create a new component for file upload.
Do NOT modify existing components."
```

#### 2. Scope Limitation
```
"Add validation to the /api/extract endpoint.
Only edit files in src/app/api/extract/"
```

#### 3. Rollback Safety
```
"Before making changes, ensure all modifications
can be reverted via git."
```

#### 4. Human Checkpoints
```
"After completing the changes, pause for review
before proceeding to the next step."
```

---

## 5. Audit Trail

### Git-Based History
All changes are tracked through git commits:
- Each logical change = one commit
- Descriptive commit messages
- Co-authored attribution for AI-generated code

### Session Documentation
Key decisions and changes are documented:
- Agent selection rationale
- Files created/modified
- Commands executed
- Errors encountered and resolution

---

## 6. Recovery Procedures

### If Unwanted Changes Occur

1. **Check git status**
   ```bash
   git status
   git diff
   ```

2. **Review recent commits**
   ```bash
   git log --oneline -10
   ```

3. **Revert specific commit** (human-initiated)
   ```bash
   git revert <commit-hash>
   ```

4. **Discard uncommitted changes** (human-initiated)
   ```bash
   git checkout -- <file>
   ```

### Prevention > Recovery
The guardrail system is designed so that recovery procedures should rarely be needed. By restricting delete operations, the worst-case scenario is unwanted additions that can be easily identified and removed through human-validated operations.

---

## 7. Checklist for New Projects

When setting up Claude Code for a new project:

- [ ] Copy boilerplate files from `system_design_docs/setup/`
- [ ] Customize `.agents/` for project-specific domains
- [ ] Configure `.claude/settings.local.json` with restricted permissions
- [ ] Verify no delete/destructive commands are allowed
- [ ] Test permission boundaries before production use
- [ ] Document any project-specific guardrails

---

## Summary

| Principle | Implementation |
|-----------|----------------|
| Safe by Default | Only additive operations automated |
| Human in the Loop | Delete operations require validation |
| Reversibility | All changes tracked in git |
| Least Privilege | Granular command permissions |
| Separation of Concerns | Task-specific agents |
| Audit Trail | Commit history + session docs |
