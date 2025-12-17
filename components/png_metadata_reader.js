/**
 * Scans a PNG Blob for embedded prompts in iTXt chunks or XMP metadata.
 * @param {Blob} blob
 * @returns {Promise<string>} The found prompt or an empty string.
 */
export async function read_png_metadata(blob) {
  const buffer = await blob.arrayBuffer();
  const view = new DataView(buffer);
  const uint8 = new Uint8Array(buffer);

  // Check PNG signature
  if (uint8[0] !== 137 || uint8[1] !== 80 || uint8[2] !== 78 || uint8[3] !== 71) {
    return ""; // Not a PNG
  }

  let offset = 8;
  while (offset < buffer.byteLength) {
    // Ensure we have enough bytes for length (4) and type (4)
    if (offset + 8 > buffer.byteLength) break;

    const length = view.getUint32(offset);
    const type = String.fromCharCode(uint8[offset + 4], uint8[offset + 5], uint8[offset + 6], uint8[offset + 7]);

    if (type === "iTXt") {
      const data_offset = offset + 8;
      const data_end = data_offset + length;

      if (data_end > buffer.byteLength) break;

      let pos = data_offset;

      // 1. Keyword
      let keyword = "";
      while (pos < data_end && uint8[pos] !== 0) {
        keyword += String.fromCharCode(uint8[pos]);
        pos++;
      }
      pos++; // Skip null

      // 2. Compression flag & method (skip 2 bytes)
      pos += 2;

      // 3. Language tag (skip until null)
      while (pos < data_end && uint8[pos] !== 0) pos++;
      pos++;

      // 4. Translated keyword (skip until null)
      while (pos < data_end && uint8[pos] !== 0) pos++;
      pos++;

      // 5. Text
      const text_bytes = uint8.subarray(pos, data_end);
      const text = new TextDecoder().decode(text_bytes);

      // Check for our custom keyword
      if (keyword === "prompt_text") {
        return text;
      }

      // Check for XMP
      if (keyword === "XML:com.adobe.xmp") {
        // Simple regex to find the description in XMP
        // Matches <dc:description>...<rdf:li ...>CONTENT</rdf:li>...</dc:description>
        // We use a slightly more robust regex to capture the content inside the rdf:li
        const match = text.match(/<dc:description>[\s\S]*?<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>[\s\S]*?<\/dc:description>/);
        if (match && match[1]) {
          return match[1];
        }
      }
    }

    // Move to next chunk (Length + Type + Data + CRC)
    offset += 8 + length + 4;
  }

  return "";
}
