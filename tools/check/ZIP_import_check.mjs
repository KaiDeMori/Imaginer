// Executable specification of ZIP_import.js and of the ZIP path of Gallery.import_files in components/gallery.js: a ZIP file from ZIP export restores its pictures in their order, with their prompts and timestamps, through the same intake as loose files. Run from the repository root: node tools/check/ZIP_import_check.mjs

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

// The modules on the import chain need a window at their top level, import_files saves through window.database_store, and the JSZip loader takes the reader from window.JSZip, so the vendored library is loaded here and handed over.
const saved_records = [];
let next_record_id = 0;
globalThis.window = {
  JSZip: createRequire(import.meta.url)("../../static_imports/jszip.min.js"),
  database_store: {
    save: async (record) => {
      saved_records.push(record);
      return ++next_record_id;
    },
  },
};
// The readability check decodes with createImageBitmap, which Node does not have; the stub accepts every file except the one that stands for undecodable content, so the checks below stay about the ZIP import, not about decoding.
const UNDECODABLE_NAME = "bad.png";
globalThis.createImageBitmap = async (blob) => {
  if (blob.name === UNDECODABLE_NAME) {
    const error = new Error("cannot decode");
    error.name = "EncodingError";
    throw error;
  }
  return { width: 1, height: 1, close() {} };
};

const { EARLIEST_TRUSTED_CREATED, ZIP_PICTURE_FAILURE_MESSAGE, describe_ZIP_contents, describe_ZIP_picture_failure, is_ZIP_file, is_picture_name, open_ZIP_file, restore_created } = await import("../../ZIP_import.js");
const { Gallery } = await import("../../components/gallery.js");
const { Import_confirm_modal } = await import("../../components/import_confirm_modal.js");
const { Error_modal } = await import("../../components/error_modal.js");
const { IMPORT_COUNT_CONFIRMATION_THRESHOLD } = await import("../../components/image_validation.js");
const { UNREADABLE_IMAGE_ERROR_NAME, intake_import } = await import("../../image_intake.js");
const { CONVERSION_UNSUPPORTED_MESSAGE } = await import("../../image_conversion.js");
const { encode_PNG_RGBA, read_PNG_prompt, write_PNG_prompt } = await import("../../PNG_chunks.js");

const JSZip = globalThis.window.JSZip;
const failures = [];

function check(condition, description) {
  if (!condition) failures.push(description);
}

async function rejection_of(action) {
  try {
    await action();
    return null;
  } catch (error) {
    return error;
  }
}

const now = Math.floor(Date.now() / 1000);
const small_png = await encode_PNG_RGBA({ width: 1, height: 1, rgba: Uint8Array.of(255, 0, 0, 255) });
const png_with_prompt = (prompt_text) => write_PNG_prompt(small_png, prompt_text, { iTXt_form: true, XMP_form: false });

/**
 * @param {Array<[string, Uint8Array | string | null]>} entries name and content, in the ZIP file's order; null makes a folder
 */
async function zip_file(name, entries) {
  const zip = new JSZip();
  for (const [entry_name, content] of entries) {
    if (content === null) zip.folder(entry_name);
    else zip.file(entry_name, content);
  }
  return new File([await zip.generateAsync({ type: "uint8array" })], name, { type: "application/zip" });
}

{
  check(is_ZIP_file(new File([], "backup.zip", { type: "" })) === true, "a file named .zip is a ZIP file, whatever its type");
  check(is_ZIP_file(new File([], "BACKUP.ZIP", { type: "" })) === true, "the extension counts in any letter case");
  check(is_ZIP_file(new File([], "backup", { type: "application/zip" })) === true, "a file typed application/zip is a ZIP file");
  check(is_ZIP_file(new File([], "backup", { type: "application/x-zip-compressed" })) === true, "a file typed application/x-zip-compressed, as Windows types it, is a ZIP file");
  check(is_ZIP_file(new File([], "photo.png", { type: "image/png" })) === false, "a PNG is not a ZIP file");
  check(is_ZIP_file(new File([], "archive.zip.png", { type: "image/png" })) === false, "only the last extension counts");
}

