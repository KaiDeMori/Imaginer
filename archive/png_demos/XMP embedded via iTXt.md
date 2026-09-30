# Project File: PNG XMP Metadata Embedder (Client-side JavaScript)

## Project Overview
A pure JavaScript module for embedding Unicode descriptions into PNG images using XMP metadata. The module will run entirely client-side in a browser environment. It takes a PNG image as a base64 data URL and a Unicode description string, returning a new PNG image Blob with embedded XMP metadata.

## Requirements
- Pure JavaScript (no external dependencies or server-side processing)
- Runs entirely in-browser (client-side)
- Input: PNG image as base64 data URL, Unicode description string
- Output: PNG image Blob (`image/png`) with embedded XMP metadata
- Embeds description using XMP metadata standard via PNG's `iTXt` chunk
- Unicode support for description text

## Function Signature
```javascript
/**
 * Embeds a Unicode description into a PNG image using XMP metadata.
 *
 * @param {string} base64DataUrl - The original PNG image as a base64 data URL.
 * @param {string} description - The Unicode description text to embed.
 * @returns {Promise<Blob>} - A promise resolving to a Blob of type "image/png" with embedded metadata.
 */
async function embedXmpDescription(base64DataUrl, description) {
  // implementation
}
```

## Implementation Steps
1. Decode the base64 data URL into binary data.
2. Parse the PNG binary structure to identify existing chunks.
3. Construct an XMP metadata XML packet containing the provided description.
4. Create a new PNG `iTXt` chunk with keyword `"XML:com.adobe.xmp"` and embed the XMP XML packet.
5. Insert the new `iTXt` chunk into the PNG binary data (typically after the IHDR chunk).
6. Recalculate CRC checksums for modified chunks.
7. Generate a new Blob object (`image/png`) from the modified binary data.

## Testing and Validation
- Verify the resulting PNG Blob is valid and displays correctly in browsers.
- Confirm metadata embedding by inspecting the PNG file with tools like ExifTool or Adobe software.
- Test Unicode support thoroughly with various languages and emoji characters.

## Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Adobe software (Photoshop, Lightroom, Bridge) and other XMP-compatible image viewers/editors

## Deliverables
- JavaScript module file (`png-xmp-embedder.js`)
- Example HTML page demonstrating usage
- Documentation and usage instructions