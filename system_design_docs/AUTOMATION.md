# Browser Automation

> Reference: `.agents/automation.md`

## Overview

Playwright-based browser automation to populate the target immigration form with extracted data.

**Target Form:** `https://mendrika-alma.github.io/form-submission/`

**CRITICAL:** Do NOT submit or digitally sign the form.

---

## Playwright Setup

### Installation

```bash
npm install playwright
npx playwright install chromium
```

### Configuration

```typescript
interface AutomationConfig {
  headless: boolean;        // false for demo/debugging
  slowMo: number;           // Delay between actions (ms)
  timeout: number;          // Default timeout (ms)
  screenshotOnFill: boolean;
  screenshotDir: string;
}

const DEFAULT_CONFIG: AutomationConfig = {
  headless: process.env.NODE_ENV === 'production',
  slowMo: 50,
  timeout: 30000,
  screenshotOnFill: true,
  screenshotDir: './screenshots',
};
```

### Browser Launch

```typescript
import { chromium, Browser, BrowserContext, Page } from 'playwright';

async function createBrowser(config: AutomationConfig): Promise<Browser> {
  return chromium.launch({
    headless: config.headless,
    slowMo: config.slowMo,
  });
}

async function createContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({
    viewport: { width: 1280, height: 720 },
    locale: 'en-US',
  });
}
```

---

## Page Object Pattern

### ImmigrationFormPage

```typescript
class ImmigrationFormPage {
  constructor(private page: Page) {}

  // Navigation
  async navigate(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  async waitForFormReady(): Promise<void> {
    await this.page.waitForSelector('form', { state: 'visible' });
  }

  // Passport Fields
  async fillFullName(surname: string, givenNames: string): Promise<void> {
    await this.fillField('#lastName', surname);
    await this.fillField('#firstName', givenNames.split(' ')[0]);
    const middleName = givenNames.split(' ').slice(1).join(' ');
    if (middleName) {
      await this.fillField('#middleName', middleName);
    }
  }

  async fillDateOfBirth(date: string): Promise<void> {
    await this.fillDateField('#dob', date);
  }

  async fillNationality(country: string): Promise<void> {
    await this.selectOption('#nationality', country);
  }

  async fillPassportNumber(number: string): Promise<void> {
    await this.fillField('#passportNumber', number);
  }

  async fillSex(sex: 'M' | 'F' | 'X'): Promise<void> {
    const value = sex === 'M' ? 'male' : sex === 'F' ? 'female' : 'other';
    await this.selectOption('#sex', value);
  }

  // G-28 Fields
  async fillAttorneyName(name: string): Promise<void> {
    await this.fillField('#attorneyName', name);
  }

  async fillFirmName(name: string): Promise<void> {
    await this.fillField('#firmName', name);
  }

  async fillAddress(address: Address): Promise<void> {
    await this.fillField('#street', address.street);
    await this.fillField('#city', address.city);
    await this.selectOption('#state', address.state);
    await this.fillField('#zipCode', address.zipCode);
  }

  // Verification
  async getFilledValues(): Promise<Record<string, string>> {
    const fields = await this.page.$$('input, select');
    const values: Record<string, string> = {};

    for (const field of fields) {
      const id = await field.getAttribute('id');
      const value = await field.inputValue();
      if (id) values[id] = value;
    }

    return values;
  }

  async takeScreenshot(filename: string): Promise<string> {
    const path = `./screenshots/${filename}`;
    await this.page.screenshot({ path, fullPage: true });
    return path;
  }

  // Private helpers
  private async fillField(selector: string, value: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
      await this.page.fill(selector, '');
      await this.page.type(selector, value, { delay: 30 });
      return true;
    } catch (error) {
      console.error(`Failed to fill ${selector}:`, error);
      return false;
    }
  }

  private async fillDateField(selector: string, date: string): Promise<void> {
    const input = await this.page.$(selector);
    const inputType = await input?.getAttribute('type');

    if (inputType === 'date') {
      await this.page.fill(selector, date); // YYYY-MM-DD
    } else {
      // Text input - convert to MM/DD/YYYY for US locale
      const [year, month, day] = date.split('-');
      await this.page.fill(selector, `${month}/${day}/${year}`);
    }
  }

  private async selectOption(selector: string, value: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { state: 'visible', timeout: 5000 });

      // Try exact value match
      await this.page.selectOption(selector, value);
      return true;
    } catch {
      // Try label match
      try {
        await this.page.selectOption(selector, { label: value });
        return true;
      } catch {
        console.error(`Failed to select ${value} in ${selector}`);
        return false;
      }
    }
  }
}
```

---

## Field Mapping

### Configuration-Driven Mapping

