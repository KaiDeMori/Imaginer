window.AUDIO_VOLUME_KEY = "imaginer_audio_volume";
window.FONT_SCALE_KEY = "imaginer_font_scale";

if (localStorage.getItem(window.AUDIO_VOLUME_KEY) === null) {
  localStorage.setItem(window.AUDIO_VOLUME_KEY, "1.0");
}

if (localStorage.getItem(window.FONT_SCALE_KEY) === null) {
  localStorage.setItem(window.FONT_SCALE_KEY, "1.0");
}

// Asset loading completion callback
let on_assets_loaded = null;

async function initialize_pre_intro() {
  const has_api_key = await check_for_api_key();

  if (has_api_key) {
    setup_audio_interface();
    setup_firefox_detection();
    start_asset_loading();
    await wait_for_font_and_show_ui();
  } else {
    setup_api_key_interface();
    await wait_for_font_and_show_api_key_ui();
  }
}

async function check_for_api_key() {
  return new Promise((resolve) => {
    import("../../storage/session_store.js")
      .then(({ Session_store }) => {
        const key = Session_store.get_api_key();
        resolve(key && key.trim().length > 0);
      })
      .catch(() => {
        resolve(false);
      });
  });
}

function setup_api_key_interface() {
  const input = document.getElementById("api_key_input_solo");
  const test_button = document.getElementById("api_key_test_solo");
  const message_div = document.getElementById("api_key_message");
  const ok_button = document.getElementById("api_key_ok");

  test_button.addEventListener("click", async () => {
    const key = input.value.trim();
    if (!key) return;

    test_button.disabled = true;
    test_button.textContent = "Testing...";
    message_div.textContent = "";

    const { Session_store } = await import("../../storage/session_store.js");

    try {
      const resp = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
      });

      if (!resp.ok) {
        message_div.textContent = "❌ Invalid API key";
        message_div.style.color = "#ff6666";
        ok_button.style.display = "none";
        return;
      }

      const data = await resp.json();
      const found = data.data.some((m) => m.id === "gpt-image-1");

      if (found) {
        Session_store.set_api_key(key);
        message_div.textContent = "✅ API key valid and ready!";
        message_div.style.color = "#66ff66";
        ok_button.style.display = "block";
      } else {
        message_div.textContent = "❌ Valid key but no gpt-image-1 access";
        message_div.style.color = "#ffaa66";
        ok_button.style.display = "none";
      }
    } catch (err) {
      message_div.textContent = "❌ Connection failed";
      message_div.style.color = "#ff6666";
      ok_button.style.display = "none";
    } finally {
      test_button.disabled = false;
      test_button.textContent = "Test";
    }
  });

  input.addEventListener("input", () => {
    message_div.textContent = "";
    ok_button.style.display = "none";
  });

  ok_button.addEventListener("click", () => {
    proceed_to_normal_flow();
  });
}

async function wait_for_font_and_show_api_key_ui() {
  const font_promises = [document.fonts.load("16px Orbitron")];
  await Promise.all(font_promises);

  const saved_font_scale = parseFloat(localStorage.getItem(window.FONT_SCALE_KEY));
  document.documentElement.style.setProperty("--font-scale", saved_font_scale.toString());
  document.body.classList.add("font-4");

  const api_key_interface = document.getElementById("api_key_interface");
  api_key_interface.style.display = "flex";
  api_key_interface.classList.add("fade_in");

  // Focus the input field after animation starts
  setTimeout(() => {
    const input = document.getElementById("api_key_input_solo");
    input.focus();
  }, 100);
}

function proceed_to_normal_flow() {
  const api_key_interface = document.getElementById("api_key_interface");
  api_key_interface.classList.add("fade_out");

  api_key_interface.addEventListener("transitionend", function handle_transition() {
    api_key_interface.removeEventListener("transitionend", handle_transition);
    api_key_interface.style.display = "none";

    setup_audio_interface();
    setup_firefox_detection();
    start_asset_loading();
    wait_for_font_and_show_ui();
  });
}

