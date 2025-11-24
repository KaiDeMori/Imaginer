# OOBE (Out of Box Experience) Planning

## Objective
Implement a "First Run" experience where new users are automatically redirected to the cinematic intro sequence. Subsequent launches should load the main application directly.

## Key Components
1.  **Storage Key**: `imaginer.intro.first_start` (Boolean string: "true" or "false").
    -   If missing, assume it's a first run.
2.  **Entry Point (`app.js`)**: Checks for the key. Redirects if missing.
3.  **Intro Start (`cinematic_starfield...html`)**: Sets the key to "true" upon loading (specifically when the API key UI is ready).
4.  **Intro End (`version_manager.js`)**: Sets the key to "false" when the user dismisses the version dialog (signaling the end of the intro flow).

## Implementation Details

### 1. `app.js` (Main Entry Point)
-   **Logic**:
    -   Check `localStorage.getItem("imaginer.intro.first_start")`.
    -   If `null` (key doesn't exist), redirect immediately to `intro/00/cinematic_starfield_and_the_great_everywhere_shake.html`.
    -   Use `window.location.replace()` to avoid keeping the redirect page in history.
-   **Placement**: At the very top of the `DOMContentLoaded` listener, or even before it (in the module scope) to minimize flash of content.

### 2. `intro/00/cinematic_starfield_and_the_great_everywhere_shake.html`
-   **Logic**:
    -   On load, check `localStorage.getItem("imaginer.intro.first_start")`.
    -   If it exists AND is "false", show an alert (Debug/Safety check).
    -   Set `localStorage.setItem("imaginer.intro.first_start", "true")`.
    -   This ensures that if the user refreshes the intro page, they stay in the intro flow until they finish it.

### 3. `version_manager.js` (End of Intro)
-   **Logic**:
    -   In the `on_close` callback of `check_and_show_update_message`:
        -   Set `localStorage.setItem("imaginer.intro.first_start", "false")`.
        -   This marks the OOBE as complete.
-   **Note**: This callback is already handling the fullscreen exit, so it's the perfect place.

## Edge Cases
-   **User closes tab during intro**: Key remains "true" (or missing if they closed before the intro loaded). Next launch -> Redirects to intro (if missing) or prompts user (if "true").
-   **User refreshes during intro**:
    -   If in iframe phase: `app.js` loads inside iframe. `window.self !== window.top` check prevents redirect. App loads normally inside iframe.
    -   If in intro page: Intro page reloads, sees key is "true", continues intro.
-   **User refreshes after intro (URL is index.html)**:
    -   Key is "false" (if dialog closed). App loads normally.
    -   Key is "true" (if dialog open). App prompts user to restart or skip.

## Revised Logic Summary

1.  **`app.js`**:
    ```javascript
    if (window.self === window.top) { // Only check if NOT in an iframe
        const first_start = localStorage.getItem("imaginer.intro.first_start");
        
        if (first_start === null) {
            // First run -> Go to intro
            window.location.replace("intro/00/cinematic_starfield_and_the_great_everywhere_shake.html");
        } else if (first_start === "true") {
            // Incomplete run -> Ask user
            if (confirm("The intro sequence was interrupted. Would you like to watch it again?\n\nClick OK to restart the intro.\nClick Cancel to skip to the app.")) {
                 // User chose to restart. Reset key to ensure clean state.
                 localStorage.removeItem("imaginer.intro.first_start");
                 window.location.replace("intro/00/cinematic_starfield_and_the_great_everywhere_shake.html");
            } else {
                 // User chose to skip. Mark as done so we don't ask again.
                 localStorage.setItem("imaginer.intro.first_start", "false");
            }
        }
    }
    ```

2.  **`cinematic_starfield...html`**:
    ```javascript
    const key = localStorage.getItem("imaginer.intro.first_start");
    if (key === "false") {
        alert("imaginer.intro.first_start is false!");
    }
    localStorage.setItem("imaginer.intro.first_start", "true");
    ```

3.  **`version_manager.js`**:
    ```javascript
    // Inside on_close callback
    localStorage.setItem("imaginer.intro.first_start", "false");
    ```

This seems robust and covers the iframe scenario correctly.
