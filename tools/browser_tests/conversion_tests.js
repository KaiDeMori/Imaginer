// Runs the conversion measurements in the current browser and shows one row per claim. The results decide the conversion pipeline of Imaginer's intake for JPEG and WebP.

import {
   apply_exif_orientation,
   compare_alpha,
   compare_pixels,
   create_alpha_pattern,
   create_gradient_pattern,
   create_quadrant_pattern,
   encode_png,
   jpeg_with_orientation,
   read_png_chunks,
   webp_with_orientation,
   zlib_compress,
} from "./png_test_tools.js";

const ORIENTATION_WIDTH = 64;
const ORIENTATION_HEIGHT = 32;
const LOSSY_QUALITY = 0.95;

const results_body = document.querySelector("#results tbody");
const summary_area = document.querySelector("#summary");
const window_mode_select = document.querySelector("#window-mode");
const status_line = document.querySelector("#status");
const copy_button = document.querySelector("#copy-results");
const results = [];

function update_summary() {
   const lines = [
      `Browser: ${navigator.userAgent}`,
      `Window mode: ${window_mode_select.value || "not chosen"}`,
      "Candidate pipeline: createImageBitmap, VideoFrame.copyTo as RGBA, own PNG encoder",
      "",
      "| Group | Test | Result | Verdict |",
      "|---|---|---|---|",
      ...results.map((entry) => `| ${entry.group} | ${entry.test} | ${entry.result.replaceAll("|", "\\|")} | ${entry.verdict} |`),
   ];
   summary_area.value = lines.join("\n");
}

function record(group, test, result, verdict) {
   results.push({ group, test, result, verdict });
   const row = document.createElement("tr");
   row.dataset.verdict = verdict;
   for (const text of [group, test, result, verdict]) {
      const cell = document.createElement("td");
      cell.textContent = text;
      row.appendChild(cell);
   }
   results_body.appendChild(row);
   update_summary();
}

/**
 * Runs one claim and records it. A thrown error becomes a failed row, so one broken API never stops the remaining tests.
 */
async function run_step(group, test, action) {
   status_line.textContent = `Running: ${group}, ${test}`;
   try {
      const { result, verdict } = await action();
      record(group, test, result, verdict);
   } catch (error) {
      record(group, test, `error: ${error instanceof Error ? error.message : String(error)}`, "✗");
   }
}

function format_comparison(comparison) {
   if (!comparison.same_size) {
      return "different size";
   }
   return `max difference ${comparison.max_difference}, differing values ${comparison.differing_values}`;
}

function canvas_with_pixels(pixels) {
   const canvas = document.createElement("canvas");
   canvas.width = pixels.width;
   canvas.height = pixels.height;
   const context = canvas.getContext("2d");
   context.putImageData(new ImageData(new Uint8ClampedArray(pixels.rgba), pixels.width, pixels.height), 0, 0);
   return { canvas, context };
}

function canvas_to_blob(canvas, type, quality) {
   return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error(`toBlob returned no ${type}`))), type, quality);
   });
}

async function blob_bytes(blob) {
   return new Uint8Array(await blob.arrayBuffer());
}

async function canvas_encoded_bytes(pixels, type, quality) {
   const blob = await canvas_to_blob(canvas_with_pixels(pixels).canvas, type, quality);
   if (blob.type !== type) {
      throw new Error(`the canvas cannot encode ${type}, it produced ${blob.type}`);
   }
   return blob_bytes(blob);
}

function read_canvas_pixels(canvas, context) {
   const image_data = context.getImageData(0, 0, canvas.width, canvas.height);
   return { width: canvas.width, height: canvas.height, rgba: new Uint8Array(image_data.data.buffer) };
}

function bitmap_of(bytes, type) {
   return createImageBitmap(new Blob([bytes], { type }), { premultiplyAlpha: "none", colorSpaceConversion: "none" });
}

/**
 * Reads the pixels of a bitmap through a VideoFrame, so no canvas is involved. This is the candidate pipeline's decode step.
 */
