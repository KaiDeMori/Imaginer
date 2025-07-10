// texture_region_zoom_utils.js
// Utility functions for matrix math, interpolation, and helpers for texture region zoom

// Matrix math (column-major 3x3)
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

// Interpolation helpers
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

function ease_in_out_exponential(a, b, t, is_angle) {
  t = Math.min(Math.max(t, 0), 1);
  if (t === 0) return a;
  if (t === 1) return b;
  if (t < 0.5) return lerp(a, b, 0.5 * Math.pow(2, 20 * t - 10), is_angle);
  return lerp(a, b, 1 - 0.5 * Math.pow(2, -20 * t + 10), is_angle);
}

// Animation matrix builder
function build_trs_matrix(trs, w, h) {
  const proj = mat_ortho(w, h);
  return mat_mul(
    proj,
    mat_mul(mat_mul(mat_mul(mat_translate(w * 0.5, h * 0.5), mat_scale(trs.scale)), mat_rotate(trs.theta)), mat_translate(-trs.center_x, -trs.center_y))
  );
}

// Attach all helpers to window.infinity_zoom_II.utils.texture_region_zoom
window.infinity_zoom_II.utils.texture_region_zoom = {
  mat_mul,
  mat_translate,
  mat_scale,
  mat_rotate,
  mat_ortho,
  lerp,
  ease_linear,
  ease_in_out_cubic,
  ease_in_out_exponential,
  build_trs_matrix,
};
