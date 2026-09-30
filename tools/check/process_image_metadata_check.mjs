// Executable specification of process_image_metadata.js. Run from the repository root: node tools/check/process_image_metadata_check.mjs

const settings = new Map();
globalThis.localStorage = {
  getItem: (key) => (settings.has(key) ? settings.get(key) : null),
  setItem: (key, value) => settings.set(key, String(value)),
};
const warnings = [];
console.warn = (...parts) => warnings.push(parts.join(" "));

const { process_image_metadata } = await import("../../process_image_metadata.js");
const { PROMPT_KEYWORD, XMP_KEYWORD, build_XMP_packet, is_XMP_form, read_PNG_chunks, write_PNG_chunks } = await import("../../PNG_chunks.js");

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

function iTXt_text(chunk) {
  let position = chunk.data.indexOf(0) + 3;
  position = chunk.data.indexOf(0, position) + 1;
  position = chunk.data.indexOf(0, position) + 1;
  return decoder.decode(chunk.data.subarray(position));
}

async function bytes_of(blob) {
  return new Uint8Array(await blob.arrayBuffer());
}

async function chunks_of(blob) {
  return read_PNG_chunks(await bytes_of(blob));
}

async function forms_in(blob) {
  const chunks = (await chunks_of(blob)).filter((chunk) => chunk.type === "iTXt");
  return {
    prompt: chunks.filter((chunk) => iTXt_keyword(chunk) === PROMPT_KEYWORD),
    xmp: chunks.filter((chunk) => iTXt_keyword(chunk) === XMP_KEYWORD),
  };
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
const foreign_packet = '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator><rdf:Seq><rdf:li>Some Photographer</rdf:li></rdf:Seq></dc:creator></rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>';
const foreign_xmp = { type: "iTXt", data: iTXt_data(XMP_KEYWORD, encoder.encode(foreign_packet)) };
const imaginer_prompt = { type: "iTXt", data: iTXt_data(PROMPT_KEYWORD, encoder.encode("stored prompt")) };
const imaginer_xmp = { type: "iTXt", data: iTXt_data(XMP_KEYWORD, encoder.encode(build_XMP_packet("stored prompt"))) };

const png_blob = (chunks) => new Blob([write_PNG_chunks(chunks)], { type: "image/png" });
const palette_with_text = png_blob([IHDR, tEXt, PLTE, tRNS, IDAT, IEND]);

{
  configure({ strip: true, iTXt: true, XMP: true });
  const result = await process_image_metadata(palette_with_text, "the prompt", {});
  check(result.type === "image/png", "the result is a PNG blob");
  check((await chunks_of(result)).map((chunk) => chunk.type).join() === "IHDR,PLTE,tRNS,iTXt,iTXt,IDAT,IEND", "strip on keeps PLTE and tRNS, removes tEXt, and writes both forms before IDAT");
}

{
  configure({ strip: false, iTXt: true, XMP: true });
  const once = await process_image_metadata(palette_with_text, "the prompt", {});
  const twice = await process_image_metadata(once, "the prompt", {});
  const forms = await forms_in(twice);
  check(forms.prompt.length === 1 && forms.xmp.length === 1, "strip off with both prompt options on, applied twice, leaves one chunk per form");
  check((await chunks_of(twice)).some((chunk) => chunk.type === "tEXt"), "strip off keeps the tEXt chunk");
}

{
  configure({ strip: true, iTXt: true, XMP: true });
  const result = await process_image_metadata(palette_with_text, "", {});
  check((await chunks_of(result)).map((chunk) => chunk.type).join() === "IHDR,PLTE,tRNS,IDAT,IEND", "an empty prompt with strip on gives exactly the five pixel chunk types");
  configure({ strip: false, iTXt: true, XMP: true });
  const unstripped = await process_image_metadata(palette_with_text, "", {});
  const forms = await forms_in(unstripped);
  check(forms.prompt.length === 0 && forms.xmp.length === 0, "an empty prompt writes no form");
}

{
  configure({ strip: false, iTXt: false, XMP: false });
  const stored = png_blob([IHDR, PLTE, tRNS, imaginer_prompt, imaginer_xmp, foreign_xmp, IDAT, IEND]);
  const result = await process_image_metadata(stored, "the prompt", {});
  const forms = await forms_in(result);
  check(forms.prompt.length === 0, "both prompt options off removes the stored iTXt form");
  check(forms.xmp.length === 1 && iTXt_text(forms.xmp[0]) === foreign_packet, "both prompt options off removes the stored XMP form and keeps the foreign XMP chunk");
}

{
  configure({ strip: false, iTXt: false, XMP: false });
  const stored = png_blob([IHDR, PLTE, tRNS, foreign_xmp, IDAT, IEND]);
  const result = await process_image_metadata(stored, "the prompt", { embed_itxt: false, embed_xmp: true });
  const forms = await forms_in(result);
  check(forms.xmp.length === 1 && is_XMP_form(iTXt_text(forms.xmp[0])), "embed_options override the stored options, and the written XMP form replaces the foreign XMP chunk");
}

{
  configure({ strip: true, iTXt: true, XMP: true });
  warnings.length = 0;
  const not_png = new Blob([encoder.encode("not a png at all")], { type: "image/jpeg" });
  const result = await process_image_metadata(not_png, "the prompt", {});
  check(result === not_png, "a blob that is not a PNG comes back unchanged");
  check(warnings.length === 1 && warnings[0].startsWith("Failed to strip PNG metadata:"), "a failed strip is logged with console.warn");
}

{
  configure({ strip: true, iTXt: true, XMP: true });
  warnings.length = 0;
  const without_idat = png_blob([IHDR, tEXt, IEND]);
  const result = await process_image_metadata(without_idat, "the prompt", {});
  check((await chunks_of(result)).map((chunk) => chunk.type).join() === "IHDR,IEND", "when strip succeeds and writing the forms fails, the stripped bytes come back");
  check(warnings.length === 1 && warnings[0].startsWith("Failed to write the prompt into the PNG:"), "a failed write is logged with console.warn");
}

if (failures.length > 0) {
  console.log("check failed: process_image_metadata");
  for (const failure of failures) {
    console.log(`   ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log("process_image_metadata check passed");
}