async function pixels_of_bitmap(bitmap) {
   const frame = new VideoFrame(bitmap, { timestamp: 0, alpha: "keep" });
   try {
      const width = frame.visibleRect ? frame.visibleRect.width : bitmap.width;
      const height = frame.visibleRect ? frame.visibleRect.height : bitmap.height;
      const buffer = new Uint8Array(frame.allocationSize({ format: "RGBA" }));
      const layouts = await frame.copyTo(buffer, { format: "RGBA" });
      const { offset, stride } = layouts[0];
      const rgba = new Uint8Array(width * height * 4);
      for (let row = 0; row < height; row += 1) {
         rgba.set(buffer.subarray(offset + row * stride, offset + row * stride + width * 4), row * width * 4);
      }
      const details = `frame format ${frame.format}, coded ${frame.codedWidth}×${frame.codedHeight}, display ${frame.displayWidth}×${frame.displayHeight}`;
      return { width, height, rgba, details };
   } finally {
      frame.close();
   }
}

async function decode_with_candidate(bytes, type) {
   const bitmap = await bitmap_of(bytes, type);
   try {
      return await pixels_of_bitmap(bitmap);
   } finally {
      bitmap.close();
   }
}

async function decode_with_image_element(bytes, type) {
   const url = URL.createObjectURL(new Blob([bytes], { type }));
   try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      return read_canvas_pixels(canvas, context);
   } finally {
      URL.revokeObjectURL(url);
   }
}

async function decode_with_bitmap_through_canvas(bytes, type) {
   const bitmap = await bitmap_of(bytes, type);
   const canvas = document.createElement("canvas");
   canvas.width = bitmap.width;
   canvas.height = bitmap.height;
   const context = canvas.getContext("2d");
   context.drawImage(bitmap, 0, 0);
   bitmap.close();
   return read_canvas_pixels(canvas, context);
}

function pixels_identical(first, second) {
   return first.width === second.width && first.height === second.height && first.rgba.length === second.rgba.length && first.rgba.every((value, index) => value === second.rgba[index]);
}

async function run_support_tests() {
   await run_step("Support", "createImageBitmap exists", async () => {
      const exists = typeof createImageBitmap === "function";
      return { result: exists ? "yes" : "no", verdict: exists ? "✓" : "✗" };
   });
   await run_step("Support", "VideoFrame exists", async () => {
      const exists = typeof VideoFrame === "function";
      return { result: exists ? "yes" : "no", verdict: exists ? "✓" : "✗" };
   });
   await run_step("Support", "VideoFrame from an ImageBitmap, copyTo as RGBA", async () => {
      const pattern = create_quadrant_pattern(8, 4);
      const bitmap = await createImageBitmap(new ImageData(new Uint8ClampedArray(pattern.rgba), 8, 4), { premultiplyAlpha: "none" });
      try {
         const decoded = await pixels_of_bitmap(bitmap);
         const comparison = compare_pixels(decoded, pattern);
         return { result: `${decoded.details}; against the pattern: ${format_comparison(comparison)}`, verdict: comparison.max_difference === 0 ? "✓" : "✗" };
      } finally {
         bitmap.close();
      }
   });
   await run_step("Support", "CompressionStream(\"deflate\") produces ZLIB", async () => {
      const compressed = await zlib_compress(new Uint8Array([1, 2, 3]));
      return { result: `first byte 0x${compressed[0].toString(16)}`, verdict: compressed[0] === 0x78 ? "✓" : "✗" };
   });
}

/**
 * Runs the candidate pipeline on one source. With an expected image the decode must be exact; without one it is compared with <img>, which is what the browser displays.
 */
