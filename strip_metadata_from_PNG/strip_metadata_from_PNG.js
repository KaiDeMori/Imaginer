/**
 * Strips metadata from a PNG image.
 * @param {Uint8Array} input_data - The PNG image data as Uint8Array.
 * @returns {Blob} - A Blob containing the PNG image without metadata.
 */
export function strip_metadata_from_PNG(input_data) {
  const PNG_signature = [137, 80, 78, 71, 13, 10, 26, 10];
  const essential_chunks = ['IHDR', 'IDAT', 'IEND'];

  // Helper function to read a 32-bit unsigned integer (big-endian)
  function read_uint32(data, offset) {
    return (
      (data[offset] << 24) |
      (data[offset + 1] << 16) |
      (data[offset + 2] << 8) |
      data[offset + 3]
    ) >>> 0;
  }

  // Helper function to read chunk type as string
  function read_chunk_type(data, offset) {
    return String.fromCharCode(
      data[offset],
      data[offset + 1],
      data[offset + 2],
      data[offset + 3]
    );
  }

  // Validate PNG signature
  for (let i = 0; i < PNG_signature.length; i++) {
    if (input_data[i] !== PNG_signature[i]) {
      throw new Error('Invalid PNG file signature.');
    }
  }

  let offset = PNG_signature.length;
  const chunks = [];

  // Parse chunks
  while (offset < input_data.length) {
    const length = read_uint32(input_data, offset);
    const type = read_chunk_type(input_data, offset + 4);
    const chunk_start = offset;
    const chunk_end = offset + 12 + length; // 4 bytes length + 4 bytes type + data + 4 bytes CRC

    if (essential_chunks.includes(type)) {
      chunks.push(input_data.slice(chunk_start, chunk_end));
    }

    offset = chunk_end;

    if (type === 'IEND') {
      break; // End of PNG file
    }
  }

  // Concatenate PNG signature and essential chunks
  const total_length = PNG_signature.length + chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output_data = new Uint8Array(total_length);
  output_data.set(PNG_signature, 0);

  let current_offset = PNG_signature.length;
  for (const chunk of chunks) {
    output_data.set(chunk, current_offset);
    current_offset += chunk.length;
  }

  return new Blob([output_data], { type: 'image/png' });
}
