// Chunk-level operations on PNG files: parse, serialize, strip, and the two prompt forms. The pixels are never decoded, so every operation is lossless.

import { decode_XML_entities, escape_XML } from "./XML_entities.js";

export const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
export const PIXEL_CHUNK_TYPES = new Set(["IHDR", "PLTE", "tRNS", "IDAT", "IEND"]);
export const PROMPT_KEYWORD = "prompt_text";
export const XMP_KEYWORD = "XML:com.adobe.xmp";

/** @typedef {{ type: string, data: Uint8Array }} PNG_chunk */

const CHUNK_OVERHEAD = 12;
const XMP_PLACEHOLDER = "\u0000PROMPT\u0000";
const DESCRIPTION_PATTERN = /<dc:description(?:\s[^>]*)?>([\s\S]*?)<\/dc:description>/;
const LIST_ITEM_PATTERN = /<rdf:li(?:\s[^>]*)?>([\s\S]*?)<\/rdf:li>/;

const crc_table = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function read_uint32_big_endian(bytes, offset) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset);
}

export function crc32(bytes) {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index++) {
    crc = crc_table[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function is_PNG(bytes) {
  return bytes.length >= PNG_SIGNATURE.length && PNG_SIGNATURE.every((value, index) => bytes[index] === value);
}

/**
 * Walks the chunks and stops without an error at the first chunk that runs past the end or at the end of the bytes.
 * `complete` is true only when the walk reached the IEND chunk.
 * @param {Uint8Array} bytes
 * @returns {{ chunks: PNG_chunk[], complete: boolean }}
 */
function read_chunks_tolerant(bytes) {
  const chunks = [];
  let position = PNG_SIGNATURE.length;
  while (bytes.length - position >= CHUNK_OVERHEAD) {
    const length = read_uint32_big_endian(bytes, position);
    if (bytes.length - position < length + CHUNK_OVERHEAD) break;
    const type = String.fromCharCode(...bytes.subarray(position + 4, position + 8));
    chunks.push({ type, data: bytes.slice(position + 8, position + 8 + length) });
    if (type === "IEND") return { chunks, complete: true };
    position += length + CHUNK_OVERHEAD;
  }
  return { chunks, complete: false };
}

/**
 * @param {Uint8Array} bytes
 * @returns {PNG_chunk[]}
 */
export function read_PNG_chunks(bytes) {
  if (!is_PNG(bytes)) throw new Error("Not a PNG file.");
  const { chunks, complete } = read_chunks_tolerant(bytes);
  if (!complete) throw new Error("Truncated PNG chunk.");
  return chunks;
}

/**
 * @param {PNG_chunk[]} chunks
 * @returns {Uint8Array}
 */
export function write_PNG_chunks(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.data.length + CHUNK_OVERHEAD, PNG_SIGNATURE.length);
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  out.set(PNG_SIGNATURE, 0);
  let position = PNG_SIGNATURE.length;
  for (const chunk of chunks) {
    view.setUint32(position, chunk.data.length);
    for (let index = 0; index < 4; index++) {
      out[position + 4 + index] = chunk.type.charCodeAt(index);
    }
    out.set(chunk.data, position + 8);
    view.setUint32(position + 8 + chunk.data.length, crc32(out.subarray(position + 4, position + 8 + chunk.data.length)));
    position += chunk.data.length + CHUNK_OVERHEAD;
  }
  return out;
}

export function strip_PNG(bytes) {
  return write_PNG_chunks(read_PNG_chunks(bytes).filter((chunk) => PIXEL_CHUNK_TYPES.has(chunk.type)));
}

export function build_XMP_packet(prompt_text) {
  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:description>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escape_XML(prompt_text)}</rdf:li>
        </rdf:Alt>
      </dc:description>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

function collapse_whitespace(text) {
  return text.replace(/\s+/g, " ");
}

export function is_XMP_form(packet_text) {
  const template = collapse_whitespace(build_XMP_packet(XMP_PLACEHOLDER));
  const placeholder_start = template.indexOf(XMP_PLACEHOLDER);
  const head = template.slice(0, placeholder_start);
  const tail = template.slice(placeholder_start + XMP_PLACEHOLDER.length);
  const collapsed = collapse_whitespace(packet_text);
  return collapsed.startsWith(head) && collapsed.endsWith(tail);
}

/**
 * Splits the data of an iTXt chunk into its parts, or returns null when the layout does not fit.
 * @param {Uint8Array} data
 * @returns {{ keyword: string, compression_flag: number, compression_method: number, text_bytes: Uint8Array } | null}
 */
function parse_iTXt_data(data) {
  const keyword_end = data.indexOf(0);
  if (keyword_end < 0 || data.length < keyword_end + 3) return null;
  const language_end = data.indexOf(0, keyword_end + 3);
  if (language_end < 0) return null;
  const translated_end = data.indexOf(0, language_end + 1);
  if (translated_end < 0) return null;
  return {
    keyword: new TextDecoder("utf-8", { ignoreBOM: true }).decode(data.subarray(0, keyword_end)),
    compression_flag: data[keyword_end + 1],
    compression_method: data[keyword_end + 2],
    text_bytes: data.subarray(translated_end + 1),
  };
}

/**
 * @param {string} keyword
 * @param {string} text
 * @returns {PNG_chunk}
 */
function build_iTXt_chunk(keyword, text) {
  const encoder = new TextEncoder();
  const keyword_bytes = encoder.encode(keyword);
  const text_bytes = encoder.encode(text);
  const data = new Uint8Array(keyword_bytes.length + 5 + text_bytes.length);
  data.set(keyword_bytes, 0);
  data.set(text_bytes, keyword_bytes.length + 5);
  return { type: "iTXt", data };
}

async function inflate_bytes(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/**
 * Returns the text of an iTXt chunk, or null when the chunk uses an unknown compression or does not inflate.
 * @param {NonNullable<ReturnType<typeof parse_iTXt_data>>} parsed
 * @returns {Promise<string | null>}
 */
async function read_iTXt_text(parsed) {
  if (parsed.compression_method !== 0) return null;
  let text_bytes;
  if (parsed.compression_flag === 0) {
    text_bytes = parsed.text_bytes;
  } else if (parsed.compression_flag === 1) {
    try {
      text_bytes = await inflate_bytes(parsed.text_bytes);
    } catch {
      return null;
    }
  } else {
    return null;
  }
  return new TextDecoder("utf-8", { ignoreBOM: true }).decode(text_bytes);
}

function read_description(packet_text) {
  const description_match = DESCRIPTION_PATTERN.exec(packet_text);
  if (description_match === null) return null;
  const item_match = LIST_ITEM_PATTERN.exec(description_match[1]);
  return item_match === null ? null : decode_XML_entities(item_match[1]);
}

/**
 * @param {Uint8Array} bytes
 * @returns {Promise<string>}
 */
export async function read_PNG_prompt(bytes) {
  if (!is_PNG(bytes)) return "";
  const { chunks } = read_chunks_tolerant(bytes);
  /** @type {string | null} */
  let xmp_prompt = null;
  for (const chunk of chunks) {
    if (chunk.type !== "iTXt") continue;
    const parsed = parse_iTXt_data(chunk.data);
    if (parsed === null) continue;
    if (parsed.keyword === PROMPT_KEYWORD) {
      const text = await read_iTXt_text(parsed);
      if (text) return text;
    } else if (parsed.keyword === XMP_KEYWORD && xmp_prompt === null) {
      const text = await read_iTXt_text(parsed);
      if (text !== null) xmp_prompt = read_description(text);
    }
  }
  return xmp_prompt ?? "";
}

/**
 * @param {Uint8Array} bytes
 * @param {string} prompt_text
 * @param {{ iTXt_form: boolean, XMP_form: boolean }} forms
 * @returns {Uint8Array}
 */
export function write_PNG_prompt(bytes, prompt_text, forms) {
  const chunks = read_PNG_chunks(bytes);
  const has_prompt = typeof prompt_text === "string" && prompt_text.length > 0;
  const write_iTXt_form = forms.iTXt_form && has_prompt;
  const write_XMP_form = forms.XMP_form && has_prompt;
  const decoder = new TextDecoder("utf-8", { ignoreBOM: true });

  const kept = chunks.filter((chunk) => {
    if (chunk.type !== "iTXt") return true;
    const parsed = parse_iTXt_data(chunk.data);
    if (parsed === null) return true;
    if (parsed.keyword === PROMPT_KEYWORD) return false;
    if (parsed.keyword !== XMP_KEYWORD) return true;
    if (write_XMP_form) return false;
    // A foreign XMP chunk is external metadata, so it stays unless the XMP form replaces it.
    const is_own_form = parsed.compression_flag === 0 && is_XMP_form(decoder.decode(parsed.text_bytes));
    return !is_own_form;
  });

  const inserted = [];
  if (write_iTXt_form) inserted.push(build_iTXt_chunk(PROMPT_KEYWORD, prompt_text));
  if (write_XMP_form) inserted.push(build_iTXt_chunk(XMP_KEYWORD, build_XMP_packet(prompt_text)));
  if (inserted.length > 0) {
    const first_IDAT = kept.findIndex((chunk) => chunk.type === "IDAT");
    if (first_IDAT < 0) throw new Error("PNG has no IDAT chunk.");
    kept.splice(first_IDAT, 0, ...inserted);
  }
  return write_PNG_chunks(kept);
}

const BYTES_PER_PIXEL = 4;
const FILTER_TYPE_COUNT = 5;

async function deflate_bytes(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function paeth_predictor(left, above, upper_left) {
  const estimate = left + above - upper_left;
  const distance_left = Math.abs(estimate - left);
  const distance_above = Math.abs(estimate - above);
  const distance_upper_left = Math.abs(estimate - upper_left);
  if (distance_left <= distance_above && distance_left <= distance_upper_left) return left;
  return distance_above <= distance_upper_left ? above : upper_left;
}

/**
 * Writes the row filtered with the given filter type into `target` and returns the sum of the absolute values of the filtered bytes read as signed bytes.
 * @param {number} filter_type
 * @param {Uint8Array} row
 * @param {Uint8Array} previous_row
 * @param {Uint8Array} target
 * @returns {number}
 */
function filter_row(filter_type, row, previous_row, target) {
  let sum = 0;
  for (let index = 0; index < row.length; index++) {
    const left = index >= BYTES_PER_PIXEL ? row[index - BYTES_PER_PIXEL] : 0;
    const above = previous_row[index];
    const upper_left = index >= BYTES_PER_PIXEL ? previous_row[index - BYTES_PER_PIXEL] : 0;
    let predictor;
    if (filter_type === 0) predictor = 0;
    else if (filter_type === 1) predictor = left;
    else if (filter_type === 2) predictor = above;
    else if (filter_type === 3) predictor = (left + above) >> 1;
    else predictor = paeth_predictor(left, above, upper_left);
    const filtered = (row[index] - predictor) & 0xff;
    target[index] = filtered;
    sum += Math.abs((filtered << 24) >> 24);
  }
  return sum;
}

/**
 * Filters every row with the filter type whose bytes have the smallest signed sum; the lowest filter type wins a tie.
 * @param {Uint8Array} rgba
 * @param {number} width
 * @param {number} height
 * @returns {Uint8Array}
 */
function filter_image_data(rgba, width, height) {
  const row_length = width * BYTES_PER_PIXEL;
  const image_data = new Uint8Array(height * (row_length + 1));
  const candidate = new Uint8Array(row_length);
  const zero_row = new Uint8Array(row_length);
  for (let row_index = 0; row_index < height; row_index++) {
    const row = rgba.subarray(row_index * row_length, (row_index + 1) * row_length);
    const previous_row = row_index > 0 ? rgba.subarray((row_index - 1) * row_length, row_index * row_length) : zero_row;
    const target_offset = row_index * (row_length + 1);
    let best_type = 0;
    let best_sum = Infinity;
    for (let filter_type = 0; filter_type < FILTER_TYPE_COUNT; filter_type++) {
      const sum = filter_row(filter_type, row, previous_row, candidate);
      if (sum < best_sum) {
        best_sum = sum;
        best_type = filter_type;
        image_data.set(candidate, target_offset + 1);
      }
    }
    image_data[target_offset] = best_type;
  }
  return image_data;
}

/**
 * @param {{ width: number, height: number, rgba: Uint8Array }} image
 * @returns {Promise<Uint8Array>}
 */
export async function encode_PNG_RGBA({ width, height, rgba }) {
  if (rgba.length !== width * height * BYTES_PER_PIXEL) throw new Error("Wrong RGBA length.");
  const header = new Uint8Array(13);
  const header_view = new DataView(header.buffer);
  header_view.setUint32(0, width);
  header_view.setUint32(4, height);
  header[8] = 8;
  header[9] = 6;
  const compressed = await deflate_bytes(filter_image_data(rgba, width, height));
  return write_PNG_chunks([
    { type: "IHDR", data: header },
    { type: "IDAT", data: compressed },
    { type: "IEND", data: new Uint8Array(0) },
  ]);
}