{
  for (const name of ["a.png", "A.PNG", "b.Jpg", "c.jpeg", "d.WEBP", "folder/e.png"]) {
    check(is_picture_name(name) === true, `"${name}" is a picture`);
  }
  for (const name of ["notes.txt", "a.png.txt", "png", "folder/", "e.gif", "f.zip"]) {
    check(is_picture_name(name) === false, `"${name}" is not a picture`);
  }
}

{
  check(EARLIEST_TRUSTED_CREATED === 1735689600, "a timestamp is trusted from 2025-01-01 on");
  check(restore_created("a_cat_1759000000_7.png", now) === 1759000000, "the timestamp is read from <prompt>_<created>_<id>.png");
  check(restore_created("a_cat_1759000000.png", now) === 1759000000, "the timestamp is read from <prompt>_<created>.png, the name of Imaginer 1.12");
  check(restore_created("image_42_1759000000.jpg", now) === 1759000000, "a 1.12 name whose prompt ends in digits is read by its last group");
  check(restore_created("image_1759000000_42.png", now) === 1759000000, "a name whose ID could pass for a prompt digit is read by its timestamp group");
  check(restore_created("2_cats_1759000000_7.webp", now) === 1759000000, "a prompt that starts with digits does not matter");
  check(restore_created("a_cat_1700000000_7.png", now) === null, "a timestamp before 2025 is not trusted");
  check(restore_created(`a_cat_${now + 1}_7.png`, now) === null, "a timestamp in the future is not trusted");
  check(restore_created(`a_cat_${now}_7.png`, now) === now, "the time of the import itself is trusted");
  check(restore_created(`a_cat_${EARLIEST_TRUSTED_CREATED}_7.png`, now) === EARLIEST_TRUSTED_CREATED, "the first second of 2025 is trusted");
  check(restore_created("photo.png", now) === null, "a name without a timestamp gives none");
  check(restore_created("1759000000.png", now) === null, "a bare number is not Export's name");
  check(restore_created("a_cat_1759000000_7", now) === 1759000000, "a name without an extension is read as it stands");
  check(restore_created("folder/a_cat_1759000000_7.PNG", now) === 1759000000, "the base name is read, in any letter case of the extension");
}

{
  const file = await zip_file("backup.zip", [
    ["b_1759000001_2.png", png_with_prompt("b prompt")],
    ["a_1759000000_1.png", small_png],
    ["folder", null],
    ["folder/notes.txt", "hi"],
    ["folder/inner_1759000002_3.PNG", small_png],
    ["README.md", "# readme"],
    ["photo.JPG", Uint8Array.of(0xff, 0xd8, 0xff, 0xd9)],
  ]);
  const contents = await open_ZIP_file(file);
  check(contents.pictures.map((picture) => picture.name).join() === "b_1759000001_2.png,a_1759000000_1.png,folder/inner_1759000002_3.PNG,photo.JPG", "open_ZIP_file lists the pictures in the ZIP file's order, those in folders included");
  check(contents.other_file_count === 2, "files that are not pictures are counted, folders are not");
  const [first, , inner, photo] = contents.pictures;
  const first_file = await first.read();
  check(first_file instanceof File && first_file.name === "b_1759000001_2.png" && first_file.type === "image/png", "a picture reads as a File named like its entry, typed by its extension");
  check((await read_PNG_prompt(new Uint8Array(await first_file.arrayBuffer()))) === "b prompt", "the File carries the entry's bytes");
  check((await inner.read()).name === "inner_1759000002_3.PNG", "a picture in a folder reads as a File with its base name");
  check((await photo.read()).type === "image/jpeg", "a .JPG entry is typed image/jpeg");
}

{
  const not_a_zip = new File([small_png], "fake.zip", { type: "application/zip" });
  const error = await rejection_of(() => open_ZIP_file(not_a_zip));
  check(error instanceof Error && error.message === '"fake.zip" could not be read as a ZIP file.', "a file that is not a ZIP file is refused with Imaginer's own message");
  const empty = new File([], "empty.zip", { type: "application/zip" });
  const empty_error = await rejection_of(() => open_ZIP_file(empty));
  check(empty_error instanceof Error && empty_error.message === '"empty.zip" could not be read as a ZIP file.' && !/corrupt/i.test(empty_error.message), "an empty file is refused with the same message, without the library's wording");
}

