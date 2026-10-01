// Pure helpers for the conversion tests. They run in the browser and in Node, so they use only platform APIs that both provide.

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const CHANNELS_PER_COLOR_TYPE = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
const EXIF_ORIENTATION_TAG = 0x0112;
const TIFF_TYPE_SHORT = 3;
const WEBP_FLAG_EXIF = 0x08;
const QUADRANT_COLORS = [
   [230, 40, 40],
   [40, 200, 60],
   [40, 70, 220],
   [240, 210, 40],
];

const CRC32_TABLE = (() => {
   const table = new Uint32Array(256);
   for (let index = 0; index < 256; index += 1) {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) {
         value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      }
      table[index] = value >>> 0;
   }
   return table;
})();

export function crc32(bytes) {
   let crc = 0xffffffff;
   for (const byte of bytes) {
      crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
   }
   return (crc ^ 0xffffffff) >>> 0;
}

function ascii_bytes(text) {
   return Uint8Array.from(text, (character) => character.charCodeAt(0));
}

function ascii_text(bytes) {
   return String.fromCharCode(...bytes);
}

function concat_bytes(parts) {
   const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
   let offset = 0;
   for (const part of parts) {
      result.set(part, offset);
      offset += part.length;
   }
   return result;
}

function uint32_big_endian(value) {
   return new Uint8Array([(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]);
}

function uint32_little_endian(value) {
   return new Uint8Array([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]);
}

function read_uint32_little_endian(bytes, offset) {
   return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

/**
 * Compresses with CompressionStream("deflate"), which produces the ZLIB format that PNG image data requires.
 */
export async function zlib_compress(bytes) {
   const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate"));
   return new Uint8Array(await new Response(stream).arrayBuffer());
}

export function build_png_chunk(type, data) {
   const type_and_data = concat_bytes([ascii_bytes(type), data]);
   return concat_bytes([uint32_big_endian(data.length), type_and_data, uint32_big_endian(crc32(type_and_data))]);
}

export function read_png_chunks(png_bytes) {
   if (!PNG_SIGNATURE.every((value, index) => png_bytes[index] === value)) {
      throw new Error("not a PNG");
   }
   const view = new DataView(png_bytes.buffer, png_bytes.byteOffset, png_bytes.byteLength);
   const chunks = [];
   let offset = PNG_SIGNATURE.length;
   while (offset + 12 <= png_bytes.length) {
      const length = view.getUint32(offset);
      const type = ascii_text(png_bytes.subarray(offset + 4, offset + 8));
      const data = png_bytes.subarray(offset + 8, offset + 8 + length);
      const crc_valid = crc32(png_bytes.subarray(offset + 4, offset + 8 + length)) === view.getUint32(offset + 8 + length);
      chunks.push({ type, offset, length, data, crc_valid });
      offset += 12 + length;
      if (type === "IEND") {
         break;
      }
   }
   return chunks;
}

function build_image_header(width, height, bit_depth, color_type) {
   const data = new Uint8Array(13);
   const view = new DataView(data.buffer);
   view.setUint32(0, width);
   view.setUint32(4, height);
   data[8] = bit_depth;
   data[9] = color_type;
   return build_png_chunk("IHDR", data);
}

/**
 * Prefixes every row with filter type 0. The tests need exactness, not small files, and unfiltered rows keep the encoder trivially correct.
 */
function rows_with_filter_none(samples, height, row_length) {
   const filtered = new Uint8Array(height * (row_length + 1));
   for (let row = 0; row < height; row += 1) {
      filtered.set(samples.subarray(row * row_length, (row + 1) * row_length), row * (row_length + 1) + 1);
   }
   return filtered;
}

/**
 * Encodes raw samples as a PNG. Chunks in ancillary_chunks, already built, go between IHDR and IDAT.
 */
export async function encode_png({ width, height, samples, color_type = 6, bit_depth = 8, ancillary_chunks = [] }) {
   const row_length = (width * CHANNELS_PER_COLOR_TYPE[color_type] * bit_depth) / 8;
   if (samples.length !== row_length * height) {
      throw new Error(`expected ${row_length * height} sample bytes, got ${samples.length}`);
   }
   const image_data = await zlib_compress(rows_with_filter_none(samples, height, row_length));
   return concat_bytes([PNG_SIGNATURE, build_image_header(width, height, bit_depth, color_type), ...ancillary_chunks, build_png_chunk("IDAT", image_data), build_png_chunk("IEND", new Uint8Array(0))]);
}

/**
 * Builds a big-endian TIFF structure whose only IFD entry is the EXIF orientation. JPEG APP1 and the WebP EXIF chunk both carry this structure.
 */
export function build_exif_tiff(orientation) {
   const bytes = new Uint8Array(26);
   const view = new DataView(bytes.buffer);
   bytes[0] = 0x4d;
   bytes[1] = 0x4d;
   view.setUint16(2, 42);
   view.setUint32(4, 8);
   view.setUint16(8, 1);
   view.setUint16(10, EXIF_ORIENTATION_TAG);
   view.setUint16(12, TIFF_TYPE_SHORT);
   view.setUint32(14, 1);
   view.setUint16(18, orientation);
   view.setUint32(22, 0);
   return bytes;
}

/**
 * Returns the JPEG with a new EXIF APP1 segment right after SOI. The JFIF APP0 segment and any EXIF segment are dropped, so every variant differs only in its orientation value.
 */
export function jpeg_with_orientation(jpeg_bytes, orientation) {
   if (jpeg_bytes[0] !== 0xff || jpeg_bytes[1] !== 0xd8) {
      throw new Error("not a JPEG");
   }
   const kept_segments = [];
   let offset = 2;
   while (offset + 4 <= jpeg_bytes.length && jpeg_bytes[offset] === 0xff && jpeg_bytes[offset + 1] >= 0xe0 && jpeg_bytes[offset + 1] <= 0xef) {
      const marker = jpeg_bytes[offset + 1];
      const segment_length = (jpeg_bytes[offset + 2] << 8) | jpeg_bytes[offset + 3];
      const segment = jpeg_bytes.subarray(offset, offset + 2 + segment_length);
      const is_exif = marker === 0xe1 && ascii_text(segment.subarray(4, 10)) === "Exif\0\0";
      if (marker !== 0xe0 && !is_exif) {
         kept_segments.push(segment);
      }
      offset += 2 + segment_length;
   }
   const exif_payload = concat_bytes([ascii_bytes("Exif\0\0"), build_exif_tiff(orientation)]);
   const segment_length = exif_payload.length + 2;
   const exif_segment = concat_bytes([new Uint8Array([0xff, 0xe1, (segment_length >>> 8) & 0xff, segment_length & 0xff]), exif_payload]);
   return concat_bytes([jpeg_bytes.subarray(0, 2), exif_segment, ...kept_segments, jpeg_bytes.subarray(offset)]);
}

/**
 * Returns the WebP in the extended format with an EXIF chunk. The image chunks are kept byte for byte; an existing VP8X keeps its flags.
 */
export function webp_with_orientation(webp_bytes, width, height, orientation) {
   if (ascii_text(webp_bytes.subarray(0, 4)) !== "RIFF" || ascii_text(webp_bytes.subarray(8, 12)) !== "WEBP") {
      throw new Error("not a WebP");
   }
   const image_chunks = [];
   let flags = 0;
   let offset = 12;
   while (offset + 8 <= webp_bytes.length) {
      const fourcc = ascii_text(webp_bytes.subarray(offset, offset + 4));
      const size = read_uint32_little_endian(webp_bytes, offset + 4);
      const chunk_end = offset + 8 + size + (size % 2);
      if (fourcc === "VP8X") {
         flags = webp_bytes[offset + 8];
      } else if (fourcc !== "EXIF") {
         image_chunks.push(webp_bytes.subarray(offset, chunk_end));
      }
      offset = chunk_end;
   }
   const extended_header = new Uint8Array(10);
   extended_header[0] = flags | WEBP_FLAG_EXIF;
   extended_header.set(uint32_little_endian(width - 1).subarray(0, 3), 4);
   extended_header.set(uint32_little_endian(height - 1).subarray(0, 3), 7);
   const exif_data = build_exif_tiff(orientation);
   const body = concat_bytes([ascii_bytes("WEBP"), ascii_bytes("VP8X"), uint32_little_endian(extended_header.length), extended_header, ...image_chunks, ascii_bytes("EXIF"), uint32_little_endian(exif_data.length), exif_data]);
   return concat_bytes([ascii_bytes("RIFF"), uint32_little_endian(body.length), body]);
}

/**
 * Turns stored pixels into the displayed image for an EXIF orientation from 1 to 8.
 */
export function apply_exif_orientation(pixels, orientation) {
   const { width, height, rgba } = pixels;
   const swaps_axes = orientation >= 5;
   const output_width = swaps_axes ? height : width;
   const output_height = swaps_axes ? width : height;
   const output = new Uint8Array(rgba.length);
   for (let y = 0; y < output_height; y += 1) {
      for (let x = 0; x < output_width; x += 1) {
         let source_x;
         let source_y;
         switch (orientation) {
            case 1: source_x = x; source_y = y; break;
            case 2: source_x = width - 1 - x; source_y = y; break;
            case 3: source_x = width - 1 - x; source_y = height - 1 - y; break;
            case 4: source_x = x; source_y = height - 1 - y; break;
            case 5: source_x = y; source_y = x; break;
            case 6: source_x = y; source_y = height - 1 - x; break;
            case 7: source_x = width - 1 - y; source_y = height - 1 - x; break;
            case 8: source_x = width - 1 - y; source_y = x; break;
            default: throw new Error(`unknown orientation ${orientation}`);
         }
         const source_index = (source_y * width + source_x) * 4;
         output.set(rgba.subarray(source_index, source_index + 4), (y * output_width + x) * 4);
      }
   }
   return { width: output_width, height: output_height, rgba: output };
}

const FRAME_ROTATIONS = new Set([0, 90, 180, 270]);

/**
 * Where the output pixel (x, y) lies in the coded pixels, as a pixel index: origin + x * step_x + y * step_y.
 */
function source_walk(width, height, output_width, rotation, flip) {
   const first_x = flip ? output_width - 1 : 0;
   const direction_x = flip ? -1 : 1;
   switch (rotation) {
      case 0:
         return { origin: first_x, step_x: direction_x, step_y: width };
      case 90:
         return { origin: (height - 1 - first_x) * width, step_x: -direction_x * width, step_y: 1 };
      case 180:
         return { origin: (height - 1) * width + width - 1 - first_x, step_x: -direction_x, step_y: -width };
      default:
         return { origin: first_x * width + width - 1, step_x: direction_x * width, step_y: -1 };
   }
}

/**
 * The page's copy of the app's transform in image_conversion.js, so the page stays self-contained. The check in tools/check holds both against the EXIF transform.
 * Turns the coded pixels of a VideoFrame into its displayed orientation: a clockwise rotation first, then a horizontal flip.
 */
export function apply_rotation_and_flip(pixels, rotation, flip) {
   if (!FRAME_ROTATIONS.has(rotation)) {
      throw new Error(`unsupported frame rotation ${rotation}.`);
   }
   if (rotation === 0 && !flip) {
      return pixels;
   }
   const { width, height } = pixels;
   const aligned_rgba = pixels.rgba.byteOffset % 4 === 0 ? pixels.rgba : pixels.rgba.slice();
   const source = new Uint32Array(aligned_rgba.buffer, aligned_rgba.byteOffset, width * height);
   const swaps_axes = rotation === 90 || rotation === 270;
   const output_width = swaps_axes ? height : width;
   const output_height = swaps_axes ? width : height;
   const output = new Uint32Array(width * height);
   const { origin, step_x, step_y } = source_walk(width, height, output_width, rotation, flip);
   for (let y = 0; y < output_height; y += 1) {
      let source_index = origin + y * step_y;
      const row_start = y * output_width;
      for (let x = 0; x < output_width; x += 1) {
         output[row_start + x] = source[source_index];
         source_index += step_x;
      }
   }
   return { width: output_width, height: output_height, rgba: new Uint8Array(output.buffer) };
}

export function compare_pixels(first, second) {
   if (first.width !== second.width || first.height !== second.height) {
      return { same_size: false, max_difference: Infinity, mean_difference: Infinity, differing_values: Infinity };
   }
   let max_difference = 0;
   let difference_sum = 0;
   let differing_values = 0;
   for (let index = 0; index < first.rgba.length; index += 1) {
      const difference = Math.abs(first.rgba[index] - second.rgba[index]);
      if (difference > 0) {
         differing_values += 1;
         difference_sum += difference;
         if (difference > max_difference) {
            max_difference = difference;
         }
      }
   }
   return { same_size: true, max_difference, mean_difference: difference_sum / first.rgba.length, differing_values };
}

export function compare_alpha(first, second) {
   let max_difference = 0;
   let differing_values = 0;
   for (let index = 3; index < first.rgba.length; index += 4) {
      const difference = Math.abs(first.rgba[index] - second.rgba[index]);
      if (difference > 0) {
         differing_values += 1;
         max_difference = Math.max(max_difference, difference);
      }
   }
   return { max_difference, differing_values };
}

/**
 * Four colored quadrants on a non-square image. All eight EXIF orientations of it look different, so an orientation can be recognized from the pixels.
 */
export function create_quadrant_pattern(width, height) {
   const rgba = new Uint8Array(width * height * 4);
   for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
         const quadrant = (y < height / 2 ? 0 : 2) + (x < width / 2 ? 0 : 1);
         rgba.set([...QUADRANT_COLORS[quadrant], 255], (y * width + x) * 4);
      }
   }
   return { width, height, rgba };
}

/**
 * Pixels with the alpha values that break most easily: 0 with a color behind it, 1, 128, 254, and 255.
 */
export function create_alpha_pattern(width, height) {
   const samples = [
      [200, 100, 50, 0],
      [200, 100, 50, 1],
      [10, 220, 130, 128],
      [250, 250, 250, 254],
      [0, 0, 0, 255],
      [255, 0, 128, 255],
      [17, 34, 51, 85],
      [90, 180, 45, 170],
   ];
   const rgba = new Uint8Array(width * height * 4);
   for (let index = 0; index < width * height; index += 1) {
      rgba.set(samples[index % samples.length], index * 4);
   }
   return { width, height, rgba };
}

export function create_gradient_pattern(width, height) {
   const rgba = new Uint8Array(width * height * 4);
   for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
         rgba.set([x & 255, y & 255, (x ^ y) & 255, 255], (y * width + x) * 4);
      }
   }
   return { width, height, rgba };
}
