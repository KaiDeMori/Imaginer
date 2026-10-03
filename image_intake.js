// Intake: every image that enters Imaginer passes here once, so every gallery file and every input area image is a PNG without metadata, and the prompt is kept in the record.

import { is_PNG, read_PNG_prompt, strip_PNG } from "./PNG_chunks.js";
import { convert_to_PNG } from "./image_conversion.js";
import { read_jpeg_metadata } from "./components/jpeg_metadata_reader.js";
import { read_webp_metadata } from "./components/webp_metadata_reader.js";
import { validate_file_readable, validate_image_file } from "./components/image_validation.js";

/** @typedef {{ image_blob: Blob, prompt_text: string }} Intake_result */
/** @typedef {{ name: string, message: string }} Intake_failure */

// The name of the error intake throws when the browser cannot read a file as an image. Its message diagnoses a loose file; the ZIP import leaves the diagnosis out.
export const UNREADABLE_IMAGE_ERROR_NAME = "Unreadable_image_error";

async function read_or_empty(reader, file) {
  try {
    return (await reader(file)) || "";
  } catch {
    return "";
  }
}

/**
 * The format is decided by the bytes, not by the declared type, so a renamed file is read as what it is.
 * A prompt is a side benefit, so a reader that throws gives the empty string.
 * @param {Blob} file
 * @param {Uint8Array} bytes
 * @returns {Promise<string>}
 */
export async function read_import_prompt(file, bytes) {
  if (is_PNG(bytes)) return read_PNG_prompt(bytes);
  return (await read_or_empty(read_jpeg_metadata, file)) || (await read_or_empty(read_webp_metadata, file));
}

/**
 * @param {File | Blob} file
 * @param {(file: Blob) => Promise<Blob>} [convert]
 * @returns {Promise<Intake_result>}
 */
export async function intake_import(file, convert = convert_to_PNG) {
  const type_check = validate_image_file(file);
  if (!type_check.valid) throw new Error(type_check.error);
  const readable_check = await validate_file_readable(file);
  if (!readable_check.valid) throw Object.assign(new Error(readable_check.error), { name: UNREADABLE_IMAGE_ERROR_NAME });
  const bytes = new Uint8Array(await file.arrayBuffer());
  // The prompt is read before the conversion, because the conversion drops every metadata.
  const prompt_text = await read_import_prompt(file, bytes);
  let image_blob = null;
  if (is_PNG(bytes)) {
    try {
      image_blob = new Blob([strip_PNG(bytes)], { type: "image/png" });
    } catch {
      image_blob = null;
    }
  }
  if (image_blob === null) image_blob = await convert(file);
  return { image_blob, prompt_text };
}

/**
 * @param {Blob} blob
 * @returns {Promise<Blob>}
 */
export async function intake_model_output(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (localStorage.getItem("imaginer.strip_metadata") === "true") return new Blob([strip_PNG(bytes)], { type: "image/png" });
  return blob;
}

/**
 * A paid generation is never thrown away, so a failure is returned for the caller to tell the user.
 * @param {Blob} blob
 * @returns {Promise<{ image_blob: Blob, failure: string | null }>}
 */
export async function accept_model_output(blob) {
  try {
    return { image_blob: await intake_model_output(blob), failure: null };
  } catch (error) {
    return { image_blob: blob, failure: error?.message || String(error) };
  }
}

/**
 * @param {Intake_failure[]} failures
 * @returns {{ message: string, details: string }}
 */
export function describe_import_failures(failures) {
  const details = failures.map((failure) => (failure.message.startsWith(`"${failure.name}"`) ? failure.message : `${failure.name}: ${failure.message}`));
  return { message: `${failures.length} file(s) could not be imported.`, details: details.join("\n") };
}