{
  const unreadable = Object.assign(new Error('"bad.png" doesn\'t look like a valid image — it may be corrupted or mislabeled.'), { name: UNREADABLE_IMAGE_ERROR_NAME });
  check(describe_ZIP_picture_failure(unreadable) === ZIP_PICTURE_FAILURE_MESSAGE, "a picture the browser cannot read is listed without the diagnosis intake makes for a loose file");
  check(describe_ZIP_picture_failure(new Error(CONVERSION_UNSUPPORTED_MESSAGE)) === `${ZIP_PICTURE_FAILURE_MESSAGE} ${CONVERSION_UNSUPPORTED_MESSAGE}`, "a conversion the browser cannot do is a fact and follows as the reason");
  check(describe_ZIP_picture_failure(new Error("")) === ZIP_PICTURE_FAILURE_MESSAGE, "an error without a message adds no reason");
  check(describe_ZIP_picture_failure("quota") === `${ZIP_PICTURE_FAILURE_MESSAGE} quota`, "a thrown value that is not an Error is passed on as the reason");
  check(!/corrupt|damaged/i.test(ZIP_PICTURE_FAILURE_MESSAGE), "the message does not guess");
  const intake_error = await rejection_of(() => intake_import(new File([small_png], UNDECODABLE_NAME, { type: "image/png" })));
  check(intake_error instanceof Error && intake_error.name === UNREADABLE_IMAGE_ERROR_NAME && /corrupted/.test(intake_error.message), "intake marks the readability failure by its name and keeps the message for loose files");
}

{
  check(describe_ZIP_contents("x.zip", 3, 0).length === 0, "a ZIP file of pictures only gets no note");
  check(describe_ZIP_contents("x.zip", 0, 0).join("|") === '"x.zip" holds no pictures.', "a ZIP file without pictures says so");
  check(describe_ZIP_contents("x.zip", 3, 1).join("|") === '1 file in "x.zip" is not an image that Imaginer can understand.', "one other file is counted in the singular");
  check(describe_ZIP_contents("x.zip", 3, 2).join("|") === '2 files in "x.zip" are not images that Imaginer can understand.', "other files are counted in one line");
  check(describe_ZIP_contents("x.zip", 0, 2).length === 2, "a ZIP file of other files only gets both notes");
}

const questions = [];
let answer_to_question = "import";
Import_confirm_modal.show = async (count, zip_name = null) => {
  questions.push({ count, zip_name });
  return answer_to_question;
};
const error_dialogs = [];
Error_modal.show = (content) => {
  error_dialogs.push(content);
};

function fake_gallery() {
  const gallery = Object.create(Gallery.prototype);
  gallery.records_by_id = {};
  gallery.thumbnails = [];
  gallery.create_or_update_thumbnail = (container, blob, prompt_text, created, id) => {
    gallery.thumbnails.push({ prompt_text, created, id });
  };
  return gallery;
}

async function run_import(files, answer) {
  questions.length = 0;
  error_dialogs.length = 0;
  saved_records.length = 0;
  answer_to_question = answer;
  const gallery = fake_gallery();
  await Gallery.prototype.import_files.call(gallery, files);
  return gallery;
}

{
  const file = await zip_file("backup.zip", [
    ["a_1759000000_1.png", png_with_prompt("first prompt")],
    ["b_1759000001_2.png", png_with_prompt("second prompt")],
    ["photo.png", small_png],
    ["c_1700000000_3.png", small_png],
  ]);
  const gallery = await run_import([file], "cancel");
  check(questions.length === 0, "a ZIP file at or below the threshold asks nothing");
  check(saved_records.map((record) => record.created).join() === `1759000000,1759000001,${now},${now}` || saved_records.map((record) => record.created).join() === `1759000000,1759000001,${now + 1},${now + 1}`, "the pictures are saved in the ZIP file's order, with the restored timestamps, and the time of the import where none can be trusted");
  check(saved_records.map((record) => record.prompt_text ?? "").join("|") === "first prompt|second prompt||", "the prompts come back from the files' metadata");
  check(gallery.thumbnails.map((thumbnail) => `${thumbnail.id}:${thumbnail.created}`).join() === saved_records.map((record, index) => `${index + 1}:${record.created}`).join(), "every picture gets a thumbnail with its record's ID and timestamp");
  check(error_dialogs.length === 0, "a clean ZIP file ends without a dialog");
}

