// Executable specification of image_intake.js and of the Node-visible part of image_conversion.js. Run from the repository root: node tools/check/image_intake_check.mjs

const settings = new Map();
globalThis.localStorage = {
  getItem: (key) => (settings.has(key) ? settings.get(key) : null),
  setItem: (key, value) => settings.set(key, String(value)),
};
// The readability check decodes with createImageBitmap, which Node does not have; the stub accepts every file, so the checks below stay about intake, not about decoding.
globalThis.createImageBitmap = async () => ({ close() {} });

const { CONVERSION_UNSUPPORTED_MESSAGE, apply_rotation_and_flip, can_convert_images, convert_to_PNG, pixels_only_PNG } = await import("../../image_conversion.js");
const test_page_tools = await import("../browser_tests/png_test_tools.js");
const { accept_model_output, describe_import_failures, intake_import, intake_model_output, read_import_prompt } = await import("../../image_intake.js");
const { PROMPT_KEYWORD, XMP_KEYWORD, build_XMP_packet, read_PNG_chunks, read_PNG_prompt, write_PNG_chunks } = await import("../../PNG_chunks.js");

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

function uint16_big_endian(value) {
  return Uint8Array.of((value >>> 8) & 0xff, value & 0xff);
}

async function bytes_of(blob) {
  return new Uint8Array(await blob.arrayBuffer());
}

