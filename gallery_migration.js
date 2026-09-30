// Migration: gallery files stored before intake existed are brought to what intake produces, once, one record at a time, each verified before it replaces the old file.

import { PIXEL_CHUNK_TYPES, PROMPT_KEYWORD, XMP_KEYWORD, is_PNG, read_PNG_chunks, strip_PNG, write_PNG_prompt } from "./PNG_chunks.js";
import { convert_to_PNG } from "./image_conversion.js";
import { EXPORT_AS_STORED_HINT, export_filename } from "./image_export.js";

/** @typedef {{ id: number, filename: string, message: string }} Migration_failure */
/** @typedef {{ strip: boolean, convert?: (blob: Blob) => Promise<Blob>, verify?: (blob: Blob) => Promise<{ width: number, height: number }>, on_progress?: (done: number, total: number) => void }} Migration_options */

export const GALLERY_FILES_MIGRATED_KEY = "imaginer.gallery_files_migrated";
export const INVALID_RESULT_MESSAGE = "The converted file is not a valid PNG.";

const CHUNK_OVERHEAD = 12;
const SIGNATURE_LENGTH = 8;
const IHDR_DATA_LENGTH = 13;

export function migration_is_done() {
  return localStorage.getItem(GALLERY_FILES_MIGRATED_KEY) === "1";
}

export function mark_migration_done() {
  localStorage.setItem(GALLERY_FILES_MIGRATED_KEY, "1");
}

export function strip_option_is_on() {
  return localStorage.getItem("imaginer.strip_metadata") === "true";
}

function has_trailing_bytes(bytes, chunks) {
  return chunks.reduce((sum, chunk) => sum + chunk.data.length + CHUNK_OVERHEAD, SIGNATURE_LENGTH) !== bytes.length;
}

function iTXt_keyword(data) {
  const end = data.indexOf(0);
  return String.fromCharCode(...data.subarray(0, end < 0 ? data.length : end));
}

/**
 * @param {Blob} blob
 * @param {boolean} strip
 * @returns {Promise<boolean>}
 */
export async function needs_migration(blob, strip) {
  if (blob.type !== "image/png") return true;
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (!is_PNG(bytes)) return true;
  let chunks;
  try {
    chunks = read_PNG_chunks(bytes);
  } catch {
    return true;
  }
  if (has_trailing_bytes(bytes, chunks)) return true;
  return chunks.some((chunk) => {
    if (strip && !PIXEL_CHUNK_TYPES.has(chunk.type)) return true;
    if (chunk.type !== "iTXt") return false;
    const keyword = iTXt_keyword(chunk.data);
    return keyword === PROMPT_KEYWORD || keyword === XMP_KEYWORD;
  });
}

/**
 * @param {Array<{ id: number, image_blob?: Blob }>} records
 * @param {boolean} strip
 * @returns {Promise<Array<{ id: number, image_blob?: Blob }>>}
 */
export async function find_records_to_migrate(records, strip) {
  const found = [];
  for (const record of records) {
    if (!(record.image_blob instanceof Blob)) continue;
    try {
      if (await needs_migration(record.image_blob, strip)) found.push(record);
    } catch (error) {
      // Converting cannot help a blob that cannot even be read, so the record is left as it is.
      console.warn("Gallery file could not be read:", record.id, error);
    }
  }
  return found;
}

/**
 * @param {Blob} blob
 * @param {boolean} strip
 * @param {(blob: Blob) => Promise<Blob>} [convert]
 * @returns {Promise<Blob>}
 */
export async function migrate_blob(blob, strip, convert = convert_to_PNG) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (is_PNG(bytes)) {
    try {
      const result = strip ? strip_PNG(bytes) : write_PNG_prompt(bytes, "", { iTXt_form: false, XMP_form: false });
      return new Blob([result], { type: "image/png" });
    } catch {
      // A PNG the browser decodes can still have truncated chunks, which only a conversion repairs.
    }
  }
  return await convert(blob);
}

/**
 * @param {Uint8Array} bytes
 * @returns {{ width: number, height: number }}
 */
export function check_PNG_structure(bytes) {
  let chunks;
  try {
    chunks = read_PNG_chunks(bytes);
  } catch {
    throw new Error(INVALID_RESULT_MESSAGE);
  }
  const header = chunks[0];
  const is_valid = !has_trailing_bytes(bytes, chunks) && header.type === "IHDR" && header.data.length === IHDR_DATA_LENGTH && chunks.some((chunk) => chunk.type === "IDAT") && chunks[chunks.length - 1].type === "IEND";
  if (!is_valid) throw new Error(INVALID_RESULT_MESSAGE);
  const view = new DataView(header.data.buffer, header.data.byteOffset, header.data.byteLength);
  return { width: view.getUint32(0), height: view.getUint32(4) };
}

function failure_message(error) {
  return error?.message || error?.name || String(error);
}

/**
 * @param {Array<{ id: number, image_blob: Blob }>} records
 * @param {{ update: (id: number, updates: object) => Promise<void> }} store
 * @param {Migration_options} options
 * @returns {Promise<{ migrated: number, failures: Migration_failure[] }>}
 */
export async function migrate_gallery(records, store, options) {
  const { strip, convert = convert_to_PNG, verify, on_progress } = options;
  const failures = [];
  let migrated = 0;
  let done = 0;
  for (const record of records) {
    try {
      const image_blob = await migrate_blob(record.image_blob, strip, convert);
      const structure = check_PNG_structure(new Uint8Array(await image_blob.arrayBuffer()));
      if (verify) {
        let decoded;
        try {
          decoded = await verify(image_blob);
        } catch {
          throw new Error(INVALID_RESULT_MESSAGE);
        }
        if (decoded.width !== structure.width || decoded.height !== structure.height) throw new Error(INVALID_RESULT_MESSAGE);
      }
      await store.update(record.id, { image_blob });
      migrated += 1;
    } catch (error) {
      failures.push({ id: record.id, filename: export_filename(record), message: failure_message(error) });
    }
    done += 1;
    try {
      if (on_progress) on_progress(done, records.length);
    } catch {
      // A broken progress dialog must never stop the run.
    }
  }
  return { migrated, failures };
}

/**
 * @param {Migration_failure[]} failures
 * @returns {string}
 */
export function describe_migration_failures(failures) {
  if (failures.length === 0) return "";
  return [
    `${failures.length} image(s) could not be converted and stay as they are:`,
    ...failures.map((failure) => `${failure.filename}: ${failure.message}`),
    EXPORT_AS_STORED_HINT,
  ].join("\n");
}
