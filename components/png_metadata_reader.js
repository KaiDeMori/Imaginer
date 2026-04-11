/**
 * Scans a PNG Blob for embedded prompts in iTXt chunks or XMP metadata.
 * Prefers the custom "prompt_text" keyword over XMP Description.
 * @param {Blob} blob
 * @returns {Promise<string>} The found prompt or an empty string.
 */
export async function read_png_metadata(blob) {
  const buffer = await blob.arrayBuffer();
  const view = new DataView(buffer);
  const uint8 = new Uint8Array(buffer);

  // Check PNG signature
  if (uint8[0] !== 137 || uint8[1] !== 80 || uint8[2] !== 78 || uint8[3] !== 71) {
    return "";
  }

  let xmp_fallback = "";

  let offset = 8;
  while (offset < buffer.byteLength) {
    if (offset + 8 > buffer.byteLength) break;

    const length = view.getUint32(offset);
    const type = String.fromCharCode(uint8[offset + 4], uint8[offset + 5], uint8[offset + 6], uint8[offset + 7]);

    if (type === "iTXt") {
      const data_offset = offset + 8;
      const data_end = data_offset + length;

      if (data_end > buffer.byteLength) break;

      let pos = data_offset;

      let keyword = "";
      while (pos < data_end && uint8[pos] !== 0) {
        keyword += String.fromCharCode(uint8[pos]);
        pos++;
      }
      pos++; // null separator

      // compression flag + method
      pos += 2;

      // language tag
      while (pos < data_end && uint8[pos] !== 0) pos++;
      pos++;

      // translated keyword
      while (pos < data_end && uint8[pos] !== 0) pos++;
      pos++;

      const text_bytes = uint8.subarray(pos, data_end);
      const text = new TextDecoder().decode(text_bytes);

      if (keyword === "prompt_text") {
        return text;
      }

      if (keyword === "XML:com.adobe.xmp" && !xmp_fallback) {
        const match = text.match(/<dc:description>[\s\S]*?<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>[\s\S]*?<\/dc:description>/);
        if (match && match[1]) {
          xmp_fallback = match[1];
        }
      }
    }

    offset += 8 + length + 4;
  }

  return xmp_fallback;
}
