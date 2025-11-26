# OOBE and Version Update Flow

This document outlines the logic flow for the Out of Box Experience (OOBE) and version update mechanism in Imaginer.

## Core Logic

The logic is encapsulated in `version_manager.js`, specifically within the `check_and_show_update_message()` function. This function is responsible for detecting version changes, displaying release notes, and managing the transition from the intro/OOBE state to the main application.

### Dependencies & State

The system relies on the following:

*   **`APP_VERSION`**: A constant in `version_manager.js` defining the current running version (e.g., "1.0").
*   **`localStorage` Keys**:
    *   `imaginer_app_version`: Stores the version number of the *last run* instance.
    *   `imaginer.intro.first_start`: A boolean string ("true"/"false") indicating if the OOBE intro sequence is active.

### The Flow

1.  **Initialization**:
    *   The app retrieves the `previous_version` from `localStorage`.
    *   It compares `APP_VERSION` with `previous_version` to determine if `is_new_version` is true.

2.  **New Version Detected (`is_new_version` is true)**:
    *   The system attempts to look up the release notes HTML file path in `VERSION_HTML_FILES`.
    *   **If Release Notes Exist**:
        *   The `version_message_modal` is opened with the content.
        *   **On Modal Close**:
            1.  `finalize_oobe()` is called to clean up any pending intro state (exit fullscreen, set `first_start` to false).
            2.  **Hard Reload Check**:
                *   If `previous_version` **exists** (not null), this is an **Update**. We trigger `location.reload(true)` to force Firefox/browsers to clear the cache and load fresh assets.
                *   If `previous_version` is **null**, this is a **First Start**. We **skip** the reload because the assets are already fresh.
    *   **If Release Notes Are Missing**:
        *   An error alert is shown to the user.
        *   `finalize_oobe()` is called immediately to ensure the user isn't stuck.

3.  **No New Version**:
    *   The system simply calls `finalize_oobe()` to ensure any pending OOBE state is resolved (e.g., if the user refreshed during the intro).

4.  **State Update**:
    *   Finally, `localStorage` is updated with the current `APP_VERSION`.

### Edge Case Handling

| Scenario | `previous_version` | `is_new_version` | Action | Reload? |
| :--- | :--- | :--- | :--- | :--- |
| **First Install** | `null` | `true` | Show Modal -> Finalize OOBE | **No** |
| **Update** | `"0.9"` | `true` | Show Modal -> Finalize OOBE | **Yes** (Hard) |
| **Normal Run** | `"1.0"` | `false` | Finalize OOBE (Safety check) | **No** |
| **Missing Notes** | Any | `true` | Alert Error -> Finalize OOBE | **No** |

## Files Involved

*   `version_manager.js`: Main logic controller.
*   `components/version_message_modal.js`: UI for displaying the HTML release notes.
*   `version_messages/*.html`: Content files for specific versions.
