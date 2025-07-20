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

  // Check if feather enabled value is persisted
  const feather_enabled = window.infinity_zoom_II.debug.recall_value("feather_enabled");
  if (feather_enabled !== null) {
    // If feather is disabled, set feather_size to undefined
    config.feather_size = feather_enabled ? 300 : undefined;
  }

  // Check if region selection is persisted
  const selected_region = window.infinity_zoom_II.debug.recall_value("selected_region");
  if (selected_region !== null) {
    config.region_zoom.region_rect = window.infinity_zoom_II.regions[selected_region];
  }
}

function setup_debug_controls() {
  const rotation_checkbox = document.getElementById("global_rotation_enabled");
  const feather_checkbox = document.getElementById("feather_enabled");
  const region_select = document.getElementById("region_select");

  // Restore rotation checkbox state
  const saved_rotation_state = recall_debug_value("global_rotation_enabled", true);
  rotation_checkbox.checked = saved_rotation_state;

  // Add event listener to persist rotation changes
  rotation_checkbox.addEventListener("change", function () {
    persist_debug_value("global_rotation_enabled", rotation_checkbox.checked);
  });

  // Restore feather checkbox state
  const saved_feather_state = recall_debug_value("feather_enabled", true);
  feather_checkbox.checked = saved_feather_state;

  // Add event listener to persist feather changes
  feather_checkbox.addEventListener("change", function () {
    persist_debug_value("feather_enabled", feather_checkbox.checked);
  });

  // Populate region dropdown dynamically
  const region_keys = Object.keys(window.infinity_zoom_II.regions);
  region_keys.forEach(function (key) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    region_select.appendChild(option);
  });

  // Restore region selection state
  const saved_region = recall_debug_value("selected_region", "original");
  region_select.value = saved_region;

  // Add event listener to persist region changes
  region_select.addEventListener("change", function () {
    persist_debug_value("selected_region", region_select.value);
  });
}

window.infinity_zoom_II.debug.persist_value = persist_debug_value;
window.infinity_zoom_II.debug.recall_value = recall_debug_value;
window.infinity_zoom_II.debug.apply_persisted_debug_values = apply_persisted_debug_values;
window.infinity_zoom_II.debug.setup_controls = setup_debug_controls;
