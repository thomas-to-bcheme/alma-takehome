import { z } from 'zod';
import { NUEXTRACT_DEFAULTS, PASSPORTEYE_DEFAULTS } from '@/lib/constants';

/**
 * Environment configuration schema for extraction services
 */
const ExtractionConfigSchema = z.object({
  nuextract: z.object({
    apiUrl: z.string().url(),
    apiKey: z.string().min(1),
    timeoutMs: z.number().int().positive().default(NUEXTRACT_DEFAULTS.TIMEOUT_MS),
  }),
  passporteye: z
    .object({
      apiUrl: z.string().url(),
      timeoutMs: z.number().int().positive().default(PASSPORTEYE_DEFAULTS.TIMEOUT_MS),
      enabled: z.boolean().default(PASSPORTEYE_DEFAULTS.ENABLED),
    })
    .optional(),
});

export type ExtractionConfig = z.infer<typeof ExtractionConfigSchema>;

/**
 * Load and validate extraction configuration from environment variables
 * @throws {Error} If required environment variables are missing or invalid
 */
export function loadExtractionConfig(): ExtractionConfig {
  // Build passporteye config only if API URL is provided
  const passporteyeApiUrl = process.env.PASSPORTEYE_API_URL;
  const passporteyeConfig = passporteyeApiUrl
    ? {
        apiUrl: passporteyeApiUrl,
        timeoutMs: process.env.PASSPORTEYE_TIMEOUT_MS
          ? parseInt(process.env.PASSPORTEYE_TIMEOUT_MS, 10)
          : PASSPORTEYE_DEFAULTS.TIMEOUT_MS,
        enabled: process.env.PASSPORTEYE_ENABLED !== 'false',
      }
    : undefined;

  const rawConfig = {
    nuextract: {
      apiUrl: process.env.NUEXTRACT_API_URL,
      apiKey: process.env.NUEXTRACT_API_KEY,
      timeoutMs: process.env.NUEXTRACT_TIMEOUT_MS
        ? parseInt(process.env.NUEXTRACT_TIMEOUT_MS, 10)
        : NUEXTRACT_DEFAULTS.TIMEOUT_MS,
    },
    passporteye: passporteyeConfig,
  };

  const result = ExtractionConfigSchema.safeParse(rawConfig);

  if (!result.success) {
    const missingFields = result.error.issues.map((issue) => issue.path.join('.'));
    throw new Error(
      `Missing or invalid extraction configuration: ${missingFields.join(', ')}. ` +
        'Ensure NUEXTRACT_API_URL and NUEXTRACT_API_KEY are set in environment.'
    );
  }

  return result.data;
}

/**
 * Singleton config instance - lazily loaded on first access
 */
let _config: ExtractionConfig | null = null;

/**
 * Get the extraction configuration (cached after first load)
 */
export function getExtractionConfig(): ExtractionConfig {
  if (!_config) {
    _config = loadExtractionConfig();
  }
  return _config;
}

/**
 * Reset the config cache (useful for testing)
 */
export function resetConfigCache(): void {
  _config = null;
}
