// Constants
const AUDIO_VOLUME_KEY = "imaginer_audio_volume";

// Global volume storage for both audio elements
let global_audio_volume = parseFloat(localStorage.getItem(AUDIO_VOLUME_KEY)) || 1.0;

// Asset loading completion callback
let on_assets_loaded = null;

async function initialize_pre_intro() {
  // Wait for font before showing UI
  await document.fonts.load("16px Orbitron");

  // Font is ready, setup the UI
  setup_audio_interface();

  // Start background asset loading
  start_asset_loading();
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
  const language_buttons = document.querySelectorAll(".language_button");
  const trigger_texts = document.querySelectorAll(".trigger_text");
  const skip_button = document.getElementById("skip_button");

  let blip_enabled = true;

  // Apply saved volume to audio element
  blip_audio.volume = global_audio_volume;

  function play_blip() {
    if (blip_enabled) {
      blip_audio.currentTime = 0;
      blip_audio.play();
    }
  }

  function adjust_volume(delta) {
    global_audio_volume = Math.max(0, Math.min(1, global_audio_volume + delta));
    blip_audio.volume = global_audio_volume;

    // Save to localStorage
    localStorage.setItem(AUDIO_VOLUME_KEY, global_audio_volume.toString());

    // If we're in cinematic mode, update the cinematic audio too
    if (!blip_enabled) {
      window.audio_manager.get_audio().volume = global_audio_volume;
    }

    // Update global reference for cinematic bridge
    window.global_audio_volume = global_audio_volume;
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
          play_blip();
        });
    } else {
      document.exitFullscreen().then(() => {
        fullscreen_button.textContent = "Fullscreen";
      });
    }
  }

  function show_standard_warning() {
    standard_warning_modal.style.display = "flex";
  }

  function hide_standard_warning() {
    standard_warning_modal.style.display = "none";
  }

  function switch_language(lang) {
    language_buttons.forEach((button) => button.classList.remove("active"));
    trigger_texts.forEach((text) => text.classList.remove("active"));

    const selected_button = document.querySelector(`.language_button[data-lang="${lang}"]`);
    const selected_text = document.querySelector(`.trigger_text[data-lang="${lang}"]`);

    if (selected_button && selected_text) {
      selected_button.classList.add("active");
      selected_text.classList.add("active");
    }
  }

  function skip_intro() {
    // Fade out before skipping
    interface_div.classList.add("fade_out");

    // Wait for fade-out to complete before navigating
    setTimeout(() => {
      window.location.href = "about:blank";
    }, 1000); // Wait 1s for fade-out transition
  }

  // Event listeners
  test_button.addEventListener("click", play_blip);
  fullscreen_button.addEventListener("click", toggle_fullscreen);
  warning_help.addEventListener("click", show_standard_warning);
  modal_close.addEventListener("click", hide_standard_warning);
  skip_button.addEventListener("click", skip_intro);

  // Language switching
  language_buttons.forEach((button) => {
    button.addEventListener("click", function () {
      const lang = this.getAttribute("data-lang");
      switch_language(lang);
    });
  });

  // Modal click outside to close
  standard_warning_modal.addEventListener("click", function (event) {
    if (event.target === standard_warning_modal) {
      hide_standard_warning();
    }
  });

  // Volume control via keyboard
  document.addEventListener("keydown", function (event) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      adjust_volume(0.1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      adjust_volume(-0.1);
    }
  });

  // Start button - immediately set to loading state
  start_button.textContent = "Loading...";
  start_button.disabled = true;
  start_button.classList.remove("start_button");

  start_button.addEventListener("click", function () {
    if (!window.cinematic_bridge) {
      console.error("Cinematic bridge not loaded!");
      return;
    }

    blip_enabled = false;

    // Fade out before hiding
    interface_div.classList.add("fade_out");

    // Wait for fade-out to complete before hiding and starting cinematic
    setTimeout(() => {
      interface_div.style.display = "none";
      document.body.classList.add("hide_cursor");

      // Call the dynamically loaded cinematic bridge
      window.cinematic_bridge.initialize_cinematic();
    }, 1000); // Wait 1s for fade-out transition
  });

  // Trigger fade-in now that setup is complete
  setTimeout(() => {
    interface_div.classList.add("fade_in");
  }, 100); // Small delay to ensure CSS is applied
}

function start_asset_loading() {
  // This will be called by asset_loader.js when complete
  on_assets_loaded = function () {
    const start_button = document.getElementById("start_button");
    start_button.textContent = "Start";
    start_button.disabled = false;
    start_button.classList.add("start_button");
  };

  // Load the asset loader and start loading
  const script = document.createElement("script");
  script.src = "asset_loader.js";
  script.onload = function () {
    window.asset_loader.start_loading(on_assets_loaded);
  };
  document.head.appendChild(script);
}

// Start everything when page loads
window.addEventListener("load", initialize_pre_intro);

// Expose global volume for cinematic bridge
window.global_audio_volume = global_audio_volume;
