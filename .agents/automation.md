# Automation Agent (Browser Control)

**Focus**: Playwright Browser Automation, Form Field Population, Error Recovery, Visual Verification.

**Triggers**: "Fill the web form", "Navigate to form URL", "Handle form field", "Fix automation error", "Add screenshot".

---

## CLAUDE.md Alignment

1. **No Hardcoding**: Form URL, field selectors configurable. Support selector updates without code changes.

2. **Fail Fast**: Verify page loaded before interacting. Timeout on missing elements.

3. **Robustness**: Handle dynamic content, wait for elements, retry on transient failures.

4. **Pattern**: **Page Object Model** - Encapsulate form interactions in reusable classes.

---

## Domain-Specific Guidelines

### Target Form
URL: `https://mendrika-alma.github.io/form-submission/`

**Critical**: Do NOT submit or digitally sign the form.

### Playwright Setup
```typescript
import { chromium, Browser, Page } from 'playwright';

interface AutomationConfig {
  headless: boolean; // false for demo/debugging
  slowMo: number;    // Delay between actions (ms)
  timeout: number;   // Default timeout
  screenshotOnFill: boolean;
}

const DEFAULT_CONFIG: AutomationConfig = {
  headless: true,
  slowMo: 50,
  timeout: 30000,
  screenshotOnFill: true,
};
```

### Page Object Pattern
```typescript
class ImmigrationFormPage {
  constructor(private page: Page) {}

  async navigate(url: string): Promise<void>;
  async waitForFormReady(): Promise<void>;

  // Passport fields
  async fillFullName(name: string): Promise<void>;
  async fillDateOfBirth(date: string): Promise<void>;
  async fillNationality(country: string): Promise<void>;
  async fillPassportNumber(number: string): Promise<void>;

  // G-28 fields
  async fillAttorneyName(name: string): Promise<void>;
  async fillFirmName(name: string): Promise<void>;
  async fillAddress(address: Address): Promise<void>;

  // Verification
  async getFilledValues(): Promise<Record<string, string>>;
  async takeScreenshot(path: string): Promise<void>;
}
```

### Field Mapping Strategy
```typescript
// Map extracted data to form selectors
interface FieldMapping {
  dataKey: keyof PassportData | keyof G28Data;
  selector: string;
  inputType: 'text' | 'date' | 'select' | 'radio';
  transform?: (value: string) => string;
}

const FIELD_MAPPINGS: FieldMapping[] = [
  {
    dataKey: 'surname',
    selector: '#lastName',
    inputType: 'text',
  },
  {
    dataKey: 'dateOfBirth',
    selector: '#dob',
    inputType: 'date',
    transform: (date) => formatDateForInput(date),
  },
  // ... other mappings
];
```

### Robust Element Interaction
```typescript
async function fillField(
  page: Page,
  selector: string,
  value: string
): Promise<boolean> {
  try {
    // Wait for element
    await page.waitForSelector(selector, { state: 'visible' });

    // Clear existing value
    await page.fill(selector, '');

    // Type with realistic delay
    await page.type(selector, value, { delay: 50 });

    return true;
  } catch (error) {
    console.error(`Failed to fill ${selector}:`, error);
    return false;
  }
}
```

### Select/Dropdown Handling
```typescript
async function selectOption(
  page: Page,
  selector: string,
  value: string
): Promise<boolean> {
  // Try exact match first
  // Fall back to partial match
  // Fall back to index if needed
}
```

### Date Field Handling
```typescript
// Different browsers handle date inputs differently
async function fillDateField(
  page: Page,
  selector: string,
  date: string // YYYY-MM-DD
): Promise<void> {
  const input = await page.$(selector);
  const inputType = await input?.getAttribute('type');

  if (inputType === 'date') {
    await page.fill(selector, date);
  } else {
    // Text input - use locale-appropriate format
    await page.fill(selector, formatForLocale(date));
  }
}
```

---

## Error Recovery

```typescript
interface FillResult {
  field: string;
  success: boolean;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

// Retry strategy
const RETRY_CONFIG = {
  maxAttempts: 3,
  delayMs: 1000,
  retryableErrors: ['timeout', 'element detached'],
};
```

---

## Sub-Agents

### Navigator
- Handles page navigation
- Waits for network idle
- Detects page load errors

### Form Filler
- Executes field mappings
- Handles different input types
- Reports success/failure per field

### Visual Verifier
- Takes screenshots after filling
- Highlights filled fields
- Generates visual diff reports
