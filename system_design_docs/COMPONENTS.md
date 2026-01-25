# Frontend Components

> Reference: `.agents/frontend.md`

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         App (page.tsx)                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    AppStateProvider                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│  │  │   Upload    │  │  Extraction │  │  Automation │       │ │
│  │  │   Section   │  │   Section   │  │   Section   │       │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
src/components/
├── upload/
│   ├── UploadZone.tsx          # Drag-and-drop file upload
│   ├── FilePreview.tsx         # Display uploaded files
│   ├── UploadProgress.tsx      # Upload/processing indicator
│   └── index.ts                # Barrel export
├── extraction/
│   ├── ExtractedDataView.tsx   # Display extracted data
│   ├── DataEditForm.tsx        # Manual data correction
│   ├── ConfidenceIndicator.tsx # Show extraction confidence
│   └── index.ts
├── automation/
│   ├── FormFillButton.tsx      # Trigger automation
│   ├── AutomationStatus.tsx    # Show fill progress
│   ├── ScreenshotPreview.tsx   # Show filled form screenshot
│   └── index.ts
└── ui/
    ├── Button.tsx              # Reusable button
    ├── Card.tsx                # Container component
    ├── Alert.tsx               # Status messages
    └── index.ts
```

---

## Upload Components

### UploadZone

Drag-and-drop file upload with visual feedback.

```typescript
interface UploadZoneProps {
  label: string;                    // "Passport" or "G-28 Form"
  accept: string[];                 // ['application/pdf', 'image/*']
  maxSize: number;                  // bytes
  required?: boolean;
  onFileSelect: (file: File) => void;
  onError: (error: string) => void;
}
```

**Features:**
- Drag-and-drop support
- Click to browse
- File type validation
- Size validation
- Visual feedback on drag-over
- Accessible (keyboard navigation, ARIA labels)

**States:**
- `idle` - Default appearance
- `dragover` - Highlighted when file dragged over
- `error` - Red border with error message
- `hasFile` - Shows file preview

---

### FilePreview

Display uploaded file with remove option.

```typescript
interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}
```

**Features:**
- File name display (truncated if long)
- File size (formatted: KB/MB)
- File type icon (PDF vs image)
- Remove button
- Thumbnail for images

---

### UploadProgress

Show extraction progress.

```typescript
interface UploadProgressProps {
  status: 'idle' | 'uploading' | 'extracting' | 'complete' | 'error';
  progress?: number;        // 0-100
  message?: string;
}
```

---

## Extraction Components

### ExtractedDataView

Display extracted data in readable format.

```typescript
interface ExtractedDataViewProps {
  passportData: PassportData | null;
  g28Data: G28Data | null;
  onEdit: () => void;
}
```

**Layout:**
```
┌─────────────────────────────────────────┐
│ Passport Data                    [Edit] │
├─────────────────────────────────────────┤
│ Name:        JOHN MICHAEL DOE           │
│ DOB:         May 15, 1990               │
│ Nationality: United States              │
│ Passport #:  123456789                  │
│ Expires:     May 14, 2030               │
│ Confidence:  ████████░░ 98%             │
└─────────────────────────────────────────┘
```

---

### DataEditForm

Manual correction of extracted data.

```typescript
interface DataEditFormProps {
  initialData: PassportData | G28Data;
  onSave: (data: PassportData | G28Data) => void;
  onCancel: () => void;
}
```

**Features:**
- Pre-filled with extracted values
- Validation on all fields
- Date picker for date fields
- Dropdown for country selection
- Clear button per field
- Save/Cancel actions

---

### ConfidenceIndicator

Visual indicator of extraction confidence.

```typescript
interface ConfidenceIndicatorProps {
  value: number;        // 0-1
  showLabel?: boolean;
}
```

**Visual:**
- Green: > 0.8
- Yellow: 0.5 - 0.8
- Red: < 0.5

---

## Automation Components

### FormFillButton

Trigger browser automation.

```typescript
interface FormFillButtonProps {
  disabled?: boolean;
  onFill: () => Promise<void>;
}
```

**States:**
- `idle` - "Fill Form" button
- `loading` - Spinner with "Filling..."
- `success` - Checkmark with "Complete"
- `error` - Error message with retry

---

### AutomationStatus

Show form fill progress and results.

```typescript
interface AutomationStatusProps {
  status: 'idle' | 'running' | 'complete' | 'error';
  filledFields: string[];
  skippedFields: { field: string; reason: string }[];
  error?: string;
}
```

---

### ScreenshotPreview

Display screenshot of filled form.

```typescript
interface ScreenshotPreviewProps {
  src: string;
  alt?: string;
  onFullscreen: () => void;
}
```

---

## State Management

### AppState

```typescript
interface AppState {
  // Files
  files: {
    passport: File | null;
    g28: File | null;
  };

  // Extraction
  extraction: {
    status: 'idle' | 'processing' | 'complete' | 'error';
    passportData: PassportData | null;
    g28Data: G28Data | null;
    errors: string[];
  };

  // Automation
  automation: {
    status: 'idle' | 'running' | 'complete' | 'error';
    filledFields: string[];
    skippedFields: { field: string; reason: string }[];
    screenshotUrl: string | null;
    error: string | null;
  };
}
```

### Actions

```typescript
type AppAction =
  | { type: 'SET_FILE'; payload: { field: 'passport' | 'g28'; file: File | null } }
  | { type: 'START_EXTRACTION' }
  | { type: 'EXTRACTION_SUCCESS'; payload: ExtractionResponse }
  | { type: 'EXTRACTION_ERROR'; payload: string }
  | { type: 'UPDATE_DATA'; payload: Partial<PassportData | G28Data> }
  | { type: 'START_FILL' }
  | { type: 'FILL_SUCCESS'; payload: FillFormResponse }
  | { type: 'FILL_ERROR'; payload: string }
  | { type: 'RESET' };
```

---

## Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | All interactive elements focusable |
| Screen reader support | ARIA labels on upload zones |
| Status announcements | `aria-live` for progress updates |
| High contrast | Sufficient color contrast ratios |
| Focus indicators | Visible focus rings |
| Error association | `aria-describedby` for error messages |

---

## Styling Guidelines

- Use Tailwind CSS utility classes
- No inline styles
- Consistent spacing via Tailwind scale
- Dark mode support via `dark:` variants
- Responsive breakpoints: `sm:`, `md:`, `lg:`
