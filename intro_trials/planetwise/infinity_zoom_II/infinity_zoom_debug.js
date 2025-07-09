const DEBUG = true;
const LOG_PREFIX = ' 🌀 — ';

function log(msg, obj) {
   if (!DEBUG) return;
   if (obj !== undefined) {
      console.info(LOG_PREFIX + msg, obj);
   } else {
      console.info(LOG_PREFIX + msg);
   }
}

if (DEBUG) {
   log('[debug] Debug mode is enabled. log() is globally available.');
}