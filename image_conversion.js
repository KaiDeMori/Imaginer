// Conversion: a JPEG or WebP becomes a PNG with the pixels the browser displays, read through a VideoFrame so that no canvas, and no canvas noise, is on the way.

import { encode_PNG_RGBA, is_PNG, strip_PNG } from "./PNG_chunks.js";

export const CONVERSION_UNSUPPORTED_MESSAGE = "This browser cannot convert JPEG and WebP images. Imaginer needs a current Firefox or Chrome, served over https or from localhost.";

export function can_convert_images() {
  return typeof globalThis.createImageBitmap === "function" && typeof globalThis.VideoFrame === "function";
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
 * Turns the coded pixels of a VideoFrame into its displayed orientation: a clockwise rotation first, then a horizontal flip, which is the order the frame's `rotation` and `flip` describe.
 * Without rotation and flip it returns its input, so an image without orientation costs nothing extra.
 * @param {{ width: number, height: number, rgba: Uint8Array }} pixels
 * @param {number} rotation
 * @param {boolean} flip
 * @returns {{ width: number, height: number, rgba: Uint8Array }}
 */
export function apply_rotation_and_flip(pixels, rotation, flip) {
  if (!FRAME_ROTATIONS.has(rotation)) throw new Error(`unsupported frame rotation ${rotation}.`);
  if (rotation === 0 && !flip) return pixels;
  const { width, height } = pixels;
  const aligned_rgba = pixels.rgba.byteOffset % 4 === 0 ? pixels.rgba : pixels.rgba.slice();
  const source = new Uint32Array(aligned_rgba.buffer, aligned_rgba.byteOffset, width * height);
  const swaps_axes = rotation === 90 || rotation === 270;
  const output_width = swaps_axes ? height : width;
  const output_height = swaps_axes ? width : height;
  const output = new Uint32Array(width * height);
  const { origin, step_x, step_y } = source_walk(width, height, output_width, rotation, flip);
  for (let y = 0; y < output_height; y++) {
    let source_index = origin + y * step_y;
    const row_start = y * output_width;
    for (let x = 0; x < output_width; x++) {
      output[row_start + x] = source[source_index];
      source_index += step_x;
    }
  }
  return { width: output_width, height: output_height, rgba: new Uint8Array(output.buffer) };
}

/**
 * Copies the pixels of the bitmap, in their displayed orientation, into a tightly packed RGBA array and closes the frame and the bitmap before returning, so the encoder does not hold them in memory.
 * @param {ImageBitmap} bitmap
 * @returns {Promise<{ width: number, height: number, rgba: Uint8Array }>}
 */
async function read_RGBA(bitmap) {
  let frame = null;
  try {
    frame = new VideoFrame(bitmap, { timestamp: 0, alpha: "keep" });
    const width = frame.visibleRect ? frame.visibleRect.width : bitmap.width;
    const height = frame.visibleRect ? frame.visibleRect.height : bitmap.height;
    const buffer = new Uint8Array(frame.allocationSize({ format: "RGBA" }));
    const layouts = await frame.copyTo(buffer, { format: "RGBA" });
    if (layouts.length === 0) throw new Error("unexpected pixel layout.");
    const { offset, stride } = layouts[0];
    const row_length = width * 4;
    if (stride < row_length || offset + stride * height > buffer.length) throw new Error("unexpected pixel layout.");
    let rgba = buffer.subarray(offset, offset + row_length * height);
    if (stride !== row_length) {
      rgba = new Uint8Array(row_length * height);
      for (let row = 0; row < height; row++) {
        rgba.set(buffer.subarray(offset + row * stride, offset + row * stride + row_length), row * row_length);
      }
    }
    return apply_rotation_and_flip({ width, height, rgba }, frame.rotation ?? 0, frame.flip === true);
  } finally {
    frame?.close();
    bitmap.close();
  }
}

/**
 * @param {Blob} blob
 * @returns {Promise<Blob>}
 */
export async function convert_to_PNG(blob) {
  if (!can_convert_images()) throw new Error(CONVERSION_UNSUPPORTED_MESSAGE);
  const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image", premultiplyAlpha: "none" });
  try {
    const { width, height, rgba } = await read_RGBA(bitmap);
    return new Blob([await encode_PNG_RGBA({ width, height, rgba })], { type: "image/png" });
  } catch (error) {
    if (error instanceof RangeError) throw new Error("The image is too large to convert.");
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error("The image could not be converted: " + reason);
  }
}

// Pixels only: a PNG keeps its pixel chunks and nothing else; anything else is converted, which yields a clean PNG by construction.
export async function pixels_only_PNG(blob, convert = convert_to_PNG) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (is_PNG(bytes)) {
    try {
      return new Blob([strip_PNG(bytes)], { type: "image/png" });
    } catch {
      return await convert(blob);
    }
  }
  return await convert(blob);
}
