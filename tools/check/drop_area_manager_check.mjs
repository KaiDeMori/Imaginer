// Executable specification of the entry label and the edit request's limits in components/drop_area_manager.js, and of the named messages, the limits and the import confirmation threshold in components/image_validation.js. Run from the repository root: node tools/check/drop_area_manager_check.mjs

const encoder = new TextEncoder();
const undecodable_image = new Blob([encoder.encode("broken bytes")], { type: "image/png" });
const undecodable_mask = new File([encoder.encode("broken mask")], "mask.png", { type: "image/png" });

// The readability and mask checks decode with createImageBitmap, which Node does not have; the stub accepts every file with one fixed size, except the two blobs that stand for undecodable content, so the checks below stay about the entries and the messages, not about decoding.
globalThis.createImageBitmap = async (blob) => {
  if (blob === undecodable_image || blob === undecodable_mask) {
    const error = new Error("cannot decode");
    error.name = "EncodingError";
    throw error;
  }
  return { width: 1, height: 1, close() {} };
};

const { default: drop_area_manager } = await import("../../components/drop_area_manager.js");
const {
  IMPORT_COUNT_CONFIRMATION_THRESHOLD,
  MAXIMUM_BYTES_PER_EDIT_REQUEST_IMAGE,
  MAXIMUM_IMAGE_COUNT_PER_EDIT_REQUEST,
  needs_import_confirmation,
  validate_image_count,
  validate_image_file,
  validate_mask_file,
} = await import("../../components/image_validation.js");

const failures = [];

function check(condition, description) {
  if (!condition) failures.push(description);
}

const png_file = new File([encoder.encode("png bytes")], "photo.png", { type: "image/png" });
const png_blob = new Blob([encoder.encode("png bytes")], { type: "image/png" });
const gif_blob = new Blob([encoder.encode("GIF89a")], { type: "image/gif" });
const wrong_mask = new File([encoder.encode("not a png")], "mask.jpg", { type: "image/jpeg" });
const good_mask = new File([encoder.encode("mask bytes")], "mask.png", { type: "image/png" });

{
  const result = await drop_area_manager.try_add_images([
    { image: png_file, mask: null, uuid: null, label: "photo.png" },
    { image: png_blob, mask: good_mask, uuid: "abc", label: "a_unicorn.png" },
  ]);
  const entries = drop_area_manager.get_images();
  check(result.ok === true, "try_add_images accepts entries with labels");
  check(entries.length === 2 && entries[0].label === "photo.png" && entries[1].label === "a_unicorn.png", "every entry keeps its label");
  check(entries[1].mask === good_mask && entries[1].uuid === "abc", "the mask and the uuid stay with the entry");
}

{
  const result = await drop_area_manager.try_add_images([{ image: png_blob, mask: wrong_mask, uuid: null, label: "gallery_image.png" }]);
  check(result.ok === true && result.mask_discard_reasons.length === 1, "a mask of the wrong type is discarded and the image is still added");
  check(result.mask_discard_reasons[0].includes('"gallery_image.png"'), "the discarded mask is reported with the entry's label");
  check(drop_area_manager.get_images()[2].mask === null, "the entry keeps no discarded mask");
}

{
  const result = await drop_area_manager.try_add_images([{ image: png_blob, mask: undecodable_mask, uuid: null, label: "with_mask.png" }]);
  check(result.ok === true && result.mask_discard_reasons.length === 1 && result.mask_discard_reasons[0].includes('"with_mask.png"') && result.mask_discard_reasons[0].includes("could not be read"), "an unreadable mask is reported with the entry's label");
}

{
  const result = await drop_area_manager.try_add_images([{ image: gif_blob, mask: null, uuid: null, label: "gallery_image.png" }]);
  check(result.ok === false && result.error.includes('"gallery_image.png"') && !result.error.includes("undefined"), "a nameless blob of an unsupported type is refused with a message that carries the label");
}

{
  const result = await drop_area_manager.try_add_images([{ image: undecodable_image, mask: null, uuid: null, label: "broken.png" }]);
  check(result.ok === false && result.error.includes('"broken.png"') && !result.error.includes("undefined"), "a nameless blob the browser cannot decode is refused with a message that carries the label");
}

{
  const named = validate_image_file(gif_blob, "given name");
  check(named.valid === false && named.error.includes('"given name"'), "validate_image_file names the image by the given name");
  const fallback = validate_image_file(new File([encoder.encode("GIF89a")], "animation.gif", { type: "image/gif" }));
  check(fallback.valid === false && fallback.error.includes('"animation.gif"'), "validate_image_file falls back to the file's name");
  const named_mask = await validate_mask_file(wrong_mask, png_blob, "given name");
  check(named_mask.valid === false && named_mask.error.includes('"given name"'), "validate_mask_file names the image by the given name");
  const fallback_mask = await validate_mask_file(wrong_mask, png_file);
  check(fallback_mask.valid === false && fallback_mask.error.includes('"photo.png"'), "validate_mask_file falls back to the file's name");
}

{
  check(MAXIMUM_IMAGE_COUNT_PER_EDIT_REQUEST === 16, "the edit request takes at most 16 images");
  check(MAXIMUM_BYTES_PER_EDIT_REQUEST_IMAGE === 50 * 1024 * 1024, "an image of the edit request has at most 50 MB");
  check(validate_image_count(0, 16).valid === true && validate_image_count(1, 16).valid === false, "validate_image_count holds the edit request's count");
  const oversized = { type: "image/png", size: 60 * 1024 * 1024, name: "huge.png" };
  check(validate_image_file(oversized).valid === true, "validate_image_file checks only the type, because the gallery sets no size limit");
  check(IMPORT_COUNT_CONFIRMATION_THRESHOLD === 100, "the import confirmation threshold is 100 images");
  check(needs_import_confirmation(100) === false && needs_import_confirmation(101) === true, "an import asks first only above the threshold");
}

{
  const count_before = drop_area_manager.get_images().length;
  const oversized = { type: "image/png", size: 60 * 1024 * 1024, name: "huge.png" };
  const result = await drop_area_manager.try_add_images([{ image: oversized, mask: null, uuid: null, label: "huge_label.png" }]);
  check(result.ok === false && result.error.includes('"huge_label.png"') && result.error.includes("60MB") && result.error.includes("50MB"), "the input area refuses an image over the edit request's byte limit, named by its label");
  check(drop_area_manager.get_images().length === count_before, "a refused entry is not added");
}

if (failures.length > 0) {
  console.log("check failed: drop_area_manager");
  for (const failure of failures) {
    console.log(`   ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log("drop_area_manager check passed");
}
