// Executable specification of gallery_migration.js. Run from the repository root: node tools/check/gallery_migration_check.mjs

const settings = new Map();
globalThis.localStorage = {
  getItem: (key) => (settings.has(key) ? settings.get(key) : null),
  setItem: (key, value) => settings.set(key, String(value)),
};
const warnings = [];
console.warn = (...parts) => warnings.push(parts.map(String).join(" "));

const { GALLERY_FILES_MIGRATED_KEY, INVALID_RESULT_MESSAGE, check_PNG_structure, describe_migration_failures, find_records_to_migrate, mark_migration_done, migrate_blob, migrate_gallery, migration_is_done, needs_migration, strip_option_is_on } = await import("../../gallery_migration.js");
const { EXPORT_AS_STORED_HINT } = await import("../../image_export.js");
const { PROMPT_KEYWORD, XMP_KEYWORD, build_XMP_packet, read_PNG_chunks, write_PNG_chunks } = await import("../../PNG_chunks.js");

const failures = [];
const encoder = new TextEncoder();

function check(condition, description) {
  if (!condition) failures.push(description);
}

function concat_bytes(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function iTXt_data(keyword, text_bytes) {
  return concat_bytes([encoder.encode(keyword), Uint8Array.of(0, 0, 0, 0, 0), text_bytes]);
}

async function chunk_types(blob) {
  return read_PNG_chunks(new Uint8Array(await blob.arrayBuffer())).map((chunk) => chunk.type);
}

async function deflate(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function thrown_by(action) {
  try {
    await action();
    return null;
  } catch (error) {
    return error;
  }
}

const IHDR = { type: "IHDR", data: Uint8Array.of(0, 0, 0, 1, 0, 0, 0, 1, 8, 3, 0, 0, 0) };
const PLTE = { type: "PLTE", data: Uint8Array.of(255, 0, 0) };
const tRNS = { type: "tRNS", data: Uint8Array.of(128) };
const IDAT = { type: "IDAT", data: await deflate(Uint8Array.of(0, 0)) };
const IEND = { type: "IEND", data: new Uint8Array(0) };
const tEXt = { type: "tEXt", data: encoder.encode("Comment\0made by a test") };
const stored_prompt = { type: "iTXt", data: iTXt_data(PROMPT_KEYWORD, encoder.encode("a stored prompt")) };
const stored_xmp = { type: "iTXt", data: iTXt_data(XMP_KEYWORD, encoder.encode(build_XMP_packet("a stored prompt"))) };

const png_blob = (chunks, type = "image/png") => new Blob([write_PNG_chunks(chunks)], { type });
const clean_png = png_blob([IHDR, PLTE, tRNS, IDAT, IEND]);
const png_with_text = png_blob([IHDR, tEXt, PLTE, tRNS, IDAT, IEND]);
const png_with_forms = png_blob([IHDR, PLTE, tRNS, stored_prompt, stored_xmp, IDAT, IEND]);
const clean_png_typed_jpeg = png_blob([IHDR, PLTE, tRNS, IDAT, IEND], "image/jpeg");
const jpeg_blob = new Blob([Uint8Array.of(0xff, 0xd8, 0xff, 0xd9)], { type: "image/jpeg" });
const whole = write_PNG_chunks([IHDR, PLTE, tRNS, IDAT, IEND]);
const truncated_png = new Blob([whole.subarray(0, whole.length - 12)], { type: "image/png" });
const trailing_png = new Blob([concat_bytes([whole, encoder.encode("trailing bytes")])], { type: "image/png" });
const converted_png = png_blob([IHDR, PLTE, tRNS, IDAT, IEND]);
const record = (id, image_blob, prompt_text = "a prompt") => ({ id, created: 1700000000, prompt_text, image_blob });

const conversions = [];
const converter_stub = async (blob) => {
  conversions.push(blob);
  return converted_png;
};

{
  check((await needs_migration(clean_png, true)) === false, "needs_migration with strip is false for a clean PNG");
  check((await needs_migration(png_with_text, true)) === true, "needs_migration with strip is true for a PNG with a tEXt chunk");
  check((await needs_migration(png_with_forms, true)) === true, "needs_migration with strip is true for a PNG with the forms");
  check((await needs_migration(jpeg_blob, true)) === true, "needs_migration is true for a JPEG");
  check((await needs_migration(truncated_png, true)) === true, "needs_migration is true for a truncated PNG");
  check((await needs_migration(clean_png_typed_jpeg, true)) === true, "needs_migration is true for a clean PNG typed image/jpeg");
  check((await needs_migration(trailing_png, true)) === true, "needs_migration is true for a PNG with bytes after IEND");
  check((await needs_migration(png_with_text, false)) === false, "needs_migration without strip is false for a PNG with a tEXt chunk");
  check((await needs_migration(png_with_forms, false)) === true, "needs_migration without strip is true for a PNG with the forms");
  check((await needs_migration(clean_png, false)) === false, "needs_migration without strip is false for a clean PNG");
}

{
  const unreadable = { type: "image/png", arrayBuffer: async () => { throw new Error("NotReadableError"); } };
  const records = [
    record(1, clean_png),
    record(2, png_with_text),
    { id: 3, prompt_text: "no blob" },
    record(4, jpeg_blob),
    { id: 5, image_blob: Object.assign(new Blob([Uint8Array.of(1)], { type: "image/png" }), { arrayBuffer: unreadable.arrayBuffer }) },
  ];
  warnings.length = 0;
  const candidates = await find_records_to_migrate(records, true);
  check(candidates.map((entry) => entry.id).join() === "2,4", "find_records_to_migrate keeps the order and skips clean PNGs, records without a blob, and unreadable blobs");
  check(warnings.length === 1 && warnings[0].includes("5"), "an unreadable blob is logged with its record id");
}

{
  conversions.length = 0;
  const stripped = await migrate_blob(png_with_text, true, converter_stub);
  check((await chunk_types(stripped)).join() === "IHDR,PLTE,tRNS,IDAT,IEND" && conversions.length === 0, "migrate_blob with strip strips a PNG without calling the converter");
  const forms_removed = await migrate_blob(png_blob([IHDR, tEXt, PLTE, tRNS, stored_prompt, stored_xmp, IDAT, IEND]), false, converter_stub);
  check((await chunk_types(forms_removed)).join() === "IHDR,tEXt,PLTE,tRNS,IDAT,IEND", "migrate_blob without strip removes the forms and keeps a tEXt chunk");
  const retyped = await migrate_blob(clean_png_typed_jpeg, true, converter_stub);
  check(retyped.type === "image/png" && conversions.length === 0, "migrate_blob returns a blob typed image/png for PNG bytes typed image/jpeg");
  const from_jpeg = await migrate_blob(jpeg_blob, true, converter_stub);
  check(from_jpeg === converted_png && conversions.length === 1 && conversions[0] === jpeg_blob, "migrate_blob converts a JPEG");
  const from_truncated = await migrate_blob(truncated_png, true, converter_stub);
  check(from_truncated === converted_png && conversions.length === 2, "migrate_blob converts a truncated PNG");
}

{
  const structure = check_PNG_structure(whole);
  check(structure.width === 1 && structure.height === 1, "check_PNG_structure returns the header's dimensions");
  const not_png = await thrown_by(() => check_PNG_structure(encoder.encode("not a png")));
  check(not_png instanceof Error && not_png.message === INVALID_RESULT_MESSAGE, "check_PNG_structure throws for bytes that are not a PNG");
  const no_idat = await thrown_by(() => check_PNG_structure(write_PNG_chunks([IHDR, IEND])));
  check(no_idat instanceof Error && no_idat.message === INVALID_RESULT_MESSAGE, "check_PNG_structure throws for a PNG without IDAT");
  const wrong_end = await thrown_by(() => check_PNG_structure(write_PNG_chunks([IHDR, IDAT, IEND, tEXt])));
  check(wrong_end instanceof Error && wrong_end.message === INVALID_RESULT_MESSAGE, "check_PNG_structure throws when the last chunk is not IEND");
}

{
  const updates = [];
  const store = { update: async (id, fields) => updates.push({ id, fields }) };
  const progress = [];
  const failing_converter = async (blob) => {
    if (blob === jpeg_blob) return converted_png;
    throw new Error("The image could not be converted: no decoder.");
  };
  const records = [
    record(10, png_with_forms, "first"),
    record(11, jpeg_blob, "second"),
    record(12, new Blob([encoder.encode("RIFF....WEBP")], { type: "image/webp" }), "third"),
  ];
  const result = await migrate_gallery(records, store, { strip: true, convert: failing_converter, on_progress: (done, total) => progress.push(`${done}/${total}`) });
  check(result.migrated === 2, "migrate_gallery counts the records it wrote");
  check(updates.map((update) => update.id).join() === "10,11", "migrate_gallery writes the records that could be converted, in order");
  check(updates.every((update) => Object.keys(update.fields).join() === "image_blob"), "migrate_gallery writes only the field image_blob");
  check(updates.every((update) => update.fields.image_blob instanceof Blob && update.fields.image_blob.type === "image/png"), "migrate_gallery writes a PNG blob into image_blob");
  check((await chunk_types(updates[0].fields.image_blob)).join() === "IHDR,PLTE,tRNS,IDAT,IEND", "the written PNG is clean");
  check(result.failures.length === 1 && result.failures[0].id === 12 && result.failures[0].filename === "third_1700000000_12.webp" && result.failures[0].message === "The image could not be converted: no decoder.", "a record whose conversion fails is reported with its id, its export filename and the message");
  check(progress.join() === "1/3,2/3,3/3", "progress is reported after every record");
}

{
  const updates = [];
  const store = { update: async (id, fields) => updates.push({ id, fields }) };
  const bad_converter = async () => new Blob([encoder.encode("not a png")], { type: "image/png" });
  const invalid = await migrate_gallery([record(20, jpeg_blob)], store, { strip: true, convert: bad_converter });
  check(updates.length === 0 && invalid.migrated === 0 && invalid.failures.length === 1 && invalid.failures[0].message === INVALID_RESULT_MESSAGE, "a converted file that is not a valid PNG is not written and is reported as such");

  const throwing_verify = async () => { throw new Error("decode failed"); };
  const not_decodable = await migrate_gallery([record(21, png_with_text)], store, { strip: true, verify: throwing_verify });
  check(updates.length === 0 && not_decodable.failures.length === 1 && not_decodable.failures[0].message === INVALID_RESULT_MESSAGE, "a result the verifier cannot decode is not written");

  const wrong_size_verify = async () => ({ width: 2, height: 2 });
  const wrong_size = await migrate_gallery([record(22, png_with_text)], store, { strip: true, verify: wrong_size_verify });
  check(updates.length === 0 && wrong_size.failures.length === 1 && wrong_size.failures[0].message === INVALID_RESULT_MESSAGE, "a result whose decoded size differs from its header is not written");

  const right_size_verify = async () => ({ width: 1, height: 1 });
  const verified = await migrate_gallery([record(23, png_with_text)], store, { strip: true, verify: right_size_verify });
  check(updates.length === 1 && verified.migrated === 1 && verified.failures.length === 0, "a result the verifier confirms is written");

  const throwing_store = { update: async () => { throw new DOMException("", "QuotaExceededError"); } };
  const stored = await migrate_gallery([record(24, png_with_text)], throwing_store, { strip: true });
  check(stored.migrated === 0 && stored.failures.length === 1 && stored.failures[0].message === "QuotaExceededError", "a failing store write is reported by its name when the message is empty");

  const progress_updates = [];
  const noisy_store = { update: async (id, fields) => progress_updates.push(id) };
  const noisy = await migrate_gallery([record(25, png_with_text), record(26, png_with_text)], noisy_store, { strip: true, on_progress: () => { throw new Error("dialog gone"); } });
  check(noisy.migrated === 2 && progress_updates.join() === "25,26", "a throwing on_progress does not stop the run");
}

{
  check(migration_is_done() === false, "migration_is_done is false without the flag");
  mark_migration_done();
  check(settings.get(GALLERY_FILES_MIGRATED_KEY) === "1" && migration_is_done() === true, "mark_migration_done sets the flag and migration_is_done reads it");
  settings.set("imaginer.strip_metadata", "true");
  check(strip_option_is_on() === true, "strip_option_is_on reads the strip option");
  settings.set("imaginer.strip_metadata", "false");
  check(strip_option_is_on() === false, "strip_option_is_on is false when the option is off");
}

{
  const message = describe_migration_failures([
    { id: 12, filename: "third_1700000000_12.webp", message: "The image could not be converted: no decoder." },
    { id: 20, filename: "photo_1700000000_20.jpg", message: INVALID_RESULT_MESSAGE },
  ]);
  const lines = message.split("\n");
  check(lines[0] === "2 image(s) could not be converted and stay as they are:", "describe_migration_failures starts with the count");
  check(lines[1] === "third_1700000000_12.webp: The image could not be converted: no decoder." && lines[2] === `photo_1700000000_20.jpg: ${INVALID_RESULT_MESSAGE}`, "describe_migration_failures lists each file by its export filename with its message");
  check(lines[3] === EXPORT_AS_STORED_HINT, "describe_migration_failures ends with the export hint");
  check(describe_migration_failures([]) === "", "describe_migration_failures returns the empty string without failures");
}

if (failures.length > 0) {
  console.log("check failed: gallery_migration");
  for (const failure of failures) {
    console.log(`   ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log("gallery_migration check passed");
}
