// Executable specification of image_export.js. Run from the repository root: node tools/check/image_export_check.mjs

const settings = new Map();
globalThis.localStorage = {
  getItem: (key) => (settings.has(key) ? settings.get(key) : null),
  setItem: (key, value) => settings.set(key, String(value)),
};

const { EXPORT_AS_STORED_HINT, collect_ZIP_entries, describe_export_failures, export_filename, export_image } = await import("../../image_export.js");
const { PROMPT_KEYWORD, XMP_KEYWORD, build_XMP_packet, read_PNG_chunks, read_PNG_prompt, write_PNG_chunks } = await import("../../PNG_chunks.js");

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

async function bytes_of(blob) {
  return new Uint8Array(await blob.arrayBuffer());
}

async function chunk_types(blob) {
  return read_PNG_chunks(await bytes_of(blob)).map((chunk) => chunk.type);
}

async function forms_in(blob) {
  const chunks = read_PNG_chunks(await bytes_of(blob)).filter((chunk) => chunk.type === "iTXt");
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

const png_blob = (chunks, type = "image/png") => new Blob([write_PNG_chunks(chunks)], { type });
const palette_with_text = png_blob([IHDR, tEXt, PLTE, tRNS, IDAT, IEND]);
const with_stored_forms = png_blob([IHDR, tEXt, PLTE, tRNS, stored_prompt, stored_xmp, IDAT, IEND]);
const jpeg_blob = new Blob([Uint8Array.of(0xff, 0xd8, 0xff, 0xd9)], { type: "image/jpeg" });
const webp_blob = new Blob([encoder.encode("RIFF....WEBP")], { type: "image/webp" });
const corrupt_blob = new Blob([encoder.encode("not a png at all")], { type: "image/png" });
const record = (id, prompt_text, image_blob) => ({ id, created: 1700000000, prompt_text, image_blob });

{
  configure({ strip: true, iTXt: true, XMP: true });
  const entry = await export_image(record(7, "a unicorn dinosaur", palette_with_text));
  check(entry.filename === "a_unicorn_dinosaur_1700000000_7.png", "export_image names a PNG record <prompt>_<created>_<id>.png");
  check(export_filename(record(7, "a unicorn dinosaur", palette_with_text)) === entry.filename, "export_filename gives the entry's filename");
  check(entry.blob.type === "image/png", "export_image returns a PNG blob for a PNG record");
  check((await chunk_types(entry.blob)).join() === "IHDR,PLTE,tRNS,iTXt,iTXt,IDAT,IEND", "strip on keeps PLTE and tRNS, removes tEXt, and both forms are written before IDAT");
  check((await read_PNG_prompt(await bytes_of(entry.blob))) === "a unicorn dinosaur", "the written forms carry the record's prompt");
}

{
  configure({ strip: true, iTXt: false, XMP: false });
  const entry = await export_image(record(8, "a unicorn dinosaur", with_stored_forms));
  check((await chunk_types(entry.blob)).join() === "IHDR,PLTE,tRNS,IDAT,IEND", "strip on with both prompt options off gives exactly the five pixel chunk types");
}

{
  configure({ strip: false, iTXt: true, XMP: false });
  const only_iTXt = await forms_in((await export_image(record(9, "new prompt", with_stored_forms))).blob);
  check(only_iTXt.prompt.length === 1 && only_iTXt.xmp.length === 0, "only the iTXt option on writes exactly one prompt_text chunk and no XMP chunk");
  configure({ strip: false, iTXt: false, XMP: true });
  const only_XMP = await forms_in((await export_image(record(9, "new prompt", with_stored_forms))).blob);
  check(only_XMP.prompt.length === 0 && only_XMP.xmp.length === 1, "only the XMP option on writes exactly one XMP chunk and no prompt_text chunk");
}

{
  configure({ strip: false, iTXt: true, XMP: true });
  const entry = await export_image(record(10, "new prompt", with_stored_forms));
  const forms = await forms_in(entry.blob);
  check((await chunk_types(entry.blob)).includes("tEXt"), "strip off keeps the tEXt chunk");
  check(forms.prompt.length === 1 && forms.xmp.length === 1, "strip off with both prompt options on replaces the stored forms with one chunk per form");
  check((await read_PNG_prompt(await bytes_of(entry.blob))) === "new prompt", "the replaced forms carry the record's prompt");
}

{
  configure({ strip: false, iTXt: false, XMP: false });
  const entry = await export_image(record(11, "a unicorn dinosaur", with_stored_forms));
  check(entry.blob === with_stored_forms, "strip off with both prompt options off returns the stored blob itself");
  check(entry.filename === "a_unicorn_dinosaur_1700000000_11.png", "the unparsed PNG keeps the png extension");
  const corrupt_entry = await export_image(record(12, "broken", corrupt_blob));
  check(corrupt_entry.blob === corrupt_blob, "strip off with both prompt options off does not parse the file");
}

{
  configure({ strip: true, iTXt: true, XMP: true });
  const entry = await export_image({ id: 13, created: 1700000000, image_blob: palette_with_text });
  check(entry.filename === "image_1700000000_13.png", "a record without a prompt is named image_<created>_<id>.png");
  const forms = await forms_in(entry.blob);
  check(forms.prompt.length === 0 && forms.xmp.length === 0, "a record without a prompt gets no form");
}

{
  configure({ strip: false, iTXt: false, XMP: false });
  const jpeg_entry = await export_image(record(14, "photo", jpeg_blob));
  check(jpeg_entry.blob === jpeg_blob && jpeg_entry.filename === "photo_1700000000_14.jpg", "with every option off a JPEG record exports as the stored blob itself, named with the extension jpg");
  const webp_entry = await export_image(record(15, "photo", webp_blob));
  check(webp_entry.blob === webp_blob && webp_entry.filename === "photo_1700000000_15.webp", "with every option off a WebP record exports as the stored blob itself, named with the extension webp");
  configure({ strip: true, iTXt: false, XMP: false });
  const with_strip = await rejection_of(() => export_image(record(14, "photo", jpeg_blob)));
  check(with_strip instanceof Error && with_strip.message === "The file is not a PNG and cannot be processed.", "with the strip option on a JPEG record cannot leave");
  configure({ strip: false, iTXt: true, XMP: false });
  const with_form = await rejection_of(() => export_image(record(15, "photo", webp_blob)));
  check(with_form instanceof Error && with_form.message === "The file is not a PNG and cannot be processed.", "with a prompt option on a WebP record cannot leave");
}

{
  configure({ strip: true, iTXt: true, XMP: true });
  const with_strip = await rejection_of(() => export_image(record(16, "broken", corrupt_blob)));
  check(with_strip instanceof Error && with_strip.message === "Not a PNG file.", "export_image of a corrupt record rejects with Not a PNG file. when strip is on");
  configure({ strip: false, iTXt: true, XMP: false });
  const with_form = await rejection_of(() => export_image(record(16, "broken", corrupt_blob)));
  check(with_form instanceof Error && with_form.message === "Not a PNG file.", "export_image of a corrupt record rejects with Not a PNG file. when a prompt option is on");
}

{
  configure({ strip: true, iTXt: true, XMP: true });
  const entry = await export_image(record(17, "untyped", png_blob([IHDR, tEXt, PLTE, tRNS, IDAT, IEND], "")));
  check(entry.filename === "untyped_1700000000_17.png", "a PNG record whose blob has an empty type is named .png");
  check((await chunk_types(entry.blob)).join() === "IHDR,PLTE,tRNS,iTXt,iTXt,IDAT,IEND", "a PNG record whose blob has an empty type is processed");
}

{
  configure({ strip: true, iTXt: true, XMP: true });
  const progress = [];
  const records = [
    record(1, "good", palette_with_text),
    record(2, "broken", corrupt_blob),
    record(3, "photo", jpeg_blob),
    { id: 4, created: 1700000000, prompt_text: "no blob" },
  ];
  const result = await collect_ZIP_entries(records, (done, total) => progress.push(`${done}/${total}`));
  check(result.entries.map((entry) => entry.filename).join() === "good_1700000000_1.png", "collect_ZIP_entries returns the entries of the records that could be exported, in order");
  check(result.failures.map((failure) => `${failure.filename}: ${failure.message}`).join("|") === "broken_1700000000_2.png: Not a PNG file.|photo_1700000000_3.jpg: The file is not a PNG and cannot be processed.", "the failures name the filename and the message, the JPEG among them while the strip option is on");
  check(progress.join() === "1/3,2/3,3/3", "progress is reported after every record with a blob");
  const without_progress = await collect_ZIP_entries(records);
  check(without_progress.entries.length === 1, "collect_ZIP_entries works without a progress callback");
}

{
  configure({ strip: true, iTXt: true, XMP: true });
  const first = await export_image(record(21, "same prompt", palette_with_text));
  const second = await export_image(record(22, "same prompt", palette_with_text));
  check(first.filename !== second.filename, "two records with the same prompt and timestamp get different filenames");
}

{
  const message = describe_export_failures([
    { filename: "broken_1700000000_2.png", message: "Not a PNG file." },
    { filename: "other_1700000000_5.png", message: "Truncated PNG chunk." },
  ]);
  const lines = message.split("\n");
  check(lines[0] === "2 image(s) could not be exported and stay in the gallery:", "describe_export_failures starts with the count");
  check(lines[1] === "broken_1700000000_2.png: Not a PNG file." && lines[2] === "other_1700000000_5.png: Truncated PNG chunk.", "describe_export_failures lists every filename with its message, one per line");
  check(typeof EXPORT_AS_STORED_HINT === "string" && EXPORT_AS_STORED_HINT.length > 0 && lines[3] === EXPORT_AS_STORED_HINT, "describe_export_failures ends with the hint");
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
