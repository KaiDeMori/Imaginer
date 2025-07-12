const DEBUG = true;
const LOG_PREFIX = " 🌀 — ";

function log(msg, obj) {
  if (!DEBUG) return;
  if (obj !== undefined) {
    console.info(LOG_PREFIX + msg, obj);
  } else {
    console.info(LOG_PREFIX + msg);
  }
}

// Standardized debug helper for matrix comparison
function log_matrix_debug(source, canvas, image, matrix, scale, rotation) {
  if (window._matrix_debug_logged) return;
  window._matrix_debug_logged = true;

  log("=== " + source + " DEBUG ===");
  log("canvas: " + canvas.width + "x" + canvas.height + " aspect: " + (canvas.width / canvas.height).toFixed(3));
  if (image) {
    log("image: " + image.width + "x" + image.height + " aspect: " + (image.width / image.height).toFixed(3));
  }
  log("DPR: " + (window.devicePixelRatio || 1) + " window: " + window.innerWidth + "x" + window.innerHeight);
  if (scale !== undefined && rotation !== undefined) {
    log("scale: " + scale + " rotation: " + rotation.toFixed(6));
  }
  log("matrix: [" + matrix[0].toFixed(6) + ", " + matrix[4].toFixed(6) + "]");
  log("=== END " + source + " ===");
}

// Enhanced debug function for canvas dimension comparison
function log_canvas_comparison(source, canvas) {
  if (window._canvas_comparison_logged) return;
  window._canvas_comparison_logged = true;

  const dpr = window.devicePixelRatio || 1;
  const css_width = window.innerWidth;
  const css_height = window.innerHeight;
  const expected_buffer_width = css_width * dpr;
  const expected_buffer_height = css_height * dpr;

  log("=== " + source + " CANVAS COMPARISON ===");
  log("CSS dimensions: " + css_width + "x" + css_height);
  log("Canvas buffer: " + canvas.width + "x" + canvas.height);
  log("DPR: " + dpr);
  log("Expected buffer: " + expected_buffer_width + "x" + expected_buffer_height);
  log("Buffer matches expected: " + (canvas.width === expected_buffer_width && canvas.height === expected_buffer_height));
  log("CSS aspect: " + (css_width / css_height).toFixed(6));
  log("Buffer aspect: " + (canvas.width / canvas.height).toFixed(6));
  log("=== END " + source + " CANVAS ===");
}

// Enhanced debug function for matrix comparison using different canvas sources
function log_matrix_comparison(source, image, actual_canvas) {
  if (window._matrix_comparison_logged) return;
  window._matrix_comparison_logged = true;

  const css_canvas = { width: window.innerWidth, height: window.innerHeight };

  // Calculate matrices using both approaches
  const matrix_css = window.infinity_zoom_II.utils.math.make_matrix(image, css_canvas);
  const matrix_buffer = window.infinity_zoom_II.utils.math.make_matrix(image, actual_canvas);

  log("=== " + source + " MATRIX COMPARISON ===");
  log("CSS canvas: " + css_canvas.width + "x" + css_canvas.height + " → matrix: [" + matrix_css[0].toFixed(6) + ", " + matrix_css[4].toFixed(6) + "]");
  log(
    "Buffer canvas: " +
      actual_canvas.width +
      "x" +
      actual_canvas.height +
      " → matrix: [" +
      matrix_buffer[0].toFixed(6) +
      ", " +
      matrix_buffer[4].toFixed(6) +
      "]"
  );
  log("Matrices identical: " + (Math.abs(matrix_css[0] - matrix_buffer[0]) < 0.000001 && Math.abs(matrix_css[4] - matrix_buffer[4]) < 0.000001));
  log("=== END " + source + " MATRIX ===");

  return { css: matrix_css, buffer: matrix_buffer };
}

// Debug function for identifying where different canvas sources are used
function log_canvas_usage(location, canvas_source, dimensions) {
  if (window._canvas_usage_logged) return;
  window._canvas_usage_logged = true;

  log("CANVAS USAGE at " + location + ": " + canvas_source + " (" + dimensions.width + "x" + dimensions.height + ")");
}

if (!window.infinity_zoom_II) window.infinity_zoom_II = {};
if (!window.infinity_zoom_II.debug) window.infinity_zoom_II.debug = {};
window.infinity_zoom_II.debug.log = log;
window.infinity_zoom_II.debug.log_matrix_debug = log_matrix_debug;
window.infinity_zoom_II.debug.log_canvas_comparison = log_canvas_comparison;
window.infinity_zoom_II.debug.log_matrix_comparison = log_matrix_comparison;
window.infinity_zoom_II.debug.log_canvas_usage = log_canvas_usage;

// Create global shortcuts for easier debugging
window.log_canvas_comparison = log_canvas_comparison;
window.log_matrix_comparison = log_matrix_comparison;
window.log_canvas_usage = log_canvas_usage;

if (DEBUG) {
  log("[debug] Enhanced debug system enabled with canvas comparison tools");
}