async function run_pipeline_case(name, bytes, type, expected) {
   let decoded = null;
   await run_step("Pipeline", `${name}: candidate decode ${expected ? "is exact" : "matches <img>"}`, async () => {
      decoded = await decode_with_candidate(bytes, type);
      const summary = `${decoded.width}×${decoded.height}, ${decoded.details}`;
      if (expected) {
         const comparison = compare_pixels(decoded, expected);
         return { result: `${summary}; ${format_comparison(comparison)}`, verdict: comparison.max_difference === 0 ? "✓" : "✗" };
      }
      const reference = await decode_with_image_element(bytes, type);
      const comparison = compare_pixels(decoded, reference);
      return { result: `${summary}; against <img>, read back through the canvas: ${format_comparison(comparison)}, mean ${comparison.mean_difference.toFixed(4)}`, verdict: "info" };
   });
   if (!decoded) {
      return;
   }
   await run_step("Pipeline", `${name}: two candidate decodes are identical`, async () => {
      const again = await decode_with_candidate(bytes, type);
      const identical = pixels_identical(decoded, again);
      return { result: identical ? "yes" : `no: ${format_comparison(compare_pixels(decoded, again))}`, verdict: identical ? "✓" : "✗" };
   });
   await run_step("Pipeline", `${name}: candidate decode against the bitmap drawn on a canvas`, async () => {
      const through_canvas = await decode_with_bitmap_through_canvas(bytes, type);
      const comparison = compare_pixels(decoded, through_canvas);
      return { result: `${format_comparison(comparison)}, mean ${comparison.mean_difference.toFixed(4)}`, verdict: "info" };
   });
   await run_step("Pipeline", `${name}: own PNG round trip is exact and has only IHDR, IDAT, IEND`, async () => {
      const png = await encode_png({ width: decoded.width, height: decoded.height, samples: decoded.rgba });
      const chunk_types = read_png_chunks(png).map((chunk) => chunk.type).join(" ");
      const round_trip = await decode_with_candidate(png, "image/png");
      const comparison = compare_pixels(round_trip, decoded);
      const passed = chunk_types === "IHDR IDAT IEND" && comparison.max_difference === 0;
      return { result: `chunks ${chunk_types}; ${format_comparison(comparison)}; ${(png.length / 1024).toFixed(1)} KiB`, verdict: passed ? "✓" : "✗" };
   });
}

async function run_pipeline_tests() {
   const photo_like = create_quadrant_pattern(ORIENTATION_WIDTH, ORIENTATION_HEIGHT);
   try {
      await run_pipeline_case("JPEG", await canvas_encoded_bytes(photo_like, "image/jpeg", LOSSY_QUALITY), "image/jpeg", null);
   } catch (error) {
      record("Pipeline", "JPEG", `error: ${error.message}`, "✗");
   }
   try {
      await run_pipeline_case("WebP", await canvas_encoded_bytes(photo_like, "image/webp", LOSSY_QUALITY), "image/webp", null);
   } catch (error) {
      record("Pipeline", "WebP", `error: ${error.message}`, "✗");
   }
   const alpha_pattern = create_alpha_pattern(16, 4);
   try {
      await run_pipeline_case("WebP with alpha", await canvas_encoded_bytes(alpha_pattern, "image/webp", LOSSY_QUALITY), "image/webp", null);
   } catch (error) {
      record("Pipeline", "WebP with alpha", `error: ${error.message}`, "✗");
   }
   await run_pipeline_case("PNG RGBA with alpha 0, 1, 128, 254 (not converted by Imaginer; measures the verification path)", await encode_png({ width: 16, height: 4, samples: alpha_pattern.rgba }), "image/png", alpha_pattern);
}

/**
 * Finds the orientation whose transform of the base, the decode of the orientation 1 variant, best explains the decoded pixels. The mean difference stays small for the right orientation even when a decoder rotates chroma planes before upsampling.
 */
function detect_orientation(base, decoded) {
   let best = null;
   for (let orientation = 1; orientation <= 8; orientation += 1) {
      const candidate = apply_exif_orientation(base, orientation);
      const comparison = compare_pixels(candidate, decoded);
      if (comparison.same_size && (!best || comparison.mean_difference < best.mean_difference)) {
         best = { orientation, mean_difference: comparison.mean_difference };
      }
   }
   return best;
}

