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
  log("[debug] Debug mode is enabled. log() is available as window.infinity_zoom_II.debug.log");
}
