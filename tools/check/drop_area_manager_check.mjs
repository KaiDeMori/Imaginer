// Executable specification of the entry label in components/drop_area_manager.js and components/image_validation.js. Run from the repository root: node tools/check/drop_area_manager_check.mjs

// The readability and mask checks decode with createImageBitmap, which Node does not have; the stub accepts every file with one fixed size, so the checks below stay about the entries, not about decoding.
globalThis.createImageBitmap = async () => ({ width: 1, height: 1, close() {} });

const { default: drop_area_manager } = await import("../../components/drop_area_manager.js");
const { validate_mask_file } = await import("../../components/image_validation.js");

const failures = [];
const encoder = new TextEncoder();

function check(condition, description) {
  if (!condition) failures.push(description);
}

const png_file = new File([encoder.encode("png bytes")], "photo.png", { type: "image/png" });
const png_blob = new Blob([encoder.encode("png bytes")], { type: "image/png" });
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
  const named = await validate_mask_file(wrong_mask, png_blob, "given name");
  check(named.valid === false && named.error.includes('"given name"'), "validate_mask_file names the image by the given name");
  const fallback = await validate_mask_file(wrong_mask, png_file);
  check(fallback.valid === false && fallback.error.includes('"photo.png"'), "validate_mask_file falls back to the file's name");
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
