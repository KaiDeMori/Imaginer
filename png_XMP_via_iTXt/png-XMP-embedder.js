/**
 * Embeds a Unicode description into a PNG image using XMP metadata.
 *
 * @param {string} base64_data_url - The original PNG image as a base64 data URL.
 * @param {string} description - The Unicode description text to embed.
 * @returns {Promise<Blob>} - A promise resolving to a Blob of type "image/png" with embedded metadata.
 */
async function embed_XMP_description(base64_data_url, description) {
  const base64_to_uint8_array = (base64) => {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
  };

  const uint8_array_to_blob = (uint8_array, mime_type) => {
    return new Blob([uint8_array], { type: mime_type });
  };

  const crc32 = (buf) => {
    const table = new Uint32Array(256).map((_, n) => {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      return c >>> 0;
    });
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  };

  const create_chunk = (type, data) => {
    const chunk = new Uint8Array(8 + data.length + 4);
    const view = new DataView(chunk.buffer);
    view.setUint32(0, data.length);
    chunk.set(type, 4);
    chunk.set(data, 8);
    view.setUint32(8 + data.length, crc32(chunk.subarray(4, 8 + data.length)));
    return chunk;
  };

  const insert_chunk = (png, chunk, after_type) => {
    let offset = 8; // Skip PNG signature
    while (offset < png.length) {
      const length = new DataView(png.buffer).getUint32(offset);
      const type = String.fromCharCode(...png.subarray(offset + 4, offset + 8));
      offset += 8 + length + 4; // Move to next chunk
      if (type === after_type) break;
    }
    const before = png.subarray(0, offset);
    const after = png.subarray(offset);
    const result = new Uint8Array(before.length + chunk.length + after.length);
    result.set(before, 0);
    result.set(chunk, before.length);
    result.set(after, before.length + chunk.length);
    return result;
  };

  const create_XMP_packet = (description) => {
    const xmp = `
      <?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
      <x:xmpmeta xmlns:x="adobe:ns:meta/">
        <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
          <rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/">
            <dc:description>
              <rdf:Alt>
                <rdf:li xml:lang="x-default">${description}</rdf:li>
              </rdf:Alt>
            </dc:description>
          </rdf:Description>
        </rdf:RDF>
      </x:xmpmeta>
      <?xpacket end="w"?>
    `.trim();
    return new TextEncoder().encode(xmp);
  };

  const PNG_SIGNATURE = new Uint8Array([137,80,78,71,13,10,26,10]);
  const png_data = base64_to_uint8_array(base64_data_url.split(',')[1]);

  if (!png_data.subarray(0, 8).every((v, i) => v === PNG_SIGNATURE[i])) {
    throw new Error("Invalid PNG file");
  }

  const xmp_data = create_XMP_packet(description);
  const keyword = new TextEncoder().encode("XML:com.adobe.xmp\0\0\0\0\0");
  const iTXt_data = new Uint8Array(keyword.length + xmp_data.length);
  iTXt_data.set(keyword, 0);
  iTXt_data.set(xmp_data, keyword.length);

  const iTXt_chunk = create_chunk(new TextEncoder().encode("iTXt"), iTXt_data);
  const modified_png = insert_chunk(png_data, iTXt_chunk, "IHDR");

  return uint8_array_to_blob(modified_png, "image/png");
}

// Export for module usage
export { embed_XMP_description };