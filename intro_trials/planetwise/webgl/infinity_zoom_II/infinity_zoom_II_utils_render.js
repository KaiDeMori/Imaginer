// Upload a layer's image to GPU as a texture
function upload_texture(gl, layer) {
   const tex = gl.createTexture();
   gl.bindTexture(gl.TEXTURE_2D, tex);
   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, layer.image);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
   gl.generateMipmap(gl.TEXTURE_2D);
   layer.texture = tex;
   layer.loaded = true;
}

// Delete a layer's texture from GPU
function delete_texture(gl, layer) {
   if (layer.texture) {
      gl.deleteTexture(layer.texture);
      layer.texture = null;
      layer.loaded = false;
   }
}

// Ensure canvas dimensions are correctly set and update viewport
function resize_canvas_to_display_size(canvas, gl) {
   const dpr = window.devicePixelRatio || 1;
   const width = Math.round(window.innerWidth * dpr);
   const height = Math.round(window.innerHeight * dpr);
   if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
   }
   gl.viewport(0, 0, canvas.width, canvas.height);
}

// Returns true if the layer's texture is currently uploaded to the GPU
function is_layer_uploaded(layer) {
   return !!(layer && layer.texture);
}

// Export as global for engine usage
window.infinity_zoom_II_utils_render = {
   upload_texture,
   delete_texture,
   resize_canvas_to_display_size,
   is_layer_uploaded
};