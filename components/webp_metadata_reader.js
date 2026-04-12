/**
 * Scans a WebP Blob for prompt text in XMP or EXIF metadata.
 * Priority: XMP dc:description, then EXIF UserComment.
 * @param {Blob} blob
 * @returns {Promise<string>} The found prompt or an empty string.
 */
export async function read_webp_metadata(blob) {
  const buffer = await blob.arrayBuffer();
  const uint8 = new Uint8Array(buffer);
  const view = new DataView(buffer);

  // RIFF header: "RIFF" + 4 bytes size + "WEBP"
  if (uint8.length < 12) return "";
  const riff = String.fromCharCode(uint8[0], uint8[1], uint8[2], uint8[3]);
  const webp = String.fromCharCode(uint8[8], uint8[9], uint8[10], uint8[11]);
  if (riff !== "RIFF" || webp !== "WEBP") return "";

  let xmp_result = "";
  let exif_result = "";

  let offset = 12;
  while (offset < uint8.length - 7) {
    const chunk_id = String.fromCharCode(uint8[offset], uint8[offset + 1], uint8[offset + 2], uint8[offset + 3]);
    const chunk_size = view.getUint32(offset + 4, true); // RIFF is little-endian
    const chunk_data_start = offset + 8;
    const chunk_data_end = chunk_data_start + chunk_size;

    if (chunk_data_end > uint8.length) break;

    if (chunk_id === "XMP " && !xmp_result) {
      const xmp_text = new TextDecoder().decode(uint8.subarray(chunk_data_start, chunk_data_end));
      const match = xmp_text.match(/<dc:description>[\s\S]*?<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>[\s\S]*?<\/dc:description>/);
      if (match && match[1]) xmp_result = match[1];
    }

    if (chunk_id === "EXIF" && !exif_result) {
      exif_result = parse_exif_user_comment(uint8, view, chunk_data_start, chunk_data_end);
    }

    // RIFF chunks are padded to even byte boundaries
    offset = chunk_data_end + (chunk_size % 2);
  }

  return xmp_result || exif_result;
}

/**
 * Parses EXIF data from a WebP EXIF chunk for UserComment (0x9286).
 * WebP EXIF payload starts directly with the TIFF header (no "Exif\0\0" prefix).
 * @param {Uint8Array} uint8
 * @param {DataView} view
 * @param {number} start
 * @param {number} end
 * @returns {string}
 */
function parse_exif_user_comment(uint8, view, start, end) {
  // Some WebP encoders prepend "Exif\0\0", some don't
  let tiff_start = start;
  if (end - start > 6) {
    const maybe_exif = String.fromCharCode(uint8[start], uint8[start + 1], uint8[start + 2], uint8[start + 3]);
    if (maybe_exif === "Exif" && uint8[start + 4] === 0 && uint8[start + 5] === 0) {
      tiff_start = start + 6;
    }
  }

  if (tiff_start + 8 > end) return "";

  const byte_order = uint8[tiff_start] === 0x4D ? "big" : "little";
  const le = byte_order === "little";
  const r16 = (o) => view.getUint16(tiff_start + o, le);
  const r32 = (o) => view.getUint32(tiff_start + o, le);

  const ifd0_offset = r32(4);

  // Find ExifIFD pointer (tag 0x8769) in IFD0
  const exif_ifd_offset = scan_tag(tiff_start, ifd0_offset, 0x8769, r16, r32, end);
  if (exif_ifd_offset === null) return "";

  // Find UserComment (tag 0x9286) in ExifIFD
  return read_user_comment(uint8, tiff_start, exif_ifd_offset, r16, r32, end);
}

/**
 * @param {number} tiff_start
 * @param {number} ifd_rel
 * @param {number} target_tag
 * @param {Function} r16
 * @param {Function} r32
 * @param {number} abs_end
 * @returns {number|null}
 */
function scan_tag(tiff_start, ifd_rel, target_tag, r16, r32, abs_end) {
  if (tiff_start + ifd_rel + 2 > abs_end) return null;
  const count = r16(ifd_rel);
  for (let i = 0; i < count; i++) {
    const off = ifd_rel + 2 + i * 12;
    if (tiff_start + off + 12 > abs_end) return null;
    if (r16(off) === target_tag) return r32(off + 8);
  }
  return null;
}

/**
 * @param {Uint8Array} uint8
 * @param {number} tiff_start
 * @param {number} ifd_rel
 * @param {Function} r16
 * @param {Function} r32
 * @param {number} abs_end
 * @returns {string}
 */
function read_user_comment(uint8, tiff_start, ifd_rel, r16, r32, abs_end) {
  if (tiff_start + ifd_rel + 2 > abs_end) return "";
  const count = r16(ifd_rel);
  for (let i = 0; i < count; i++) {
    const off = ifd_rel + 2 + i * 12;
    if (tiff_start + off + 12 > abs_end) return "";
    if (r16(off) !== 0x9286) continue;

    const byte_count = r32(off + 4);
    const value_offset = byte_count <= 4 ? off + 8 : r32(off + 8);
    const abs_val = tiff_start + value_offset;
    if (abs_val + byte_count > abs_end || byte_count < 8) return "";

    const charset = String.fromCharCode(...uint8.subarray(abs_val, abs_val + 8)).replace(/\0/g, "").trim();
    const payload = uint8.subarray(abs_val + 8, abs_val + byte_count);

    if (charset === "Unicode") {
      const units = [];
      for (let j = 0; j < payload.length - 1; j += 2) {
        units.push((payload[j] << 8) | payload[j + 1]);
      }
      return String.fromCharCode(...units).replace(/\0+$/, "");
    }

    return new TextDecoder().decode(payload).replace(/\0+$/, "");
  }
  return "";
}
