let audio_ready = false;
let starfield_manager_ready = false;
let cinematic_audio = null;

function check_and_start_sequence() {
  console.log(`Audio ready: ${audio_ready}, Starfield ready: ${starfield_manager_ready}`);
  if (audio_ready && starfield_manager_ready) {
    console.log("Starting audio and starfield animation");
    cinematic_audio.currentTime = 0;
    cinematic_audio.play();
    window.cinematic_starfield_manager.start_cinematic_sequence();
  }
}

function initialize_audio() {
  console.log("Initializing audio...");
  cinematic_audio = document.getElementById("cinematic_audio");
  
  cinematic_audio.addEventListener("canplaythrough", () => {
    console.log("Audio ready");
    audio_ready = true;
    check_and_start_sequence();
  });
  
  cinematic_audio.load();
}function mark_starfield_ready() {
  starfield_manager_ready = true;
  check_and_start_sequence();
}

window.audio_manager = {
  initialize_audio,
  mark_starfield_ready,
  get_audio: () => cinematic_audio,
};
