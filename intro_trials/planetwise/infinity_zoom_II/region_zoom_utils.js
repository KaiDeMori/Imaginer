window.infinity_zoom_II.region_zoom_utils = {
  // Create quad in IMAGE PIXEL coordinates (not clip space)
  create_image_pixel_quad_buffer(gl, image_width, image_height) {
    const vertices = new Float32Array([
      0,
      0,
      0,
      1, // Bottom-left (pos + uv)
      image_width,
      0,
      1,
      1, // Bottom-right
      0,
      image_height,
      0,
      0, // Top-left
      image_width,
      image_height,
      1,
      0, // Top-right
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    return buffer;
  },
};
