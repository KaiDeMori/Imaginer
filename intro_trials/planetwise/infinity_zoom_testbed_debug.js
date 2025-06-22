function log_loaded_images(images) {
    if (!DEBUG) return;
    console.info(`${LOG_PREFIX}Infinity Zoom: Loaded ${images.length} images!`);
    images.forEach((img, i) => {
        console.info(`${LOG_PREFIX}[${i + 1}/${images.length}] → ${img.src}`);
    });
}
const DEBUG = true;
const LOG_PREFIX = ' 🌀 — ';
