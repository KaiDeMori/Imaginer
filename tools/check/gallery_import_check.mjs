// Executable specification of the gallery's import path in components/gallery.js: drop and the 📂 button hand their files to Gallery.import_files, the gallery sets no count or size limit, and a large batch asks first. Run from the repository root: node tools/check/gallery_import_check.mjs

import { readFileSync } from "node:fs";

let next_record_id = 0;
// The modules on the import chain need a window at their top level, and import_files saves through window.database_store; the readability check decodes with createImageBitmap, which Node does not have. The stubs accept every file, so the checks below stay about the import path, not about decoding.
globalThis.window = { database_store: { save: async () => ++next_record_id } };
globalThis.createImageBitmap = async () => ({ width: 1, height: 1, close() {} });

const { Gallery } = await import("../../components/gallery.js");
const { Import_confirm_modal } = await import("../../components/import_confirm_modal.js");
const { Error_modal } = await import("../../components/error_modal.js");
const { MAXIMUM_BYTES_PER_EDIT_REQUEST_IMAGE, MAXIMUM_IMAGE_COUNT_PER_EDIT_REQUEST, IMPORT_COUNT_CONFIRMATION_THRESHOLD } = await import("../../components/image_validation.js");
const { encode_PNG_RGBA, read_PNG_chunks, write_PNG_chunks } = await import("../../PNG_chunks.js");

const failures = [];

function check(condition, description) {
  if (!condition) failures.push(description);
}

const questions = [];
let answer_to_question = "import";
Import_confirm_modal.show = async (count) => {
  questions.push(count);
  return answer_to_question;
};
const error_dialogs = [];
Error_modal.show = (content) => {
  error_dialogs.push(content);
};

const small_png = await encode_PNG_RGBA({ width: 1, height: 1, rgba: Uint8Array.of(255, 0, 0, 255) });
const small_chunks = read_PNG_chunks(small_png);
const large_comment = { type: "tEXt", data: new Uint8Array(MAXIMUM_BYTES_PER_EDIT_REQUEST_IMAGE + 1).fill(65) };
const large_png = write_PNG_chunks([...small_chunks.slice(0, -1), large_comment, small_chunks[small_chunks.length - 1]]);
const png_files = (count) => Array.from({ length: count }, (unused, index) => new File([small_png], `image_${index + 1}.png`, { type: "image/png" }));

function fake_gallery() {
  const gallery = {
    records_by_id: {},
    thumbnails: [],
    create_or_update_thumbnail(container, blob, prompt_text, created, id) {
      gallery.thumbnails.push({ blob, id });
    },
  };
  return gallery;
}

async function run_import(files, answer) {
  questions.length = 0;
  error_dialogs.length = 0;
  answer_to_question = answer;
  const gallery = fake_gallery();
  await Gallery.prototype.import_files.call(gallery, files);
  return gallery;
}

{
  const large_file = new File([large_png], "large.png", { type: "image/png" });
  check(large_file.size > MAXIMUM_BYTES_PER_EDIT_REQUEST_IMAGE, "the large test file exceeds the edit request's byte limit");
  const files = [large_file, ...png_files(MAXIMUM_IMAGE_COUNT_PER_EDIT_REQUEST)];
  const gallery = await run_import(files, "cancel");
  check(gallery.thumbnails.length === files.length && error_dialogs.length === 0, "the gallery takes more images than the edit request allows, one of them over its byte limit");
  check(questions.length === 0, "a batch at or below the threshold asks nothing");
}

{
  const gallery = await run_import(png_files(IMPORT_COUNT_CONFIRMATION_THRESHOLD), "cancel");
  check(questions.length === 0 && gallery.thumbnails.length === IMPORT_COUNT_CONFIRMATION_THRESHOLD, "a batch of exactly the threshold lands without a question");
}

{
  const gallery = await run_import(png_files(IMPORT_COUNT_CONFIRMATION_THRESHOLD + 1), "cancel");
  check(questions.length === 1 && questions[0] === IMPORT_COUNT_CONFIRMATION_THRESHOLD + 1, "a batch above the threshold asks once, with its count");
  check(gallery.thumbnails.length === 0, "a cancelled batch imports nothing");
}

{
  const gallery = await run_import(png_files(IMPORT_COUNT_CONFIRMATION_THRESHOLD + 1), "import");
  check(questions.length === 1 && gallery.thumbnails.length === IMPORT_COUNT_CONFIRMATION_THRESHOLD + 1, "a confirmed batch imports every image");
}

{
  const gallery = await run_import([], "import");
  check(questions.length === 0 && gallery.thumbnails.length === 0, "an empty selection does nothing");
}

{
  const handlers = {};
  const handed_over = [];
  const fake = {
    root: { addEventListener: (type, handler) => (handlers[type] = handler), style: {} },
    import_files: async (files) => handed_over.push(files),
  };
  Gallery.prototype.enable_drag_and_drop.call(fake);
  const dropped = png_files(2);
  await handlers.drop({ preventDefault() {}, dataTransfer: { files: dropped } });
  check(handed_over.length === 1 && handed_over[0].length === 2 && handed_over[0][0] === dropped[0], "a drop hands its files to import_files");
}

{
  const read_source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
  const menu_bar_source = read_source("../../components/menu_bar/menu_bar.js");
  const menu_bar_html = read_source("../../components/menu_bar/menu_bar.html");
  const gallery_source = read_source("../../components/gallery.js");
  const dispatched = [...menu_bar_source.matchAll(/new CustomEvent\("([^"]+)",\s*\{\s*detail:\s*\{\s*files\s*\}/g)].map((match) => match[1]);
  check(dispatched.length === 1, "the menu bar dispatches the chosen files with one event");
  const listener = dispatched.length === 1 ? new RegExp(`addEventListener\\("${dispatched[0].replaceAll(".", "\\.")}",\\s*\\(e\\)\\s*=>\\s*\\{\\s*this\\.import_files\\(e\\.detail\\.files\\)`) : null;
  check(listener !== null && listener.test(gallery_source), "the gallery listens to that event and hands its files to import_files");
  check(/import_button\.addEventListener\("click",\s*\(\)\s*=>\s*import_file_input\.click\(\)\)/.test(menu_bar_source), "a click on the 📂 button opens the file dialog");
  check(/<input id="import-file-input" type="file" accept="image\/png,image\/jpeg,image\/webp" multiple hidden \/>/.test(menu_bar_html), "the file dialog offers PNG, JPEG and WebP and takes several files");
}

if (failures.length > 0) {
  console.log("check failed: gallery_import");
  for (const failure of failures) {
    console.log(`   ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log("gallery_import check passed");
}
