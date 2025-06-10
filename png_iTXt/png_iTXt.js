/**
 * Add an uncompressed iTXt chunk to a base-64 PNG.
 *
 * @param {string} data_url   `data:image/png;base64,....`
 * @param {string|Uint8Array} text  UTF-8 text to embed.
 * @param {string} [keyword="prompt_text"] ASCII keyword (1–79 chars).
 * @returns {Promise<Blob>}  Resolved with the patched PNG as a Blob.
 */
export async function add_iTXt_chunk_to_png(data_url, text, keyword = "prompt_text") {
  // 1. Decode base64 PNG to Uint8Array
  const base64 = data_url.replace(/^data:image\/png;base64,/, "");
  const bin = atob(base64);
  const orig = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; ++i) orig[i] = bin.charCodeAt(i);

  // 2. Find the first IDAT chunk offset (to insert before it)
  // PNG signature is 8 bytes
  let pos = 8;
  let insert_pos = -1;
  while (pos < orig.length) {
    const len = (
      (orig[pos] << 24) |
      (orig[pos + 1] << 16) |
      (orig[pos + 2] << 8) |
      (orig[pos + 3])
    ) >>> 0;
    const type = String.fromCharCode(
      orig[pos + 4], orig[pos + 5], orig[pos + 6], orig[pos + 7]
    );
    if (type === "IDAT") {
      insert_pos = pos;
      break;
    }
    pos += 8 + len + 4; // length + type + data + crc
  }
  if (insert_pos < 0) throw new Error("IDAT chunk not found in PNG");

  // 3. Build iTXt data section
  if (typeof text === "string") {
    text = new TextEncoder().encode(text);
  }
  if (typeof keyword !== "string" || !/^[\x20-\x7E]{1,79}$/.test(keyword)) {
    throw new Error("Keyword must be ASCII 1–79 chars");
  }
  const keyword_bytes = new TextEncoder().encode(keyword);
  const itxt_data = new Uint8Array(
    keyword_bytes.length + 1 + 1 + 1 + 1 + 1 + text.length
  );
  let o = 0;
  itxt_data.set(keyword_bytes, o); o += keyword_bytes.length;
  itxt_data[o++] = 0; // NUL
  itxt_data[o++] = 0; // compression flag
  itxt_data[o++] = 0; // compression method
  itxt_data[o++] = 0; // language tag NUL
  itxt_data[o++] = 0; // translated keyword NUL
  itxt_data.set(text, o);

  // 4. Assemble iTXt chunk
  const chunk_type = new Uint8Array([0x69, 0x54, 0x58, 0x74]); // "iTXt"
  const chunk_len = itxt_data.length;
  const chunk = new Uint8Array(4 + 4 + chunk_len + 4);
  // length (big-endian)
  chunk[0] = (chunk_len >>> 24) & 0xFF;
  chunk[1] = (chunk_len >>> 16) & 0xFF;
  chunk[2] = (chunk_len >>> 8) & 0xFF;
  chunk[3] = (chunk_len) & 0xFF;
  // type
  chunk.set(chunk_type, 4);
  // data
  chunk.set(itxt_data, 8);
  // CRC-32
  const crc = crc32(chunk.subarray(4, 8 + chunk_len));
  chunk[8 + chunk_len + 0] = (crc >>> 24) & 0xFF;
  chunk[8 + chunk_len + 1] = (crc >>> 16) & 0xFF;
  chunk[8 + chunk_len + 2] = (crc >>> 8) & 0xFF;
  chunk[8 + chunk_len + 3] = (crc) & 0xFF;

  // 5. Splice new chunk before first IDAT
  const out = new Uint8Array(orig.length + chunk.length);
  out.set(orig.subarray(0, insert_pos), 0);
  out.set(chunk, insert_pos);
  out.set(orig.subarray(insert_pos), insert_pos + chunk.length);

  // 6. Return as Blob
  return new Blob([out], { type: "image/png" });
}

// CRC-32 table (precomputed)
const CRC32_TABLE = (() => {
  let c, table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; ++i) {
    crc = CRC32_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
