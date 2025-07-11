//Finally working.

// Config for texture region zoom
window.infinity_zoom_II.config.region_zoom = {
  anim_duration: 4000,
  region_rect: {
    p0: { x: 1152, y: 1125 },
    p1: { x: 1014, y: 1136 },
    p2: { x: 1004, y: 1036 },
    p3: { x: 1142, y: 1024 },
  },
};

// Engine-driven texture region zoom API
window.infinity_zoom_II.texture_region_zoom = (function () {
  // Use helpers from namespace
  const { mat_mul, mat_translate, mat_scale, mat_rotate, mat_ortho, lerp, ease_linear, ease_in_out_cubic, ease_in_out_exponential, build_trs_matrix } =
    window.infinity_zoom_II.utils.texture_region_zoom;

  //We are only ever zooming IN (-1 would be zooming out)
  const anim_dir = 1;

  // Internal state
  let gl_ctx, gl_program, uniform_matrix;
  let image_width;
  let start_matrix, end_matrix;
  let trs_start, trs_end;
  let showing_region = false;
  let animating = false;
  let anim_start_time = 0;
  let ease_strategy = ease_in_out_cubic;
  let ease_strategy_angle = ease_in_out_cubic;
  let initial_rotation;
  let on_complete_callbacks = null;
  let config = null;

  function build_matrices(w, h) {
    const proj = mat_ortho(w, h);
    const center_start = { x: image_width * 0.5, y: image_width * 0.5 };
    const d_canvas = Math.sqrt(w * w + h * h);
    const scale_start = d_canvas / image_width;
    const a_start = mat_mul(
      mat_mul(mat_mul(mat_translate(w * 0.5, h * 0.5), mat_scale(scale_start)), mat_rotate(initial_rotation)),
      mat_translate(-center_start.x, -center_start.y)
    );
    start_matrix = mat_mul(proj, a_start);
    // Region axes
    const region_rect = config.region_rect;
    const vx = region_rect.p1.x - region_rect.p0.x;
    const vy = region_rect.p1.y - region_rect.p0.y;
    const ux = region_rect.p3.x - region_rect.p0.x;
    const uy = region_rect.p3.y - region_rect.p0.y;
    const region_w = Math.hypot(vx, vy);
    const region_h = Math.hypot(ux, uy);
    const region_theta = Math.atan2(vy, vx);
    const center_end = {
      x: (region_rect.p0.x + region_rect.p2.x) * 0.5,
      y: (region_rect.p0.y + region_rect.p2.y) * 0.5,
    };
    const scale_end = Math.max(w / region_w, h / region_h);
    trs_start = {
      center_x: center_start.x,
      center_y: center_start.y,
      scale: scale_start,
      theta: initial_rotation,
    };
    trs_end = {
      center_x: center_end.x,
      center_y: center_end.y,
      scale: scale_end,
      theta: -region_theta,
    };
    const a_end = mat_mul(
      mat_mul(mat_mul(mat_translate(w * 0.5, h * 0.5), mat_scale(scale_end)), mat_rotate(-region_theta)),
      mat_translate(-center_end.x, -center_end.y)
    );
    end_matrix = mat_mul(proj, a_end);
  }

  // Draws the current texture region zoom frame
  function draw_texture_region_zoom(matrix) {
    gl_ctx.clearColor(0, 0, 0, 1);
    gl_ctx.clear(gl_ctx.COLOR_BUFFER_BIT);
    gl_ctx.uniformMatrix3fv(uniform_matrix, false, matrix);
    gl_ctx.drawArrays(gl_ctx.TRIANGLE_STRIP, 0, 4);
  }

  function animate_step(ts) {
    if (!animating) return;
    if (!anim_start_time) anim_start_time = ts;
    let t = (ts - anim_start_time) / config.anim_duration;
    t = Math.min(Math.max(t, 0), 1);
    // For zooming in, we want to interpolate from 0 to 1 ('1 - t' would be zooming out)
    const animation_time_factor = t;
    // Interpolate TRS
    const trs = {
      center_x: ease_strategy(trs_start.center_x, trs_end.center_x, animation_time_factor, false),
      center_y: ease_strategy(trs_start.center_y, trs_end.center_y, animation_time_factor, false),
      scale: ease_strategy(trs_start.scale, trs_end.scale, animation_time_factor, false),
      theta: ease_strategy_angle(trs_start.theta, trs_end.theta, animation_time_factor, true),
    };
    // Build and set matrix
    const mat = build_trs_matrix(trs, gl_ctx.drawingBufferWidth, gl_ctx.drawingBufferHeight);
    draw_texture_region_zoom(mat);
    if (t < 1) {
      requestAnimationFrame(animate_step);
    } else {
      animating = false;
      showing_region = anim_dir === 1;
      if (on_complete_callbacks) on_complete_callbacks(showing_region);
    }
  }

  /**
   * Starts the region zoom animation for the final and previous image layers.
   * Both layers must have {image, texture} properties. The final image is rendered on top of the previous.
   * previous_rotation is in radians. on_complete is called when the animation finishes.
   */
  function start_texture_region_zoom(gl, canvas, final_layer, previous_layer, previous_rotation, on_complete) {
    gl_ctx = gl;
    config = window.infinity_zoom_II.config.region_zoom;
    on_complete_callbacks = on_complete;

    initial_rotation = previous_rotation;
    log("initial_rotation", initial_rotation);

    const vs_src = `precision mediump float;attribute vec2 a_position;attribute vec2 a_tex;uniform mat3 u_matrix;varying vec2 v_tex;void main(){vec3 p=u_matrix*vec3(a_position,1.0);gl_Position=vec4(p.xy,0.0,1.0);v_tex=a_tex;}`;
    // No Y-flip: input is always upright
    const fs_src = `precision mediump float;varying vec2 v_tex;uniform sampler2D u_texture;void main(){gl_FragColor=texture2D(u_texture,v_tex);}`;
    const vs = gl_ctx.createShader(gl_ctx.VERTEX_SHADER);
    gl_ctx.shaderSource(vs, vs_src);
    gl_ctx.compileShader(vs);
    const fs = gl_ctx.createShader(gl_ctx.FRAGMENT_SHADER);
    gl_ctx.shaderSource(fs, fs_src);
    gl_ctx.compileShader(fs);
    gl_program = gl_ctx.createProgram();
    gl_ctx.attachShader(gl_program, vs);
    gl_ctx.attachShader(gl_program, fs);
    gl_ctx.linkProgram(gl_program);
    gl_ctx.useProgram(gl_program);
    uniform_matrix = gl_ctx.getUniformLocation(gl_program, "u_matrix");

    // Use the final_layer for geometry setup (assume both layers are same size)
    image_width = final_layer.image.width;
    // Setup geometry
    const pos = new Float32Array([0, 0, image_width, 0, 0, image_width, image_width, image_width]);
    // Flip V coordinate in UVs to compensate for Y-flip during texture upload
    const uv = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);
    const pos_buf = gl_ctx.createBuffer();
    gl_ctx.bindBuffer(gl_ctx.ARRAY_BUFFER, pos_buf);
    gl_ctx.bufferData(gl_ctx.ARRAY_BUFFER, pos, gl_ctx.STATIC_DRAW);
    const loc_pos = gl_ctx.getAttribLocation(gl_program, "a_position");
    gl_ctx.enableVertexAttribArray(loc_pos);
    gl_ctx.vertexAttribPointer(loc_pos, 2, gl_ctx.FLOAT, false, 0, 0);
    const uv_buf = gl_ctx.createBuffer();
    gl_ctx.bindBuffer(gl_ctx.ARRAY_BUFFER, uv_buf);
    gl_ctx.bufferData(gl_ctx.ARRAY_BUFFER, uv, gl_ctx.STATIC_DRAW);
    const loc_uv = gl_ctx.getAttribLocation(gl_program, "a_tex");
    gl_ctx.enableVertexAttribArray(loc_uv);
    gl_ctx.vertexAttribPointer(loc_uv, 2, gl_ctx.FLOAT, false, 0, 0);
    // Build matrices
    build_matrices(canvas.width, canvas.height);
    animating = true;
    anim_start_time = 0;
    requestAnimationFrame(animate_step);
  }

  // API: draw static texture region zoom (for engine-driven redraws)
  function draw_static_texture_region_zoom(show_region) {
    draw_texture_region_zoom(show_region ? end_matrix : start_matrix);
  }

  // API: resize handler
  function resize_texture_region_zoom(w, h) {
    if (!gl_ctx) return;
    gl_ctx.viewport(0, 0, w, h);
    build_matrices(w, h);
  }

  return {
    start_texture_region_zoom,
    draw_static_texture_region_zoom,
    resize_texture_region_zoom,
  };
})();
