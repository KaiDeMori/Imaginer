// app_transition_manager.js

(function () {
  class AppTransitionManager {
    constructor() {
      this.iframe = null;
      this.fade_in_started = false;
    }

    start_loading_app() {
      if (this.iframe) return; // Already started

      console.log("[AppTransitionManager] Starting app load...");
      this.iframe = document.createElement("iframe");
      // Assuming we are in intro/04/, index.html is in ../../
      // We set a session storage flag to signal the app it's running in intro mode
      // This is safer than localStorage as it's cleared when the tab closes
      sessionStorage.setItem("imaginer.intro.is_running", "true");
      this.iframe.src = "../../index.html";
      this.iframe.style.cssText =
        "position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; z-index: 1000; opacity: 0; pointer-events: none; transition: opacity 2s ease-in-out;";
      document.body.appendChild(this.iframe);

      this.iframe.onload = async () => {
        console.log("[AppTransitionManager] Iframe loaded, setting up app state...");
        await this.setup_app_state();
      };
    }

    async setup_app_state() {
      const app_window = this.iframe.contentWindow;

      // Dynamic import of the remote control module
      // Note: path is relative to the current document (intro/04/...)
      const { Intro_remote_control } = await import("../../intro_remote_control.js");

      // Instantiate remote control with the iframe's window context
      const remote = new Intro_remote_control(app_window);

      // Execute the setup sequence
      await remote.execute();

      console.log("[AppTransitionManager] App ready for reveal!");
      // Signal ready for reveal
      window.infinity_zoom_II.FLAG_initiate_final_reveal = true;
    }

    // Called by engine loop
    update(engine_phase) {
      if (engine_phase === "region_zoom_hold" && !this.fade_in_started && this.iframe) {
        this.fade_in_started = true;
        console.log("[AppTransitionManager] Fading in app...");

        // Enable pointer events and fade in
        this.iframe.style.pointerEvents = "auto";
        this.iframe.style.opacity = "1";

        // Optional: Clean up intro after transition?
        // Maybe wait for transition end
        this.iframe.addEventListener(
          "transitionend",
          () => {
            console.log("[AppTransitionManager] Transition complete. Intro hidden.");

            // Update URL to main app so refresh loads app directly
            try {
              window.history.replaceState(null, "Imaginer", "../../index.html");
            } catch (e) {
              console.warn("[AppTransitionManager] Could not update URL:", e);
            }

            // We could pause the engine or remove the canvas here if we wanted to save resources
            if (window.infinity_zoom_II.engine) {
              window.infinity_zoom_II.engine.pause();
            }
          },
          { once: true }
        );
      }
    }
  }

  // Attach to global namespace
  if (!window.infinity_zoom_II) window.infinity_zoom_II = {};
  window.infinity_zoom_II.AppTransitionManager = AppTransitionManager;
  // Create singleton instance
  window.infinity_zoom_II.app_transition_manager = new AppTransitionManager();
})();
