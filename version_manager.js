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

function get_stored_version() {
  return localStorage.getItem(VERSION_STORAGE_KEY);
}

function set_stored_version(version) {
  localStorage.setItem(VERSION_STORAGE_KEY, version);
}

function get_version_html_path(current_version, previous_version) {
  if (current_version !== previous_version && VERSION_HTML_FILES[current_version]) {
    return VERSION_HTML_FILES[current_version];
  }
  return null;
}

async function check_and_show_update_message() {
  const previous_version = get_stored_version();
  const html_path = get_version_html_path(APP_VERSION, previous_version);
  if (html_path) {
    const modal = new version_message_modal();
    await modal.open(html_path);
  }
  set_stored_version(APP_VERSION);
}

export { APP_VERSION, check_and_show_update_message };
