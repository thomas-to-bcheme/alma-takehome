# Alma Form Filler Chrome Extension

A Chrome extension that automatically fills immigration forms on `https://mendrika-alma.github.io/form-submission/` with data extracted by the Alma app.

## How It Works

1. The Alma app extracts data from uploaded passport and G-28 documents
2. When you click "Fill Form", it opens the target form with data encoded in the URL hash
3. This extension detects the URL hash and automatically fills all form fields
4. A notification confirms how many fields were filled

## Installation

### Option 1: Load Unpacked (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `alma-form-filler-extension` folder
5. The extension icon should appear in your toolbar

### Option 2: Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store after review.

## Usage

1. Upload your passport and/or G-28 documents in the Alma app
2. Review the extracted data in the form
3. Click **"Fill Form"** button
4. A new tab opens with the target form
5. The extension automatically fills all fields
6. Review the filled form and submit when ready

## Extension Files

- `manifest.json` - Extension configuration (Manifest V3)
- `content.js` - Content script that runs on the target form page
- `background.js` - Service worker for extension lifecycle
- `icons/` - Extension icons (16x16, 48x48, 128x128)

## URL Format

The Alma app encodes form data as base64 JSON in the URL hash:

```
https://mendrika-alma.github.io/form-submission/#data=eyJhdHRvcm5leUxhc3ROYW1lIjoiU21pdGgiLi4ufQ==
```

The extension decodes this hash and fills the form fields automatically.

## Field Mappings

The extension maps Alma form data fields to target form selectors:

| Alma Field | Form Selector |
|------------|---------------|
| attorneyLastName | #attorney-last-name |
| attorneyFirstName | #attorney-first-name |
| clientLastName | #client-last-name |
| passportNumber | #passport-number |
| dateOfBirth | #client-date-of-birth |
| ... | ... |

See `content.js` for the complete mapping.

## Generating Better Icons

The included icons are simple blue squares. To generate better icons with the "A" letter:

1. Open `generate-icons.html` in a browser
2. Right-click each canvas and save as PNG
3. Replace the files in `icons/` folder

Or if you have the `canvas` npm package:

```bash
npm install canvas
node generate-icons.js
```

## Troubleshooting

### Extension not filling fields

1. Make sure the extension is enabled in `chrome://extensions/`
2. Check the browser console (F12) for error messages
3. Verify the URL starts with `https://mendrika-alma.github.io/form-submission/`
4. Ensure the URL hash contains `#data=...`

### Some fields not filled

- Check that the field exists on the form
- The field selector might have changed - compare with `content.js` mappings
- Open DevTools and check console for "[Alma Form Filler]" messages

## Development

To modify the extension:

1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Reload the target form page to test changes

## Security

- The extension only runs on `https://mendrika-alma.github.io/*`
- No data is sent to external servers
- All form data is transmitted via URL hash (client-side only)
