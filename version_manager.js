// version_manager.js
// Handles version tracking and user-facing update messages

import { version_message_modal } from "./components/version_message_modal.js";

const VERSION_STORAGE_KEY = "imaginer_app_version";

// Fetch version config from server (cache-busted)
async function get_version_config() {
  try {
    const response = await fetch(`version.json?t=${Date.now()}`);
    if (!response.ok) throw new Error("Failed to fetch version.json");
    return await response.json();
  } catch (e) {
    console.error("Could not load version config:", e);
    return null;
  }
}

function compare_versions(left_version, right_version) {
  const left_segments = left_version.split(".").map((segment) => parseInt(segment, 10));
  const right_segments = right_version.split(".").map((segment) => parseInt(segment, 10));
  const max_segments = Math.max(left_segments.length, right_segments.length);

  for (let segment_index = 0; segment_index < max_segments; segment_index += 1) {
    const left_value = left_segments[segment_index] ?? 0;
    const right_value = right_segments[segment_index] ?? 0;

    if (left_value === right_value) {
      continue;
    }

    return left_value > right_value ? 1 : -1;
  }

  return 0;
}

async function check_and_show_update_message(suppress_modal = false) {
  const config = await get_version_config();
  if (!config) return;

  const current_app_version = config.version;
  const previous_version = localStorage.getItem(VERSION_STORAGE_KEY);
  const normalized_previous_version = previous_version || "0";
  const version_comparison_result = compare_versions(current_app_version, normalized_previous_version);
  const is_new_version = version_comparison_result !== 0;
  const is_upgrade = previous_version ? version_comparison_result === 1 : false;

  // Helper to finalize OOBE (mark complete & exit fullscreen)
  const finalize_oobe = () => {
    if (localStorage.getItem("imaginer.intro.first_start") === "true") {
      localStorage.setItem("imaginer.intro.first_start", "false");
      // Only exit fullscreen if we are NOT suppressing the modal (i.e. normal flow).
      // If suppressed (intro running), we let the intro manage the screen state.
      if (!suppress_modal) {
        const target_doc = window.parent.document || document;
        if (target_doc.fullscreenElement) {
          target_doc.exitFullscreen().catch((err) => console.warn(err));
        }
      }
    }
  };

  if (is_new_version && !suppress_modal) {
    const html_path = config.history[current_app_version];
    if (html_path) {
      const modal = new version_message_modal();
      await modal.open(html_path, () => {
        finalize_oobe();
        // Force reload to ensure fresh assets (especially for Firefox)
        // Only reload if this was an update (previous_version exists).
        if (is_upgrade) {
          location.reload(true);
        }
      });
    } else {
      alert(`Error: Release notes for version ${current_app_version} not found.`);
      finalize_oobe();
    }
    localStorage.setItem(VERSION_STORAGE_KEY, current_app_version);
  } else {
    // If no new version OR suppressed:
    // We still need to mark OOBE as complete so we don't get stuck in a loop/prompt.
    finalize_oobe();

    // If suppressed, we do NOT update the version key, so the modal appears on the next (normal) run.
    if (!suppress_modal) {
      localStorage.setItem(VERSION_STORAGE_KEY, current_app_version);
    }
  }
}

async function get_version_history() {
  const config = await get_version_config();
  return config ? config.history : {};
}

export { check_and_show_update_message, compare_versions, get_version_history };
