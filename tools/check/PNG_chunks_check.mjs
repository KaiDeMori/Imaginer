// Executable specification of PNG_chunks.js and XML_entities.js. Run from the repository root: node tools/check/PNG_chunks_check.mjs

import { decode_XML_entities, escape_XML } from "../../XML_entities.js";
import {
  PIXEL_CHUNK_TYPES,
  PNG_SIGNATURE,
  PROMPT_KEYWORD,
  XMP_KEYWORD,
  build_XMP_packet,
  crc32,
  encode_PNG_RGBA,
  is_PNG,
  is_XMP_form,
  read_PNG_chunks,
  read_PNG_prompt,
  strip_PNG,
  write_PNG_chunks,
  write_PNG_prompt,
} from "../../PNG_chunks.js";

const failures = [];
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { ignoreBOM: true });

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

function bytes_equal(first, second) {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

function types_of(bytes) {
  return read_PNG_chunks(bytes).map((chunk) => chunk.type);
}

function iTXt_data(keyword, text_bytes, compressed) {
  return concat_bytes([encoder.encode(keyword), Uint8Array.of(0, compressed ? 1 : 0, 0, 0, 0), text_bytes]);
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

function forms_in(bytes) {
  const chunks = read_PNG_chunks(bytes).filter((chunk) => chunk.type === "iTXt");
  return {
    prompt: chunks.filter((chunk) => iTXt_keyword(chunk) === PROMPT_KEYWORD),
    xmp: chunks.filter((chunk) => iTXt_keyword(chunk) === XMP_KEYWORD),
  };
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
const IDAT_second = { type: "IDAT", data: Uint8Array.of(1, 2, 3) };
const IEND = { type: "IEND", data: new Uint8Array(0) };
const tEXt = { type: "tEXt", data: encoder.encode("Comment\0made by a test") };
const eXIf = { type: "eXIf", data: encoder.encode("MM\0*\0\0\0\b") };
const acTL = { type: "acTL", data: Uint8Array.of(0, 0, 0, 2, 0, 0, 0, 0) };
const prompt_chunk = (text_bytes, compressed = false) => ({ type: "iTXt", data: iTXt_data(PROMPT_KEYWORD, text_bytes, compressed) });
const xmp_chunk = (packet) => ({ type: "iTXt", data: iTXt_data(XMP_KEYWORD, encoder.encode(packet), false) });

const foreign_packet = '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator><rdf:Seq><rdf:li>Some Photographer</rdf:li></rdf:Seq></dc:creator><dc:description><rdf:Alt><rdf:li xml:lang="x-default">Tom &amp; Jerry&#39;s &#x263A;</rdf:li></rdf:Alt></dc:description></rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>';
const empty_description_packet = '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:description/><dc:title><rdf:Alt><rdf:li xml:lang="x-default">Not the prompt</rdf:li></rdf:Alt></dc:title></rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>';
const old_style_packet = [
  '<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>',
  '      <x:xmpmeta xmlns:x="adobe:ns:meta/">',
  '        <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">',
  '          <rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/">',
  '            <dc:description>',
  '              <rdf:Alt>',
  '                <rdf:li xml:lang="x-default">old prompt</rdf:li>',
  '              </rdf:Alt>',
  '            </dc:description>',
  '          </rdf:Description>',
  '        </rdf:RDF>',
  '      </x:xmpmeta>',
  '      <?xpacket end="w"?>',
].join("\n");

const palette_png = write_PNG_chunks([IHDR, PLTE, tRNS, IDAT, IEND]);

check(crc32(encoder.encode("IEND")) === 0xae426082, "crc32 of IEND is 0xAE426082");

check(is_PNG(palette_png), "is_PNG accepts a written PNG");
check(!is_PNG(encoder.encode("RIFF....WEBP")), "is_PNG rejects a WebP header");
check(!is_PNG(PNG_SIGNATURE.subarray(0, 4)), "is_PNG rejects fewer than eight bytes");
check(bytes_equal(palette_png.subarray(0, 8), PNG_SIGNATURE), "write_PNG_chunks starts with the signature");
{
  const chunks = read_PNG_chunks(palette_png);
  check(chunks.map((chunk) => chunk.type).join() === "IHDR,PLTE,tRNS,IDAT,IEND", "read_PNG_chunks returns the chunks in order");
  check(bytes_equal(chunks[3].data, IDAT.data), "read_PNG_chunks returns the IDAT data byte for byte");
  const iend_offset = palette_png.length - 12;
  const iend_crc = new DataView(palette_png.buffer, palette_png.byteOffset).getUint32(iend_offset + 8);
  check(iend_crc === 0xae426082, "write_PNG_chunks writes the CRC over type and data");
  const view = concat_bytes([Uint8Array.of(9, 9, 9), palette_png]).subarray(3);
  check(types_of(view).length === 5, "read_PNG_chunks accepts a view with a byte offset");
}

check(types_of(concat_bytes([palette_png, encoder.encode("trailing junk")])).length === 5, "read_PNG_chunks stops after IEND");
{
  const wrong_signature = await thrown_by(() => read_PNG_chunks(encoder.encode("not a png at all")));
  check(wrong_signature instanceof Error && wrong_signature.message === "Not a PNG file.", "read_PNG_chunks throws Not a PNG file. on a wrong signature");
  const cut_header = await thrown_by(() => read_PNG_chunks(palette_png.subarray(0, palette_png.length - 6)));
  check(cut_header instanceof Error && cut_header.message === "Truncated PNG chunk.", "read_PNG_chunks throws Truncated PNG chunk. when the last chunk header is cut");
  const cut_data = await thrown_by(() => read_PNG_chunks(palette_png.subarray(0, palette_png.length - 14)));
  check(cut_data instanceof Error && cut_data.message === "Truncated PNG chunk.", "read_PNG_chunks throws Truncated PNG chunk. when chunk data is cut");
  const no_iend = await thrown_by(() => read_PNG_chunks(palette_png.subarray(0, palette_png.length - 12)));
  check(no_iend instanceof Error && no_iend.message === "Truncated PNG chunk.", "read_PNG_chunks throws Truncated PNG chunk. when the file ends before IEND");
}

{
  const dirty = write_PNG_chunks([IHDR, tEXt, PLTE, eXIf, tRNS, prompt_chunk(encoder.encode("old prompt")), IDAT, IDAT_second, xmp_chunk(build_XMP_packet("old")), acTL, IEND]);
  const stripped = strip_PNG(dirty);
  check(types_of(stripped).join() === "IHDR,PLTE,tRNS,IDAT,IDAT,IEND", "strip_PNG keeps exactly the pixel chunks in order");
  check(bytes_equal(stripped, write_PNG_chunks([IHDR, PLTE, tRNS, IDAT, IDAT_second, IEND])), "strip_PNG output equals the written pixel chunks");
  check([...PIXEL_CHUNK_TYPES].join() === "IHDR,PLTE,tRNS,IDAT,IEND", "PIXEL_CHUNK_TYPES holds the five pixel chunk types");
}

check(escape_XML(`a & b < c > "d" 'e'`) === "a &amp; b &lt; c &gt; &quot;d&quot; &apos;e&apos;", "escape_XML escapes the five characters");
check(escape_XML("&lt;") === "&amp;lt;", "escape_XML escapes an ampersand once");
check(decode_XML_entities("a &amp; b &lt; c &gt; &quot;d&quot; &apos;e&apos; &#65; &#x263A; &amp;lt;") === `a & b < c > "d" 'e' A ☺ &lt;`, "decode_XML_entities decodes named, decimal and hexadecimal entities in one pass");
check(decode_XML_entities("&#38;amp;") === "&amp;", "decode_XML_entities does not decode twice");
check(decode_XML_entities("&#x110000; &#0; &#xD800; &bogus;") === "&#x110000; &#0; &#xD800; &bogus;", "decode_XML_entities leaves invalid and unknown entities unchanged");
check(decode_XML_entities(escape_XML("round & trip <ok>")) === "round & trip <ok>", "escape_XML and decode_XML_entities round-trip");
{
  const packet = build_XMP_packet("a & b <c>");
  check(packet.startsWith('<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>'), "build_XMP_packet starts with the xpacket header and the byte order mark");
  check(packet.endsWith('<?xpacket end="w"?>'), "build_XMP_packet ends with the xpacket trailer");
  check(packet.includes('<rdf:li xml:lang="x-default">a &amp; b &lt;c&gt;</rdf:li>'), "build_XMP_packet escapes the prompt");
  check(is_XMP_form(packet), "is_XMP_form accepts Imaginer's packet");
  check(is_XMP_form(old_style_packet), "is_XMP_form accepts a packet with the old indentation");
  check(!is_XMP_form(foreign_packet), "is_XMP_form rejects a foreign packet");
}

{
  const both = write_PNG_prompt(palette_png, "a & b <c>", { iTXt_form: true, XMP_form: true });
  check(types_of(both).join() === "IHDR,PLTE,tRNS,iTXt,iTXt,IDAT,IEND", "write_PNG_prompt inserts both forms directly before the first IDAT");
  const forms = forms_in(both);
  check(forms.prompt.length === 1 && forms.xmp.length === 1, "write_PNG_prompt writes one chunk per form");
  check(iTXt_keyword(read_PNG_chunks(both)[3]) === PROMPT_KEYWORD, "the iTXt form comes before the XMP form");
  check(iTXt_text(forms.prompt[0]) === "a & b <c>", "the iTXt form carries the raw prompt");
  check(iTXt_text(forms.xmp[0]).includes("a &amp; b &lt;c&gt;"), "the XMP form carries the escaped prompt");
  check((await read_PNG_prompt(both)) === "a & b <c>", "read_PNG_prompt reads the prompt back from both forms");

  const twice = write_PNG_prompt(both, "second prompt", { iTXt_form: true, XMP_form: true });
  const twice_forms = forms_in(twice);
  check(twice_forms.prompt.length === 1 && twice_forms.xmp.length === 1, "write_PNG_prompt applied twice leaves one chunk per form");
  check((await read_PNG_prompt(twice)) === "second prompt", "write_PNG_prompt replaces the prompt");

  const only_xmp = write_PNG_prompt(palette_png, "xmp only", { iTXt_form: false, XMP_form: true });
  check(forms_in(only_xmp).prompt.length === 0 && forms_in(only_xmp).xmp.length === 1, "write_PNG_prompt with only the XMP form writes only the XMP form");
  check((await read_PNG_prompt(only_xmp)) === "xmp only", "read_PNG_prompt falls back to the XMP form");

  const only_iTXt = write_PNG_prompt(palette_png, "itxt only", { iTXt_form: true, XMP_form: false });
  check(forms_in(only_iTXt).prompt.length === 1 && forms_in(only_iTXt).xmp.length === 0, "write_PNG_prompt with only the iTXt form writes only the iTXt form");

  const emptied = write_PNG_prompt(both, "", { iTXt_form: true, XMP_form: true });
  check(forms_in(emptied).prompt.length === 0 && forms_in(emptied).xmp.length === 0, "write_PNG_prompt with an empty prompt removes the forms and writes none");
  check((await read_PNG_prompt(emptied)) === "", "read_PNG_prompt returns the empty string without forms");

  const none = write_PNG_prompt(both, "kept prompt", { iTXt_form: false, XMP_form: false });
  check(forms_in(none).prompt.length === 0 && forms_in(none).xmp.length === 0, "write_PNG_prompt with both forms off removes the forms");

  const old_style = write_PNG_chunks([IHDR, PLTE, tRNS, xmp_chunk(old_style_packet), IDAT, IEND]);
  check(forms_in(write_PNG_prompt(old_style, "", { iTXt_form: false, XMP_form: false })).xmp.length === 0, "write_PNG_prompt removes an old-style Imaginer XMP chunk when no form is written");

  const with_foreign = write_PNG_chunks([IHDR, PLTE, tRNS, xmp_chunk(foreign_packet), prompt_chunk(encoder.encode("imaginer prompt")), IDAT, IEND]);
  const foreign_kept = write_PNG_prompt(with_foreign, "", { iTXt_form: true, XMP_form: true });
  check(forms_in(foreign_kept).prompt.length === 0, "write_PNG_prompt removes the prompt_text chunk when no form is written");
  check(forms_in(foreign_kept).xmp.length === 1 && iTXt_text(forms_in(foreign_kept).xmp[0]) === foreign_packet, "write_PNG_prompt keeps a foreign XMP chunk when the XMP form is not written");
  const foreign_kept_itxt_only = write_PNG_prompt(with_foreign, "new prompt", { iTXt_form: true, XMP_form: false });
  check(forms_in(foreign_kept_itxt_only).xmp.length === 1 && iTXt_text(forms_in(foreign_kept_itxt_only).xmp[0]) === foreign_packet, "write_PNG_prompt keeps a foreign XMP chunk when only the iTXt form is written");
  const foreign_replaced = write_PNG_prompt(with_foreign, "new prompt", { iTXt_form: false, XMP_form: true });
  check(forms_in(foreign_replaced).xmp.length === 1 && is_XMP_form(iTXt_text(forms_in(foreign_replaced).xmp[0])), "write_PNG_prompt replaces a foreign XMP chunk when the XMP form is written");

  const unicode = write_PNG_prompt(palette_png, "Ünïcödé 🦄 prompt", { iTXt_form: true, XMP_form: true });
  check((await read_PNG_prompt(unicode)) === "Ünïcödé 🦄 prompt", "the prompt round-trips with non-ASCII characters");
  check(bytes_equal(read_PNG_chunks(unicode).find((chunk) => chunk.type === "IDAT").data, IDAT.data), "write_PNG_prompt leaves the IDAT data untouched");

  const bom = write_PNG_prompt(palette_png, "﻿leading mark", { iTXt_form: true, XMP_form: false });
  check((await read_PNG_prompt(bom)) === "﻿leading mark", "a leading byte order mark in the prompt survives");

  const spaced = write_PNG_prompt(palette_png, "  spaced  ", { iTXt_form: false, XMP_form: true });
  check((await read_PNG_prompt(spaced)) === "  spaced  ", "read_PNG_prompt does not trim the prompt");

  const no_idat = await thrown_by(() => write_PNG_prompt(write_PNG_chunks([IHDR, IEND]), "prompt", { iTXt_form: true, XMP_form: false }));
  check(no_idat instanceof Error && no_idat.message === "PNG has no IDAT chunk.", "write_PNG_prompt throws when a form is requested and no IDAT exists");
  const not_png = await thrown_by(() => write_PNG_prompt(encoder.encode("not a png"), "prompt", { iTXt_form: true, XMP_form: false }));
  check(not_png instanceof Error && not_png.message === "Not a PNG file.", "write_PNG_prompt throws on bytes that are not a PNG");
}

{
  const compressed = write_PNG_chunks([IHDR, PLTE, tRNS, prompt_chunk(await deflate(encoder.encode("compressed prompt")), true), IDAT, IEND]);
  check((await read_PNG_prompt(compressed)) === "compressed prompt", "read_PNG_prompt inflates a compressed prompt_text chunk");

  const with_foreign_xmp = write_PNG_chunks([IHDR, PLTE, tRNS, IDAT, xmp_chunk(foreign_packet), IEND]);
  check((await read_PNG_prompt(with_foreign_xmp)) === "Tom & Jerry's ☺", "read_PNG_prompt decodes entities in a foreign XMP packet and ignores other properties");

  const empty_description = write_PNG_chunks([IHDR, IDAT, xmp_chunk(empty_description_packet), IEND]);
  check((await read_PNG_prompt(empty_description)) === "", "read_PNG_prompt returns nothing for a self-closing dc:description although another property carries an rdf:li");

  const both_forms_differ = write_PNG_chunks([IHDR, xmp_chunk(build_XMP_packet("from xmp")), prompt_chunk(encoder.encode("from itxt")), IDAT, IEND]);
  check((await read_PNG_prompt(both_forms_differ)) === "from itxt", "read_PNG_prompt prefers the prompt_text chunk over the XMP form");

  const empty_prompt_chunk = write_PNG_chunks([IHDR, prompt_chunk(new Uint8Array(0)), xmp_chunk(build_XMP_packet("from xmp")), IDAT, IEND]);
  check((await read_PNG_prompt(empty_prompt_chunk)) === "from xmp", "read_PNG_prompt skips an empty prompt_text chunk and uses the XMP form");

  const corrupt = write_PNG_chunks([IHDR, prompt_chunk(encoder.encode("this is not zlib data"), true), xmp_chunk(build_XMP_packet("from xmp")), IDAT, IEND]);
  check((await read_PNG_prompt(corrupt)) === "from xmp", "read_PNG_prompt leaves a prompt_text chunk with corrupt compressed data out");

  const malformed = write_PNG_chunks([IHDR, { type: "iTXt", data: encoder.encode("no separators at all") }, IDAT, IEND]);
  check((await read_PNG_prompt(malformed)) === "", "read_PNG_prompt leaves a malformed iTXt chunk out");

  const other_text = write_PNG_chunks([IHDR, { type: "iTXt", data: iTXt_data("Comment", encoder.encode("not a prompt"), false) }, IDAT, IEND]);
  check((await read_PNG_prompt(other_text)) === "", "read_PNG_prompt ignores iTXt chunks with other keywords");

  check((await read_PNG_prompt(encoder.encode("not a png at all"))) === "", "read_PNG_prompt returns the empty string for bytes that are not a PNG");
  const with_prompt = write_PNG_chunks([IHDR, prompt_chunk(encoder.encode("before the cut")), IDAT, IEND]);
  check((await read_PNG_prompt(with_prompt.subarray(0, with_prompt.length - 6))) === "before the cut", "read_PNG_prompt returns the prompt found before a truncation");
  check((await read_PNG_prompt(palette_png.subarray(0, palette_png.length - 14))) === "", "read_PNG_prompt returns the empty string for a truncated PNG without a prompt");
}

{
  const rgba = Uint8Array.from({ length: 3 * 2 * 4 }, (_, index) => (index * 37) & 0xff);
  const png = await encode_PNG_RGBA({ width: 3, height: 2, rgba });
  const chunks = read_PNG_chunks(png);
  check(chunks.map((chunk) => chunk.type).join() === "IHDR,IDAT,IEND", "encode_PNG_RGBA writes IHDR, one IDAT and IEND");
  check(bytes_equal(chunks[0].data, Uint8Array.of(0, 0, 0, 3, 0, 0, 0, 2, 8, 6, 0, 0, 0)), "encode_PNG_RGBA writes the header for 8-bit RGBA without interlacing");
  const inflated = new Uint8Array(await new Response(new Blob([chunks[1].data]).stream().pipeThrough(new DecompressionStream("deflate"))).arrayBuffer());
  const expected_rows = concat_bytes([Uint8Array.of(0), rgba.subarray(0, 12), Uint8Array.of(0), rgba.subarray(12, 24)]);
  check(bytes_equal(inflated, expected_rows), "the image data is every row with filter type 0 in front");
  check(bytes_equal(strip_PNG(png), png), "an encoded PNG passes strip_PNG unchanged");
  const wrong_length = await thrown_by(() => encode_PNG_RGBA({ width: 3, height: 2, rgba: new Uint8Array(5) }));
  check(wrong_length instanceof Error && wrong_length.message === "Wrong RGBA length.", "encode_PNG_RGBA throws on a wrong RGBA length");
}

if (failures.length > 0) {
  console.log("check failed: PNG_chunks");
  for (const failure of failures) {
    console.log(`   ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log("PNG_chunks check passed");
}
