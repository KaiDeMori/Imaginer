// image_validation.js - Shared restrictions for images entering the input panel or the gallery.
// Rules mirror the GPT image model limits for /v1/images/edits.

export const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
export const MAX_MASK_BYTES = 4 * 1024 * 1024;
export const MAX_IMAGE_COUNT = 16;
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

export function validate_image_file(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: `"${file.name}" is not a supported format — use PNG, WEBP, or JPEG.` };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return {
      valid: false,
      error: `"${file.name}" is ${format_megabytes(file.size)}MB, which exceeds the ${format_megabytes(MAX_IMAGE_BYTES)}MB limit.`,
    };
  }
  return { valid: true };
}

export async function validate_file_readable(file) {
  let bitmap = null;
  try {
    bitmap = await createImageBitmap(file);
    return { valid: true };
  } catch (err) {
    if (err?.name === "NotFoundError") {
      return {
        valid: false,
        error: `"${file.name}" could not be read by the browser — this is a known drag-and-drop issue on some Linux systems. Try Firefox instead, or copy the file to a local folder before dragging it in.`,
      };
    }
    if (err?.name === "NotReadableError") {
      return {
        valid: false,
        error: `"${file.name}" could not be read — it may be locked by another program or you don't have permission to access it.`,
      };
    }
    if (err?.name === "EncodingError") {
      return {
        valid: false,
        error: `"${file.name}" doesn't look like a valid image — it may be corrupted or mislabeled.`,
      };
    }
    return { valid: false, error: `"${file.name}" could not be imported.` };
  } finally {
    bitmap?.close?.();
  }
}

export function validate_image_count(current_count, incoming_count) {
  const total = current_count + incoming_count;
  if (total > MAX_IMAGE_COUNT) {
    return {
      valid: false,
      error: `Adding ${incoming_count} image(s) would bring the total to ${total}, which exceeds the maximum of ${MAX_IMAGE_COUNT}.`,
    };
  }
  return { valid: true };
}

export async function validate_mask_file(mask_file, image_file) {
  if (mask_file.type !== "image/png") {
    return { valid: false, error: `The mask for "${image_file.name}" is not a PNG and has been discarded.` };
  }
  if (mask_file.size > MAX_MASK_BYTES) {
    return {
      valid: false,
      error: `The mask for "${image_file.name}" exceeds ${format_megabytes(MAX_MASK_BYTES)}MB and has been discarded.`,
    };
  }

  let mask_bitmap = null;
  let image_bitmap = null;
  try {
    [mask_bitmap, image_bitmap] = await Promise.all([createImageBitmap(mask_file), createImageBitmap(image_file)]);
    if (mask_bitmap.width !== image_bitmap.width || mask_bitmap.height !== image_bitmap.height) {
      return { valid: false, error: `The mask for "${image_file.name}" does not match the image dimensions and has been discarded.` };
    }
  } catch (err) {
    return { valid: false, error: `The mask for "${image_file.name}" could not be read and has been discarded.` };
  } finally {
    mask_bitmap?.close?.();
    image_bitmap?.close?.();
  }

  return { valid: true };
}

export function with_batch_hint(message, is_batch) {
  return is_batch ? `${message} Try importing the files individually.` : message;
}
