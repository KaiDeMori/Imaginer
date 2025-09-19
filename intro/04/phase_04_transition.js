// Phase 4 Transition
// Seamlessly transitions from phase 3 (early universe formation) to phase 4 (infinity zoom)
// while preserving music continuity and managing canvas switchover

console.log("[Phase4Transition] Module loaded");

const ABSOLUTE_BASE_DIRECTORY_PHASE4 = "/Imaginer/intro/04";

// Phase 4 dependency loading order (critical - some files depend on others)
const PHASE_04_DEPENDENCIES = [
  "regions.js",
  "infinity_zoom_II_configs.js",
  "infinity_zoom_debug.js",
  "infinity_zoom_II_utils.js",
  "infinity_zoom_II_preloader.js",
  "infinity_zoom_II_featherer.js",
  "region_zoom_utils.js",
  "mystery_image_region_zoom.js",
  "region_zoom.js",
  "mystery_image_main_zoom.js",
  "infinity_zoom_II_engine.js", // MUST be last - depends on all others
];

class Phase4Transition {
  constructor() {
    this.transition_in_progress = false;
    this.phase_4_loaded = false;
    this.zarathustra_audio = null;
    this.bach_audio = null;
    this.saved_volume = 1.0;
    this.music_transition_complete = false;
    this.zarathustra_end_timestamp = null;
  }

  async start_transition(current_canvas) {
    if (this.transition_in_progress) {
      console.warn("[Phase4Transition] Transition already in progress");
      return;
    }

    console.log("[Phase4Transition] Starting transition from phase 3 to phase 4");
    this.transition_in_progress = true;

    // Connect to existing Zarathustra audio element
    this.zarathustra_audio = document.getElementById("cinematic_audio");
    console.log("[Phase4Transition] Connected to Zarathustra audio:", this.zarathustra_audio.currentTime, "/", this.zarathustra_audio.duration);

    // Step 1: Load Phase 4 dependencies while keeping black screen
    console.log("[Phase4Transition] Loading Phase 4 dependencies...");
    await this.load_phase_04_dependencies();

    // Step 2: Canvas switchover (2D -> WebGL)
    console.log("[Phase4Transition] Performing canvas switchover...");
    const new_canvas = this.perform_canvas_switchover(current_canvas);

    // Step 3: Initialize Phase 4 (planet intro begins immediately)
    console.log("[Phase4Transition] Initializing Phase 4...");
    await this.initialize_phase_4(new_canvas);

    // Step 4: Setup music transition logic
    console.log("[Phase4Transition] Setting up music transition...");
    this.setup_music_transition();

    console.log("[Phase4Transition] Transition complete - Phase 4 running with planet intro");

    this.transition_in_progress = false;
  }

  async load_phase_04_dependencies() {
    const load_promises = [];

    // Load all dependencies in order (sequential for dependencies, parallel where safe)
    for (const dependency of PHASE_04_DEPENDENCIES) {
      const script_url = `${ABSOLUTE_BASE_DIRECTORY_PHASE4}/${dependency}`;
      load_promises.push(this.load_script(script_url));
    }

    // Wait for all scripts to load
    await Promise.all(load_promises);

    console.log("[Phase4Transition] All Phase 4 dependencies loaded successfully");
    this.phase_4_loaded = true;
  }