async function wait_for_font_and_show_ui() {
  console.log("Waiting for fonts to load...");

  // Wait for all fonts to load
  const font_promises = [
    document.fonts.load("16px Andika"),
    document.fonts.load("16px 'Comic Neue'"),
    document.fonts.load("16px 'Noto Sans'"),
    document.fonts.load("16px Orbitron"),
    document.fonts.load("16px Quicksand"),
  ];

  await Promise.all(font_promises);
  console.log("All fonts loaded.");

  // Apply saved font scale
  const saved_font_scale = parseFloat(localStorage.getItem(window.FONT_SCALE_KEY));
  document.documentElement.style.setProperty("--font-scale", saved_font_scale.toString());

  // Set default font (Orbitron - font 4)
  document.body.classList.add("font-4");

  // Now fade in the interface
  console.log("Fading in interface.");
  const interface_div = document.getElementById("audio_setup_interface");
  interface_div.classList.add("fade_in");
}

function setup_firefox_detection() {
  const firefox_warning_modal = document.getElementById("firefox_warning_modal");
  const firefox_continue = document.getElementById("firefox_continue");
  const firefox_icon = document.getElementById("firefox_icon");

  function show_firefox_warning() {
    firefox_warning_modal.style.display = "flex";
  }

  function hide_firefox_warning() {
    firefox_warning_modal.style.display = "none";
  }

  // Setup event listeners
  firefox_continue.addEventListener("click", hide_firefox_warning);

  // Modal click outside to close
  firefox_warning_modal.addEventListener("click", function (event) {
    if (event.target === firefox_warning_modal) {
      hide_firefox_warning();
    }
  });

  // Check browser and show warning/icon only if not Firefox
  if (!window.browser_detection.is_firefox()) {
    // Show Firefox icon (now an <a> tag, no click handler needed)
    firefox_icon.style.display = "block";

    // Show warning after a brief delay to let the page settle
    setTimeout(show_firefox_warning, 1500);
  }
}

