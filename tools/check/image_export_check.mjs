// Executable specification of image_export.js. Run from the repository root: node tools/check/image_export_check.mjs

const settings = new Map();
globalThis.localStorage = {
  getItem: (key) => (settings.has(key) ? settings.get(key) : null),
  setItem: (key, value) => settings.set(key, String(value)),
};

const { collect_ZIP_entries, describe_export_failures, export_image } = await import("../../image_export.js");
const { PROMPT_KEYWORD, XMP_KEYWORD, build_XMP_packet, read_PNG_chunks, write_PNG_chunks } = await import("../../PNG_chunks.js");

const failures = [];
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { ignoreBOM: true });

function check(condition, description) {
  if (!condition) failures.push(description);
}

function configure({ strip, iTXt, XMP }) {
  settings.set("imaginer.strip_metadata", String(strip));
  settings.set("imaginer.add_prompt_to_image", String(iTXt));
  settings.set("imaginer.add_prompt_to_image_xmp", String(XMP));
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

function iTXt_keyword(chunk) {
  return decoder.decode(chunk.data.subarray(0, chunk.data.indexOf(0)));
}

async function chunk_types(blob) {
  return read_PNG_chunks(new Uint8Array(await blob.arrayBuffer())).map((chunk) => chunk.type);
}

async function forms_in(blob) {
  const chunks = read_PNG_chunks(new Uint8Array(await blob.arrayBuffer())).filter((chunk) => chunk.type === "iTXt");
  return {
    prompt: chunks.filter((chunk) => iTXt_keyword(chunk) === PROMPT_KEYWORD),
    xmp: chunks.filter((chunk) => iTXt_keyword(chunk) === XMP_KEYWORD),
  };
}

async function deflate(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function rejection_of(action) {
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
const stored_prompt = { type: "iTXt", data: iTXt_data(PROMPT_KEYWORD, encoder.encode("stored prompt")) };
const stored_xmp = { type: "iTXt", data: iTXt_data(XMP_KEYWORD, encoder.encode(build_XMP_packet("stored prompt"))) };

const png_blob = (chunks) => new Blob([write_PNG_chunks(chunks)], { type: "image/png" });
const palette_with_text = png_blob([IHDR, tEXt, PLTE, tRNS, IDAT, IEND]);
const with_stored_forms = png_blob([IHDR, tEXt, PLTE, tRNS, stored_prompt, stored_xmp, IDAT, IEND]);
const jpeg_blob = new Blob([Uint8Array.of(0xff, 0xd8, 0xff, 0xd9)], { type: "image/jpeg" });
const corrupt_blob = new Blob([encoder.encode("not a png at all")], { type: "image/png" });

{
  configure({ strip: true, iTXt: true, XMP: true });
  const entry = await export_image({ id: 7, created: 1700000000, prompt_text: "a unicorn dinosaur", image_blob: palette_with_text });
  check(entry.filename === "a_unicorn_dinosaur_1700000000_7.png", "export_image names a PNG record <prompt>_<created>_<id>.png");
  check(entry.blob.type === "image/png", "export_image returns a PNG blob for a PNG record");
  check((await chunk_types(entry.blob)).join() === "IHDR,PLTE,tRNS,iTXt,iTXt,IDAT,IEND", "strip on keeps PLTE and tRNS, removes tEXt, and both forms are written before IDAT");
}

{
  configure({ strip: false, iTXt: false, XMP: false });
  const entry = await export_image({ id: 8, created: 1700000000, prompt_text: "a unicorn dinosaur", image_blob: with_stored_forms });
  const types = await chunk_types(entry.blob);
  const forms = await forms_in(entry.blob);
  check(types.includes("tEXt"), "strip off keeps the tEXt chunk");
  check(forms.prompt.length === 0 && forms.xmp.length === 0, "both prompt options off removes the stored forms");
}

{
  configure({ strip: true, iTXt: true, XMP: true });
  const entry = await export_image({ id: 9, created: 1700000000, image_blob: palette_with_text });
  check(entry.filename === "image_1700000000_9.png", "a record without a prompt is named image_<created>_<id>.png");
  const forms = await forms_in(entry.blob);
  check(forms.prompt.length === 0 && forms.xmp.length === 0, "a record without a prompt gets no form");
}

{
  configure({ strip: true, iTXt: true, XMP: true });
  const entry = await export_image({ id: 10, created: 1700000000, prompt_text: "photo", image_blob: jpeg_blob });
  check(entry.blob === jpeg_blob, "a JPEG record exports as the stored blob itself");
  check(entry.filename === "photo_1700000000_10.jpg", "a JPEG record is named with the extension jpg");
}

{
  configure({ strip: true, iTXt: true, XMP: true });
  const error = await rejection_of(() => export_image({ id: 11, created: 1700000000, prompt_text: "broken", image_blob: corrupt_blob }));
  check(error instanceof Error && error.message === "Not a PNG file.", "export_image of a corrupt record rejects with Not a PNG file.");
}

{
  configure({ strip: true, iTXt: true, XMP: true });
  const progress = [];
  const records = [
    { id: 1, created: 1700000000, prompt_text: "good", image_blob: palette_with_text },
    { id: 2, created: 1700000000, prompt_text: "broken", image_blob: corrupt_blob },
    { id: 3, created: 1700000000, prompt_text: "photo", image_blob: jpeg_blob },
    { id: 4, created: 1700000000, prompt_text: "no blob" },
  ];
  const result = await collect_ZIP_entries(records, (done, total) => progress.push(`${done}/${total}`));
  check(result.entries.length === 3, "collect_ZIP_entries returns one entry per record with a blob");
  check(result.entries.map((entry) => entry.filename).join() === "good_1700000000_1.png,broken_1700000000_2.png,photo_1700000000_3.jpg", "collect_ZIP_entries keeps the record order and the filenames");
  check(result.entries[1].blob === corrupt_blob, "a record that cannot be processed goes in as stored");
  check(result.failures.length === 1 && result.failures[0].filename === "broken_1700000000_2.png" && result.failures[0].message === "Not a PNG file.", "the failure names the filename and the message");
  check(progress.join() === "1/3,2/3,3/3", "progress is reported after every exportable record");
  const without_progress = await collect_ZIP_entries(records);
  check(without_progress.entries.length === 3, "collect_ZIP_entries works without a progress callback");
}

{
  configure({ strip: true, iTXt: true, XMP: true });
  const first = await export_image({ id: 21, created: 1700000000, prompt_text: "same prompt", image_blob: palette_with_text });
  const second = await export_image({ id: 22, created: 1700000000, prompt_text: "same prompt", image_blob: palette_with_text });
  check(first.filename !== second.filename, "two records with the same prompt and timestamp get different filenames");
}

{
  const message = describe_export_failures([
    { filename: "broken_1700000000_2.png", message: "Not a PNG file." },
    { filename: "other_1700000000_5.png", message: "Truncated PNG chunk." },
  ]);
  check(message.startsWith("2 image(s) could not be processed and were exported as stored:"), "describe_export_failures starts with the count");
  check(message.includes("broken_1700000000_2.png: Not a PNG file.") && message.includes("other_1700000000_5.png: Truncated PNG chunk."), "describe_export_failures lists every filename with its message");
  check(describe_export_failures([]) === "", "describe_export_failures returns the empty string without failures");
}

if (failures.length > 0) {
  console.log("check failed: image_export");
  for (const failure of failures) {
    console.log(`   ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log("image_export check passed");
}
