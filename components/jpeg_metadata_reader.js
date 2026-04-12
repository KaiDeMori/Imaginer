/**
 * Scans a JPEG Blob for prompt text in XMP or EXIF metadata.
 * Priority: XMP dc:description, then EXIF UserComment.
 * @param {Blob} blob
 * @returns {Promise<string>} The found prompt or an empty string.
 */
export async function read_jpeg_metadata(blob) {
  const buffer = await blob.arrayBuffer();
  const uint8 = new Uint8Array(buffer);
  const view = new DataView(buffer);

  // JPEG starts with 0xFF 0xD8
  if (uint8[0] !== 0xFF || uint8[1] !== 0xD8) return "";

  let xmp_result = "";
  let exif_result = "";

  let offset = 2;
  while (offset < uint8.length - 1) {
    if (uint8[offset] !== 0xFF) break;

    const marker = uint8[offset + 1];

    // SOS (Start of Scan) — image data follows, no more metadata
    if (marker === 0xDA) break;

    // Markers without payload
    if (marker === 0xD8 || marker === 0xD9 || (marker >= 0xD0 && marker <= 0xD7)) {
      offset += 2;
      continue;
    }

    const segment_length = view.getUint16(offset + 2);
    const segment_data_start = offset + 4;
    const segment_data_end = offset + 2 + segment_length;

    if (segment_data_end > uint8.length) break;

    // APP1 marker (0xE1) can contain EXIF or XMP
    if (marker === 0xE1) {
      if (!xmp_result) {
        xmp_result = try_xmp_from_APP1(uint8, segment_data_start, segment_data_end);
      }
      if (!exif_result) {
        exif_result = try_exif_from_APP1(uint8, view, segment_data_start, segment_data_end);
      }
    }

    offset = segment_data_end;
  }

  return xmp_result || exif_result;
}

const XMP_NAMESPACE = "http://ns.adobe.com/xap/1.0/\0";

/**
 * @param {Uint8Array} uint8
 * @param {number} start
 * @param {number} end
 * @returns {string}
 */
function try_xmp_from_APP1(uint8, start, end) {
  const ns_bytes = new TextEncoder().encode(XMP_NAMESPACE);
  if (end - start < ns_bytes.length) return "";

  for (let i = 0; i < ns_bytes.length; i++) {
    if (uint8[start + i] !== ns_bytes[i]) return "";
  }

  const xmp_start = start + ns_bytes.length;
  const xmp_text = new TextDecoder().decode(uint8.subarray(xmp_start, end));

  const match = xmp_text.match(/<dc:description>[\s\S]*?<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>[\s\S]*?<\/dc:description>/);
  return (match && match[1]) ? match[1] : "";
}

const EXIF_HEADER = "Exif\0\0";

/**
 * @param {Uint8Array} uint8
 * @param {DataView} view
 * @param {number} start
 * @param {number} end
 * @returns {string}
 */
function try_exif_from_APP1(uint8, view, start, end) {
  if (end - start < 14) return "";

  const header = String.fromCharCode(...uint8.subarray(start, start + 6));
  if (header !== EXIF_HEADER) return "";

  const tiff_start = start + 6;
  const byte_order = uint8[tiff_start] === 0x4D ? "big" : "little";
  const read16 = byte_order === "big"
    ? (o) => view.getUint16(tiff_start + o)
    : (o) => view.getUint16(tiff_start + o, true);
  const read32 = byte_order === "big"
    ? (o) => view.getUint32(tiff_start + o)
    : (o) => view.getUint32(tiff_start + o, true);

  const ifd0_offset = read32(4);

  // Scan IFD0 for ExifIFD pointer (tag 0x8769)
  const exif_ifd_offset = scan_ifd_for_tag(uint8, tiff_start, ifd0_offset, 0x8769, read16, read32, end);

  if (exif_ifd_offset === null) return "";

  // Scan ExifIFD for UserComment (tag 0x9286)
  return read_user_comment(uint8, tiff_start, exif_ifd_offset, read16, read32, end);
}

/**
 * @param {Uint8Array} uint8
 * @param {number} tiff_start - absolute offset of TIFF header
 * @param {number} ifd_rel - relative IFD offset from TIFF header
 * @param {number} target_tag
 * @param {Function} read16
 * @param {Function} read32
 * @param {number} abs_end - absolute buffer boundary
 * @returns {number|null} relative offset value for the tag, or null
 */
function scan_ifd_for_tag(uint8, tiff_start, ifd_rel, target_tag, read16, read32, abs_end) {
  const abs_ifd = tiff_start + ifd_rel;
  if (abs_ifd + 2 > abs_end) return null;

  const entry_count = read16(ifd_rel);
  for (let i = 0; i < entry_count; i++) {
    const entry_offset = ifd_rel + 2 + i * 12;
    if (tiff_start + entry_offset + 12 > abs_end) return null;

    const tag = read16(entry_offset);
    if (tag === target_tag) {
      return read32(entry_offset + 8);
    }
  }
  return null;
}

/**
 * @param {Uint8Array} uint8
 * @param {number} tiff_start
 * @param {number} ifd_rel
 * @param {Function} read16
 * @param {Function} read32
 * @param {number} abs_end
 * @returns {string}
 */
function read_user_comment(uint8, tiff_start, ifd_rel, read16, read32, abs_end) {
  const abs_ifd = tiff_start + ifd_rel;
  if (abs_ifd + 2 > abs_end) return "";

  const entry_count = read16(ifd_rel);
  for (let i = 0; i < entry_count; i++) {
    const entry_offset = ifd_rel + 2 + i * 12;
    if (tiff_start + entry_offset + 12 > abs_end) return "";

    const tag = read16(entry_offset);
    if (tag !== 0x9286) continue;

    const byte_count = read32(entry_offset + 4);
    // Values > 4 bytes are stored at an offset
    const value_offset = byte_count <= 4 ? entry_offset + 8 : read32(entry_offset + 8);
    const abs_value = tiff_start + value_offset;

    if (abs_value + byte_count > abs_end || byte_count < 8) return "";

    // First 8 bytes are character code identifier
    const charset = String.fromCharCode(...uint8.subarray(abs_value, abs_value + 8)).replace(/\0/g, "").trim();
    const payload = uint8.subarray(abs_value + 8, abs_value + byte_count);

    if (charset === "Unicode") {
      // UTF-16 BE
      const code_units = [];
      for (let j = 0; j < payload.length - 1; j += 2) {
        code_units.push((payload[j] << 8) | payload[j + 1]);
      }
      return String.fromCharCode(...code_units).replace(/\0+$/, "");
    }

    // ASCII or unknown — decode as UTF-8
    return new TextDecoder().decode(payload).replace(/\0+$/, "");
  }
  return "";
}
