function process_images_with_feathering(images, feather_size, callback) {
  const feathered_images = new Array(images.length);
  const shared_canvas = document.createElement("canvas");
  let shared_gl = null;
  let shared_prog = null;
  let shared_buf = null;
  let a_pos = null;
  let a_tex = null;
  let u_image = null;
  let u_feather = null;

  function init_shared_gl(width, height) {
    shared_canvas.width = width;
    shared_canvas.height = height;
    shared_gl = shared_canvas.getContext("webgl");

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
      varying vec2 v_tex;
      uniform sampler2D u_image;
      uniform float u_feather;
      void main() {
        vec4 color = texture2D(u_image, v_tex);
        float feather = u_feather;
        float edge_dist = min(min(v_tex.x, 1.0 - v_tex.x), min(v_tex.y, 1.0 - v_tex.y));
        float corner_radius = feather;
        float alpha = 1.0;
        bool in_corner = false;
        float d_corner = 0.0;
        
        if (v_tex.x < corner_radius && v_tex.y < corner_radius) {
          in_corner = true;
          d_corner = length(v_tex - vec2(corner_radius, corner_radius));
        } else if (v_tex.x > 1.0 - corner_radius && v_tex.y < corner_radius) {
          in_corner = true;
          d_corner = length(v_tex - vec2(1.0 - corner_radius, corner_radius));
        } else if (v_tex.x < corner_radius && v_tex.y > 1.0 - corner_radius) {
          in_corner = true;
          d_corner = length(v_tex - vec2(corner_radius, 1.0 - corner_radius));
        } else if (v_tex.x > 1.0 - corner_radius && v_tex.y > 1.0 - corner_radius) {
          in_corner = true;
          d_corner = length(v_tex - vec2(1.0 - corner_radius, 1.0 - corner_radius));
        }
        
        if (in_corner) {
          alpha = smoothstep(feather, 0.0, d_corner);
        } else {
          alpha = smoothstep(0.0, feather, edge_dist);
        }
        
        // Debug: feather to pure green instead of transparency
        // vec3 debug_green = vec3(0.0, 1.0, 0.0);
        // vec3 final_color = mix(debug_green, color.rgb, alpha);
        // gl_FragColor = vec4(final_color, color.a);
        
        float out_alpha = color.a * alpha;
        gl_FragColor = vec4(color.rgb * out_alpha, out_alpha);
      }
    `;

    function compile(type, src) {
      const s = shared_gl.createShader(type);
      shared_gl.shaderSource(s, src);
      shared_gl.compileShader(s);
      return s;
    }

    const shared_vs = compile(shared_gl.VERTEX_SHADER, vert_src);
    const shared_fs = compile(shared_gl.FRAGMENT_SHADER, frag_src);
    shared_prog = shared_gl.createProgram();
    shared_gl.attachShader(shared_prog, shared_vs);
    shared_gl.attachShader(shared_prog, shared_fs);
    shared_gl.linkProgram(shared_prog);
    shared_gl.useProgram(shared_prog);

    const pos = new Float32Array([-1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1]);
    shared_buf = shared_gl.createBuffer();
    shared_gl.bindBuffer(shared_gl.ARRAY_BUFFER, shared_buf);
    shared_gl.bufferData(shared_gl.ARRAY_BUFFER, pos, shared_gl.STATIC_DRAW);

    a_pos = shared_gl.getAttribLocation(shared_prog, "a_pos");
    a_tex = shared_gl.getAttribLocation(shared_prog, "a_tex");
    shared_gl.enableVertexAttribArray(a_pos);
    shared_gl.vertexAttribPointer(a_pos, 2, shared_gl.FLOAT, false, 16, 0);
    shared_gl.enableVertexAttribArray(a_tex);
    shared_gl.vertexAttribPointer(a_tex, 2, shared_gl.FLOAT, false, 16, 8);

    u_image = shared_gl.getUniformLocation(shared_prog, "u_image");
    u_feather = shared_gl.getUniformLocation(shared_prog, "u_feather");
  }

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const this_feather = i === 0 ? 0 : feather_size;

    init_shared_gl(img.width, img.height);

    const tex = shared_gl.createTexture();
    shared_gl.bindTexture(shared_gl.TEXTURE_2D, tex);
    shared_gl.pixelStorei(shared_gl.UNPACK_FLIP_Y_WEBGL, true);
    shared_gl.texImage2D(shared_gl.TEXTURE_2D, 0, shared_gl.RGBA, shared_gl.RGBA, shared_gl.UNSIGNED_BYTE, img);
    shared_gl.texParameteri(shared_gl.TEXTURE_2D, shared_gl.TEXTURE_MIN_FILTER, shared_gl.LINEAR);
    shared_gl.texParameteri(shared_gl.TEXTURE_2D, shared_gl.TEXTURE_MAG_FILTER, shared_gl.LINEAR);
    shared_gl.texParameteri(shared_gl.TEXTURE_2D, shared_gl.TEXTURE_WRAP_S, shared_gl.CLAMP_TO_EDGE);
    shared_gl.texParameteri(shared_gl.TEXTURE_2D, shared_gl.TEXTURE_WRAP_T, shared_gl.CLAMP_TO_EDGE);

    shared_gl.uniform1i(u_image, 0);
    shared_gl.uniform1f(u_feather, this_feather / Math.max(img.width, img.height));
    shared_gl.viewport(0, 0, img.width, img.height);
    shared_gl.clear(shared_gl.COLOR_BUFFER_BIT);
    shared_gl.drawArrays(shared_gl.TRIANGLE_STRIP, 0, 4);

    const out_canvas = document.createElement("canvas");
    out_canvas.width = img.width;
    out_canvas.height = img.height;
    const out_ctx = out_canvas.getContext("2d");
    out_ctx.drawImage(shared_canvas, 0, 0);
    feathered_images[i] = out_canvas;

    shared_gl.deleteTexture(tex);
  }

  callback(feathered_images);
}

window.infinity_zoom_II.featherer = {
  process_images_with_feathering,
};