async function chunk_types(blob) {
  return read_PNG_chunks(await bytes_of(blob)).map((chunk) => chunk.type);
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
const stored_prompt = { type: "iTXt", data: iTXt_data(PROMPT_KEYWORD, encoder.encode("a stored prompt")) };
const stored_xmp = { type: "iTXt", data: iTXt_data(XMP_KEYWORD, encoder.encode(build_XMP_packet("a stored prompt"))) };

const png_file = (chunks, name = "image.png", type = "image/png") => new File([write_PNG_chunks(chunks)], name, { type });
const packet = '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:description><rdf:Alt><rdf:li xml:lang="x-default">Tom &amp; Jerry</rdf:li></rdf:Alt></dc:description></rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>';

function jpeg_bytes_with_xmp(packet_text) {
  const payload = concat_bytes([encoder.encode("http://ns.adobe.com/xap/1.0/\0"), encoder.encode(packet_text)]);
  const segment = concat_bytes([Uint8Array.of(0xff, 0xe1), uint16_big_endian(payload.length + 2), payload]);
  return concat_bytes([Uint8Array.of(0xff, 0xd8), segment, Uint8Array.of(0xff, 0xda, 0x00, 0x02)]);
}

const converted_png = new Blob([write_PNG_chunks([IHDR, PLTE, tRNS, IDAT, IEND])], { type: "image/png" });
const conversions = [];
const converter_stub = async (file) => {
  conversions.push(file);
  return converted_png;
};

{
  check(can_convert_images() === false, "can_convert_images is false under Node, which has no VideoFrame");
  const error = await rejection_of(() => convert_to_PNG(converted_png));
  check(error instanceof Error && error.message === CONVERSION_UNSUPPORTED_MESSAGE, "convert_to_PNG rejects with the unsupported message when VideoFrame is missing");
  check(typeof CONVERSION_UNSUPPORTED_MESSAGE === "string" && CONVERSION_UNSUPPORTED_MESSAGE.includes("https"), "the unsupported message names the secure context");
}

{
  const file = png_file([IHDR, tEXt, PLTE, tRNS, stored_prompt, stored_xmp, IDAT, IEND], "with_forms.png");
  const result = await intake_import(file, converter_stub);
  check(result.image_blob.type === "image/png", "intake_import returns a PNG blob for a PNG");
  check((await chunk_types(result.image_blob)).join() === "IHDR,PLTE,tRNS,IDAT,IEND", "intake_import strips a PNG to its pixel chunks, forms included");
  check(result.prompt_text === "a stored prompt", "intake_import reads the prompt from the forms before stripping");
  check((await read_PNG_prompt(await bytes_of(result.image_blob))) === "", "the stored PNG carries no prompt form");
  check(conversions.length === 0, "a PNG is not converted");
}

{
  const result = await intake_import(png_file([IHDR, PLTE, tRNS, IDAT, IEND], "plain.png"), converter_stub);
  check(result.prompt_text === "", "intake_import of a PNG without a prompt returns the empty prompt");
}

{
  conversions.length = 0;
  const file = new File([jpeg_bytes_with_xmp(packet)], "photo.jpg", { type: "image/jpeg" });
  const result = await intake_import(file, converter_stub);
  check(result.image_blob === converted_png, "intake_import of a JPEG returns the converter's PNG");
  check(conversions.length === 1 && conversions[0] === file, "the converter received the JPEG file");
  check(result.prompt_text === "Tom & Jerry", "intake_import reads and decodes the JPEG's XMP description");
}

{
  conversions.length = 0;
  const renamed = new File([jpeg_bytes_with_xmp(packet)], "renamed.png", { type: "image/png" });
  const result = await intake_import(renamed, converter_stub);
  check(conversions.length === 1 && result.image_blob === converted_png, "a file typed image/png whose bytes are a JPEG goes through the converter");
  check(result.prompt_text === "Tom & Jerry", "the prompt of a renamed JPEG is read from its JPEG metadata");
}

{
  conversions.length = 0;
  const whole = write_PNG_chunks([IHDR, PLTE, tRNS, stored_prompt, IDAT, IEND]);
  const truncated = new File([whole.subarray(0, whole.length - 12)], "cut.png", { type: "image/png" });
  const result = await intake_import(truncated, converter_stub);
  check(conversions.length === 1 && result.image_blob === converted_png, "a PNG whose IEND is cut off goes through the converter");
  check(result.prompt_text === "a stored prompt", "the prompt read before the cut is kept");
}

{
  conversions.length = 0;
  const hostile = new File([Uint8Array.of(0xff, 0xd8, 0xff, 0xe0)], "hostile.jpg", { type: "image/jpeg" });
  const result = await intake_import(hostile, converter_stub);
  check(result.prompt_text === "" && result.image_blob === converted_png, "a JPEG whose bytes make the reader throw imports with the empty prompt");
}

{
  const gif = new File([encoder.encode("GIF89a")], "animation.gif", { type: "image/gif" });
  const error = await rejection_of(() => intake_import(gif, converter_stub));
  check(error instanceof Error && error.message.includes("not a supported format"), "intake_import rejects an unsupported type with the validation message");
}

{
  const bytes = write_PNG_chunks([IHDR, stored_prompt, IDAT, IEND]);
  check((await read_import_prompt(new Blob([bytes], { type: "image/png" }), bytes)) === "a stored prompt", "read_import_prompt reads a PNG by its bytes");
  const jpeg = jpeg_bytes_with_xmp(packet);
  check((await read_import_prompt(new Blob([jpeg], { type: "" }), jpeg)) === "Tom & Jerry", "read_import_prompt reads a JPEG without a type by its bytes");
  const hostile = Uint8Array.of(0xff, 0xd8, 0xff, 0xe0);
  check((await read_import_prompt(new Blob([hostile], { type: "image/jpeg" }), hostile)) === "", "read_import_prompt returns the empty string when a reader throws");
}

{
  const model_output = new Blob([write_PNG_chunks([IHDR, tEXt, PLTE, tRNS, IDAT, IEND])], { type: "image/png" });
  settings.set("imaginer.strip_metadata", "true");
  const stripped = await intake_model_output(model_output);
  check((await chunk_types(stripped)).join() === "IHDR,PLTE,tRNS,IDAT,IEND", "intake_model_output with the strip option on keeps exactly the pixel chunks");
  check((await read_PNG_prompt(await bytes_of(stripped))) === "", "intake_model_output writes no form");
  settings.set("imaginer.strip_metadata", "false");
  const kept = await intake_model_output(model_output);
  check(kept === model_output, "intake_model_output with the strip option off returns the blob itself");
  settings.set("imaginer.strip_metadata", "true");
  const error = await rejection_of(() => intake_model_output(new Blob([encoder.encode("not a png")], { type: "image/png" })));
  check(error instanceof Error && error.message === "Not a PNG file.", "intake_model_output with the strip option on rejects bytes that are not a PNG");
}

{
  settings.set("imaginer.strip_metadata", "true");
  const not_png = new Blob([encoder.encode("not a png")], { type: "image/png" });
  const kept = await accept_model_output(not_png);
  check(kept.image_blob === not_png && kept.failure === "Not a PNG file.", "accept_model_output keeps the blob and reports the failure when strip fails");
  const model_output = new Blob([write_PNG_chunks([IHDR, tEXt, PLTE, tRNS, IDAT, IEND])], { type: "image/png" });
  const accepted = await accept_model_output(model_output);
  check(accepted.failure === null && (await chunk_types(accepted.image_blob)).join() === "IHDR,PLTE,tRNS,IDAT,IEND", "accept_model_output returns the stripped PNG and no failure");
}

{
  conversions.length = 0;
  const dirty = new Blob([write_PNG_chunks([IHDR, tEXt, PLTE, tRNS, stored_prompt, stored_xmp, IDAT, IEND])], { type: "image/png" });
  const cleaned = await pixels_only_PNG(dirty, converter_stub);
  check((await chunk_types(cleaned)).join() === "IHDR,PLTE,tRNS,IDAT,IEND" && conversions.length === 0, "pixels_only_PNG reduces a PNG to its pixel chunks without calling the converter");
  const whole = write_PNG_chunks([IHDR, PLTE, tRNS, IDAT, IEND]);
  const truncated = new Blob([whole.subarray(0, whole.length - 12)], { type: "image/png" });
  check((await pixels_only_PNG(truncated, converter_stub)) === converted_png && conversions.length === 1, "pixels_only_PNG converts a truncated PNG");
  const jpeg = new Blob([jpeg_bytes_with_xmp(packet)], { type: "image/jpeg" });
  check((await pixels_only_PNG(jpeg, converter_stub)) === converted_png && conversions.length === 2, "pixels_only_PNG converts a JPEG");
}

{
  const described = describe_import_failures([
    { name: "a.gif", message: '"a.gif" is not a supported format — use PNG, WEBP, or JPEG.' },
    { name: "b.png", message: "Not a PNG file." },
  ]);
  check(described.message === "2 file(s) could not be imported.", "describe_import_failures names the count");
  check(described.details === '"a.gif" is not a supported format — use PNG, WEBP, or JPEG.\nb.png: Not a PNG file.', "describe_import_failures keeps a message that starts with the quoted name and prefixes the others");
}

{
  // The pairs of EXIF orientation, frame rotation and frame flip, as measured in Chromium; the planning file holds the measurement.
  const measured_frame_orientations = [
    [1, 0, false],
    [2, 0, true],
    [3, 180, false],
    [4, 180, true],
    [5, 90, true],
    [6, 90, false],
    [7, 270, true],
    [8, 270, false],
  ];
  const width = 3;
  const height = 2;
  const stored = { width, height, rgba: Uint8Array.from({ length: width * height * 4 }, (unused, index) => index + 1) };
  const unaligned_bytes = new Uint8Array(stored.rgba.length + 1);
  unaligned_bytes.set(stored.rgba, 1);
  const stored_unaligned = { width, height, rgba: unaligned_bytes.subarray(1) };
  const same_pixels = (first, second) => first.width === second.width && first.height === second.height && first.rgba.length === second.rgba.length && first.rgba.every((value, index) => value === second.rgba[index]);
  const implementations = [
    ["the app", apply_rotation_and_flip],
    ["the test page", test_page_tools.apply_rotation_and_flip],
  ];
  for (const [owner, transform] of implementations) {
    for (const [orientation, rotation, flip] of measured_frame_orientations) {
      const expected = test_page_tools.apply_exif_orientation(stored, orientation);
      check(same_pixels(transform(stored, rotation, flip), expected), `the transform of ${owner} with rotation ${rotation} and flip ${flip} shows EXIF orientation ${orientation}`);
      check(same_pixels(transform(stored_unaligned, rotation, flip), expected), `the transform of ${owner} with rotation ${rotation} and flip ${flip} gives the same pixels from an unaligned array`);
    }
    check(transform(stored, 0, false) === stored, `the transform of ${owner} returns its input without rotation and flip`);
    const error = await rejection_of(() => transform(stored, 45, false));
    check(error instanceof Error && error.message.includes("rotation 45"), `the transform of ${owner} rejects a rotation other than 0, 90, 180 and 270`);
  }
}

if (failures.length > 0) {
  console.log("check failed: image_intake");
  for (const failure of failures) {
    console.log(`   ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log("image_intake check passed");
}
