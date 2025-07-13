// TRS (Translate, Rotate, Scale) utilities for Infinity Zoom II

// Calculate fitting TRS for an image in a canvas (touches viewport from inside)
function calculate_fitting_trs(img, canvas) {
  const img_aspect = img.width / img.height;
  const canvas_aspect = canvas.width / canvas.height;

  let scale;
  if (canvas_aspect > img_aspect) {
    // Wider viewport - fit height
    scale = canvas.height / img.height;
  } else {
    // Taller viewport - fit width
    scale = canvas.width / img.width;
  }

  return {
    center_x: canvas.width / 2,
    center_y: canvas.height / 2,
    scale: scale,
    rotation: 0,
  };
}

// Calculate covering TRS for an image in a canvas (fills entire viewport)
function calculate_covering_trs(img, canvas) {
  const img_aspect = img.width / img.height;
  const canvas_aspect = canvas.width / canvas.height;

  let scale;
  if (canvas_aspect > img_aspect) {
    // Wider viewport - fit width, crop top/bottom
    scale = canvas.width / img.width;
  } else {
    // Taller viewport - fit height, crop sides
    scale = canvas.height / img.height;
  }

  return {
    center_x: canvas.width / 2,
    center_y: canvas.height / 2,
    scale: scale,
    rotation: 0,
  };
}

// Linear interpolation between two TRS objects
function lerp_trs(trs1, trs2, t) {
  return {
    center_x: trs1.center_x + (trs2.center_x - trs1.center_x) * t,
    center_y: trs1.center_y + (trs2.center_y - trs1.center_y) * t,
    scale: trs1.scale + (trs2.scale - trs1.scale) * t,
    rotation: lerp_angle(trs1.rotation, trs2.rotation, t),
  };
}

// Angle interpolation with proper wrapping
function lerp_angle(angle1, angle2, t) {
  let diff = angle2 - angle1;
  if (diff > Math.PI) diff -= 2 * Math.PI;
  if (diff < -Math.PI) diff += 2 * Math.PI;
  return angle1 + diff * t;
}

// Convert TRS to a 3x3 transformation matrix for WebGL (-1 to 1 coordinates)
function trs_to_matrix(trs, img_width, img_height) {
  const cos_r = Math.cos(trs.rotation);
  const sin_r = Math.sin(trs.rotation);

  // Scale from image pixels to normalized device coordinates
  const scale_x = (trs.scale * img_width) / 2; // Scale to half-width
  const scale_y = (trs.scale * img_height) / 2; // Scale to half-height

  // Translation from center position to normalized coordinates
  const tx = (trs.center_x - (img_width * trs.scale) / 2) / (img_width / 2) - 1;
  const ty = -((trs.center_y - (img_height * trs.scale) / 2) / (img_height / 2) - 1); // Flip Y

  // Combined transformation matrix: translate * rotate * scale
  return [
    (scale_x * cos_r) / (img_width / 2),
    (-scale_y * sin_r) / (img_height / 2),
    0,
    (scale_x * sin_r) / (img_width / 2),
    (scale_y * cos_r) / (img_height / 2),
    0,
    tx,
    ty,
    1,
  ];
}

// Check if TRS represents covering behavior (fills entire viewport)
function is_trs_covering(trs, img, canvas) {
  const covering_trs = calculate_covering_trs(img, canvas);
  return trs.scale >= covering_trs.scale;
}

// Calculate rendered size of image with given TRS
function get_trs_render_size(trs, img) {
  const rendered_width = img.width * trs.scale;
  const rendered_height = img.height * trs.scale;
  return Math.min(rendered_width, rendered_height);
}

// Attach to namespace
window.infinity_zoom_II.utils.trs = {
  calculate_fitting_trs,
  calculate_covering_trs,
  lerp_trs,
  lerp_angle,
  trs_to_matrix,
  is_trs_covering,
  get_trs_render_size,
};
