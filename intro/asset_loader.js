const ASSET_URLS_ORDERED = [
  "01/cinematic_starfield.css",
  "02/the_great_everywhere_shake.css",
  "01/cinematic_starfield_manager.js",
  "01/cinematic_starfield.js",
  "02/the_great_everywhere_shake.js",
  "cinematic_bridge.js",
  "audio/Also_sprach_Zarathustra.webm",
];

const ASSET_URLS_BULK = [
  // Add URLs here that can load in parallel
];

const asset_loader = {
  async start_loading(callback) {
    // Load ordered assets sequentially
    for (const url of ASSET_URLS_ORDERED) {
      await this.load_asset(url);
    }

    // Load bulk assets in parallel
    await Promise.all(ASSET_URLS_BULK.map((url) => this.load_asset(url)));

    callback();
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
