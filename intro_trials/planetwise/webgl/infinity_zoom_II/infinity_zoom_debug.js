const DEBUG = true;
const LOG_PREFIX = ' 🌀 — ';

function log(msg) {
   if (!DEBUG) return;
   console.info(LOG_PREFIX + msg);
}

if (DEBUG) {
   log('[debug] Debug mode is enabled. log() is globally available.');
}