// Feathered image preloader logic for Infinity Zoom II

/**
 * Preload and feather layer images only (no mystery image).
 * Used by the unified preloader interface.
 * @param {Array} layer_data - Data describing the image layers to load.
 * @param {string} image_folder - Folder containing the images.
 * @param {number} feather_size - Size of the feathering effect.
 * @param {Function} callback - Called with feathered images array.
 */
function preload_and_feather_layers_only(layer_data, image_folder, feather_size, callback) {
  log(`[feather_preloader] Starting layers-only feathering with size: ${feather_size}`);

  // Load layer images using regular preloader (layers only, no mystery)
  window.infinity_zoom_II.preloader.load_layer_images_only(layer_data, image_folder, (images) => {
    log(`[feather_preloader] Starting feathering of ${images.length} layer images...`);
    const start_time = performance.now();
    const feathered_layer_images = new Array(images.length);

    // Use a single shared canvas and WebGL context for all feathering
    const shared_canvas = document.createElement("canvas");
    let shared_gl = null;
    let shared_prog = null;
    let shared_buf = null;
    let shared_vs = null;
    let shared_fs = null;
    let a_pos = null;
    let a_tex = null;
    let u_image = null;
    let u_feather = null;

    // Helper to initialize shared GL resources
    function init_shared_gl(width, height) {
      shared_canvas.width = width;
      shared_canvas.height = height;
      shared_gl = shared_canvas.getContext("webgl");

      // Compile shaders (same as original)
      const vert_src = `
                attribute vec2 a_pos;
                attribute vec2 a_tex;
                varying vec2 v_tex;
                void main() {
                    v_tex = a_tex;
                    gl_Position = vec4(a_pos, 0, 1);
                }
            `;
      const frag_src = `
                precision mediump float;
                uniform sampler2D u_image;
                uniform float u_feather;
                varying vec2 v_tex;
                void main() {
                    vec4 color = texture2D(u_image, v_tex);
                    float edge_dist = min(min(v_tex.x, 1.0 - v_tex.x), min(v_tex.y, 1.0 - v_tex.y));
                    float alpha_mult = smoothstep(0.0, u_feather, edge_dist);
                    gl_FragColor = vec4(color.rgb, color.a * alpha_mult);
                }
            `;

      shared_vs = shared_gl.createShader(shared_gl.VERTEX_SHADER);
      shared_gl.shaderSource(shared_vs, vert_src);
      shared_gl.compileShader(shared_vs);

      shared_fs = shared_gl.createShader(shared_gl.FRAGMENT_SHADER);
      shared_gl.shaderSource(shared_fs, frag_src);
      shared_gl.compileShader(shared_fs);

      shared_prog = shared_gl.createProgram();
      shared_gl.attachShader(shared_prog, shared_vs);
      shared_gl.attachShader(shared_prog, shared_fs);
      shared_gl.linkProgram(shared_prog);
      shared_gl.useProgram(shared_prog);

      a_pos = shared_gl.getAttribLocation(shared_prog, "a_pos");
      a_tex = shared_gl.getAttribLocation(shared_prog, "a_tex");
      u_image = shared_gl.getUniformLocation(shared_prog, "u_image");
      u_feather = shared_gl.getUniformLocation(shared_prog, "u_feather");

      const verts = new Float32Array([-1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1]);
      shared_buf = shared_gl.createBuffer();
      shared_gl.bindBuffer(shared_gl.ARRAY_BUFFER, shared_buf);
      shared_gl.bufferData(shared_gl.ARRAY_BUFFER, verts, shared_gl.STATIC_DRAW);
      shared_gl.vertexAttribPointer(a_pos, 2, shared_gl.FLOAT, false, 16, 0);
      shared_gl.vertexAttribPointer(a_tex, 2, shared_gl.FLOAT, false, 16, 8);
      shared_gl.enableVertexAttribArray(a_pos);
      shared_gl.enableVertexAttribArray(a_tex);
      shared_gl.enable(shared_gl.BLEND);
      shared_gl.blendFunc(shared_gl.SRC_ALPHA, shared_gl.ONE_MINUS_SRC_ALPHA);
    }

    // Process each layer image
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (!img.width || !img.height) {
        feathered_layer_images[i] = null;
        continue;
      }

      // Initialize or resize GL context
      if (!shared_gl || shared_canvas.width !== img.width || shared_canvas.height !== img.height) {
        init_shared_gl(img.width, img.height);
      }

      // Create texture and render with feathering
      const tex = shared_gl.createTexture();
      shared_gl.bindTexture(shared_gl.TEXTURE_2D, tex);
      shared_gl.texImage2D(shared_gl.TEXTURE_2D, 0, shared_gl.RGBA, shared_gl.RGBA, shared_gl.UNSIGNED_BYTE, img);
      shared_gl.texParameteri(shared_gl.TEXTURE_2D, shared_gl.TEXTURE_MIN_FILTER, shared_gl.LINEAR);
      shared_gl.texParameteri(shared_gl.TEXTURE_2D, shared_gl.TEXTURE_MAG_FILTER, shared_gl.LINEAR);
      shared_gl.texParameteri(shared_gl.TEXTURE_2D, shared_gl.TEXTURE_WRAP_S, shared_gl.CLAMP_TO_EDGE);
      shared_gl.texParameteri(shared_gl.TEXTURE_2D, shared_gl.TEXTURE_WRAP_T, shared_gl.CLAMP_TO_EDGE);

      const feather_norm = feather_size / Math.min(img.width, img.height);
      shared_gl.uniform1f(u_feather, feather_norm);
      shared_gl.uniform1i(u_image, 0);
      shared_gl.drawArrays(shared_gl.TRIANGLE_STRIP, 0, 4);

      // Copy to output canvas
      const out_canvas = document.createElement("canvas");
      out_canvas.width = img.width;
      out_canvas.height = img.height;
      const out_ctx = out_canvas.getContext("2d");
      out_ctx.drawImage(shared_canvas, 0, 0);
      feathered_layer_images[i] = out_canvas;

      // Clean up texture
      shared_gl.deleteTexture(tex);
    }

    const end_time = performance.now();
    log(`[feather_preloader] Finished feathering ${images.length} layer images in ${(end_time - start_time).toFixed(1)} ms.`);

    callback(feathered_layer_images);
  });
}

// Attach to unified namespace
window.infinity_zoom_II.feather_preloader = {
  preload_and_feather_layers_only,
};
