import type { Page } from 'playwright';
import type { FormA28Data } from '@/lib/validation/formA28Schema';
import { getAllMappings, type FieldMapping, type FieldType } from '../field-mappings';

export interface FieldResult {
  fieldName: string;
  selector: string;
  status: 'filled' | 'skipped' | 'failed';
  value?: string;
  error?: string;
}

const FILL_TIMEOUT_MS = 5000;

/**
 * Page Object Model for the G-28 target form.
 * Encapsulates all form interaction logic.
 */
export class FormA28Page {
  public filledFields: FieldResult[] = [];
  public skippedFields: FieldResult[] = [];
  public failedFields: FieldResult[] = [];

  constructor(
    private readonly page: Page,
    private readonly formUrl: string
  ) {}

  /**
   * Navigate to the target form.
   */
  async navigate(): Promise<void> {
    await this.page.goto(this.formUrl, { waitUntil: 'networkidle' });
  }

  /**
   * Fill the entire form with the provided data.
   */
  async fillForm(data: FormA28Data): Promise<void> {
    const mappings = getAllMappings();

    for (const mapping of mappings) {
      const value = this.getFieldValue(data, mapping.fieldName);
      await this.fillField(mapping, value);
    }
  }

  /**
   * Fill a single field based on its mapping and value.
   */
  private async fillField(mapping: FieldMapping, value: unknown): Promise<void> {
    const { fieldName, selector, fieldType } = mapping;

    // Skip if no value provided
    if (value === undefined || value === null || value === '') {
      this.skippedFields.push({
        fieldName,
        selector,
        status: 'skipped',
      });
      return;
    }

    try {
      await this.fillByType(fieldType, selector, value, fieldName);
      this.filledFields.push({
        fieldName,
        selector,
        status: 'filled',
        value: String(value),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.failedFields.push({
        fieldName,
        selector,
        status: 'failed',
        value: String(value),
        error: errorMessage,
      });
      // Log error but continue with other fields
      console.error(`Failed to fill field "${fieldName}": ${errorMessage}`);
    }
  }

  /**
   * Fill a field based on its type.
   */
  private async fillByType(
    fieldType: FieldType,
    selector: string,
    value: unknown,
    fieldName: string
  ): Promise<void> {
    switch (fieldType) {
      case 'text':
      case 'email':
      case 'tel':
        await this.fillTextField(selector, String(value));
        break;
      case 'select':
        await this.fillSelectField(selector, String(value));
        break;
      case 'checkbox':
        await this.fillCheckboxField(selector, Boolean(value));
        break;
      case 'radio':
        await this.fillRadioField(selector, String(value), fieldName);
        break;
      case 'date':
        await this.fillDateField(selector, String(value));
        break;
      default:
        throw new Error(`Unknown field type: ${fieldType}`);
    }
  }

  /**
   * Fill a text input field.
   */
  private async fillTextField(selector: string, value: string): Promise<void> {
    const element = await this.page.waitForSelector(selector, { timeout: FILL_TIMEOUT_MS });
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    await element.fill(value);
  }

  /**
   * Fill a select dropdown field.
   */
  private async fillSelectField(selector: string, value: string): Promise<void> {
    const element = await this.page.waitForSelector(selector, { timeout: FILL_TIMEOUT_MS });
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    await element.selectOption(value);
  }

  /**
   * Fill a checkbox field.
   */
  private async fillCheckboxField(selector: string, checked: boolean): Promise<void> {
    const element = await this.page.waitForSelector(selector, { timeout: FILL_TIMEOUT_MS });
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    if (checked) {
      await element.check();
    } else {
      await element.uncheck();
    }
  }

  /**
   * Fill a radio button field.
   */
  private async fillRadioField(selector: string, value: string, fieldName: string): Promise<void> {
    // For radio buttons, we need to select the one with the matching value
    // Handle special cases like sex (M/F/X) and isSubjectToOrders (am/am_not)
    let radioSelector: string;

    if (fieldName === 'sex') {
      // Sex radio: value is M, F, or X
      radioSelector = `${selector}[value="${value}"]`;
    } else if (fieldName === 'isSubjectToOrders') {
      // Subject to orders: value is "am" or "am_not"
      radioSelector = `${selector}[value="${value}"]`;
    } else {
      radioSelector = `${selector}[value="${value}"]`;
    }

    const element = await this.page.waitForSelector(radioSelector, { timeout: FILL_TIMEOUT_MS });
    if (!element) {
      throw new Error(`Radio element not found: ${radioSelector}`);
    }
    await element.click();
  }

  /**
   * Fill a date input field.
   */
  private async fillDateField(selector: string, value: string): Promise<void> {
    const element = await this.page.waitForSelector(selector, { timeout: FILL_TIMEOUT_MS });
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    // Date fields expect YYYY-MM-DD format
    await element.fill(value);
  }

  /**
   * Take a screenshot of the current page state.
   */
  async takeScreenshot(): Promise<Buffer> {
    return await this.page.screenshot({ fullPage: true });
  }

  /**
   * Verify that the form was not accidentally submitted.
   * Checks that we're still on the target form URL.
   */
  async verifyNoSubmit(): Promise<boolean> {
    const currentUrl = this.page.url();
    // Allow for URL variations (hash, query params) but ensure base URL matches
    return currentUrl.startsWith(this.formUrl.split('?')[0].split('#')[0]);
  }

  /**
   * Get a field value from the form data object.
   */
  private getFieldValue(data: FormA28Data, fieldName: string): unknown {
    // Use type assertion to access dynamic property
    return (data as Record<string, unknown>)[fieldName];
  }

  /**
   * Get a summary of the fill operation.
   */
  getSummary(): {
    total: number;
    filled: number;
    skipped: number;
    failed: number;
  } {
    return {
      total: this.filledFields.length + this.skippedFields.length + this.failedFields.length,
      filled: this.filledFields.length,
      skipped: this.skippedFields.length,
      failed: this.failedFields.length,
    };
  }
}
