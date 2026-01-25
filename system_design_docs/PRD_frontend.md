# Implementation Plan: Document Upload UI + API Route

## Overview
Build a file upload interface for passport (PNG/PDF) and G-28 form (PDF) documents.

## Scope
Upload files and send to API endpoint. **No extraction display, no form filling.**

---

## Test Data
- Passport: PNG and PDF formats
- G-28 form: PDF format

---

## Dependencies to Install

```bash
npm install clsx tailwind-merge
```

---

## Files to Create (in order)

### 1. Types (`src/types/index.ts`)
- File validation types
- API response types
- App state for files only

### 2. Constants (`src/lib/constants.ts`)
- `MAX_SIZE_BYTES`: 10MB
- `ACCEPTED_MIME_TYPES`: PDF, JPEG, PNG
- Error codes and messages

### 3. Utilities (`src/lib/utils.ts`)
- `cn()` helper for Tailwind class merging

### 4. UI Components (`src/components/ui/`)
| File | Purpose |
|------|---------|
| `Button.tsx` | Primary/secondary variants, loading state |
| `Card.tsx` | Container component |
| `Alert.tsx` | Success/error messages |
| `index.ts` | Barrel export |

### 5. Upload Components (`src/components/upload/`)
| File | Purpose |
|------|---------|
| `UploadZone.tsx` | Drag-and-drop, click-to-upload, validation |
| `FilePreview.tsx` | Show selected file with remove button |
| `UploadProgress.tsx` | Uploading/complete/error states |
| `index.ts` | Barrel export |

### 6. State Management (`src/context/AppStateContext.tsx`)
- Track passport and g28 files
- Track upload status (idle/uploading/complete/error)

### 7. API Route (`src/app/api/extract/route.ts`)
- Accept multipart/form-data
- Validate file types (PDF, PNG, JPEG)
- Validate file size (max 10MB)
- Return success response (mock extraction data for now)

### 8. Page (`src/app/`)
| File | Purpose |
|------|---------|
| `UploadSection.tsx` | Client component with upload zones + submit button |
| `page.tsx` | Main page with AppStateProvider |
| `layout.tsx` | Update metadata |

---

## User Flow

1. User drags/clicks passport file (PNG or PDF) onto upload zone
2. File preview shows with remove option
3. User optionally adds G-28 form (PDF)
4. User clicks "Extract Data" button
5. Loading indicator shows
6. Success/error message displays

---

## File Validation

| Check | Client-side | Server-side |
|-------|-------------|-------------|
| MIME type | Yes | Yes |
| File size | Yes | Yes |
| Required passport | Yes | Yes |

**Accepted types:** `application/pdf`, `image/png`, `image/jpeg`
**Max size:** 10MB per file

---

## Directory Structure

```
src/
├── app/
│   ├── api/extract/route.ts
│   ├── UploadSection.tsx
│   ├── page.tsx
│   └── layout.tsx
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Alert.tsx
│   │   └── index.ts
│   ├── upload/
│   │   ├── UploadZone.tsx
│   │   ├── FilePreview.tsx
│   │   ├── UploadProgress.tsx
│   │   └── index.ts
│   └── index.ts
├── context/
│   └── AppStateContext.tsx
├── lib/
│   ├── constants.ts
│   └── utils.ts
└── types/
    └── index.ts
```

---

## Verification

1. `npm run dev` - start local server
2. Upload passport PNG - shows preview
3. Upload passport PDF - shows preview
4. Upload G-28 PDF - shows preview
5. Click Extract - loading state, then success
6. Drop invalid file (.txt) - error message
7. `npm run lint && npm run build` - passes
