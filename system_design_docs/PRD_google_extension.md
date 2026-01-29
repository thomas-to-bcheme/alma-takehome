# Frontend Implementation Plan: Data Display & Form Fill UI

---

# Alma Form Filler Chrome Extension: Installation & Testing Guide

This section provides comprehensive step-by-step instructions for installing the Chrome extension for development purposes and testing the integration with the Vercel web application.

---

## Architecture Overview

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│   Vercel Web App    │     │    Chrome Browser    │     │   GitHub Pages      │
│  (localhost:3000)   │     │                      │     │   Form Website      │
├─────────────────────┤     ├──────────────────────┤     ├─────────────────────┤
│                     │     │                      │     │                     │
│  1. User uploads    │     │                      │     │                     │
│     passport/G-28   │     │                      │     │                     │
│          ↓          │     │                      │     │                     │
│  2. Data extracted  │     │                      │     │                     │
│          ↓          │     │                      │     │                     │
│  3. Click "Fill     │────▶│  4. Opens new tab    │────▶│  5. Form page loads │
│     Form" button    │     │     with URL hash    │     │     with #data=...  │
│                     │     │          ↓           │     │          ↓          │
│                     │     │  ┌────────────────┐  │     │  6. Extension       │
│                     │     │  │   EXTENSION    │  │     │     detects URL     │
│                     │     │  │  content.js    │──┼────▶│          ↓          │
│                     │     │  │  (injected)    │  │     │  7. Decodes base64  │
│                     │     │  └────────────────┘  │     │     JSON data       │
│                     │     │                      │     │          ↓          │
│                     │     │                      │     │  8. Fills all form  │
│                     │     │                      │     │     fields          │
│                     │     │                      │     │          ↓          │
│                     │     │                      │     │  9. Shows success   │
│                     │     │                      │     │     notification    │
└─────────────────────┘     └──────────────────────┘     └─────────────────────┘
```

### Data Flow Explanation

1. **Vercel App** (`src/lib/submission/buildFormUrl.ts`) encodes form data as JSON, then base64:
   ```
   {attorneyLastName: "Smith", ...} → JSON string → base64 string
   ```

2. **URL Generated**:
   ```
   https://mendrika-alma.github.io/form-submission/#data=eyJhdHRvcm5leUxhc3ROYW1lIjoiU21pdGgiLC4uLn0=
   ```

3. **Extension** (`alma-form-filler-extension/content.js`) runs automatically on that URL:
   - Reads the `#data=...` hash from the URL
   - Decodes base64 → JSON → JavaScript object
   - Maps each field to a form selector (e.g., `attorneyLastName` → `#attorney-last-name`)
   - Sets each input value and triggers change events
   - Displays success notification with field count

---

## Step 1: Install the Chrome Extension

### 1.1 Open Chrome Extensions Page

1. Open **Google Chrome** browser
2. Type `chrome://extensions/` in the address bar
3. Press **Enter**
4. You will see the Extensions management page

### 1.2 Enable Developer Mode

1. Look for the **"Developer mode"** toggle in the **top-right corner** of the page
2. Click the toggle to turn it **ON**
3. The toggle should turn blue when enabled
4. Three new buttons will appear: "Load unpacked", "Pack extension", and "Update"

### 1.3 Load the Extension

1. Click the **"Load unpacked"** button
2. A file browser dialog will open
3. Navigate to the extension directory:
   ```
   /Users/tto/Desktop/alma/alma-form-filler-extension
   ```
4. Select the folder (do not go inside it, just select it)
5. Click **"Select"** or **"Open"**

### 1.4 Verify Installation

After loading, you should see:

| Indicator | Expected Value |
|-----------|----------------|
| Extension name | "Alma Form Filler" |
| Version | 1.0.0 |
| Status | Enabled (toggle is blue) |
| Icon | Blue "A" icon in toolbar or extension menu |

**If the extension doesn't appear:**
- Check for error messages in red
- Verify the folder contains `manifest.json`
- Try disabling and re-enabling Developer mode