{
  const big = Array.from({ length: IMPORT_COUNT_CONFIRMATION_THRESHOLD + 1 }, (unused, index) => [`image_${index + 1}.png`, small_png]);
  const file = await zip_file("big.zip", [...big, ["notes.txt", "hi"]]);
  await run_import([file], "cancel");
  check(questions.length === 1 && questions[0].count === IMPORT_COUNT_CONFIRMATION_THRESHOLD + 1 && questions[0].zip_name === "big.zip", "a ZIP file above the threshold asks once, with its picture count and its name; other files do not count");
  check(saved_records.length === 0 && error_dialogs.length === 0, "a cancelled ZIP file imports nothing and reports nothing");
  await run_import([file], "import");
  check(questions.length === 1 && saved_records.length === IMPORT_COUNT_CONFIRMATION_THRESHOLD + 1, "a confirmed ZIP file imports every picture");
}

{
  const first = await zip_file("first.zip", [["a_1759000000_1.png", small_png]]);
  const second = await zip_file("second.zip", Array.from({ length: IMPORT_COUNT_CONFIRMATION_THRESHOLD + 1 }, (unused, index) => [`image_${index + 1}.png`, small_png]));
  const loose = new File([small_png], "loose.png", { type: "image/png" });
  await run_import([first, loose, second], "import");
  check(questions.length === 1 && questions[0].zip_name === "second.zip", "the question is asked per ZIP file, and a small loose batch asks nothing");
  check(saved_records.length === IMPORT_COUNT_CONFIRMATION_THRESHOLD + 3, "loose files and the pictures of every ZIP file are imported together");
  check(saved_records[0].created >= now && saved_records[1].created === 1759000000, "the loose files come first, then the ZIP files in their order");
}

{
  const file = await zip_file("mixed.zip", [
    ["good_1759000000_1.png", small_png],
    [UNDECODABLE_NAME, small_png],
    ["photo_1759000001_2.jpg", Uint8Array.of(0xff, 0xd8, 0xff, 0xd9)],
    ["notes.txt", "hi"],
    ["README.md", "# readme"],
  ]);
  await run_import([file], "import");
  check(saved_records.length === 1 && saved_records[0].created === 1759000000, "the pictures that pass intake are imported, the others are not");
  check(error_dialogs.length === 1, "one dialog follows the import");
  const dialog = error_dialogs[0];
  check(dialog && dialog.message === "2 file(s) could not be imported.", "the dialog counts the pictures that were not imported");
  const lines = dialog ? String(dialog.details).split("\n") : [];
  check(lines[0] === `${UNDECODABLE_NAME}: ${ZIP_PICTURE_FAILURE_MESSAGE}`, "a picture the browser cannot read is listed by name, without a reason");
  check(lines[1] === `photo_1759000001_2.jpg: ${ZIP_PICTURE_FAILURE_MESSAGE} ${CONVERSION_UNSUPPORTED_MESSAGE}`, "a picture this browser cannot convert is listed with that fact");
  check(lines[2] === '2 files in "mixed.zip" are not images that Imaginer can understand.', "the files that are not pictures are counted in one line of the same dialog");
  check(!/corrupt|damaged/i.test(String(dialog?.details)), "the dialog does not guess");
}

{
  const file = await zip_file("texts.zip", [["notes.txt", "hi"]]);
  await run_import([file], "import");
  check(error_dialogs.length === 1 && error_dialogs[0] === '"texts.zip" holds no pictures. 1 file in "texts.zip" is not an image that Imaginer can understand.', "a ZIP file without pictures gets the notes as the dialog's text");
}

