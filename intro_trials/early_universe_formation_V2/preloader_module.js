"use strict";
/*
Preloader module – Early Universe Formation (V2)
------------------------------------------------
Implements deterministic image pre-loading / decoding and exposes a
`load_and_decode_images` promise that resolves to a `Map<string, ImageBitmap>`
containing the fully prepared bitmaps.

The module is framework-free and intended to be included **before** any other
rendering logic. After the returned promise settles, other modules can safely
assume that every texture is ready for instantaneous use.
*/

// ---------------------------------------------------------------------------------
// 1. Asset manifest (deterministic, consolidated list) -----------------------------
// ---------------------------------------------------------------------------------

// Utility to create zero-padded numbers e.g. pad("01", 2) => "01"
function pad(num, len = 2) {
  return String(num).padStart(len, "0");
}


// Generate manifest lists for all PNGs in each asset subdirectory (no "big" distinction)
const asset_manifest = (() => {
  const base = "/assets/ai_universe";
  const subdirs = [
    "cosmic_fog",
    "galaxy_streams",
    "nebulae",
    "star_clusters",
    "alien_planet"
  ];
  const list = [];

  // For each subdirectory, add all PNGs (no "big" distinction)
  // If you want to make this dynamic, you could fetch the file list from the server.
  // For now, we hardcode the known PNGs for each subdir (except planet, which is a single file)

  // cosmic_fog (5 textures)
  for (let i = 1; i <= 5; i++) {
    list.push(`${base}/cosmic_fog/${pad(i)}.png`);
  }

  // galaxy_streams (4 textures)
  for (let i = 1; i <= 4; i++) {
    list.push(`${base}/galaxy_streams/${pad(i)}.png`);
  }

  // nebulae (9 textures)
  for (let i = 1; i <= 9; i++) {
    list.push(`${base}/nebulae/${pad(i)}.png`);
  }

  // star_clusters (3 textures)
  for (let i = 1; i <= 3; i++) {
    list.push(`${base}/star_clusters/${pad(i)}.png`);
  }

  // planet hero texture (single file)
  list.push(`${base}/alien_planet/planet_totale.png`);

  return list;
})();

// Freeze to guard against accidental mutation.
Object.freeze(asset_manifest);

// ---------------------------------------------------------------------------------
// 2. Internal state ---------------------------------------------------------------
// ---------------------------------------------------------------------------------

// Holds mapping of `url -> ImageBitmap` after decoding / conversion.
const preloaded_bitmaps = new Map();

// Simple progress helpers
let _progress_callback = null; // (loadedCount, totalCount) => void

function _fire_progress(loaded, total) {
  if (typeof _progress_callback === "function") {
    try { _progress_callback(loaded, total); } catch (_) { /* swallow */ }
  }
}

// ---------------------------------------------------------------------------------
// 3. Public: load_and_decode_images -----------------------------------------------
// ---------------------------------------------------------------------------------

/**
 * Preloads every asset defined in `asset_manifest`, waits for decode, converts
 * to `ImageBitmap`, and stores the result in `preloaded_bitmaps`.
 *
 * @param {Function} [onProgress] – Optional callback `(loadedCount, totalCount)`
 *                                  fired after each successful image decode.
 * @returns {Promise<Map<string, ImageBitmap>>} – Resolves when all assets are
 *                                               decoded + converted.
 */
function load_and_decode_images(onProgress) {
  _progress_callback = typeof onProgress === "function" ? onProgress : null;

  const total = asset_manifest.length;
  let loaded = 0;

  const loaders = asset_manifest.map(src => new Promise((resolve, reject) => {
    const img = new Image();

    // CORS note: if the assets are served with proper CORS headers, you may
    // uncomment the following line. For same-origin setups it is unnecessary.
    // img.crossOrigin = "anonymous";

    img.src = src;

    // Generic error listener ------------------------------------------------------
    function _on_error(err) {
      console.error(`[Preloader] Failed to load: ${src}`, err);
      // We keep the reference to avoid memory leaks.
      img.remove();
      reject(err || new Error(`Image failed to load: ${src}`));
    }

    img.onerror = _on_error;

    // Start the decode pipeline ---------------------------------------------------
    // Some browsers require explicit wait on load event before decode(); others
    // resolve immediately. We guard with a catch.
    const decode_promise = (img.decode ? img.decode() : Promise.resolve())
      .catch(() => new Promise(res => img.addEventListener("load", res)));

    decode_promise
      .then(() => createImageBitmap(img))
      .then(bitmap => {
        preloaded_bitmaps.set(src, bitmap);
        // Keep memory usage low – the <img> element isn't needed post-decode.
        img.remove();
        loaded += 1;
        _fire_progress(loaded, total);
        resolve(bitmap);
      })
      .catch(_on_error);
  }));

  return Promise.all(loaders).then(() => preloaded_bitmaps);
}

// ---------------------------------------------------------------------------------
// 4. Debug / Dev helpers -----------------------------------------------------------
// ---------------------------------------------------------------------------------

/**
 * Prints a concise summary of the current `preloaded_bitmaps` registry to the
 * developer console. Additionally, if a global `window.universe_animator` is
 * present, it logs whether the animation loop is *running* or *paused* so that
 * testers can quickly verify the animator state without switching contexts.
 *
 * Usage (from DevTools):
 *   > debug_preloader();
 */
function debug_preloader() {
  const count = preloaded_bitmaps.size;
  if (!count) {
    console.info("[debug_preloader] No ImageBitmaps have been registered yet. Did you await load_and_decode_images()?");
    return;
  }

  let total_pixels = 0;
  preloaded_bitmaps.forEach(bmp => {
    total_pixels += bmp.width * bmp.height;
  });
  const total_bytes = total_pixels * 4; // RGBA8 → 4 bytes per pixel
  const total_mib   = total_bytes / (1024 * 1024);

  console.groupCollapsed(`[debug_preloader] ${count} ImageBitmaps – ≈ ${total_mib.toFixed(1)} MiB VRAM`);
  preloaded_bitmaps.forEach((bmp, src) => {
    console.log(`${src} → ${bmp.width}×${bmp.height}`);
  });
  console.groupEnd();

  // ---------------------------------------------------------------------------
  // Extra reporter: UniverseAnimator state ------------------------------------
  // ---------------------------------------------------------------------------
  if (typeof window !== "undefined" && window.universe_animator) {
    const ua = window.universe_animator;
    const running = (typeof ua.is_running === "function") ? ua.is_running() : false;
    console.info(`[debug_preloader] UniverseAnimator is currently ${running ? "running" : "paused"}.`);
  } else if (typeof window !== "undefined") {
    console.info("[debug_preloader] UniverseAnimator has not been initialised yet.");
  }
}

// Expose helpers in dev environments ---------------------------------------------
if (typeof window !== "undefined") {
  window.preloader_module = {
    asset_manifest,
    preloaded_bitmaps,
    load_and_decode_images,
    debug_preloader,
  };
  // Direct global shortcut
  window.debug_preloader = debug_preloader;
}

export { asset_manifest, preloaded_bitmaps, load_and_decode_images, debug_preloader };