async function detect_orientations(decode, variants) {
   const base = await decode(variants.get(1));
   const detections = new Map();
   for (const [orientation, bytes] of variants) {
      detections.set(orientation, detect_orientation(base, await decode(bytes)));
   }
   return detections;
}

/**
 * The candidate output counts as upright when it shows what <img> shows, which is how the terms define upright.
 */
async function run_orientation_case(format_name, type, variants) {
   const methods = [
      ["candidate", (bytes) => decode_with_candidate(bytes, type)],
      ["<img>", (bytes) => decode_with_image_element(bytes, type)],
      ["bitmap on canvas", (bytes) => decode_with_bitmap_through_canvas(bytes, type)],
   ];
   const detections = new Map();
   for (const [method_name, decode] of methods) {
      try {
         detections.set(method_name, await detect_orientations(decode, variants));
      } catch (error) {
         detections.set(method_name, error instanceof Error ? error : new Error(String(error)));
      }
   }
   const shown = (method_name, orientation) => {
      const detection = detections.get(method_name);
      if (detection instanceof Error) {
         return null;
      }
      const best = detection.get(orientation);
      return best ? best.orientation : null;
   };
   const describe = (method_name, orientation) => {
      const detection = detections.get(method_name);
      if (detection instanceof Error) {
         return `${method_name}: error ${detection.message}`;
      }
      const value = shown(method_name, orientation);
      return value === null ? `${method_name}: no match` : `${method_name} shows ${value}`;
   };
   for (const orientation of variants.keys()) {
      await run_step("Orientation", `${format_name}, EXIF orientation ${orientation}: candidate output shows what <img> shows`, async () => {
         const result = methods.map(([method_name]) => describe(method_name, orientation)).join(", ");
         const candidate_shows = shown("candidate", orientation);
         const image_shows = shown("<img>", orientation);
         return { result, verdict: candidate_shows !== null && candidate_shows === image_shows ? "✓" : "✗" };
      });
   }
}

async function run_orientation_tests() {
   const pattern = create_quadrant_pattern(ORIENTATION_WIDTH, ORIENTATION_HEIGHT);
   try {
      const jpeg = await canvas_encoded_bytes(pattern, "image/jpeg", LOSSY_QUALITY);
      const variants = new Map([1, 2, 3, 4, 5, 6, 7, 8].map((orientation) => [orientation, jpeg_with_orientation(jpeg, orientation)]));
      await run_orientation_case("JPEG", "image/jpeg", variants);
   } catch (error) {
      record("Orientation", "JPEG", `error: ${error.message}`, "✗");
   }
   try {
      const webp = await canvas_encoded_bytes(pattern, "image/webp", LOSSY_QUALITY);
      const variants = new Map([1, 6].map((orientation) => [orientation, webp_with_orientation(webp, ORIENTATION_WIDTH, ORIENTATION_HEIGHT, orientation)]));
      await run_orientation_case("WebP", "image/webp", variants);
   } catch (error) {
      record("Orientation", "WebP", `error: ${error.message}`, "✗");
   }
}

