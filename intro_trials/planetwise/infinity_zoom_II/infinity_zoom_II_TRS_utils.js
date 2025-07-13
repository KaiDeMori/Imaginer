// TRS (Translate, Rotate, Scale) utilities for Infinity Zoom II

// Calculate fitting TRS for an image in a canvas (native 1:1 aspect ratio)
function calculate_fitting_trs(img, canvas) {
  // For native 1:1 aspect ratio, no aspect ratio corrections!
  // Image displays at its natural proportions without distortion
  return {
    center_x: 0, // Normalized coordinates: center of viewport
    center_y: 0, // Normalized coordinates: center of viewport
    scale: 1.0, // Native scale - no squeezing
    rotation: 0,
  };
}

// Calculate covering TRS for an image in a canvas (native 1:1 aspect ratio)
function calculate_covering_trs(img, canvas) {
  // For native 1:1 aspect ratio, no aspect ratio corrections!
  // Image displays at its natural proportions without distortion
  return {
    center_x: 0, // Normalized coordinates: center of viewport
    center_y: 0, // Normalized coordinates: center of viewport
    scale: 1.0, // Native scale - no squeezing
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

// Convert TRS to a 3x3 transformation matrix for WebGL
function trs_to_matrix(trs, img_width, img_height) {
  const cos_r = Math.cos(trs.rotation);
  const sin_r = Math.sin(trs.rotation);

  // Keep images at native 1:1 aspect ratio - no distortion!
  const scale_x = trs.scale;
  const scale_y = trs.scale;

  // Build transformation matrix: translate * rotate * scale
  return [scale_x * cos_r, -scale_y * sin_r, 0, scale_x * sin_r, scale_y * cos_r, 0, trs.center_x, trs.center_y, 1];
}

// Check if TRS represents covering behavior (fills entire viewport)
function is_trs_covering(trs, img, canvas) {
  const covering_trs = calculate_covering_trs(img, canvas);
  return trs.scale >= covering_trs.scale;
}

// Calculate rendered size of image with given TRS (in viewport terms)
function get_trs_render_size(trs, img, canvas) {
  // Convert normalized scale back to pixel size for visibility checking
  const viewport_scale = trs.scale * Math.min(canvas.width, canvas.height);
  return viewport_scale;
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
