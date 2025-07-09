// region_zoom_animator.js
// Provides region zoom animation and matrix helpers for WebGL image/canvas transitions.
// No canvas passing; always use an existing WebGL context.

// Matrix helpers (column-major 3x3)
function mat_mul(a, b) {
  const c = new Float32Array(9);
  for (let i = 0; i < 3; ++i)
    for (let j = 0; j < 3; ++j) {
      let s = 0;
      for (let k = 0; k < 3; ++k) s += a[i + k * 3] * b[k + j * 3];
      c[i + j * 3] = s;
    }
  return c;
}
function mat_translate(tx, ty) {
  return new Float32Array([1, 0, 0, 0, 1, 0, tx, ty, 1]);
}
function mat_scale(s) {
  return new Float32Array([s, 0, 0, 0, s, 0, 0, 0, 1]);
}
function mat_rotate(a) {
  const c = Math.cos(a),
    s = Math.sin(a);
  return new Float32Array([c, s, 0, -s, c, 0, 0, 0, 1]);
}
function mat_ortho(w, h) {
  return new Float32Array([2 / w, 0, 0, 0, -2 / h, 0, -1, 1, 1]);
}

// Interpolation and easing
function lerp(a, b, t, is_angle) {
  if (is_angle) {
    let d = b - a;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return a + d * t;
  } else {
    return a * (1 - t) + b * t;
  }
}
function ease_linear(a, b, t, is_angle) {
  t = Math.min(Math.max(t, 0), 1);
  return lerp(a, b, t, is_angle);
}
function ease_in_out_cubic(a, b, t, is_angle) {
  t = Math.min(Math.max(t, 0), 1);
  if (t < 0.5) {
    return lerp(a, b, 4 * t * t * t, is_angle);
  } else {
    return lerp(a, b, 1 - Math.pow(-2 * t + 2, 3) / 2, is_angle);
  }
}

// Main animator factory
function create_region_zoom_animator(params) {
  // params: {
  //   gl: WebGLRenderingContext,
  //   uniform_matrix: WebGLUniformLocation,
  //   region_rect: {p0,p1,p2,p3},
  //   texture_side: number,
  //   initial_rotation: number,
  //   anim_duration: number (ms),
  //   ease_strategy: function,
  //   ease_strategy_angle: function
  // }
  const {
    gl,
    uniform_matrix,
    region_rect,
    texture_side,
    initial_rotation = 0,
    anim_duration = 1600,
    ease_strategy = ease_in_out_cubic,
    ease_strategy_angle = ease_in_out_cubic,
  } = params;
  let animating = false;
  let anim_t = 0;
  let anim_dir = 1;
  let anim_start_time = 0;
  let showing_region = false;
  let trs_start, trs_end;

  function build_trs_matrix(trs, w, h) {
    const proj = mat_ortho(w, h);
    return mat_mul(
      proj,
      mat_mul(
        mat_mul(
          mat_mul(mat_translate(w * 0.5, h * 0.5), mat_scale(trs.scale)),
          mat_rotate(trs.theta)
        ),
        mat_translate(-trs.center_x, -trs.center_y)
      )
    );
  }

  function build_matrices(w, h) {
    const proj = mat_ortho(w, h);
    const center_start = { x: texture_side * 0.5, y: texture_side * 0.5 };
    const d_canvas = Math.sqrt(w * w + h * h);
    const scale_start = d_canvas / texture_side;
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
  }

  function animate_step(ts, canvas) {
    if (!animating) return;
    if (!anim_start_time) anim_start_time = ts;
    let t = (ts - anim_start_time) / anim_duration;
    t = Math.min(Math.max(t, 0), 1);
    anim_t = anim_dir === 1 ? t : 1 - t;
    const trs = {
      center_x: ease_strategy(
        trs_start.center_x,
        trs_end.center_x,
        anim_t,
        false
      ),
      center_y: ease_strategy(
        trs_start.center_y,
        trs_end.center_y,
        anim_t,
        false
      ),
      scale: ease_strategy(trs_start.scale, trs_end.scale, anim_t, false),
      theta: ease_strategy_angle(trs_start.theta, trs_end.theta, anim_t, true),
    };
    const mat = build_trs_matrix(trs, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniformMatrix3fv(uniform_matrix, false, mat);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (t < 1) {
      requestAnimationFrame((ts2) => animate_step(ts2, canvas));
    } else {
      animating = false;
      showing_region = anim_dir === 1;
    }
  }

  function start_animation(dir, canvas) {
    if (animating) return;
    animating = true;
    anim_dir = dir;
    anim_start_time = 0;
    build_matrices(canvas.width, canvas.height);
    requestAnimationFrame((ts) => animate_step(ts, canvas));
  }

  function draw(canvas) {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const mat = build_trs_matrix(
      showing_region ? trs_end : trs_start,
      canvas.width,
      canvas.height
    );
    gl.uniformMatrix3fv(uniform_matrix, false, mat);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  return {
    start_animation,
    draw,
    is_animating: () => animating,
    is_showing_region: () => showing_region,
  };
}

// Export
window.create_region_zoom_animator = create_region_zoom_animator;
