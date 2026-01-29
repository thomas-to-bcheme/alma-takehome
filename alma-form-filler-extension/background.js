/**
 * Alma Form Filler - Background Service Worker
 *
 * This service worker handles extension lifecycle events.
 * The main form-filling logic is in content.js which runs on the target page.
 */

// Log when the extension is installed or updated
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Alma Form Filler] Extension installed');
  } else if (details.reason === 'update') {
    console.log('[Alma Form Filler] Extension updated to version', chrome.runtime.getManifest().version);
  }
});

// Listen for messages from content scripts (for future extensibility)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FORM_FILL_STATUS') {
    console.log('[Alma Form Filler] Form fill status:', message.status, 'Fields filled:', message.filledCount);
  }
  return true;
});
