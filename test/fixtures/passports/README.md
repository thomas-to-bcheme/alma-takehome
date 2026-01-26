# Passport Test Fixtures

This directory contains test images for passport MRZ extraction testing.

## Important Guidelines

- **NO REAL PASSPORTS**: Never commit real passport images containing actual PII
- Use only synthetic/sample images or publicly available test images
- All test images should be clearly marked as samples/specimens

## Test Image Sources

### Publicly Available MRZ Test Images

1. **ICAO Test Images**
   - [ICAO 9303 Specimen Documents](https://www.icao.int/publications/pages/publication.aspx?docnum=9303)
   - Official specimen images from ICAO documentation

2. **PassportEye Test Images**
   - [PassportEye Test Suite](https://github.com/konstantint/PassportEye/tree/master/tests)
   - Sample images used by the PassportEye library

3. **MRZ Generator Tools**
   - [MRZ Generator](https://www.mrzgenerator.com/)
   - Generate synthetic MRZ strings (create your own test images)

## Expected Directory Structure

```
test/fixtures/passports/
├── README.md           # This file
├── valid/              # Valid passport images with correct MRZ
│   ├── td3_usa.jpg     # US passport specimen
│   └── td3_gbr.jpg     # UK passport specimen
├── invalid/            # Images that should fail extraction
│   ├── no_mrz.jpg      # Image without MRZ
│   └── blurry.jpg      # Low quality image
└── edge_cases/         # Edge case testing
    ├── rotated.jpg     # Rotated passport image
    └── partial_mrz.jpg # Partially visible MRZ
```

## Expected Extraction Results

### Valid TD3 Passport (ICAO Specimen)

**Input MRZ:**
```
P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<
L898902C36UTO7408122F1204159ZE184226B<<<<<10
```

**Expected Output:**
```json
{
  "success": true,
  "data": {
    "documentType": "P",
    "issuingCountry": "UTO",
    "surname": "ERIKSSON",
    "givenNames": "ANNA MARIA",
    "documentNumber": "L898902C3",
    "nationality": "UTO",
    "dateOfBirth": "1974-08-12",
    "sex": "F",
    "expirationDate": "2012-04-15"
  },
  "confidence": 0.98,
  "error": null
}
```

### Invalid Image (No MRZ)

**Expected Output:**
```json
{
  "success": false,
  "data": null,
  "confidence": 0.0,
  "error": "No MRZ detected in image"
}
```

## Adding Test Images

1. Ensure the image is either synthetic or a publicly available specimen
2. Place in the appropriate subdirectory (`valid/`, `invalid/`, `edge_cases/`)
3. Update this README with expected extraction results
4. Run tests to verify extraction behavior

## Running Tests

```bash
# Test PassportEye service directly
curl -X POST -F "file=@test/fixtures/passports/valid/specimen.jpg" \
  http://localhost:8000/extract

# Test full pipeline
curl -X POST -F "passport=@test/fixtures/passports/valid/specimen.jpg" \
  http://localhost:3000/api/extract
```
