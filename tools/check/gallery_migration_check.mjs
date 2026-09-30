// Executable specification of gallery_migration.js. Run from the repository root: node tools/check/gallery_migration_check.mjs

const settings = new Map();
globalThis.localStorage = {
  getItem: (key) => (settings.has(key) ? settings.get(key) : null),
  setItem: (key, value) => settings.set(key, String(value)),
};

const { GALLERY_FILES_MIGRATED_KEY, describe_migration_failures, find_records_to_migrate, mark_migration_done, migrate_blob, migrate_gallery, migration_is_done, needs_migration } = await import("../../gallery_migration.js");
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
const jpeg_blob = new Blob([Uint8Array.of(0xff, 0xd8, 0xff, 0xd9)], { type: "image/jpeg" });
const whole = write_PNG_chunks([IHDR, PLTE, tRNS, IDAT, IEND]);
const truncated_png = new Blob([whole.subarray(0, whole.length - 12)], { type: "image/png" });
const converted_png = png_blob([IHDR, PLTE, tRNS, IDAT, IEND]);

const conversions = [];
const converter_stub = async (blob) => {
  conversions.push(blob);
  return converted_png;
};

{
  check((await needs_migration(clean_png)) === false, "needs_migration is false for a clean PNG");
  check((await needs_migration(png_with_text)) === true, "needs_migration is true for a PNG with a tEXt chunk");
  check((await needs_migration(png_with_forms)) === true, "needs_migration is true for a PNG with the prompt forms");
  check((await needs_migration(jpeg_blob)) === true, "needs_migration is true for a JPEG");
  check((await needs_migration(truncated_png)) === true, "needs_migration is true for a truncated PNG");
}

{
  const records = [
    { id: 1, image_blob: clean_png },
    { id: 2, image_blob: png_with_text },
    { id: 3, prompt_text: "no blob" },
    { id: 4, image_blob: jpeg_blob },
  ];
  const candidates = await find_records_to_migrate(records);
  check(candidates.map((record) => record.id).join() === "2,4", "find_records_to_migrate keeps the order and skips clean PNGs and records without a blob");
}

{
  conversions.length = 0;
  const stripped = await migrate_blob(png_with_text, converter_stub);
  check((await chunk_types(stripped)).join() === "IHDR,PLTE,tRNS,IDAT,IEND" && conversions.length === 0, "migrate_blob strips a PNG without calling the converter");
  const from_jpeg = await migrate_blob(jpeg_blob, converter_stub);
  check(from_jpeg === converted_png && conversions.length === 1 && conversions[0] === jpeg_blob, "migrate_blob converts a JPEG");
  const from_truncated = await migrate_blob(truncated_png, converter_stub);
  check(from_truncated === converted_png && conversions.length === 2, "migrate_blob converts a truncated PNG");
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
    { id: 10, image_blob: png_with_forms },
    { id: 11, image_blob: jpeg_blob },
    { id: 12, image_blob: new Blob([encoder.encode("RIFF....WEBP")], { type: "image/webp" }) },
  ];
  const result = await migrate_gallery(records, store, { on_progress: (done, total) => progress.push(`${done}/${total}`), convert: failing_converter });
  check(result.migrated === 2, "migrate_gallery counts the records it wrote");
  check(updates.map((update) => update.id).join() === "10,11", "migrate_gallery writes the records that could be converted, in order");
  check(updates.every((update) => update.fields.image_blob instanceof Blob && update.fields.image_blob.type === "image/png"), "migrate_gallery writes a PNG blob into image_blob");
  check((await chunk_types(updates[0].fields.image_blob)).join() === "IHDR,PLTE,tRNS,IDAT,IEND", "the written PNG is clean");
  check(result.failures.length === 1 && result.failures[0].id === 12 && result.failures[0].message === "The image could not be converted: no decoder.", "a record whose conversion fails is reported with its id and message");
  check(progress.join() === "1/3,2/3,3/3", "progress is reported after every record");
}

{
  const updates = [];
  const store = { update: async (id, fields) => updates.push({ id, fields }) };
  const bad_converter = async () => new Blob([encoder.encode("not a png")], { type: "image/png" });
  const result = await migrate_gallery([{ id: 20, image_blob: jpeg_blob }], store, { convert: bad_converter });
  check(updates.length === 0 && result.migrated === 0, "a converted file that is not a valid PNG is not written");
  check(result.failures.length === 1 && result.failures[0].message === "The converted file is not a valid PNG.", "the invalid result is reported as such");
  const throwing_store = { update: async () => { throw new Error("QuotaExceededError"); } };
  const stored = await migrate_gallery([{ id: 21, image_blob: png_with_text }], throwing_store, {});
  check(stored.migrated === 0 && stored.failures.length === 1 && stored.failures[0].message === "QuotaExceededError", "a failing store write is reported and counted as not migrated");
}

{
  check(migration_is_done() === false, "migration_is_done is false without the flag");
  mark_migration_done();
  check(settings.get(GALLERY_FILES_MIGRATED_KEY) === "1" && migration_is_done() === true, "mark_migration_done sets the flag and migration_is_done reads it");
}

{
  const message = describe_migration_failures([
    { id: 12, message: "The image could not be converted: no decoder." },
    { id: 20, message: "The converted file is not a valid PNG." },
  ]);
  const lines = message.split("\n");
  check(lines[0] === "2 image(s) could not be converted and stay as they are:", "describe_migration_failures starts with the count");
  check(lines[1] === "Image 12: The image could not be converted: no decoder." && lines[2] === "Image 20: The converted file is not a valid PNG.", "describe_migration_failures lists each image by id with its message");
  check(lines[3] === "They can still be downloaded with Strip Server-Side metadata and both Embed prompt options turned off.", "describe_migration_failures ends with the way out");
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
