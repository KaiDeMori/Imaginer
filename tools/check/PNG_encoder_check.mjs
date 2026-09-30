// Executable specification of encode_PNG_RGBA in PNG_chunks.js. Run from the repository root: node tools/check/PNG_encoder_check.mjs

import { encode_PNG_RGBA, read_PNG_chunks, strip_PNG } from "../../PNG_chunks.js";

const failures = [];

function check(condition, description) {
  if (!condition) failures.push(description);
}

function bytes_equal(first, second) {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

async function inflate(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function thrown_by(action) {
  try {
    await action();
    return null;
  } catch (error) {
    return error;
  }
}

function paeth(left, above, upper_left) {
  const estimate = left + above - upper_left;
  const distance_left = Math.abs(estimate - left);
  const distance_above = Math.abs(estimate - above);
  const distance_upper_left = Math.abs(estimate - upper_left);
  if (distance_left <= distance_above && distance_left <= distance_upper_left) return left;
  return distance_above <= distance_upper_left ? above : upper_left;
}

/**
 * Reverses the PNG row filters, so the check accepts any filter choice and judges only the reconstructed pixels.
 */
function unfilter(image_data, width, height) {
  const row_length = width * 4;
  if (image_data.length !== height * (row_length + 1)) return { rows: null, filter_types: [], reason: `image data has ${image_data.length} bytes, expected ${height * (row_length + 1)}` };
  const rows = new Uint8Array(height * row_length);
  const filter_types = [];
  for (let row = 0; row < height; row += 1) {
    const filter_type = image_data[row * (row_length + 1)];
    filter_types.push(filter_type);
    const source = row * (row_length + 1) + 1;
    const target = row * row_length;
    for (let index = 0; index < row_length; index += 1) {
      const left = index >= 4 ? rows[target + index - 4] : 0;
      const above = row > 0 ? rows[target - row_length + index] : 0;
      const upper_left = row > 0 && index >= 4 ? rows[target - row_length + index - 4] : 0;
      let predictor;
      if (filter_type === 0) predictor = 0;
      else if (filter_type === 1) predictor = left;
      else if (filter_type === 2) predictor = above;
      else if (filter_type === 3) predictor = (left + above) >> 1;
      else if (filter_type === 4) predictor = paeth(left, above, upper_left);
      else return { rows: null, filter_types, reason: `unknown filter type ${filter_type} in row ${row}` };
      rows[target + index] = (image_data[source + index] + predictor) & 0xff;
    }
  }
  return { rows, filter_types, reason: "" };
}

async function encode_and_reconstruct(width, height, rgba) {
  const png = await encode_PNG_RGBA({ width, height, rgba });
  const chunks = read_PNG_chunks(png);
  const image_data = await inflate(chunks.filter((chunk) => chunk.type === "IDAT").map((chunk) => chunk.data).reduce((all, data) => {
    const joined = new Uint8Array(all.length + data.length);
    joined.set(all, 0);
    joined.set(data, all.length);
    return joined;
  }, new Uint8Array(0)));
  return { png, chunks, ...unfilter(image_data, width, height) };
}

{
  const rgba = Uint8Array.from({ length: 3 * 2 * 4 }, (_, index) => (index * 37) & 0xff);
  const result = await encode_and_reconstruct(3, 2, rgba);
  check(result.chunks.map((chunk) => chunk.type).join() === "IHDR,IDAT,IEND", "encode_PNG_RGBA writes IHDR, one IDAT and IEND");
  check(bytes_equal(result.chunks[0].data, Uint8Array.of(0, 0, 0, 3, 0, 0, 0, 2, 8, 6, 0, 0, 0)), "encode_PNG_RGBA writes the header for 8-bit RGBA without interlacing");
  check(result.rows !== null && bytes_equal(result.rows, rgba), `the image data unfilters to the source rows (${result.reason})`);
  check(result.filter_types.every((filter_type) => filter_type >= 0 && filter_type <= 4), "every row carries a filter type from 0 to 4");
  check(bytes_equal(strip_PNG(result.png), result.png), "an encoded PNG passes strip_PNG unchanged");
}

{
  const width = 64;
  const height = 64;
  const gradient = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      gradient.set([x * 4, y * 4, 128, 255], (y * width + x) * 4);
    }
  }
  const result = await encode_and_reconstruct(width, height, gradient);
  check(result.rows !== null && bytes_equal(result.rows, gradient), `a 64 by 64 gradient unfilters to the source rows (${result.reason})`);
  const image_data_length = result.chunks.filter((chunk) => chunk.type === "IDAT").reduce((sum, chunk) => sum + chunk.data.length, 0);
  check(image_data_length < gradient.length / 2, `a smooth gradient compresses to less than half its raw size (got ${image_data_length} of ${gradient.length})`);
}

{
  const width = 37;
  const height = 11;
  const noise = Uint8Array.from({ length: width * height * 4 }, (_, index) => (index * 2654435761) >>> 24);
  const result = await encode_and_reconstruct(width, height, noise);
  check(result.rows !== null && bytes_equal(result.rows, noise), `an odd-sized noisy image unfilters to the source rows (${result.reason})`);
}

{
  const wrong_length = await thrown_by(() => encode_PNG_RGBA({ width: 3, height: 2, rgba: new Uint8Array(5) }));
  check(wrong_length instanceof Error && wrong_length.message === "Wrong RGBA length.", "encode_PNG_RGBA throws on a wrong RGBA length");
}

if (failures.length > 0) {
  console.log("check failed: PNG_encoder");
  for (const failure of failures) {
    console.log(`   ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log("PNG_encoder check passed");
}
