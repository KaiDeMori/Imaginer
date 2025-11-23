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

  // Check if feather size value is persisted
  const feather_size = window.infinity_zoom_II.debug.recall_value("feather_size");
  if (feather_size !== null) {
    // If feather size is 0, set to undefined; otherwise use the numeric value
    config.feather_size = feather_size === 0 ? undefined : feather_size;
  }

  // Check if region selection is persisted
  const selected_region = window.infinity_zoom_II.debug.recall_value("selected_region");
  if (selected_region !== null) {
    config.region_zoom.region_rect = window.infinity_zoom_II.regions[selected_region];
  }
}

function create_debug_elements() {
  // Check if debug div already exists
  if (document.getElementById("debug_div")) {
    return; // Already created
  }

  // Create the debug div with inline styles
  const debug_div = document.createElement("div");
  debug_div.id = "debug_div";
  debug_div.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    border: 2px solid green;
    background-color: wheat;
    padding: 10px;
    z-index: 1000;
    display: none; /* Hidden by default */
  `;

  // Toggle visibility with "d" key
  window.addEventListener("keydown", (ev) => {
    // Ignore if typing in an input
    const tgt = ev.target;
    if (tgt && (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.isContentEditable)) {
      return;
    }

    if (ev.key === "d") {
      debug_div.style.display = debug_div.style.display === "none" ? "block" : "none";
    }
  });

  // Create reload button
  const reload_button = document.createElement("button");
  reload_button.textContent = "Reload";
  reload_button.onclick = () => location.reload(true);
  debug_div.appendChild(reload_button);

  // Create trigger final reveal button
  const trigger_button = document.createElement("button");
  trigger_button.textContent = "trigger final reveal";
  trigger_button.onclick = () => (window.infinity_zoom_II.FLAG_initiate_final_reveal = true);
  debug_div.appendChild(trigger_button);

  // Add line break
  debug_div.appendChild(document.createElement("br"));

  // Create global rotation checkbox with label
  const rotation_label = document.createElement("label");
  const rotation_checkbox = document.createElement("input");
  rotation_checkbox.type = "checkbox";
  rotation_checkbox.id = "global_rotation_enabled";
  rotation_label.appendChild(rotation_checkbox);
  rotation_label.appendChild(document.createTextNode(" Global rotation enabled"));
  debug_div.appendChild(rotation_label);

  // Add line break
  debug_div.appendChild(document.createElement("br"));

  // Create feather size input with label
  const feather_label = document.createElement("label");
  feather_label.appendChild(document.createTextNode("Feather Size: "));
  const feather_input = document.createElement("input");
  feather_input.type = "number";
  feather_input.id = "feather_size";
  feather_input.min = "0";
  feather_input.step = "1";
  feather_input.style.width = "60px";
  feather_label.appendChild(feather_input);
  debug_div.appendChild(feather_label);

  // Add line break
  debug_div.appendChild(document.createElement("br"));

  // Create region select with label
  const region_label = document.createElement("label");
  region_label.appendChild(document.createTextNode("Region: "));
  const region_select = document.createElement("select");
  region_select.id = "region_select";
  region_label.appendChild(region_select);
  debug_div.appendChild(region_label);

  // Append to body
  document.body.appendChild(debug_div);
}

function setup_debug_controls() {
  // Inject debug elements dynamically
  create_debug_elements();

  const rotation_checkbox = document.getElementById("global_rotation_enabled");
  const feather_size_input = document.getElementById("feather_size");
  const region_select = document.getElementById("region_select");

  // Restore rotation checkbox state
  const saved_rotation_state = recall_debug_value("global_rotation_enabled", true);
  rotation_checkbox.checked = saved_rotation_state;

  // Add event listener to persist rotation changes
  rotation_checkbox.addEventListener("change", function () {
    persist_debug_value("global_rotation_enabled", rotation_checkbox.checked);
  });

  // Restore feather size input state
  const saved_feather_size = recall_debug_value("feather_size", 30);
  // Display 0 if undefined, otherwise show the actual value
  feather_size_input.value = saved_feather_size === undefined ? "0" : saved_feather_size.toString();

  // Add event listener to persist feather size changes
  feather_size_input.addEventListener("input", function () {
    const value = parseInt(feather_size_input.value);
    if (!isNaN(value) && value >= 0) {
      // Store 0 as 0, other values as numbers
      persist_debug_value("feather_size", value);
      // Update config immediately: 0 becomes undefined, others stay as numbers
      window.infinity_zoom_II.config.feather_size = value === 0 ? undefined : value;
    }
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
