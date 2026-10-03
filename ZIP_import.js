// ZIP import: a ZIP file from ZIP export restores its pictures into the gallery, in their order, with their prompts and timestamps. The pictures pass intake like loose files; this module opens the ZIP file, reads the timestamps from the filenames Export wrote, and words the dialog after the import.

import { get_jszip } from "./static_imports/jszip_loader.js";
import { UNREADABLE_IMAGE_ERROR_NAME } from "./image_intake.js";

/** @typedef {{ name: string, read: () => Promise<File> }} ZIP_picture */
/** @typedef {{ pictures: ZIP_picture[], other_file_count: number }} ZIP_contents */

const ZIP_TYPES = new Set(["application/zip", "application/x-zip-compressed"]);
const PICTURE_TYPES_BY_EXTENSION = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };

// Export writes the record's timestamp in Unix seconds, and the first gallery record was created in 2025, so an earlier timestamp, or one in the future, is not a record's.
export const EARLIEST_TRUSTED_CREATED = Date.UTC(2025, 0, 1) / 1000;

export const ZIP_PICTURE_FAILURE_MESSAGE = "Imaginer could not understand this picture.";
const ZIP_PICTURE_UNREADABLE_REASON = "It could not be read from the ZIP file.";

/**
 * The type of a dropped or chosen file depends on the system, so the name decides as well.
 * @param {File} file
 */
export function is_ZIP_file(file) {
  return /\.zip$/i.test(file.name || "") || ZIP_TYPES.has(file.type);
}

function base_name_of(entry_name) {
  return entry_name.slice(entry_name.lastIndexOf("/") + 1);
}

function picture_type_of(entry_name) {
  const base_name = base_name_of(entry_name);
  const dot = base_name.lastIndexOf(".");
  if (dot < 0) return null;
  return PICTURE_TYPES_BY_EXTENSION[base_name.slice(dot + 1).toLowerCase()] ?? null;
}

/**
 * A picture is a file whose name ends in .png, .jpg, .jpeg or .webp, in any letter case.
 * @param {string} entry_name
 */
export function is_picture_name(entry_name) {
  return picture_type_of(entry_name) !== null;
}

/**
 * The timestamp of the gallery record, read from the filename Export wrote: `<prompt>_<created>_<id>.<ext>`, or `<prompt>_<created>.<ext>` from Imaginer 1.12.
 * The prompt part may end in digits, so the reading with the ID comes first, and a reading counts only when its timestamp lies between 2025 and the import.
 * @param {string} entry_name
 * @param {number} now the time of the import, in Unix seconds
 * @returns {number | null} the timestamp, or null when none can be trusted
 */
export function restore_created(entry_name, now) {
  const stem = base_name_of(entry_name).replace(/\.[^.]*$/, "");
  for (const reading of [/_(\d+)_\d+$/, /_(\d+)$/]) {
    const match = reading.exec(stem);
    if (match === null) continue;
    const created = Number(match[1]);
    if (created >= EARLIEST_TRUSTED_CREATED && created <= now) return created;
  }
  return null;
}

/**
 * Opens a ZIP file and lists its pictures in the ZIP file's order. Folders are skipped, every other file is counted.
 * @param {File} file
 * @returns {Promise<ZIP_contents>}
 */
export async function open_ZIP_file(file) {
  const JSZip = await get_jszip();
  let zip;
  try {
    // An ArrayBuffer, because JSZip reads a Blob through FileReader, which Node does not have.
    zip = await JSZip.loadAsync(await file.arrayBuffer());
  } catch (error) {
    // JSZip's messages speculate about corruption; the fact is that the file could not be read as a ZIP file.
    throw new Error(`"${file.name}" could not be read as a ZIP file.`, { cause: error });
  }
  const pictures = [];
  let other_file_count = 0;
  // JSZip keeps the entries in the ZIP file's order; a picture's name ends in an extension, so it is never an integer-like key that JavaScript would move to the front.
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    const type = picture_type_of(entry.name);
    if (type === null) {
      other_file_count += 1;
      continue;
    }
    pictures.push({
      name: entry.name,
      read: async () => {
        let bytes;
        try {
          bytes = await entry.async("uint8array");
        } catch (error) {
          throw new Error(ZIP_PICTURE_UNREADABLE_REASON, { cause: error });
        }
        return new File([bytes], base_name_of(entry.name), { type });
      },
    });
  }
  return { pictures, other_file_count };
}

/**
 * A picture from a ZIP file is listed as one Imaginer could not understand. A reason follows only when it is a fact: the diagnosis intake makes for an unreadable loose file is a guess and stays out.
 * @param {unknown} error
 * @returns {string}
 */
export function describe_ZIP_picture_failure(error) {
  if (error instanceof Error && error.name === UNREADABLE_IMAGE_ERROR_NAME) return ZIP_PICTURE_FAILURE_MESSAGE;
  const reason = error instanceof Error ? error.message : String(error);
  return reason ? `${ZIP_PICTURE_FAILURE_MESSAGE} ${reason}` : ZIP_PICTURE_FAILURE_MESSAGE;
}

/**
 * The lines of the dialog after the import that concern the ZIP file as a whole.
 * @param {string} zip_name
 * @param {number} picture_count
 * @param {number} other_file_count
 * @returns {string[]}
 */
export function describe_ZIP_contents(zip_name, picture_count, other_file_count) {
  const notes = [];
  if (picture_count === 0) notes.push(`"${zip_name}" holds no pictures.`);
  if (other_file_count === 1) notes.push(`1 file in "${zip_name}" is not an image that Imaginer can understand.`);
  if (other_file_count > 1) notes.push(`${other_file_count} files in "${zip_name}" are not images that Imaginer can understand.`);
  return notes;
}
