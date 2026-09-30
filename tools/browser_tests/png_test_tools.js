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

export async function zlib_decompress(bytes) {
   const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
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
 * Encodes RGBA frames as an animated PNG. The first frame is the default image in IDAT, so a decoder without animation support shows it.
 */
export async function encode_apng({ width, height, frames }) {
   const row_length = width * 4;
   let sequence_number = 0;
   const build_frame_control = () => {
      const data = new Uint8Array(26);
      const view = new DataView(data.buffer);
      view.setUint32(0, sequence_number);
      sequence_number += 1;
      view.setUint32(4, width);
      view.setUint32(8, height);
      view.setUint16(20, 1);
      view.setUint16(22, 2);
      return build_png_chunk("fcTL", data);
   };
   const parts = [PNG_SIGNATURE, build_image_header(width, height, 8, 6), build_png_chunk("acTL", concat_bytes([uint32_big_endian(frames.length), uint32_big_endian(0)]))];
   parts.push(build_frame_control());
   parts.push(build_png_chunk("IDAT", await zlib_compress(rows_with_filter_none(frames[0], height, row_length))));
   for (const frame of frames.slice(1)) {
      parts.push(build_frame_control());
      const frame_data = await zlib_compress(rows_with_filter_none(frame, height, row_length));
      parts.push(build_png_chunk("fdAT", concat_bytes([uint32_big_endian(sequence_number), frame_data])));
      sequence_number += 1;
   }
   parts.push(build_png_chunk("IEND", new Uint8Array(0)));
   return concat_bytes(parts);
}

const ALLOWED_BIT_DEPTHS = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] };
const ADAM7_PASSES = [
   { x: 0, y: 0, step_x: 8, step_y: 8 },
   { x: 4, y: 0, step_x: 8, step_y: 8 },
   { x: 0, y: 4, step_x: 4, step_y: 8 },
   { x: 2, y: 0, step_x: 4, step_y: 4 },
   { x: 0, y: 2, step_x: 2, step_y: 4 },
   { x: 1, y: 0, step_x: 2, step_y: 2 },
   { x: 0, y: 1, step_x: 1, step_y: 2 },
];
const WHOLE_IMAGE_PASS = [{ x: 0, y: 0, step_x: 1, step_y: 1 }];

function paeth_predictor(left, above, upper_left) {
   const estimate = left + above - upper_left;
   const distance_left = Math.abs(estimate - left);
   const distance_above = Math.abs(estimate - above);
   const distance_upper_left = Math.abs(estimate - upper_left);
   if (distance_left <= distance_above && distance_left <= distance_upper_left) {
      return left;
   }
   return distance_above <= distance_upper_left ? above : upper_left;
}

function unfilter_rows(data, offset, row_length, row_count, bytes_per_pixel) {
   if (offset + row_count * (row_length + 1) > data.length) {
      throw new Error("PNG image data is truncated");
   }
   const rows = new Uint8Array(row_length * row_count);
   for (let row = 0; row < row_count; row += 1) {
      const filter_type = data[offset];
      offset += 1;
      const row_start = row * row_length;
      for (let index = 0; index < row_length; index += 1) {
         const left = index >= bytes_per_pixel ? rows[row_start + index - bytes_per_pixel] : 0;
         const above = row > 0 ? rows[row_start - row_length + index] : 0;
         const upper_left = row > 0 && index >= bytes_per_pixel ? rows[row_start - row_length + index - bytes_per_pixel] : 0;
         let predictor;
         switch (filter_type) {
            case 0: predictor = 0; break;
            case 1: predictor = left; break;
            case 2: predictor = above; break;
            case 3: predictor = (left + above) >> 1; break;
            case 4: predictor = paeth_predictor(left, above, upper_left); break;
            default: throw new Error(`unknown PNG filter type ${filter_type}`);
         }
         rows[row_start + index] = (data[offset + index] + predictor) & 0xff;
      }
      offset += row_length;
   }
   return { rows, offset };
}

function read_sample(row, sample_index, bit_depth) {
   if (bit_depth === 8) {
      return row[sample_index];
   }
   if (bit_depth === 16) {
      return (row[sample_index * 2] << 8) | row[sample_index * 2 + 1];
   }
   const bit_offset = sample_index * bit_depth;
   return (row[bit_offset >> 3] >> (8 - bit_depth - (bit_offset & 7))) & ((1 << bit_depth) - 1);
}