{
  const not_a_zip = new File([small_png], "fake.zip", { type: "application/zip" });
  await run_import([not_a_zip], "import");
  check(error_dialogs.length === 1 && error_dialogs[0].message === "1 file(s) could not be imported." && error_dialogs[0].details === '"fake.zip" could not be read as a ZIP file.', "a file that is not a ZIP file is reported like a file that could not be imported");
}

{
  const broken = new File([small_png], "fake.zip", { type: "application/zip" });
  const loose_gif = new File([Uint8Array.of(71, 73, 70)], "animation.gif", { type: "image/gif" });
  await run_import([loose_gif, broken], "import");
  const lines = String(error_dialogs[0]?.details).split("\n");
  check(error_dialogs.length === 1 && error_dialogs[0].message === "2 file(s) could not be imported." && lines.length === 2 && lines[0].startsWith('"animation.gif"') && lines[1].startsWith('"fake.zip"'), "loose failures and ZIP failures share the one dialog");
}

{
  // The thumbnail order on a fake grid: newest first, by timestamp, then by ID; a placeholder by the start of its generation.
  function fake_grid() {
    const children = [];
    return {
      children,
      get firstChild() {
        return children[0] ?? null;
      },
      insertBefore(node, before) {
        children.splice(before === null ? children.length : children.indexOf(before), 0, node);
      },
    };
  }
  const gallery = Object.create(Gallery.prototype);
  gallery.grid = fake_grid();
  gallery.records_by_id = {
    1: { id: 1, created: 100 },
    2: { id: 2, created: 200 },
    3: { id: 3, created: 300 },
    4: { id: 4, created: 250 },
    5: { id: 5, created: 400 },
    6: { id: 6, created: 300 },
    7: { id: 7, created: 50 },
  };
  const thumbnail = (id) => ({ dataset: { recordId: String(id) }, id });
  const placeholder = { dataset: {}, _start_time: 300, id: "placeholder" };
  const order = () => gallery.grid.children.map((child) => child.id).join();
  for (const id of [1, 2, 3]) gallery.insert_thumbnail(thumbnail(id), gallery.records_by_id[id].created, id);
  check(order() === "3,2,1", "records inserted oldest first stand newest first, as loadImages builds the grid");
  gallery.grid.insertBefore(placeholder, gallery.grid.firstChild);
  gallery.insert_thumbnail(thumbnail(4), 250, 4);
  check(order() === "placeholder,3,4,2,1", "a restored picture lands among the others by its timestamp");
  gallery.insert_thumbnail(thumbnail(5), 400, 5);
  check(order() === "5,placeholder,3,4,2,1", "a new import goes above a placeholder that started before it");
  gallery.insert_thumbnail(thumbnail(6), 300, 6);
  check(order() === "5,6,placeholder,3,4,2,1", "the same timestamp sorts by ID, the higher one first, and a placeholder of that second counts as older");
  gallery.insert_thumbnail(thumbnail(7), 50, 7);
  check(order() === "5,6,placeholder,3,4,2,1,7", "the oldest picture goes to the end");
  const untimed = { dataset: {}, id: "untimed" };
  gallery.insert_thumbnail(untimed, undefined, null);
  check(order() === "untimed,5,6,placeholder,3,4,2,1,7", "a thumbnail without a timestamp goes to the top");
}

{
  const read_source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
  const menu_bar_html = read_source("../../components/menu_bar/menu_bar.html");
  const generation_panel_source = read_source("../../components/generation_panel.js");
  check(/<input id="import-file-input" type="file" accept="image\/png,image\/jpeg,image\/webp,\.zip" multiple hidden \/>/.test(menu_bar_html), "the file dialog offers ZIP files next to the image formats");
  check(/if \(is_ZIP_file\(file\)\) \{\s*failures\.push\(\{ name: file\.name, message: `"\$\{file\.name\}" is a ZIP file\. ZIP files go into the gallery[^`]*`\s*\}\);\s*continue;/.test(generation_panel_source), "the input area refuses a ZIP file with a message that points to the gallery");
}

if (failures.length > 0) {
  console.log("check failed: ZIP_import");
  for (const failure of failures) {
    console.log(`   ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log("ZIP_import check passed");
}
