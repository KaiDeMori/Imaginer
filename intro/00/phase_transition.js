// Phase Transition Orchestrator
// Seamlessly transitions from phase 1 (starfield + shake) to phase 2 (universe formation)
// while preserving music continuity and canvas state

let transition_in_progress = false;

async function transition_to_phase_2() {
  console.info("transition_to_phase_2");
  if (transition_in_progress) {
    return;
  }

  transition_in_progress = true;

  // Get elements that must survive the transition
  const audio_element = document.getElementById("cinematic_audio");
  const canvas_element = document.getElementById("cinematic_canvas");

  // Stop phase 1 animations before cleaning up DOM
  if (window.cinematic_starfield_manager) {
    window.cinematic_starfield_manager.stop_cinematic_sequence();
  }
  if (window.stop_shake_animation) {
    window.stop_shake_animation();
  }

  // Clean up phase 1 DOM elements (keep audio and canvas)
  const elements_to_remove = Array.from(document.body.children).filter((el) => el.id !== "cinematic_audio" && el.id !== "cinematic_canvas");
  elements_to_remove.forEach((el) => el.remove());

  // Create white overlay for gradual fade to universe
  const white_overlay = document.createElement("div");
  white_overlay.id = "whiteScreen";
  white_overlay.style.position = "fixed";
  white_overlay.style.inset = "0";
  white_overlay.style.background = "#ffffff";
  white_overlay.style.transition = "opacity 2s ease-in-out";
  white_overlay.style.zIndex = "9999";
  document.body.appendChild(white_overlay);

  // Load phase 2 CSS
  const css_link = document.createElement("link");
  css_link.rel = "stylesheet";
  css_link.href = "../03/early_universe_formation_V2.css";
  document.head.appendChild(css_link);

  // Wait for CSS to load
  await new Promise((resolve) => {
    css_link.onload = resolve;
  });

  // Load and initialize phase 2 JS modules
  const { initialize_early_universe_v2 } = await import("../03/early_universe_formation_V2.js");

  // Initialize phase 2 with existing canvas and white overlay for fade
  initialize_early_universe_v2(canvas_element, white_overlay);

  transition_in_progress = false;
}

// Expose to global scope for phase 1 to call
window.transition_to_phase_2 = transition_to_phase_2;