/**
 * Samples below 8 bits scale exactly, because 255 is divisible by 1, 3, and 15. Samples of 16 bits round to the nearest 8-bit value.
 */
function scale_to_8_bits(sample, bit_depth) {
   if (bit_depth === 8) {
      return sample;
   }
   if (bit_depth === 16) {
      return Math.round((sample * 255) / 65535);
   }
   return (sample * 255) / ((1 << bit_depth) - 1);
}

function write_rgba_pixel(rgba, target, row, x, image) {
   const { color_type, bit_depth, palette, transparency } = image;
   let red;
   let green;
   let blue;
   let alpha = 255;
   switch (color_type) {
      case 0: {
         const gray = read_sample(row, x, bit_depth);
         red = green = blue = scale_to_8_bits(gray, bit_depth);
         if (transparency && gray === ((transparency[0] << 8) | transparency[1])) {
            alpha = 0;
         }
         break;
      }
      case 2: {
         const red_sample = read_sample(row, x * 3, bit_depth);
         const green_sample = read_sample(row, x * 3 + 1, bit_depth);
         const blue_sample = read_sample(row, x * 3 + 2, bit_depth);
         red = scale_to_8_bits(red_sample, bit_depth);
         green = scale_to_8_bits(green_sample, bit_depth);
         blue = scale_to_8_bits(blue_sample, bit_depth);
         if (transparency && red_sample === ((transparency[0] << 8) | transparency[1]) && green_sample === ((transparency[2] << 8) | transparency[3]) && blue_sample === ((transparency[4] << 8) | transparency[5])) {
            alpha = 0;
         }
         break;
      }
      case 3: {
         const index = read_sample(row, x, bit_depth);
         if (!palette || index * 3 + 2 >= palette.length) {
            throw new Error(`palette index ${index} is out of range`);
         }
         red = palette[index * 3];
         green = palette[index * 3 + 1];
         blue = palette[index * 3 + 2];
         alpha = transparency && index < transparency.length ? transparency[index] : 255;
         break;
      }
      case 4:
         red = green = blue = scale_to_8_bits(read_sample(row, x * 2, bit_depth), bit_depth);
         alpha = scale_to_8_bits(read_sample(row, x * 2 + 1, bit_depth), bit_depth);
         break;
      case 6:
         red = scale_to_8_bits(read_sample(row, x * 4, bit_depth), bit_depth);
         green = scale_to_8_bits(read_sample(row, x * 4 + 1, bit_depth), bit_depth);
         blue = scale_to_8_bits(read_sample(row, x * 4 + 2, bit_depth), bit_depth);
         alpha = scale_to_8_bits(read_sample(row, x * 4 + 3, bit_depth), bit_depth);
         break;
      default:
         throw new Error(`unknown color type ${color_type}`);
   }
   rgba[target] = red;
   rgba[target + 1] = green;
   rgba[target + 2] = blue;
   rgba[target + 3] = alpha;
}

/**
 * Decodes a PNG into 8-bit RGBA without the browser's decoder, so semi-transparent pixels keep their exact values. It supports every color type and bit depth, the tRNS chunk, and Adam7 interlacing; an animated PNG yields its default image.
 */
