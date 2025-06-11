// version_manager.js
// Handles version tracking and user-facing update messages

const APP_VERSION = '1.0';
const VERSION_STORAGE_KEY = 'imaginer_app_version';

// Map of version numbers to messages to show to users
const VERSION_MESSAGES = {
  '1.0': 'Welcome to Imaginer 1.0! If you used the alpha version, some features may have changed. Please review the new features and report any issues.\n\nNew: There is now a button to download all images in the current gallery for backup in a zip file.',
  // Add future version messages here
};

function get_stored_version() {
  return localStorage.getItem(VERSION_STORAGE_KEY);
}

function set_stored_version(version) {
  localStorage.setItem(VERSION_STORAGE_KEY, version);
}

function get_update_message(current_version, previous_version) {
  if (!previous_version) {
    // User is coming from alpha (no version stored)
    return 'You are upgrading from the alpha version. Welcome to 1.0! Please note that some features may have changed.';
  }
  if (current_version !== previous_version && VERSION_MESSAGES[current_version]) {
    return VERSION_MESSAGES[current_version];
  }
  return null;
}

function check_and_show_update_message() {
  const previous_version = get_stored_version();
  const message = get_update_message(APP_VERSION, previous_version);
  if (message) {
    // Replace this with your preferred UI for showing messages
    alert(message);
  }
  set_stored_version(APP_VERSION);
}

export { APP_VERSION, check_and_show_update_message };
