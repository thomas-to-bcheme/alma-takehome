// Barrel export for extraction module
export { extractPassportData, extractG28Data } from './pipeline';
export { extractWithNuExtract, bufferToBase64, extractBase64FromDataUri, NuExtractError } from './nuextract-client';
export { PASSPORT_TEMPLATE, G28_TEMPLATE, getTemplateForDocumentType } from './templates';
export type { PassportTemplate, G28Template } from './templates';
