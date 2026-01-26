# Frontend Implementation Plan: Data Display & Form Fill UI

## Overview

Build UI components to display extracted data, allow manual corrections, and trigger form population. This extends the existing upload interface.

## Scope

Display extraction results and provide form-fill controls. **No API route logic, no extraction pipeline, no Playwright automation.**

---

## Current State (Complete)

- Upload UI: UploadZone, FilePreview, UploadProgress
- UI primitives: Button, Card, Alert
- State management: AppStateContext
- Types: Zod schemas for validation

## What's Missing (This Plan)

| Component | Purpose |
|-----------|---------|
| `ExtractedDataView.tsx` | Display passport/G-28 fields with confidence scores |
| `DataEditForm.tsx` | Allow manual corrections before form fill |
| `FormFillButton.tsx` | Trigger automation endpoint |
| `AutomationStatus.tsx` | Show progress and screenshot result |

---

## Files to Create

### 1. Extraction Display Components (`src/components/extraction/`)

| File | Purpose |
|------|---------|
| `ExtractedDataView.tsx` | Read-only display of extracted fields |
| `DataEditForm.tsx` | Editable form for corrections |
| `ConfidenceBadge.tsx` | Visual indicator for extraction confidence |
| `FieldRow.tsx` | Single field with label, value, confidence |
| `index.ts` | Barrel export |

### 2. Automation Components (`src/components/automation/`)

| File | Purpose |
|------|---------|
| `FormFillButton.tsx` | Trigger `/api/fill-form` endpoint |
| `AutomationStatus.tsx` | Progress indicator during fill |
| `ScreenshotPreview.tsx` | Display filled form screenshot |
| `index.ts` | Barrel export |

### 3. State Updates (`src/context/AppStateContext.tsx`)

Add extraction and automation state:

```typescript
interface AppState {
  files: {
    passport: File | null;
    g28: File | null;
  };
  extraction: {
    status: 'idle' | 'processing' | 'complete' | 'error';
    passportData: PassportData | null;
    g28Data: G28Data | null;
    errors: readonly string[];
  };
  automation: {
    status: 'idle' | 'running' | 'complete' | 'error';
    screenshotUrl: string | null;
    filledFields: readonly string[];
    error: string | null;
  };
}
```

### 4. Page Updates (`src/app/`)

| File | Change |
|------|--------|
| `page.tsx` | Add ExtractedDataView and FormFillButton sections |
| `UploadSection.tsx` | Transition to extraction display on success |

---

## Component Specifications

### ExtractedDataView

**Props:**
```typescript
interface ExtractedDataViewProps {
  readonly passportData: PassportData | null;
  readonly g28Data: G28Data | null;
  readonly onEdit: () => void;
}
```

**Behavior:**
- Display extracted fields in organized sections (Personal Info, Document Info)
- Show confidence badge per field (high/medium/low)
- "Edit" button to switch to DataEditForm
- Highlight low-confidence fields for review

### DataEditForm

**Props:**
```typescript
interface DataEditFormProps {
  readonly initialData: ExtractedData;
  readonly onSave: (data: ExtractedData) => void;
  readonly onCancel: () => void;
}
```

**Behavior:**
- Pre-fill form with extracted values
- Validate required fields
- Save updates state, Cancel reverts to view mode
- Mark user-edited fields distinctly

### FormFillButton

**Props:**
```typescript
interface FormFillButtonProps {
  readonly extractedData: ExtractedData;
  readonly disabled: boolean;
  readonly onFillComplete: (result: FillResult) => void;
  readonly onError: (error: string) => void;
}
```

**Behavior:**
- Disabled until extraction complete
- Shows loading spinner during automation
- Calls `POST /api/fill-form` with extracted data
- Triggers onFillComplete with screenshot URL

### AutomationStatus

**Props:**
```typescript
interface AutomationStatusProps {
  readonly status: 'idle' | 'running' | 'complete' | 'error';
  readonly filledFields: readonly string[];
  readonly error: string | null;
}
```

**Behavior:**
- Idle: Hidden or "Ready to fill"
- Running: Progress bar with "Filling form..."
- Complete: Success message with field count
- Error: Error alert with message

### ScreenshotPreview

**Props:**
```typescript
interface ScreenshotPreviewProps {
  readonly screenshotUrl: string;
  readonly alt: string;
}
```

**Behavior:**
- Display screenshot of filled form
- Click to open full-size in modal
- Download button for screenshot

---

## User Flow

1. **After extraction completes** → ExtractedDataView displays results
2. User reviews data, optionally clicks **"Edit"** → DataEditForm appears
3. User makes corrections, clicks **"Save"** → Returns to view mode
4. User clicks **"Fill Form"** → AutomationStatus shows progress
5. Automation completes → ScreenshotPreview shows filled form

---

## Styling Guidelines

### Confidence Badges

```typescript
const confidenceStyles = {
  high: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};
```

### Section Layout

- Use Card component for each data section
- Responsive grid: 1 col mobile, 2 col tablet+
- Consistent spacing with Tailwind scale (p-4, gap-4)

---

## Accessibility Requirements

| Element | Requirement |
|---------|-------------|
| ConfidenceBadge | `aria-label="Confidence: high/medium/low"` |
| DataEditForm | Labels linked via `htmlFor`, errors via `aria-describedby` |
| FormFillButton | `aria-busy="true"` when loading |
| AutomationStatus | `aria-live="polite"` for status updates |
| ScreenshotPreview | Descriptive `alt` text |

---

## Directory Structure (After Implementation)

```
src/components/
├── ui/                     # Existing
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Alert.tsx
│   └── index.ts
├── upload/                 # Existing
│   ├── UploadZone.tsx
│   ├── FilePreview.tsx
│   ├── UploadProgress.tsx
│   └── index.ts
├── extraction/             # NEW
│   ├── ExtractedDataView.tsx
│   ├── DataEditForm.tsx
│   ├── ConfidenceBadge.tsx
│   ├── FieldRow.tsx
│   └── index.ts
└── automation/             # NEW
    ├── FormFillButton.tsx
    ├── AutomationStatus.tsx
    ├── ScreenshotPreview.tsx
    └── index.ts
```

---

## Verification

1. `npm run dev` - start local server
2. Complete upload + extraction flow
3. Verify ExtractedDataView displays all fields
4. Click Edit → DataEditForm appears with values
5. Make changes, Save → View updates
6. Click "Fill Form" → Loading state shows
7. Automation completes → Screenshot displays
8. `npm run lint && npm run build` - passes

---

## Dependencies

No new dependencies required. Uses existing:
- `clsx` + `tailwind-merge` for styling
- React Context for state
- Tailwind CSS v4 for design

---

## Coordination Required

| Agent | Dependency |
|-------|------------|
| `api.md` | `/api/fill-form` endpoint must accept `ExtractedData` and return `{ screenshotUrl, filledFields }` |
| `backend.md` | `ExtractedData` type shape must match what pipeline returns |
