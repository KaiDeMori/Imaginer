// Conversion: a JPEG or WebP becomes a PNG with the pixels the browser displays, read through a VideoFrame so that no canvas, and no canvas noise, is on the way.

import { encode_PNG_RGBA, is_PNG, strip_PNG } from "./PNG_chunks.js";

export const CONVERSION_UNSUPPORTED_MESSAGE = "This browser cannot convert JPEG and WebP images. Imaginer needs a current Firefox or Chrome, served over https or from localhost.";

export function can_convert_images() {
  return typeof globalThis.createImageBitmap === "function" && typeof globalThis.VideoFrame === "function";
}

/**
 * Copies the pixels of the bitmap into a tightly packed RGBA array and closes the frame and the bitmap before returning, so the encoder does not hold them in memory.
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
    if (stride === row_length) return { width, height, rgba: buffer.subarray(offset, offset + row_length * height) };
    const rgba = new Uint8Array(row_length * height);
    for (let row = 0; row < height; row++) {
      rgba.set(buffer.subarray(offset + row * stride, offset + row * stride + row_length), row * row_length);
    }
    return { width, height, rgba };
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
