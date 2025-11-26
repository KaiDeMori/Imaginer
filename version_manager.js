// version_manager.js
// Handles version tracking and user-facing update messages

import { version_message_modal } from "./components/version_message_modal.js";

const APP_VERSION = "1.0";
const VERSION_STORAGE_KEY = "imaginer_app_version";

// Map of version numbers to HTML file paths
const VERSION_HTML_FILES = {
  "1.0": "version_messages/version_1.0.0.html",
  // Add future version HTML files here
};

async function check_and_show_update_message() {
  const previous_version = localStorage.getItem(VERSION_STORAGE_KEY);
  const is_new_version = APP_VERSION !== previous_version;

  // Helper to finalize OOBE (mark complete & exit fullscreen)
  const finalize_oobe = () => {
    if (localStorage.getItem("imaginer.intro.first_start") === "true") {
      localStorage.setItem("imaginer.intro.first_start", "false");
      const target_doc = window.parent.document || document;
      if (target_doc.fullscreenElement) {
        target_doc.exitFullscreen().catch((err) => console.warn(err));
      }
    }
  };

  if (is_new_version) {
    const html_path = VERSION_HTML_FILES[APP_VERSION];
    if (html_path) {
      const modal = new version_message_modal();
      await modal.open(html_path, () => {
        finalize_oobe();
        // Force reload to ensure fresh assets (especially for Firefox)
        // Only reload if this was an update (previous_version exists).
        if (previous_version) {
          location.reload(true);
        }
      });
    } else {
      alert(`Error: Release notes for version ${APP_VERSION} not found.`);
      finalize_oobe();
    }
  } else {
    finalize_oobe();
  }
  localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION);
}

export { APP_VERSION, check_and_show_update_message, VERSION_HTML_FILES };