### 1.5 Pin the Extension (Optional)

1. Click the **puzzle piece icon** in Chrome's toolbar (Extensions menu)
2. Find "Alma Form Filler"
3. Click the **pin icon** next to it
4. The blue "A" icon will now appear in your toolbar for easy access

---

## Step 2: Start the Vercel Development Server

### 2.1 Open Terminal

1. Open **Terminal** application on macOS
2. Navigate to the project directory:
   ```bash
   cd /Users/tto/Desktop/alma
   ```

### 2.2 Install Dependencies (First Time Only)

If you haven't installed dependencies yet:
```bash
npm install
```

### 2.3 Start the Development Server

```bash
npm run dev
```

### 2.4 Wait for Server Ready

Wait for the following output:
```
▲ Next.js 16.1.4 (Turbopack)
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000
```

### 2.5 Open the Application

1. Open Chrome browser
2. Navigate to: **http://localhost:3000**
3. You should see the Alma Document Automation interface

---

## Step 3: Test the Integration

### Option A: Quick Test with Sample URL

This tests the extension independently, without needing to upload documents.

1. **Copy this test URL:**
   ```
   https://mendrika-alma.github.io/form-submission/#data=eyJhdHRvcm5leUxhc3ROYW1lIjoiU21pdGgiLCJhdHRvcm5leUZpcnN0TmFtZSI6IkpvaG4iLCJjbGllbnRMYXN0TmFtZSI6IkRvZSIsImNsaWVudEZpcnN0TmFtZSI6IkphbmUiLCJwYXNzcG9ydE51bWJlciI6IkFCMTIzNDU2IiwiZGF0ZU9mQmlydGgiOiIxOTkwLTA1LTE1IiwibmF0aW9uYWxpdHkiOiJVU0EifQ==
   ```

2. **Paste the URL** into Chrome's address bar

3. **Press Enter**

4. **Expected Result:**
   - Green notification banner appears at top of page
   - Message: "Alma: Filled 7 fields successfully"
   - Form fields are populated with:
     - Attorney Last Name: Smith
     - Attorney First Name: John
     - Client Last Name: Doe
     - Client First Name: Jane
     - Passport Number: AB123456
     - Date of Birth: 1990-05-15
     - Nationality: USA

### Option B: Full End-to-End Test

This tests the complete workflow from document upload to form filling.

#### Step 3B.1: Prepare Test Documents

Locate test documents in:
- **Passports:** `test/fixtures/passports/`
- **G-28 Forms:** `test/fixtures/g28/`

#### Step 3B.2: Upload Documents

1. Go to **http://localhost:3000**
2. Click or drag to upload a **passport image** (required)
3. Optionally upload a **G-28 PDF**
4. Wait for the extraction progress to complete

#### Step 3B.3: Review Extracted Data

1. Review the extracted data displayed on screen
2. Verify the fields are correct
3. Make any manual corrections if needed using the Edit button

#### Step 3B.4: Fill the Form

1. Click the **"Fill Form"** button
2. A new browser tab will open automatically
3. The extension will fill all form fields
4. Green notification shows number of fields filled

#### Step 3B.5: Verify Results

Check that:
- [ ] New tab opened to the form website
- [ ] Green success notification appeared
- [ ] All expected fields are populated
- [ ] Field values match the extracted data

---

## Step 4: Troubleshooting

### Common Issues and Solutions

| Symptom | Possible Cause | Solution |
|---------|---------------|----------|
| No green notification | Extension not enabled | Go to `chrome://extensions/` and enable it |
| "Extension not found" error | Extension needs reload | Click refresh icon on extension card |
| Form fields not filling | Selector mismatch | Check DevTools console for errors |
| URL opens but nothing happens | Extension not running on this URL | Check `manifest.json` matches patterns |
| "Uncaught SyntaxError" in console | Invalid base64 data | Check URL encoding in `buildFormUrl.ts` |

### Debug Using Chrome DevTools

