// Audio management for cinematic sequences
let audio_ready = false;
let starfield_manager_ready = false;
let cinematic_audio = null;

// Callbacks to execute when audio is ready
const audio_ready_callbacks = [];

function check_and_start_sequence() {
  if (audio_ready && starfield_manager_ready) {
    // Start audio and animation together
    cinematic_audio.currentTime = 0; // Reset to beginning
    cinematic_audio.play().catch((e) => {
      console.warn("Audio autoplay failed - user interaction required:", e);
      // Add click handler for manual start
      document.addEventListener(
        "click",
        () => {
          cinematic_audio.play();
          window.cinematic_starfield_manager.start_cinematic_sequence();
        },
        { once: true }
      );
      return;
    });

    window.cinematic_starfield_manager.start_cinematic_sequence();

    // Execute any additional callbacks
    audio_ready_callbacks.forEach((callback) => callback());
  }
}

// Initialize audio system
function initialize_audio() {
  // Get audio element and set up preloading
  cinematic_audio = document.getElementById("cinematic_audio");

  // Wait for audio to be fully loaded
  cinematic_audio.addEventListener("canplaythrough", () => {
    console.log("Audio fully preloaded and ready");
    audio_ready = true;
    check_and_start_sequence();
  });

  // Handle audio loading errors
  cinematic_audio.addEventListener("error", (e) => {
    console.error("Audio loading failed:", e);
    // Start without audio as fallback
    audio_ready = true;
    check_and_start_sequence();
  });

  // Force audio loading
  cinematic_audio.load();
}

// Mark starfield manager as ready and check if we can start
function mark_starfield_ready() {
  starfield_manager_ready = true;
  check_and_start_sequence();
}

// Add callback to execute when audio is ready
function add_audio_ready_callback(callback) {
  audio_ready_callbacks.push(callback);
}

// Expose functions globally
window.audio_manager = {
  initialize_audio,
  mark_starfield_ready,
  add_audio_ready_callback,
  get_audio: () => cinematic_audio,
};
