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
  const fullscreen_button = document.getElementById("fullscreen_button");
  const start_button = document.getElementById("start_button");
  const interface_div = document.getElementById("audio_setup_interface");
  const warning_help = document.getElementById("warning_help");
  const standard_warning_modal = document.getElementById("standard_warning_modal");
  const modal_close = document.getElementById("modal_close");

  let blip_enabled = true;

  function play_blip() {
    if (blip_enabled) {
      blip_audio.currentTime = 0;
      blip_audio.play();
    }
  }

  function adjust_volume(delta) {
    blip_audio.volume = Math.max(0, Math.min(1, blip_audio.volume + delta));
    cinematic_audio.volume = blip_audio.volume;
    play_blip();
  }

  function toggle_fullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          fullscreen_button.textContent = "Exit Fullscreen";
        })
        .catch(() => {
          // Fullscreen not supported, just play blip
          play_blip();
        });
    } else {
      document.exitFullscreen().then(() => {
        fullscreen_button.textContent = "Fullscreen";
      });
    }
  }

  test_button.addEventListener("click", play_blip);

  fullscreen_button.addEventListener("click", toggle_fullscreen);

  function show_standard_warning() {
    standard_warning_modal.style.display = "flex";
  }

  function hide_standard_warning() {
    standard_warning_modal.style.display = "none";
  }

  warning_help.addEventListener("click", show_standard_warning);
  modal_close.addEventListener("click", hide_standard_warning);

  // Close modal when clicking outside of it
  standard_warning_modal.addEventListener("click", function (event) {
    if (event.target === standard_warning_modal) {
      hide_standard_warning();
    }
  });

  start_button.addEventListener("click", function () {
    blip_enabled = false;
    interface_div.style.display = "none";
    // Hide cursor during animation
    document.body.classList.add("hide_cursor");
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
  restore_cursor: () => document.body.classList.remove("hide_cursor"),
};