1. Navigate to the form page with `#data=...` URL
2. Press **F12** (or right-click → Inspect) to open DevTools
3. Click the **Console** tab
4. Look for messages starting with `[Alma Form Filler]`:

| Log Message | Meaning |
|-------------|---------|
| `Content script loaded on...` | Extension is running on this page |
| `Form data found, filling form...` | Data was detected in URL hash |
| `Setting field: #field-id = value` | Individual field being filled |
| `Filled X fields successfully` | Operation completed |
| `Element not found: #selector` | Form selector doesn't exist on page |
| `Error decoding form data` | Base64/JSON parsing failed |

### Reload the Extension After Code Changes

When you modify extension files:

1. Go to `chrome://extensions/`
2. Find "Alma Form Filler" card
3. Click the **refresh icon** (circular arrow)
4. **Reload the form page** (Ctrl+R or Cmd+R)

### Check Extension Permissions

1. Go to `chrome://extensions/`
2. Click **Details** on "Alma Form Filler"
3. Verify "Site access" includes:
   - `https://mendrika-alma.github.io/*`
4. Ensure "Allow in Incognito" if testing in incognito mode

### View Background Script Logs

1. Go to `chrome://extensions/`
2. Find "Alma Form Filler"
3. Click **"service worker"** link (or "Inspect views: background page")
4. DevTools opens for the background script
5. Check Console for any errors

---

## Step 5: Development Workflow

### Making Changes to the Extension

1. Edit files in `alma-form-filler-extension/`:
   - `manifest.json` - Extension configuration and permissions
   - `content.js` - Script that runs on form pages
   - `background.js` - Service worker for logging

2. Save your changes

3. Reload the extension at `chrome://extensions/`

4. Refresh the form page to test changes

### Making Changes to the Vercel App

1. Edit files in `src/`:
   - `src/lib/submission/buildFormUrl.ts` - URL generation logic
   - `src/components/` - UI components

2. Save changes (hot reload will update automatically)

3. Test the "Fill Form" button workflow

### Key Files Reference

| File | Purpose | When to Modify |
|------|---------|----------------|
| `alma-form-filler-extension/manifest.json` | Extension config, permissions, content script matching | Add new URLs, change permissions |
| `alma-form-filler-extension/content.js` | Runs on form page, reads URL hash, fills fields | Add new field mappings, change fill logic |
| `alma-form-filler-extension/background.js` | Service worker for extension lifecycle | Add background tasks, message handling |
| `src/lib/submission/buildFormUrl.ts` | Generates URL with base64-encoded data | Change data encoding, add fields |

---

## Step 6: Extension Files Structure

```
alma-form-filler-extension/
├── manifest.json       # Extension manifest (v3)
├── content.js          # Content script injected into form pages
├── background.js       # Service worker
└── icons/              # Extension icons
    ├── icon16.png      # Toolbar icon (16x16)
    ├── icon48.png      # Extensions page (48x48)
    └── icon128.png     # Chrome Web Store (128x128)
```

### manifest.json Key Sections

```json
{
  "manifest_version": 3,
  "name": "Alma Form Filler",
  "version": "1.0.0",
  "content_scripts": [{
    "matches": ["https://mendrika-alma.github.io/*"],
    "js": ["content.js"]
  }]
}
```

---

## Appendix: Field Mapping Reference

The extension maps JSON field names to HTML form selectors:

| JSON Field | Form Selector | Description |
|------------|---------------|-------------|
| `attorneyLastName` | `#attorney-last-name` | Attorney's surname |
| `attorneyFirstName` | `#attorney-first-name` | Attorney's given name |
| `clientLastName` | `#client-last-name` | Client's surname |
| `clientFirstName` | `#client-first-name` | Client's given name |
| `passportNumber` | `#passport-number` | Passport document number |
| `dateOfBirth` | `#date-of-birth` | Client's DOB (YYYY-MM-DD) |
| `nationality` | `#nationality` | Client's country of citizenship |

---

# Original PRD: Frontend Implementation Plan

---

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
