/**
 * Alma Form Filler - Extension Detector Script
 *
 * This script runs on the Alma app (Vercel/localhost) to enable detection
 * of the extension's presence. It responds to postMessage requests from
 * the web app.
 */

(function () {
  'use strict';

  const EXTENSION_VERSION = '1.1.0';
  const EXTENSION_ID = 'alma-form-filler';

  // Set a global flag that the app can check
  window.__ALMA_EXTENSION_INSTALLED__ = true;
  window.__ALMA_EXTENSION_VERSION__ = EXTENSION_VERSION;

  // Listen for detection requests from the web app
  window.addEventListener('message', function (event) {
    // Only respond to messages from the same origin
    if (event.source !== window) {
      return;
    }

    // Check for detection ping
    if (event.data && event.data.type === 'ALMA_EXTENSION_PING') {
      // Respond with extension info
      window.postMessage(
        {
          type: 'ALMA_EXTENSION_PONG',
          installed: true,
          version: EXTENSION_VERSION,
          id: EXTENSION_ID,
        },
        '*'
      );
    }
  });

  console.log('[Alma Form Filler] Extension detector loaded (v' + EXTENSION_VERSION + ')');
})();
