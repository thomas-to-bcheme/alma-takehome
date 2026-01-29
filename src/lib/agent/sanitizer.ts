/**
 * XSS sanitization for AI-generated HTML content
 *
 * Uses DOMPurify with strict allowlists to prevent script injection
 * from AI-generated content before opening in new browser tabs.
 */

import DOMPurify from 'dompurify';
import type { HtmlContent } from './tools';

// =============================================================================
// SANITIZATION CONFIGURATION
// =============================================================================

/**
 * Allowed HTML tags for AI-generated content
 * Excludes all script-capable and embedding elements
 */
const ALLOWED_TAGS = [
  // Headings
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  // Text
  'p',
  'br',
  'hr',
  // Lists
  'ul',
  'ol',
  'li',
  // Tables
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  // Semantic
  'div',
  'span',
  'article',
  'section',
  'header',
  'footer',
  'main',
  'nav',
  'aside',
  // Inline formatting
  'strong',
  'em',
  'b',
  'i',
  'u',
  'mark',
  'small',
  'sub',
  'sup',
  // Code
  'pre',
  'code',
  'blockquote',
  // Links and images
  'a',
  'img',
  // Styles (inline only)
  'style',
] as const;

/**
 * Allowed HTML attributes
 */
const ALLOWED_ATTR = [
  'class',
  'id',
  'style',
  'href',
  'target',
  'rel',
  'src',
  'alt',
  'width',
  'height',
  'colspan',
  'rowspan',
] as const;

/**
 * Tags that are explicitly forbidden (security-critical)
 */
const FORBIDDEN_TAGS = [
  'script',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'button',
  'select',
  'textarea',
] as const;

/**
 * Attributes that are explicitly forbidden (event handlers)
 */
const FORBIDDEN_ATTR = [
  'onerror',
  'onload',
  'onclick',
  'onmouseover',
  'onmouseout',
  'onfocus',
  'onblur',
  'onsubmit',
  'onchange',
  'onkeydown',
  'onkeyup',
  'onkeypress',
] as const;

// =============================================================================
// SANITIZATION FUNCTIONS
// =============================================================================

/**
 * Sanitize AI-generated HTML content to prevent XSS attacks
 *
 * @param content - The HTML content from the AI
 * @returns Sanitized complete HTML document
 */
export function sanitizeHtmlContent(content: HtmlContent): string {
  const htmlDocument = buildHtmlDocument(content);

  // Configure DOMPurify with strict settings
  const purifyConfig = {
    ALLOWED_TAGS: [...ALLOWED_TAGS],
    ALLOWED_ATTR: [...ALLOWED_ATTR],
    FORBID_TAGS: [...FORBIDDEN_TAGS],
    FORBID_ATTR: [...FORBIDDEN_ATTR],
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
  };

  return DOMPurify.sanitize(htmlDocument, purifyConfig);
}

/**
 * Build a complete HTML document from content parts
 */
function buildHtmlDocument(content: HtmlContent): string {
  const { title, content: bodyContent, styles } = content;

  const escapedTitle = escapeHtml(title);
  const sanitizedStyles = styles ? sanitizeStyles(styles) : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>
  ${sanitizedStyles ? `<style>${sanitizedStyles}</style>` : ''}
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: #1a1a1a;
    }
    h1, h2, h3 { margin-top: 2rem; }
    pre { background: #f5f5f5; padding: 1rem; overflow-x: auto; }
    code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 3px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
}

/**
 * Escape HTML entities in text (for title)
 */
function escapeHtml(text: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };
  return text.replace(/[&<>"']/g, (char) => escapeMap[char]);
}

/**
 * Sanitize CSS to remove potentially dangerous rules
 */
function sanitizeStyles(styles: string): string {
  return (
    styles
      // Remove JavaScript expressions
      .replace(/expression\s*\([^)]*\)/gi, '')
      // Remove javascript: URLs
      .replace(/javascript\s*:/gi, '')
      // Remove behavior property (IE-specific)
      .replace(/behavior\s*:/gi, '')
      // Remove -moz-binding (Firefox-specific)
      .replace(/-moz-binding\s*:/gi, '')
      // Remove @import (prevents loading external resources)
      .replace(/@import\s+[^;]+;?/gi, '')
      // Remove url() with javascript or data URIs (except safe data URIs)
      .replace(/url\s*\(\s*['"]?\s*javascript:/gi, 'url(blocked:')
  );
}
