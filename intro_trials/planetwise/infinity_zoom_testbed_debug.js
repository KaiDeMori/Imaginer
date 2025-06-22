const DEBUG = true;
const LOG_PREFIX = ' 🌀 — ';

function log(msg) {
    if (!DEBUG) return;
    console.info(LOG_PREFIX + msg);
}

function log_loaded_images(images) {
    if (!DEBUG) return;
    log(`Infinity Zoom: Loaded ${images.length} images!`);
    images.forEach((img, i) => {
        log(`[${i + 1}/${images.length}] → ${img.src}`);
    });
}