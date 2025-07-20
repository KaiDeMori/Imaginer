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

if (!window.infinity_zoom_II) window.infinity_zoom_II = {};
if (!window.infinity_zoom_II.debug) window.infinity_zoom_II.debug = {};
window.infinity_zoom_II.debug.log = log;

if (DEBUG) {
  log("[debug] Debug system enabled");
}

// Helper functions for persisting debug configuration
function persist_debug_value(key, value) {
  if (!DEBUG) return;
  localStorage.setItem(`infinity_zoom_debug_${key}`, JSON.stringify(value));
}

function recall_debug_value(key, default_value = null) {
  if (!DEBUG) return default_value;
  const stored_value = localStorage.getItem(`infinity_zoom_debug_${key}`);
  if (stored_value !== null) {
    const value = JSON.parse(stored_value);
    return value;
  }
  return default_value;
}

function apply_persisted_debug_values() {
  const config = window.infinity_zoom_II.config;
  // Check if global rotation enabled value is persisted
  const global_rotation_enabled = window.infinity_zoom_II.debug.recall_value("global_rotation_enabled");
  if (global_rotation_enabled !== null) {
    // If rotation is disabled, set rotation_speed to 0
    config.rotation_speed = global_rotation_enabled ? config.rotation_speed : 0;
  }
}

function setup_debug_controls() {
  const checkbox = document.getElementById("global_rotation_enabled");

  // Restore checkbox state
  const saved_state = recall_debug_value("global_rotation_enabled", true);
  checkbox.checked = saved_state;

  // Add event listener to persist changes
  checkbox.addEventListener("change", function () {
    persist_debug_value("global_rotation_enabled", checkbox.checked);
  });
}

window.infinity_zoom_II.debug.persist_value = persist_debug_value;
window.infinity_zoom_II.debug.recall_value = recall_debug_value;
window.infinity_zoom_II.debug.apply_persisted_debug_values = apply_persisted_debug_values;
window.infinity_zoom_II.debug.setup_controls = setup_debug_controls;