function setup_audio_interface() {
  const blip_audio = document.getElementById("blip_audio");
  const test_button = document.getElementById("test_audio_button");
  const fullscreen_button = document.getElementById("fullscreen_button");
  const start_button = document.getElementById("start_button");
  const gentle_button = document.getElementById("gentle_button");
  const interface_div = document.getElementById("audio_setup_interface");
  const warning_help = document.getElementById("warning_help");
  const standard_warning_modal = document.getElementById("standard_warning_modal");
  const modal_close = document.getElementById("modal_close");
  const language_buttons = document.querySelectorAll(".language_button");
  const trigger_texts = document.querySelectorAll(".trigger_text");
  const api_key_input = document.getElementById("api_key_input");
  const api_key_test_button = document.getElementById("api_key_test_button");

  let blip_enabled = true;

  // Apply saved volume to audio element
  blip_audio.volume = parseFloat(localStorage.getItem(window.AUDIO_VOLUME_KEY));

  function play_blip() {
    if (blip_enabled) {
      blip_audio.currentTime = 0;
      blip_audio.play();
    }
  }

  function adjust_volume(delta) {
    // get from localStorage, adjust, clamp to [0, 1]
    const current_audio_volume = parseFloat(localStorage.getItem(window.AUDIO_VOLUME_KEY));
    const new_audio_volume = Math.max(0, Math.min(1, current_audio_volume + delta));
    // Save to localStorage
    localStorage.setItem(window.AUDIO_VOLUME_KEY, new_audio_volume.toString());

    // Apply to audio
    blip_audio.volume = new_audio_volume;
    // If we're in cinematic mode, update the cinematic audio too
    const cinematic_audio = document.getElementById("cinematic_audio");
    if (cinematic_audio) {
      cinematic_audio.volume = new_audio_volume;
    }

    console.log(`Audio volume set to ${new_audio_volume}`);

    play_blip();
  }

  function adjust_font_scale(delta) {
    // get from localStorage, adjust, clamp to [0.5, 2.0]
    const current_font_scale = parseFloat(localStorage.getItem(window.FONT_SCALE_KEY));
    const new_font_scale = Math.max(0.5, Math.min(2.0, current_font_scale + delta));
    // Save to localStorage
    localStorage.setItem(window.FONT_SCALE_KEY, new_font_scale.toString());

    // Apply to CSS variable
    document.documentElement.style.setProperty("--font-scale", new_font_scale.toString());

    console.log(`Font scale set to ${new_font_scale}`);
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

  function disable_all_action_buttons() {
    start_button.disabled = true;
    gentle_button.disabled = true;
    start_button.removeEventListener("click", handle_click);
    gentle_button.removeEventListener("click", handle_click);
  }

  function fade_out_and_then(callback) {
    interface_div.addEventListener("transitionend", function handleTransition() {
      if (getComputedStyle(interface_div).opacity === "0") {
        interface_div.removeEventListener("transitionend", handleTransition);
        callback();
      }
    });
    interface_div.classList.add("fade_out");
  }

  // Event listeners
  test_button.addEventListener("click", play_blip);
  fullscreen_button.addEventListener("click", toggle_fullscreen);
  warning_help.addEventListener("click", show_standard_warning);
  modal_close.addEventListener("click", hide_standard_warning);

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

  // Volume control, font scaling, and font switching via keyboard
  const volume_step = 0.02;
  const font_scale_step = 0.01;
  document.addEventListener("keydown", function (event) {
    // Font switching (works always, no audio condition)
    if (event.key >= "1" && event.key <= "5") {
      // Remove any existing font classes
      document.body.classList.remove("font-1", "font-2", "font-3", "font-4", "font-5");

      // Add the new font class
      document.body.classList.add(`font-${event.key}`);

      console.log(`Switched to font ${event.key}`);
      return; // Don't process other keys
    }

    // Font scaling (works always, no audio condition)
    if (event.key === "+" || event.key === "=" || event.code === "NumpadAdd") {
      event.preventDefault();
      adjust_font_scale(font_scale_step);
      return;
    } else if (event.key === "-" || event.code === "NumpadSubtract") {
      event.preventDefault();
      adjust_font_scale(-font_scale_step);
      return;
    }

    // Volume control (only when audio is ready)
    if (!blip_audio.ended) return;
    if (event.key === "ArrowUp") {
      event.preventDefault();
      adjust_volume(volume_step);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      adjust_volume(-volume_step);
    }
  }); // Start button - immediately set to loading state
  start_button.textContent = "Loading...";
  start_button.disabled = true;
  start_button.classList.remove("start_button");
  gentle_button.disabled = true;
  //gentle_button.classList.remove("gentle_button");

  function handle_click(gentle_mode = false) {
    console.log("Starting cinematic sequence in" + (gentle_mode ? " gentle mode." : " normal mode."));
    if (!window.cinematic_bridge) {
      console.error("Cinematic bridge not loaded!");
      return;
    }

    disable_all_action_buttons();
    document.body.classList.add("hide_cursor");
    blip_enabled = false;
    fade_out_and_then(() => {
      interface_div.remove();
    });
    window.cinematic_bridge.initialize_cinematic(gentle_mode); // true = gentle mode
  }

  // API key test functionality
  async function test_api_key() {
    const key = api_key_input.value.trim();
    if (!key) return;

    api_key_test_button.disabled = true;
    api_key_test_button.textContent = "Testing...";

    try {
      const resp = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
      });

      if (!resp.ok) {
        api_key_test_button.textContent = "👎";
        return;
      }

      const data = await resp.json();
      if (data && Array.isArray(data.data)) {
        const found = data.data.some((m) => m.id === "gpt-image-1");
        if (found) {
          api_key_test_button.textContent = "👍";
        } else {
          api_key_test_button.textContent = "😢";
        }
      } else {
        api_key_test_button.textContent = "👎";
      }
    } catch (err) {
      api_key_test_button.textContent = "👎";
    } finally {
      setTimeout(() => {
        api_key_test_button.disabled = false;
        api_key_test_button.textContent = "Test";
      }, 2000);
    }
  }

  // Wire up API key test button
  api_key_test_button.addEventListener("click", test_api_key);
  api_key_input.addEventListener("input", () => {
    api_key_test_button.textContent = "Test";
  });

  // Setup asset loading callback now that handle_click is defined
  on_assets_loaded = function () {
    start_button.addEventListener("click", handle_click);
    start_button.textContent = "Start";
    start_button.disabled = false;
    start_button.classList.add("start_button");
    gentle_button.addEventListener("click", handle_click.bind(null, true));
    gentle_button.disabled = false;
  };

  // Don't fade in here - wait for font loading to complete
}

function start_asset_loading() {
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
