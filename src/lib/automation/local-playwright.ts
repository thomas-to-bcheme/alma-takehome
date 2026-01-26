import { chromium, type Browser, type BrowserContext } from 'playwright';
import type { FormA28Data } from '@/lib/validation/formA28Schema';
import { FormA28Page } from './page-objects/FormA28Page';
import { getTargetFormUrl } from './field-mappings';

export interface LocalPlaywrightOptions {
  headless: boolean;
  slowMo: number;
}

export interface FormFillResult {
  success: boolean;
  screenshot?: string; // Base64 encoded
  filledCount: number;
  skippedCount: number;
  failedCount: number;
  failedFields?: Array<{
    fieldName: string;
    error: string;
  }>;
  error?: string;
}

const DEFAULT_OPTIONS: LocalPlaywrightOptions = {
  headless: process.env.LOCAL_PLAYWRIGHT_HEADLESS !== 'false',
  slowMo: parseInt(process.env.LOCAL_PLAYWRIGHT_SLOW_MO ?? '100', 10),
};

/**
 * Check if local Playwright automation is enabled.
 */
export function isLocalPlaywrightEnabled(): boolean {
  return process.env.LOCAL_PLAYWRIGHT_ENABLED === 'true';
}

/**
 * Fill the target form using local Playwright.
 */
export async function fillFormLocal(
  formData: FormA28Data,
  options?: Partial<LocalPlaywrightOptions>
): Promise<FormFillResult> {
  const opts: LocalPlaywrightOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: opts.headless,
      slowMo: opts.slowMo,
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();
    const targetUrl = getTargetFormUrl();
    const formPage = new FormA28Page(page, targetUrl);

    // Navigate to form
    await formPage.navigate();

    // Fill the form
    await formPage.fillForm(formData);

    // Take screenshot of filled form
    const screenshotBuffer = await formPage.takeScreenshot();
    const screenshotBase64 = screenshotBuffer.toString('base64');

    // Verify form wasn't submitted
    const notSubmitted = await formPage.verifyNoSubmit();
    if (!notSubmitted) {
      throw new Error('Form was accidentally submitted - URL changed unexpectedly');
    }

    // Get summary
    const summary = formPage.getSummary();

    return {
      success: true,
      screenshot: screenshotBase64,
      filledCount: summary.filled,
      skippedCount: summary.skipped,
      failedCount: summary.failed,
      failedFields: formPage.failedFields.map((f) => ({
        fieldName: f.fieldName,
        error: f.error ?? 'Unknown error',
      })),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Local Playwright fill failed:', errorMessage);

    return {
      success: false,
      filledCount: 0,
      skippedCount: 0,
      failedCount: 0,
      error: errorMessage,
    };
  } finally {
    // Always clean up resources
    if (context) {
      await context.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
