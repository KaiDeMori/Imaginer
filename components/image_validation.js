// image_validation.js - Rules for images entering the input area or the gallery.
// The limits mirror OpenAI's limits for /v1/images/edits and apply only to the edit request; the gallery sets no count or size limit, because nothing outside Imaginer demands one there.

export const MAXIMUM_BYTES_PER_EDIT_REQUEST_IMAGE = 50 * 1024 * 1024;
export const MAX_MASK_BYTES = 4 * 1024 * 1024;
export const MAXIMUM_IMAGE_COUNT_PER_EDIT_REQUEST = 16;
export const IMPORT_COUNT_CONFIRMATION_THRESHOLD = 100;
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/webp", "image/jpeg"];

const EXTENSION_BY_TYPE = {
  "image/png": "png",
  "image/webp": "webp",
  "image/jpeg": "jpg",
};

function format_megabytes(bytes) {
  const megabytes = bytes / (1024 * 1024);
  return Number.isInteger(megabytes) ? String(megabytes) : megabytes.toFixed(1);
}

export function extension_for_type(type) {
  return EXTENSION_BY_TYPE[type] || "png";
}

export function validate_image_file(file, name = file.name) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: `"${name}" is not a supported format — use PNG, WEBP, or JPEG.` };
  }
  return { valid: true };
}

export function validate_edit_request_image_size(file, name = file.name) {
  if (file.size > MAXIMUM_BYTES_PER_EDIT_REQUEST_IMAGE) {
    return {
      valid: false,
      error: `"${name}" is ${format_megabytes(file.size)}MB, which exceeds the ${format_megabytes(MAXIMUM_BYTES_PER_EDIT_REQUEST_IMAGE)}MB limit.`,
    };
  }
  return { valid: true };
}

export function needs_import_confirmation(image_count) {
  return image_count > IMPORT_COUNT_CONFIRMATION_THRESHOLD;
}

export async function validate_file_readable(file, name = file.name) {
  let bitmap = null;
  try {
    bitmap = await createImageBitmap(file);
    return { valid: true };
  } catch (err) {
    if (err?.name === "NotFoundError") {
      return {
        valid: false,
        error: `"${name}" could not be read by the browser — this is a known drag-and-drop issue on some Linux systems. Try Firefox instead.`,
      };
    }
    if (err?.name === "NotReadableError") {
      return {
        valid: false,
        error: `"${name}" could not be read — it may be locked by another program or you don't have permission to access it.`,
      };
    }
    if (err?.name === "EncodingError") {
      return {
        valid: false,
        error: `"${name}" doesn't look like a valid image — it may be corrupted or mislabeled.`,
      };
    }
    return { valid: false, error: `"${name}" could not be imported.` };
  } finally {
    bitmap?.close?.();
  }
}

export function validate_image_count(current_count, incoming_count) {
  const total = current_count + incoming_count;
  if (total > MAXIMUM_IMAGE_COUNT_PER_EDIT_REQUEST) {
    return {
      valid: false,
      error: `Adding ${incoming_count} image(s) would bring the total to ${total}, which exceeds the maximum of ${MAXIMUM_IMAGE_COUNT_PER_EDIT_REQUEST}.`,
    };
  }
  return { valid: true };
}

export async function validate_mask_file(mask_file, image_file, image_name = image_file.name) {
  if (mask_file.type !== "image/png") {
    return { valid: false, error: `The mask for "${image_name}" is not a PNG and has been discarded.` };
  }
  if (mask_file.size > MAX_MASK_BYTES) {
    return {
      valid: false,
      error: `The mask for "${image_name}" exceeds ${format_megabytes(MAX_MASK_BYTES)}MB and has been discarded.`,
    };
  }

  let mask_bitmap = null;
  let image_bitmap = null;
  try {
    [mask_bitmap, image_bitmap] = await Promise.all([createImageBitmap(mask_file), createImageBitmap(image_file)]);
    if (mask_bitmap.width !== image_bitmap.width || mask_bitmap.height !== image_bitmap.height) {
      return { valid: false, error: `The mask for "${image_name}" does not match the image dimensions and has been discarded.` };
    }
  } catch (err) {
    return { valid: false, error: `The mask for "${image_name}" could not be read and has been discarded.` };
  } finally {
    mask_bitmap?.close?.();
    image_bitmap?.close?.();
  }

  return { valid: true };
}

export function with_batch_hint(message, is_batch) {
  return is_batch ? `${message} Try importing the files individually.` : message;
}