```typescript
interface FieldMapping {
  dataKey: string;              // Key in extracted data
  selector: string;             // CSS selector
  inputType: 'text' | 'date' | 'select' | 'radio';
  transform?: (value: string) => string;
  required?: boolean;
}

const PASSPORT_FIELD_MAPPINGS: FieldMapping[] = [
  {
    dataKey: 'surname',
    selector: '#lastName',
    inputType: 'text',
    required: true,
  },
  {
    dataKey: 'givenNames',
    selector: '#firstName',
    inputType: 'text',
    transform: (name) => name.split(' ')[0], // First name only
    required: true,
  },
  {
    dataKey: 'dateOfBirth',
    selector: '#dob',
    inputType: 'date',
    required: true,
  },
  {
    dataKey: 'nationality',
    selector: '#nationality',
    inputType: 'select',
  },
  {
    dataKey: 'documentNumber',
    selector: '#passportNumber',
    inputType: 'text',
  },
  {
    dataKey: 'sex',
    selector: '#sex',
    inputType: 'select',
    transform: (sex) => sex === 'M' ? 'male' : sex === 'F' ? 'female' : 'other',
  },
  {
    dataKey: 'expirationDate',
    selector: '#passportExpiry',
    inputType: 'date',
  },
];

const G28_FIELD_MAPPINGS: FieldMapping[] = [
  {
    dataKey: 'attorneyName',
    selector: '#attorneyName',
    inputType: 'text',
  },
  {
    dataKey: 'firmName',
    selector: '#firmName',
    inputType: 'text',
  },
  // ... address fields
];
```

### Generic Fill Function

```typescript
async function fillFormFields(
  page: Page,
  data: Record<string, unknown>,
  mappings: FieldMapping[]
): Promise<FillResult[]> {
  const results: FillResult[] = [];

  for (const mapping of mappings) {
    const rawValue = data[mapping.dataKey];

    if (rawValue === null || rawValue === undefined) {
      results.push({
        field: mapping.dataKey,
        success: false,
        skipped: true,
        reason: 'No data provided',
      });
      continue;
    }

    const value = mapping.transform
      ? mapping.transform(String(rawValue))
      : String(rawValue);

    const success = await fillField(page, mapping.selector, value, mapping.inputType);

    results.push({
      field: mapping.dataKey,
      success,
      error: success ? undefined : `Failed to fill ${mapping.selector}`,
    });
  }

  return results;
}
```

---

## Error Recovery

### Retry Strategy

```typescript
const RETRY_CONFIG = {
  maxAttempts: 3,
  delayMs: 1000,
  retryableErrors: [
    'Timeout',
    'Element is detached',
    'Element is not visible',
  ],
};

async function withRetry<T>(
  fn: () => Promise<T>,
  config = RETRY_CONFIG
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      const isRetryable = config.retryableErrors.some(
        (msg) => lastError?.message.includes(msg)
      );

      if (!isRetryable || attempt === config.maxAttempts) {
        throw lastError;
      }

      await new Promise((resolve) => setTimeout(resolve, config.delayMs));
    }
  }

  throw lastError;
}
```

### Graceful Degradation

```typescript
interface FillResult {
  field: string;
  success: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
}

interface AutomationResult {
  success: boolean;
  filledFields: string[];
  skippedFields: { field: string; reason: string }[];
  failedFields: { field: string; error: string }[];
  screenshotPath?: string;
}
```

---

## Main Automation Flow

```typescript
async function fillImmigrationForm(
  passportData: PassportData,
  g28Data?: G28Data,
  options: Partial<AutomationConfig> = {}
): Promise<AutomationResult> {
  const config = { ...DEFAULT_CONFIG, ...options };
  const browser = await createBrowser(config);

  try {
    const context = await createContext(browser);
    const page = await context.newPage();
    const formPage = new ImmigrationFormPage(page);

    // Navigate
    await formPage.navigate(process.env.FORM_URL!);
    await formPage.waitForFormReady();

    // Fill passport fields
    const passportResults = await fillFormFields(
      page,
      passportData,
      PASSPORT_FIELD_MAPPINGS
    );

    // Fill G-28 fields if provided
    let g28Results: FillResult[] = [];
    if (g28Data) {
      g28Results = await fillFormFields(page, g28Data, G28_FIELD_MAPPINGS);
    }

    // Take screenshot
    let screenshotPath: string | undefined;
    if (config.screenshotOnFill) {
      screenshotPath = await formPage.takeScreenshot(
        `fill-${Date.now()}.png`
      );
    }

    // Compile results
    const allResults = [...passportResults, ...g28Results];

    return {
      success: allResults.every((r) => r.success || r.skipped),
      filledFields: allResults.filter((r) => r.success).map((r) => r.field),
      skippedFields: allResults
        .filter((r) => r.skipped)
        .map((r) => ({ field: r.field, reason: r.reason! })),
      failedFields: allResults
        .filter((r) => !r.success && !r.skipped)
        .map((r) => ({ field: r.field, error: r.error! })),
      screenshotPath,
    };
  } finally {
    await browser.close();
  }
}
```

---

## Security Considerations

1. **No form submission**: Automation must NEVER submit the form
2. **No credential storage**: Form data only held in memory during fill
3. **Screenshot sanitization**: Blur/redact sensitive fields if storing screenshots
4. **Browser isolation**: Each fill operation uses fresh browser context
5. **Timeout enforcement**: Kill browser if operation exceeds timeout
