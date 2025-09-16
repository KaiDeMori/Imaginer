let cinematic_audio;

function start_sequence() {
  cinematic_audio.currentTime = 0;
  cinematic_audio.play();
  initialize_starfield();
  window.cinematic_starfield_manager.start_cinematic_sequence();
}

function initialize_cinematic() {
  cinematic_audio = document.getElementById("cinematic_audio");
  audio_manager.start_sequence();
}

function setup_audio_interface() {
  const blip_audio = document.getElementById("blip_audio");
  const test_button = document.getElementById("test_audio_button");
  const start_button = document.getElementById("start_button");
  const interface_div = document.getElementById("audio_setup_interface");

  function play_blip() {
    blip_audio.currentTime = 0;
    blip_audio.play();
  }

  function adjust_volume(delta) {
    blip_audio.volume = Math.max(0, Math.min(1, blip_audio.volume + delta));
    cinematic_audio.volume = blip_audio.volume;
    play_blip();
  }

  test_button.addEventListener("click", play_blip);

  start_button.addEventListener("click", function () {
    interface_div.style.display = "none";
    initialize_cinematic();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      adjust_volume(0.1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      adjust_volume(-0.1);
    }
  });
}

window.addEventListener("load", function () {
  cinematic_audio = document.getElementById("cinematic_audio");
  setup_audio_interface();
});

window.audio_manager = {
  start_sequence,
  get_audio: () => cinematic_audio,
  initialize_cinematic,
};
