// Invert a 3x3 matrix (returns new array)
function mat3_invert(m) {
  const a = m[0],
    b = m[1],
    c = m[2],
    d = m[3],
    e = m[4],
    f = m[5],
    g = m[6],
    h = m[7],
    i = m[8];
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const D = -(b * i - c * h);
  const E = a * i - c * g;
  const F = -(a * h - b * g);
  const G = b * f - c * e;
  const H = -(a * f - c * d);
  const I = a * e - b * d;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-12) return null;
  const invDet = 1 / det;
  return [A * invDet, D * invDet, G * invDet, B * invDet, E * invDet, H * invDet, C * invDet, F * invDet, I * invDet];
}

// Transform a 2D point [x, y] using a 3x3 matrix (returns {x, y})
function mat3_transform_point(m, pt) {
  const x = pt[0],
    y = pt[1];
  const tx = m[0] * x + m[3] * y + m[6];
  const ty = m[1] * x + m[4] * y + m[7];
  const tw = m[2] * x + m[5] * y + m[8];
  if (tw !== 0 && tw !== 1) {
    return { x: tx / tw, y: ty / tw };
  } else {
    return { x: tx, y: ty };
  }
}
// Math and matrix utility stubs for Infinity Zoom II

// Returns an aspect-correct 3x3 matrix for an image and canvas
function make_matrix(img, canvas) {
  const img_aspect = img.width / img.height;
  const canvas_aspect = canvas.width / canvas.height;

  // Use covering logic matching TRIALS code exactly
  if (canvas_aspect > img_aspect) {
    // Wider viewport - fit width, crop top/bottom
    const scale_y = canvas_aspect / img_aspect;
    return [1.0, 0, 0, 0, scale_y, 0, 0, 0, 1];
  } else {
    // Taller viewport - fit height, crop sides
    const scale_x = img_aspect / canvas_aspect;
    return [scale_x, 0, 0, 0, 1.0, 0, 0, 0, 1];
  }
}

// Returns a fitting 3x3 matrix for an image and canvas ("touching from inside")
function make_fitting_matrix(img, canvas) {
  const img_aspect = img.width / img.height;
  const canvas_aspect = canvas.width / canvas.height;

  // Use fitting logic: opposite of covering
  if (canvas_aspect > img_aspect) {
    // Wider viewport - fit height, show pillarbox bars on sides
    const scale_x = img_aspect / canvas_aspect;
    return [scale_x, 0, 0, 0, 1.0, 0, 0, 0, 1];
  } else {
    // Taller viewport - fit width, show letterbox bars on top/bottom
    const scale_y = canvas_aspect / img_aspect;
    return [1.0, 0, 0, 0, scale_y, 0, 0, 0, 1];
  }
}

function make_rotation_matrix(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}

function mat3_mul(a, b) {
  const r = new Array(9);
  for (let i = 0; i < 3; ++i) {
    for (let j = 0; j < 3; ++j) {
      r[i + j * 3] = a[0 + j * 3] * b[i + 0 * 3] + a[1 + j * 3] * b[i + 1 * 3] + a[2 + j * 3] * b[i + 2 * 3];
    }
  }
  return r;
}

/**
 * Compute the visible rectangle of the image as mapped to the canvas, given scale and rotation.
 * Returns an object with p0, p1, p2, p3 in image coordinates that map to the canvas corners.
 * @param {HTMLImageElement} image - The image object (with .width, .height)
 * @param {HTMLCanvasElement} canvas - The canvas element (with .width, .height)
 * @param {number} scale - The current scale applied to the image
 * @param {number} rotation - The current rotation (in radians)
 * @returns {object} Rectangle in image coordinates
 */
function compute_final_visible_rect(image, canvas, scale, rotation) {
  // Compose the forward transform: aspect -> scale -> rotation
  const aspect = window.infinity_zoom_II.utils.math.make_matrix(image, canvas);
  const scale_mat = [scale, 0, 0, 0, scale, 0, 0, 0, 1];
  const rot_mat = window.infinity_zoom_II.utils.math.make_rotation_matrix(rotation);
  // Forward: rot * scale * aspect
  let forward = window.infinity_zoom_II.utils.math.mat3_mul(rot_mat, window.infinity_zoom_II.utils.math.mat3_mul(scale_mat, aspect));
  // Invert to get canvas->image mapping
  const inv = window.infinity_zoom_II.utils.math.mat3_invert(forward);
  if (!inv) return null;
  // Canvas corners in pixel coordinates
  const w = canvas.width,
    h = canvas.height;
  // Map: p0 = (0,0), p1 = (w,0), p2 = (w,h), p3 = (0,h)
  const p0 = window.infinity_zoom_II.utils.math.mat3_transform_point(inv, [0, 0]);
  const p1 = window.infinity_zoom_II.utils.math.mat3_transform_point(inv, [w, 0]);
  const p2 = window.infinity_zoom_II.utils.math.mat3_transform_point(inv, [w, h]);
  const p3 = window.infinity_zoom_II.utils.math.mat3_transform_point(inv, [0, h]);
  return { p0, p1, p2, p3 };
}

window.infinity_zoom_II.utils.math = {
  make_matrix,
  make_rotation_matrix,
  mat3_mul,
  mat3_invert,
  mat3_transform_point,
  compute_final_visible_rect,
  make_fitting_matrix,
};