  load_script(url) {
    return new Promise((resolve, reject) => {
      // Check if script already loaded
      const existing_script = document.querySelector(`script[src="${url}"]`);
      if (existing_script) {
        console.log(`[Phase4Transition] Script already loaded: ${url}`);
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = url;
      script.onload = () => {
        console.log(`[Phase4Transition] Loaded: ${url}`);
        resolve();
      };
      script.onerror = () => {
        console.error(`[Phase4Transition] Failed to load: ${url}`);
        reject(new Error(`Failed to load script: ${url}`));
      };
      document.head.appendChild(script);
    });
  }

  perform_canvas_switchover(old_canvas) {
    console.log("[Phase4Transition] Switching from 2D canvas to WebGL canvas");

    // Create new WebGL canvas with the ID that Phase 4 expects
    const new_canvas = document.createElement("canvas");
    new_canvas.id = "zoom_canvas";
    new_canvas.style.cssText = `
      display: block;
      width: 100vw;
      height: 100vh;
      background: #000;
      position: fixed;
      top: 0;
      left: 0;
    `;

    // Replace old canvas with new canvas
    old_canvas.parentNode.replaceChild(new_canvas, old_canvas);

    console.log("[Phase4Transition] Canvas switchover complete");
    return new_canvas;
  }

  async initialize_phase_4(canvas) {
    // Verify Phase 4 modules are available
    if (!window.infinity_zoom_II || !window.infinity_zoom_II.engine) {
      throw new Error("Phase 4 modules not properly loaded");
    }

    // Setup debug controls (like the standalone version)
    if (window.infinity_zoom_II.debug && window.infinity_zoom_II.debug.setup_controls) {
      window.infinity_zoom_II.debug.setup_controls();
      window.infinity_zoom_II.debug.apply_persisted_debug_values();
    }

    // Initialize the engine with our canvas
    console.log("[Phase4Transition] Creating Phase 4 engine...");
    window.infinity_zoom_II.engine.create(canvas);

    // Add keyboard shortcuts (like standalone version)
    this.setup_phase_4_keyboard_shortcuts();

    console.log("[Phase4Transition] Phase 4 engine initialized successfully");
  }

  setup_phase_4_keyboard_shortcuts() {
    document.addEventListener("keydown", (event) => {
      if (event.key === "r" || event.key === "R") {
        console.log("[Phase4Transition] Manual trigger: region zoom");
        window.infinity_zoom_II.FLAG_initiate_final_reveal = true;
      }
      if (event.key === "p" || event.key === "P") {
        console.log("[Phase4Transition] Manual trigger: pause animation");
        if (window.infinity_zoom_II.engine && window.infinity_zoom_II.engine.pause) {
          window.infinity_zoom_II.engine.pause();
        }
      }
    });
  }

  setup_music_transition() {
    // Create Bach audio element
    this.bach_audio = document.createElement("audio");
    this.bach_audio.id = "bach_audio";
    this.bach_audio.preload = "auto";
    this.bach_audio.volume = parseFloat(localStorage.getItem(window.AUDIO_VOLUME_KEY));

    // Add source for Bach Air
    const source = document.createElement("source");
    source.src = "../audio/Bach_Air.m4a";
    source.type = "audio/mp4";
    this.bach_audio.appendChild(source);

    // Add to document but don't play yet
    document.body.appendChild(this.bach_audio);

    // Start monitoring for music transition cue
    this.monitor_music_transition();
  }

  monitor_music_transition() {
    console.log("[Phase4Transition] Starting music transition monitoring");

    // Wait for both conditions:
    // 1. Zarathustra ends + 2s silence
    // 2. Phase 4 is in "hold" state (planet rotation ready)

    const music_promise = this.wait_for_zarathustra_end_plus_silence();
    const phase_promise = this.wait_for_phase_4_hold_state();

    Promise.all([music_promise, phase_promise]).then(() => {
      this.start_bach_and_main_zoom();
    });
  }

  wait_for_zarathustra_end_plus_silence() {
    return new Promise((resolve) => {
      // Check if already ended
      if (this.zarathustra_audio.ended || this.zarathustra_audio.currentTime >= this.zarathustra_audio.duration) {
        this.zarathustra_end_timestamp = performance.now();
        console.log("[Phase4Transition] Zarathustra already ended - starting 2s silence from now");
        setTimeout(resolve, 2000);
        return;
      }

      // Wait for end event
      const on_ended = () => {
        this.zarathustra_end_timestamp = performance.now();
        console.log("[Phase4Transition] Zarathustra ended at timestamp:", this.zarathustra_end_timestamp);
        this.zarathustra_audio.removeEventListener("ended", on_ended);
        setTimeout(resolve, 2000);
      };

      this.zarathustra_audio.addEventListener("ended", on_ended);

      console.log("[Phase4Transition] Waiting for Zarathustra to end. Current time:", this.zarathustra_audio.currentTime, "/", this.zarathustra_audio.duration);
    });
  }

  wait_for_phase_4_hold_state() {
    return new Promise((resolve) => {
      const check_phase_state = () => {
        if (window.infinity_zoom_II.engine.animation_phase === "hold") {
          console.log("[Phase4Transition] Phase 4 reached hold state - ready for main zoom");
          resolve();
        } else {
          setTimeout(check_phase_state, 100);
        }
      };

      check_phase_state();
    });
  }

  start_bach_and_main_zoom() {
    const current_time = performance.now();
    const silence_duration = current_time - this.zarathustra_end_timestamp;
    console.log("[Phase4Transition] 🎵 Starting Bach Air and main zoom sequence! 🎵");
    console.log("[Phase4Transition] Silence duration achieved:", silence_duration.toFixed(0), "ms (required: 2000ms)");

    // Start Bach Air
    this.bach_audio.currentTime = 0;
    this.bach_audio.play();
    console.log("[Phase4Transition] Bach Air started");

    // Signal that music is ready for main zoom
    window.phase_4_music_ready = true;

    // Set engine state for immediate transition
    window.infinity_zoom_II.engine.animation_phase = "main_zoom";
    window.infinity_zoom_II.engine.main_zoom_start_time = performance.now();
    console.log("[Phase4Transition] Main zoom sequence initiated");

    this.music_transition_complete = true;
  }
}

// Create global instance
const phase_4_transition = new Phase4Transition();

// Expose to global scope for phase 3 to call
window.transition_to_phase_4 = (canvas) => {
  phase_4_transition.start_transition(canvas);
};

console.log("[Phase4Transition] Module ready - window.transition_to_phase_4() available");
