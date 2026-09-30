// Executable specification of encode_PNG_RGBA in PNG_chunks.js. Run from the repository root: node tools/check/PNG_encoder_check.mjs

import { encode_PNG_RGBA, read_PNG_chunks, strip_PNG } from "../../PNG_chunks.js";

const failures = [];

function check(condition, description) {
  if (!condition) failures.push(description);
}

function concat_bytes(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
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

{
  const rgba = Uint8Array.from({ length: 3 * 2 * 4 }, (_, index) => (index * 37) & 0xff);
  const png = await encode_PNG_RGBA({ width: 3, height: 2, rgba });
  const chunks = read_PNG_chunks(png);
  check(chunks.map((chunk) => chunk.type).join() === "IHDR,IDAT,IEND", "encode_PNG_RGBA writes IHDR, one IDAT and IEND");
  check(bytes_equal(chunks[0].data, Uint8Array.of(0, 0, 0, 3, 0, 0, 0, 2, 8, 6, 0, 0, 0)), "encode_PNG_RGBA writes the header for 8-bit RGBA without interlacing");
  const expected_rows = concat_bytes([Uint8Array.of(0), rgba.subarray(0, 12), Uint8Array.of(0), rgba.subarray(12, 24)]);
  check(bytes_equal(await inflate(chunks[1].data), expected_rows), "the image data is every row with filter type 0 in front");
  check(bytes_equal(strip_PNG(png), png), "an encoded PNG passes strip_PNG unchanged");
}

{
  const large = Uint8Array.from({ length: 64 * 64 * 4 }, (_, index) => (index * 7) & 0xff);
  const png = await encode_PNG_RGBA({ width: 64, height: 64, rgba: large });
  const chunks = read_PNG_chunks(png);
  const inflated = await inflate(chunks.find((chunk) => chunk.type === "IDAT").data);
  check(inflated.length === 64 * (64 * 4 + 1), "a larger image inflates to height rows of width times four plus one bytes");
  check(inflated[0] === 0 && bytes_equal(inflated.subarray(1, 257), large.subarray(0, 256)), "the first row of a larger image is exact");
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