async function run_canvas_tests() {
   const pattern = create_gradient_pattern(64, 64);
   const { canvas, context } = canvas_with_pixels(pattern);
   await run_step("Canvas", "getImageData returns the drawn pixels exactly", async () => {
      const comparison = compare_pixels(read_canvas_pixels(canvas, context), pattern);
      return { result: format_comparison(comparison), verdict: comparison.max_difference === 0 ? "✓" : "✗" };
   });
   let first_png = null;
   await run_step("Canvas", "toBlob PNG chunks", async () => {
      first_png = await blob_bytes(await canvas_to_blob(canvas, "image/png"));
      const chunk_types = read_png_chunks(first_png).map((chunk) => chunk.type);
      return { result: `${chunk_types.join(" ")}${chunk_types.includes("deBG") ? " (contains deBG)" : ""}`, verdict: "info" };
   });
   await run_step("Canvas", "toBlob PNG pixels are exact", async () => {
      const comparison = compare_pixels(await decode_with_candidate(first_png, "image/png"), pattern);
      return { result: format_comparison(comparison), verdict: comparison.max_difference === 0 ? "✓" : "✗" };
   });
   await run_step("Canvas", "two toBlob PNGs of the same canvas are byte-identical", async () => {
      const second_png = await blob_bytes(await canvas_to_blob(canvas, "image/png"));
      const identical = second_png.length === first_png.length && second_png.every((value, index) => value === first_png[index]);
      return { result: identical ? "yes" : "no", verdict: "info" };
   });
   await run_step("Canvas", "mask PNG keeps its alpha exactly", async () => {
      const mask = { width: 64, height: 64, rgba: new Uint8Array(64 * 64 * 4) };
      for (let index = 0; index < 64 * 64; index += 1) {
         if (index % 64 >= 32) {
            mask.rgba[index * 4 + 3] = 255;
         }
      }
      const mask_png = await blob_bytes(await canvas_to_blob(canvas_with_pixels(mask).canvas, "image/png"));
      const decoded_mask = await decode_with_candidate(mask_png, "image/png");
      const alpha_comparison = compare_alpha(decoded_mask, mask);
      const comparison = compare_pixels(decoded_mask, mask);
      const chunk_types = read_png_chunks(mask_png).map((chunk) => chunk.type).join(" ");
      const result = `chunks ${chunk_types}; alpha: max difference ${alpha_comparison.max_difference}, differing values ${alpha_comparison.differing_values}; all channels: ${format_comparison(comparison)}`;
      return { result, verdict: alpha_comparison.differing_values === 0 ? "✓" : "✗" };
   });
}

async function run_timing_test(width, height) {
   const megapixels = Math.round((width * height) / 1e6);
   await run_step("Timing", `${megapixels} MP JPEG: candidate decode, own PNG encode, verify`, async () => {
      const jpeg = await canvas_encoded_bytes(create_gradient_pattern(width, height), "image/jpeg", 0.9);
      const started_at = performance.now();
      const decoded = await decode_with_candidate(jpeg, "image/jpeg");
      const decoded_at = performance.now();
      const png = await encode_png({ width: decoded.width, height: decoded.height, samples: decoded.rgba });
      const encoded_at = performance.now();
      const verified = await decode_with_candidate(png, "image/png");
      const verified_at = performance.now();
      const comparison = compare_pixels(verified, decoded);
      const milliseconds = (from, to) => `${Math.round(to - from)} ms`;
      const result = `decode ${milliseconds(started_at, decoded_at)}, encode ${milliseconds(decoded_at, encoded_at)}, verify ${milliseconds(encoded_at, verified_at)}, total ${milliseconds(started_at, verified_at)}; PNG ${(png.length / 1048576).toFixed(1)} MiB; ${format_comparison(comparison)}`;
      return { result, verdict: comparison.max_difference === 0 ? "✓" : "✗" };
   });
}

async function run_all_tests() {
   await run_support_tests();
   await run_pipeline_tests();
   await run_orientation_tests();
   await run_canvas_tests();
   await run_timing_test(4000, 3000);
   copy_button.disabled = false;
   status_line.textContent = "Done. Choose the window mode, then copy the results.";
}

window_mode_select.addEventListener("change", update_summary);

copy_button.addEventListener("click", async () => {
   if (!window_mode_select.value) {
      status_line.textContent = "Choose the window mode first.";
      return;
   }
   try {
      await navigator.clipboard.writeText(summary_area.value);
      status_line.textContent = "Results copied.";
   } catch {
      summary_area.select();
      status_line.textContent = "Copying failed; the text is selected, press Ctrl+C.";
   }
});

document.querySelector("#run-heavy-test").addEventListener("click", async (event) => {
   event.target.disabled = true;
   await run_timing_test(8000, 6000);
   status_line.textContent = "Done.";
   event.target.disabled = false;
});

run_all_tests();
