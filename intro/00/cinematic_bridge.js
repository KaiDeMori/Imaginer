// Cinematic bridge - loaded dynamically after all assets are ready
let cinematic_audio;

function start_sequence() {
  cinematic_audio.currentTime = 0;
  cinematic_audio.play();
  initialize_starfield();
  window.cinematic_starfield_manager.start_cinematic_sequence();
}

function initialize_cinematic(gentle_mode = false) {
  cinematic_audio = document.getElementById("cinematic_audio");

  // Store gentle mode for shake animation access
  window.gentle_mode = gentle_mode;

  // Apply the volume set during pre-intro
  cinematic_audio.volume = parseFloat(localStorage.getItem(window.AUDIO_VOLUME_KEY));

  // Start the cinematic sequence
  audio_manager.start_sequence();
}

// Audio manager interface (for compatibility with existing code)
const audio_manager = {
  start_sequence,
  get_audio: () => cinematic_audio,
  initialize_cinematic: (gentle_mode) => initialize_cinematic(gentle_mode),
  restore_cursor: () => document.body.classList.remove("hide_cursor"),
};

// Expose to global scope
window.cinematic_bridge = {
  start_sequence,
  initialize_cinematic: (gentle_mode) => initialize_cinematic(gentle_mode),
};

window.audio_manager = audio_manager;