export async function decode_png(png_bytes) {
   const chunks = read_png_chunks(png_bytes);
   if (chunks.length === 0 || chunks[0].type !== "IHDR") {
      throw new Error("PNG without IHDR");
   }
   const broken_chunk = chunks.find((chunk) => !chunk.crc_valid);
   if (broken_chunk) {
      throw new Error(`the checksum of the ${broken_chunk.type} chunk is wrong`);
   }
   const header = chunks[0].data;
   const header_view = new DataView(header.buffer, header.byteOffset, header.byteLength);
   const image = {
      width: header_view.getUint32(0),
      height: header_view.getUint32(4),
      bit_depth: header[8],
      color_type: header[9],
      palette: chunks.find((chunk) => chunk.type === "PLTE")?.data ?? null,
      transparency: chunks.find((chunk) => chunk.type === "tRNS")?.data ?? null,
   };
   if (!(ALLOWED_BIT_DEPTHS[image.color_type] ?? []).includes(image.bit_depth)) {
      throw new Error(`color type ${image.color_type} with bit depth ${image.bit_depth} is not a valid PNG`);
   }
   const data = await zlib_decompress(concat_bytes(chunks.filter((chunk) => chunk.type === "IDAT").map((chunk) => chunk.data)));
   const bits_per_pixel = CHANNELS_PER_COLOR_TYPE[image.color_type] * image.bit_depth;
   const bytes_per_pixel = Math.max(1, bits_per_pixel >> 3);
   const rgba = new Uint8Array(image.width * image.height * 4);
   let offset = 0;
   for (const pass of header[12] === 1 ? ADAM7_PASSES : WHOLE_IMAGE_PASS) {
      const pass_width = image.width > pass.x ? Math.ceil((image.width - pass.x) / pass.step_x) : 0;
      const pass_height = image.height > pass.y ? Math.ceil((image.height - pass.y) / pass.step_y) : 0;
      if (pass_width === 0 || pass_height === 0) {
         continue;
      }
      const row_length = Math.ceil((pass_width * bits_per_pixel) / 8);
      const unfiltered = unfilter_rows(data, offset, row_length, pass_height, bytes_per_pixel);
      offset = unfiltered.offset;
      for (let y = 0; y < pass_height; y += 1) {
         const row = unfiltered.rows.subarray(y * row_length, (y + 1) * row_length);
         const target_row_start = (pass.y + y * pass.step_y) * image.width;
         for (let x = 0; x < pass_width; x += 1) {
            write_rgba_pixel(rgba, (target_row_start + pass.x + x * pass.step_x) * 4, row, x, image);
         }
      }
   }
   return { width: image.width, height: image.height, rgba };
}

/**
 * Reads the EXIF orientation from a TIFF structure in either byte order; 1 when it carries none.
 */
export function read_tiff_orientation(tiff) {
   const little_endian = tiff[0] === 0x49 && tiff[1] === 0x49;
   if (tiff.length < 8 || (!little_endian && !(tiff[0] === 0x4d && tiff[1] === 0x4d))) {
      return 1;
   }
   const view = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength);
   const directory_offset = view.getUint32(4, little_endian);
   if (directory_offset + 2 > tiff.length) {
      return 1;
   }
   const entry_count = view.getUint16(directory_offset, little_endian);
   for (let index = 0; index < entry_count; index += 1) {
      const entry = directory_offset + 2 + index * 12;
      if (entry + 12 > tiff.length) {
         break;
      }
      if (view.getUint16(entry, little_endian) === EXIF_ORIENTATION_TAG) {
         const orientation = view.getUint16(entry + 8, little_endian);
         return orientation >= 1 && orientation <= 8 ? orientation : 1;
      }
   }
   return 1;
}

export function read_png_exif_orientation(png_bytes) {
   const exif_chunk = read_png_chunks(png_bytes).find((chunk) => chunk.type === "eXIf");
   return exif_chunk ? read_tiff_orientation(exif_chunk.data) : 1;
}

/**
 * Builds a big-endian TIFF structure whose only IFD entry is the EXIF orientation. JPEG APP1, the WebP EXIF chunk, and the PNG eXIf chunk all carry this structure.
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

export function png_with_orientation(png_bytes, orientation) {
   const first_image_data = read_png_chunks(png_bytes).find((chunk) => chunk.type === "IDAT");
   if (!first_image_data) {
      throw new Error("PNG without IDAT");
   }
   const exif_chunk = build_png_chunk("eXIf", build_exif_tiff(orientation));
   return concat_bytes([png_bytes.subarray(0, first_image_data.offset), exif_chunk, png_bytes.subarray(first_image_data.offset)]);
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

export function quadrant_index_pattern(width, height) {
   const indices = new Uint8Array(width * height);
   for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
         indices[y * width + x] = (y < height / 2 ? 0 : 2) + (x < width / 2 ? 0 : 1);
      }
   }
   return indices;
}

export function quadrant_palette() {
   return Uint8Array.from(QUADRANT_COLORS.flat());
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

export function invert_colors(pixels) {
   const rgba = Uint8Array.from(pixels.rgba, (value, index) => (index % 4 === 3 ? value : 255 - value));
   return { width: pixels.width, height: pixels.height, rgba };
}
