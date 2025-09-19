const ABSOLUTE_BASE_DIRECTORY_INTRO = "/Imaginer/intro";

const ASSET_URLS_ORDERED = [
  "01/cinematic_starfield.css",
  "02/the_great_everywhere_shake.css",
  "01/cinematic_starfield_manager.js",
  "01/cinematic_starfield.js",
  "02/the_great_everywhere_shake.js",
  "00/cinematic_bridge.js",
  "00/phase_02_transition.js",
  "04/phase_04_transition.js",
  "audio/Also_sprach_Zarathustra.webm",
];

const ASSET_URLS_BULK = [
  // Add URLs here that can load in parallel
];

const asset_loader = {
  async start_loading(callback) {
    // Load ordered assets sequentially
    for (const relative_url of ASSET_URLS_ORDERED) {
      const url = `${ABSOLUTE_BASE_DIRECTORY_INTRO}/${relative_url}`;
      await this.load_asset(url);
    }

    // Load bulk assets in parallel (including phase 2 images)
    const bulk_promises = ASSET_URLS_BULK.map((relative_url) => {
      const url = `${ABSOLUTE_BASE_DIRECTORY_INTRO}/${relative_url}`;
      return this.load_asset(url);
    });

    // Also load phase 2 images in parallel
    const phase_2_promise = this.load_phase_2_images();

    await Promise.all([...bulk_promises, phase_2_promise]);

    callback();
  },

  async load_phase_2_images() {
    // Import phase 2 preloader module and use it directly
    const { load_and_decode_images } = await import("../03/preloader_module.js");

    // Load all phase 2 images - they'll be cached for instant access during transition
    await load_and_decode_images();
  },
  load_asset(url) {
    const extension = url.split(".").pop().toLowerCase();

    if (extension === "css") return this.load_css(url);
    if (extension === "js") return this.load_script(url);
    if (["webm", "mp3", "wav", "ogg"].includes(extension)) return this.load_audio(url);
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) return this.load_image(url);
  },

  load_css(url) {
    return new Promise((resolve) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      link.onload = resolve;
      document.head.appendChild(link);
    });
  },

  load_script(url) {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = url;
      script.onload = resolve;
      document.head.appendChild(script);
    });
  },

  load_image(url) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = resolve;
      image.src = url;
    });
  },

  async load_audio(url) {
    const response = await fetch(url);
    const array_buffer = await response.arrayBuffer();
    const audio_context = new AudioContext();
    const decoded_buffer = await audio_context.decodeAudioData(array_buffer);

    // Store for cinematic bridge
    window.decoded_audio_buffer = decoded_buffer;
    window.audio_context = audio_context;
  },
};

// Expose to global scope
window.asset_loader = asset_loader;
