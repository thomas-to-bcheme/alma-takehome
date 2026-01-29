/**
 * Hook to detect if the Alma Form Filler Chrome extension is installed.
 *
 * Uses two detection methods:
 * 1. Check for global window flag set by extension's detector.js
 * 2. postMessage ping/pong for async detection
 */

import { useState, useEffect, useCallback } from 'react';

interface ExtensionInfo {
  installed: boolean;
  version: string | null;
}

interface ExtensionDetectionResult {
  /** Whether the extension is detected */
  isExtensionDetected: boolean;
  /** Extension version if detected */
  extensionVersion: string | null;
  /** Whether detection is still in progress */
  isDetecting: boolean;
  /** Manually trigger detection */
  detectExtension: () => void;
}

// Extend window type for extension globals
declare global {
  interface Window {
    __ALMA_EXTENSION_INSTALLED__?: boolean;
    __ALMA_EXTENSION_VERSION__?: string;
  }
}

/**
 * Detect the Alma Form Filler Chrome extension
 *
 * @param timeoutMs - How long to wait for extension response (default: 500ms)
 * @returns Detection result with extension status
 */
export function useExtensionDetection(timeoutMs = 500): ExtensionDetectionResult {
  const [extensionInfo, setExtensionInfo] = useState<ExtensionInfo>({
    installed: false,
    version: null,
  });
  const [isDetecting, setIsDetecting] = useState(true);

  const detectExtension = useCallback(() => {
    setIsDetecting(true);

    // Method 1: Check global flag (synchronous, immediate)
    if (
      typeof window !== 'undefined' &&
      window.__ALMA_EXTENSION_INSTALLED__ === true
    ) {
      setExtensionInfo({
        installed: true,
        version: window.__ALMA_EXTENSION_VERSION__ ?? null,
      });
      setIsDetecting(false);
      return;
    }

    // Method 2: postMessage ping/pong (async, for timing edge cases)
    const handleMessage = (event: MessageEvent): void => {
      if (
        event.source === window &&
        event.data?.type === 'ALMA_EXTENSION_PONG'
      ) {
        setExtensionInfo({
          installed: true,
          version: event.data.version ?? null,
        });
        setIsDetecting(false);
        window.removeEventListener('message', handleMessage);
      }
    };

    window.addEventListener('message', handleMessage);

    // Send ping
    window.postMessage({ type: 'ALMA_EXTENSION_PING' }, '*');

    // Timeout: if no response, extension is not installed
    const timeoutId = setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      setExtensionInfo({ installed: false, version: null });
      setIsDetecting(false);
    }, timeoutMs);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('message', handleMessage);
    };
  }, [timeoutMs]);

  // Run detection on mount
  useEffect(() => {
    // Small delay to allow extension content script to load
    const initTimeout = setTimeout(() => {
      detectExtension();
    }, 100);

    return () => clearTimeout(initTimeout);
  }, [detectExtension]);

  return {
    isExtensionDetected: extensionInfo.installed,
    extensionVersion: extensionInfo.version,
    isDetecting,
    detectExtension,
  };
}
