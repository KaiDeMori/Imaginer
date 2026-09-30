// Export: gallery files leave Imaginer as files for the user. Download and ZIP export share this path, so both apply the same rules.

import { strip_PNG, write_PNG_prompt } from "./PNG_chunks.js";
import { build_image_filename } from "./filename_helper.js";
import { extension_for_type } from "./components/image_validation.js";

/** @typedef {{ blob: Blob, filename: string }} Export_entry */
/** @typedef {{ filename: string, message: string }} Export_failure */

export const EXPORT_AS_STORED_HINT = "To export it as stored, turn off Strip Server-Side metadata and both Embed prompt options in Config → Advanced.";

const DOWNLOAD_CLEANUP_DELAY_MS = 1000;

export function export_filename(record) {
  return build_image_filename(record.prompt_text, record.created, record.id, extension_for_type(record.image_blob.type));
}

/**
 * @returns {Promise<Export_entry>}
 */
export async function export_image(record) {
  const filename = export_filename(record);
  const strip = localStorage.getItem("imaginer.strip_metadata") === "true";
  const iTXt_form = localStorage.getItem("imaginer.add_prompt_to_image") === "true";
  const XMP_form = localStorage.getItem("imaginer.add_prompt_to_image_xmp") === "true";

  // Without strip and without a prompt form, Export changes nothing, so the file leaves as stored and is not even parsed.
  if (!strip && !iTXt_form && !XMP_form) {
    return { blob: record.image_blob, filename };
  }

  // A gallery file that is still a JPEG or WebP can only leave as stored, which the all-off case above allows; with any option on, the config could not be applied.
  const type = record.image_blob.type;
  if (type === "image/jpeg" || type === "image/webp") {
    throw new Error("The file is not a PNG and cannot be processed.");
  }

  let bytes = new Uint8Array(await record.image_blob.arrayBuffer());
  if (strip) bytes = strip_PNG(bytes);
  bytes = write_PNG_prompt(bytes, record.prompt_text || "", { iTXt_form, XMP_form });
  return { blob: new Blob([bytes], { type: "image/png" }), filename };
}

/**
 * @param {Array<{ image_blob?: Blob }>} records
 * @param {((done: number, total: number) => void) | undefined} [on_progress]
 * @returns {Promise<{ entries: Export_entry[], failures: Export_failure[] }>}
 */
export async function collect_ZIP_entries(records, on_progress) {
  const exportable = records.filter((record) => record.image_blob instanceof Blob);
  const entries = [];
  const failures = [];
  let done = 0;
  for (const record of exportable) {
    try {
      entries.push(await export_image(record));
    } catch (error) {
      // A file that cannot be processed would leave with what the config promised to remove, so it stays in the gallery and is listed instead.
      failures.push({ filename: export_filename(record), message: error instanceof Error ? error.message : String(error) });
    }
    done += 1;
    if (on_progress) on_progress(done, exportable.length);
  }
  return { entries, failures };
}

/**
 * @param {Export_failure[]} failures
 * @returns {string}
 */
export function describe_export_failures(failures) {
  if (failures.length === 0) return "";
  return [
    `${failures.length} image(s) could not be exported and stay in the gallery:`,
    ...failures.map((failure) => `${failure.filename}: ${failure.message}`),
    EXPORT_AS_STORED_HINT,
  ].join("\n");
}

export function trigger_download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, DOWNLOAD_CLEANUP_DELAY_MS);
}

/**
 * @param {Array<{ image_blob?: Blob }>} records
 * @param {{ on_progress?: (done: number, total: number) => void, on_status?: (status: string) => void }} callbacks
 * @returns {Promise<{ failures: Export_failure[] }>}
 */
export async function export_gallery_as_ZIP(records, callbacks) {
  const { on_progress, on_status } = callbacks;
  if (on_status) on_status("Processing images...");
  const { entries, failures } = await collect_ZIP_entries(records, on_progress);
  if (entries.length === 0 && failures.length === 0) throw new Error("No images to download.");
  if (entries.length === 0) throw new Error(describe_export_failures(failures));

  const { versioned_url } = await import("./version_manager.js");
  const { get_jszip } = await import(versioned_url("./static_imports/jszip_loader.js"));
  const JSZip = await get_jszip();
  const zip = new JSZip();
  for (const entry of entries) {
    zip.file(entry.filename, entry.blob);
  }

  if (on_status) on_status("Saving to disk...");
  const archive = await zip.generateAsync({ type: "blob" });
  const export_timestamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
  trigger_download(archive, `Imaginer_Export_${export_timestamp}.zip`);
  return { failures };
}
