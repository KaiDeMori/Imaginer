// Executable specification of the JPEG and WebP prompt readers. Run from the repository root: node tools/check/metadata_readers_check.mjs

import { read_jpeg_metadata } from "../../components/jpeg_metadata_reader.js";
import { read_webp_metadata } from "../../components/webp_metadata_reader.js";

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

function uint16_big_endian(value) {
  return Uint8Array.of((value >>> 8) & 0xff, value & 0xff);
}

function uint32_little_endian(value) {
  return Uint8Array.of(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

const packet = '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:description><rdf:Alt><rdf:li xml:lang="x-default">Tom &amp; Jerry &lt;3</rdf:li></rdf:Alt></dc:description></rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>';

function jpeg_with_xmp(packet_text) {
  const payload = concat_bytes([encoder.encode("http://ns.adobe.com/xap/1.0/\0"), encoder.encode(packet_text)]);
  const segment = concat_bytes([Uint8Array.of(0xff, 0xe1), uint16_big_endian(payload.length + 2), payload]);
  return concat_bytes([Uint8Array.of(0xff, 0xd8), segment, Uint8Array.of(0xff, 0xda, 0x00, 0x02)]);
}

function webp_with_xmp(packet_text) {
  const xmp_bytes = encoder.encode(packet_text);
  const padded = xmp_bytes.length % 2 === 1 ? concat_bytes([xmp_bytes, Uint8Array.of(0)]) : xmp_bytes;
  const chunk = concat_bytes([encoder.encode("XMP "), uint32_little_endian(xmp_bytes.length), padded]);
  return concat_bytes([encoder.encode("RIFF"), uint32_little_endian(4 + chunk.length), encoder.encode("WEBP"), chunk]);
}

check((await read_jpeg_metadata(new Blob([jpeg_with_xmp(packet)], { type: "image/jpeg" }))) === "Tom & Jerry <3", "read_jpeg_metadata decodes XML entities in the description");
check((await read_webp_metadata(new Blob([webp_with_xmp(packet)], { type: "image/webp" }))) === "Tom & Jerry <3", "read_webp_metadata decodes XML entities in the description");
check((await read_jpeg_metadata(new Blob([encoder.encode("not a jpeg")], { type: "image/jpeg" }))) === "", "read_jpeg_metadata returns the empty string for bytes that are not a JPEG");
check((await read_webp_metadata(new Blob([encoder.encode("not a webp")], { type: "image/webp" }))) === "", "read_webp_metadata returns the empty string for bytes that are not a WebP");

if (failures.length > 0) {
  console.log("check failed: metadata_readers");
  for (const failure of failures) {
    console.log(`   ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log("metadata_readers check passed");
}
