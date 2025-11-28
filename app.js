// app.js - Root application logic (updated with image generation logic)
// NOTE: Only gpt-image-1 is supported, so we ignore response_format (always returns b64_json)

import { Menu_bar } from "./components/menu_bar/menu_bar.js";
import { Resizable_divider } from "./components/resizable_divider.js";
import { Gallery } from "./components/gallery.js";
import { Prompt_panel } from "./components/prompt_panel.js";
import { Conversation_panel } from "./components/conversation_panel/conversation_panel.js";
import drop_area_manager from "./components/drop_area_manager.js";
import { Viewer } from "./components/viewer/viewer.js";
import { Session_store } from "./storage/session_store.js";
import { Error_modal } from "./components/error_modal.js";
import { strip_metadata_from_PNG } from "./strip_metadata_from_PNG/strip_metadata_from_PNG.js";
import { add_iTXt_chunk_to_png } from "./png_iTXt/png_iTXt.js";
import { embed_XMP_description } from "./png_XMP_via_iTXt/png-XMP-embedder.js";
import { check_and_show_update_message } from "./version_manager.js";
import { ensure_config_defaults } from "./default_config.js";
import { get_selected_model } from "./model_fetcher.js";

// --- OOBE / First Run Check ---
let is_redirecting = false;
// Check session storage for intro mode flag (set by intro/04/app_transition_manager.js)
const is_intro_running = sessionStorage.getItem("imaginer.intro.is_running") === "true";

if (!is_intro_running) {
  // Only check if NOT in intro mode (prevents infinite loop when loaded by intro)
  const first_start = localStorage.getItem("imaginer.intro.first_start");

  if (first_start === null) {
    // First run -> Go to intro
    is_redirecting = true;
    window.location.replace("intro/00/cinematic_starfield_and_the_great_everywhere_shake.html");
  } else if (first_start === "true") {
    // Incomplete run -> Ask user
    if (confirm("The intro sequence was interrupted. Would you like to watch it again?\n\nClick OK to restart the intro.\nClick Cancel to skip to the app.")) {
      // User chose to restart. Reset key to ensure clean state.
      is_redirecting = true;
      localStorage.removeItem("imaginer.intro.first_start");
      window.location.replace("intro/00/cinematic_starfield_and_the_great_everywhere_shake.html");
    } else {
      // User chose to skip. Mark as done so we don't ask again.
      localStorage.setItem("imaginer.intro.first_start", "false");
    }
  } else {
    // OOBE complete or in iframe -> Show app
  }
} else {
  // In intro mode -> Show app
  // Clear the flag so subsequent reloads (e.g. user refresh) behave normally
  sessionStorage.removeItem("imaginer.intro.is_running");
}

const session_store = new Session_store();
window.sessionStore = session_store;

// Mount components
window.addEventListener("DOMContentLoaded", async () => {
  if (is_redirecting) return;

  // Fade out startup overlay
  const overlay = document.getElementById("startup-overlay");
  if (overlay) {
    // If first_start is true, we are inside the intro sequence (iframe).
    // We remove the overlay immediately so the intro can control the fade-in of the iframe.
    // In the "interrupted" case (top level), the confirm dialog handles the state:
    // - If Cancel (Skip): first_start becomes "false" before this runs -> Smooth fade.
    // - If OK (Restart): is_redirecting is true -> This code doesn't run.
    const is_first_start_active = localStorage.getItem("imaginer.intro.first_start") === "true";

    if (is_first_start_active) {
      overlay.remove();
    } else {
      // Normal start: Fade out smoothly
      // Force reflow to ensure transition plays if added dynamically (though here it's static)
      overlay.offsetHeight;
      overlay.addEventListener("transitionend", () => overlay.remove(), { once: true });
      overlay.style.opacity = "0";
    }
  }

  // Check and show version update message if needed
  await check_and_show_update_message();
  // Ensure all config defaults are set in localStorage
  ensure_config_defaults();
  // --- Check for API key on load (using scrambled key logic) ---
  import("./storage/session_store.js").then(({ Session_store }) => {
    const apiKey = Session_store.get_api_key();
    if (!apiKey) {
      // Show a message and open the config dialog
      const msg = document.createElement("div");
      msg.textContent = "No OpenAI API key found. Please enter your API key to use Imaginer.";
      Object.assign(msg.style, {
        position: "fixed",
        top: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#fffbe6",
        color: "#b26a00",
        border: "1px solid #ffe58f",
        borderRadius: "6px",
        padding: "12px 24px",
        zIndex: 2000,
        fontSize: "1.1rem",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      });
      document.body.appendChild(msg);
      // Dynamically import and open config dialog
      import("./components/config_dialog/config_dialog.js").then(({ Config_dialog }) => {
        const cfg = new Config_dialog(() => {
          msg.remove();
          window.dispatchEvent(new Event("imaginer.config_changed"));
        });
        cfg.open();
      });
    }
  });

  // --- Clean up orphaned masks on page load ---
  if (window.sessionStore && window.sessionStore.cleanup_orphaned_masks) {
    window.sessionStore.get_all({ reverse: false }).then((records) => {
      // Collect all UUIDs in use by images (not just masks)
      const valid_uuids = new Set(records.map((r) => r.uuid).filter(Boolean));
      window.sessionStore.cleanup_orphaned_masks(valid_uuids).then((num_cleaned) => {
        if (num_cleaned > 0) {
          console.info(`[Imaginer] Cleaned up ${num_cleaned} orphaned mask(s) from sessionStore.`);
        }
      });
    });
  }

  // Initialize the menu bar component, which handles the application's top navigation menu.
  const menu_bar = new Menu_bar(document.getElementById("menu-bar"));

  const viewer = new Viewer();
  const gallery = new Gallery(document.getElementById("gallery"), viewer);
  // Initialize the resizable divider component, which allows resizing between the gallery and prompt panel.
  const divider = new Resizable_divider(document.getElementById("divider"), document.getElementById("gallery"), document.getElementById("prompt-panel"));

  // Initialize Conversation Panel
  const conversation_panel = new Conversation_panel(document.getElementById("conversation-panel"));

  // Tab Logic
  const tab_gen = document.getElementById("tab-generation");
  const tab_conv = document.getElementById("tab-conversation");
  const pane_gen = document.getElementById("prompt-panel");
  const pane_conv = document.getElementById("conversation-panel");

  function switch_tab(tab) {
    if (tab === "generation") {
      tab_gen.classList.add("active");
      tab_conv.classList.remove("active");
      pane_gen.classList.add("active");
      pane_conv.classList.remove("active");
    } else {
      tab_gen.classList.remove("active");
      tab_conv.classList.add("active");
      pane_gen.classList.remove("active");
      pane_conv.classList.add("active");
    }
  }

  tab_gen.addEventListener("click", () => switch_tab("generation"));
  tab_conv.addEventListener("click", () => switch_tab("conversation"));

  // Expose internals for intro transition only
  window.expose_internals_for_intro = () => ({
    add_image: (blob, prompt = "intro_image") => gallery.addThumbnail(blob, prompt, Date.now()),
    open_image: (blob, opts = {}) => viewer.open(blob, opts),
    viewer: viewer,
  });

  let activeGenerations = 0;

  // Warn user if they try to reload while images are pending
  window.addEventListener("beforeunload", (e) => {
    if (activeGenerations > 0) {
      e.preventDefault();
      e.returnValue = "Images are still being generated. Are you sure you want to leave?";
      return e.returnValue;
    }
  });

  function get_maximum_parallel_generations() {
    return parseInt(localStorage.getItem("imaginer.max_parallel_generations"));
  }

  function update_generate_button() {
    const max = get_maximum_parallel_generations();
    prompt_panel.set_generate_button_enabled(activeGenerations < max);
  }

  // --- Cool-down state for generate button ---
  let generate_cooldown = false;

  const prompt_panel = new Prompt_panel(document.getElementById("prompt-panel"), async (prompt_text, embed_options = {}) => {
    const max = get_maximum_parallel_generations();
    if (activeGenerations >= max || generate_cooldown) {
      prompt_panel.set_generate_button_enabled(false);
      return;
    }
    activeGenerations++;
    update_generate_button();

    // Start cool-down (600ms)
    generate_cooldown = true;
    prompt_panel.set_generate_button_enabled(false);
    setTimeout(() => {
      generate_cooldown = false;
      update_generate_button();
    }, 600);

    // Read n before using it for placeholders
    let n_local = parseInt(localStorage.getItem("imaginer.n"));
    // Add as many placeholders as images requested (for smoother UX)
    const placeholders = [];
    for (let i = 0; i < n_local; i++) {
      placeholders.push(gallery.addPlaceholder());
    }

    // --- Read orientation, transparency, quality, and n from localStorage (set by menu bar/config) ---
    // See OpenAI API docs:
    //   - 'size' param: 1024x1024 (square), 1536x1024 (landscape), 1024x1536 (portrait)
    //   - 'background' param: 'transparent', 'opaque', or 'auto' (default)
    //   - 'quality' param: high, medium, low, auto, or null (for gpt-image-1)
    //   - 'n' param: number of images to generate (1-10)
    const size = localStorage.getItem("imaginer.image_size");
    const background = localStorage.getItem("imaginer.background");
    let quality = localStorage.getItem("imaginer.quality");
    if (quality === "") quality = null;
    let n = parseInt(localStorage.getItem("imaginer.n"));

    // --- Attach dropped images from prompt_panel to API request (if any) ---
    const dropped_images = prompt_panel.dropped_images || [];
    const selected_model = get_selected_model();
    const is_mini_model = selected_model.includes("mini");
    let use_image_edit = dropped_images.length > 0 && !is_mini_model;

    if (use_image_edit) {
      // --- Use /v1/images/edits endpoint with multipart/form-data ---
      const form_data = new FormData();
      form_data.append("model", get_selected_model());
      for (const file of dropped_images) {
        form_data.append("image[]", file, file.name);
      }
      form_data.append("prompt", prompt_text);
      form_data.append("n", n_local);
      form_data.append("size", size);
      if (quality !== null && quality !== "auto") form_data.append("quality", quality);
      if (background !== "auto") form_data.append("background", background);

      // Add input_fidelity for non-mini models to ensure proper image editing
      const selected_model = get_selected_model();
      if (selected_model === "gpt-image-1") {
        form_data.append("input_fidelity", "high");
      }

      function debug_mask(mask) {
        // DEBUG: Open mask in new tab for inspection
        const mask_url = URL.createObjectURL(mask);
        const debug_tab = window.open(mask_url, "_blank");
        console.debug("[Imaginer] Mask opened in new tab for inspection:", mask_url);
        // Clean up URL after a delay to prevent memory leaks
        setTimeout(() => URL.revokeObjectURL(mask_url), 10000);
      }

      // --- Attach mask from drop_area_manager if present, and log debug info ---
      const active_mask = drop_area_manager.get_active_mask();
      if (active_mask) {
        form_data.append("mask", active_mask, active_mask.name || "mask.png");
        console.debug("[Imaginer] Sending image edit request WITH mask:", active_mask);
        //debug_mask(active_mask);
      } else {
        console.debug("[Imaginer] Sending image edit request WITHOUT mask.");
      }

      try {
        const response = await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Session_store.get_api_key()}`,
            // Note: Do not set Content-Type; browser will set it for FormData
          },
          body: form_data,
        });

        if (!response.ok) {
          let errObj = null;
          try {
            errObj = await response.json();
          } catch (_) {
            errObj = { message: `API request failed: ${response.status} ${response.statusText}` };
          }
          Error_modal.show(errObj);
          for (const ph of placeholders) {
            if (ph && ph.parentNode) ph.parentNode.removeChild(ph);
          }
          return;
        }

        const data = await response.json();
        if (!Array.isArray(data.data) || data.data.length === 0) {
          Error_modal.show({ message: "No images returned from API." });
          for (const ph of placeholders) {
            if (ph && ph.parentNode) ph.parentNode.removeChild(ph);
          }
          return;
        }

        // Handle returned images (same as before)
        const created = Math.floor(Date.now() / 1000);
        for (let i = 0; i < data.data.length; i++) {
          let base64Data = data.data[i].b64_json;
          let blob = await fetch(`data:image/png;base64,${base64Data}`).then((res) => res.blob());
          await session_store.save({
            created,
            image_blob: blob,
            prompt_text,
            prompt_imgs: [],
          });
          if (placeholders[i]) {
            gallery.update_placeholder(placeholders[i], blob, false, prompt_text, created);
          } else {
            gallery.addThumbnail(blob, prompt_text, created);
          }
        }
        // Remove any extra placeholders if fewer images returned than requested
        for (let i = data.data.length; i < placeholders.length; i++) {
          if (placeholders[i] && placeholders[i].parentNode) placeholders[i].parentNode.removeChild(placeholders[i]);
        }
      } catch (error) {
        console.error("Error editing image:", error);
        Error_modal.show(error && error.message ? error.message : error);
        for (const ph of placeholders) {
          if (ph && ph.parentNode) ph.parentNode.removeChild(ph);
        }
      } finally {
        activeGenerations--;
        update_generate_button();
      }
      return;
    }

    try {
      const request_body = {
        model: get_selected_model(),
        prompt: prompt_text,
        n: n_local,
        size,
        // Only add quality if not null or 'auto' (let API default if auto)
        ...(quality !== null && quality !== "auto" ? { quality } : {}),
        // Only add background param if not default
        ...(background !== "auto" ? { background } : {}),
      };
      // If user explicitly chose null (empty string), set quality: null
      if (quality === null) request_body.quality = null;

      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Session_store.get_api_key()}`,
        },
        body: JSON.stringify(request_body),
      });

      if (!response.ok) {
        let errObj = null;
        try {
          errObj = await response.json();
        } catch (_) {
          errObj = { message: `API request failed: ${response.status} ${response.statusText}` };
        }
        Error_modal.show(errObj);
        for (const ph of placeholders) {
          gallery.update_placeholder(ph, null, true);
        }
        return;
      }

      const data = await response.json();
      if (!Array.isArray(data.data) || data.data.length === 0) {
        Error_modal.show({ message: "No images returned from API." });
        for (const ph of placeholders) {
          gallery.update_placeholder(ph, null, true);
        }
        return;
      }

      // If n > 1, add all images to gallery, else use placeholder logic
      const created = Math.floor(Date.now() / 1000);
      if (data.data.length === 1) {
        // --- Single image (original logic) ---
        let base64Data = data.data[0].b64_json;
        let blob = await fetch(`data:image/png;base64,${base64Data}`).then((res) => res.blob());

        // Optionally strip metadata if enabled in config
        const strip_metadata = localStorage.getItem("imaginer.strip_metadata") === "true";
        if (strip_metadata) {
          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          try {
            blob = strip_metadata_from_PNG(uint8Array);
          } catch (err) {
            console.warn("Failed to strip PNG metadata:", err);
          }
        }

        // Optionally add prompt to image if enabled in config
        const embed_itxt = embed_options.embed_itxt ?? localStorage.getItem("imaginer.add_prompt_to_image") === "true";
        const embed_xmp = embed_options.embed_xmp ?? localStorage.getItem("imaginer.add_prompt_to_image_xmp") === "true";
        if (embed_itxt || embed_xmp) {
          const reader = new FileReader();
          const data_url = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          try {
            if (embed_itxt) {
              blob = await add_iTXt_chunk_to_png(data_url, prompt_text, "prompt_text");
            }
            if (embed_xmp) {
              blob = await embed_XMP_description(
                embed_itxt
                  ? await (async () => {
                      const r2 = new FileReader();
                      return await new Promise((resolve, reject) => {
                        r2.onload = () => resolve(r2.result);
                        r2.onerror = reject;
                        r2.readAsDataURL(blob);
                      });
                    })()
                  : data_url,
                prompt_text
              );
            }
          } catch (err) {
            console.warn("Failed to embed prompt metadata:", err);
          }
        }

        const record_id = await session_store.save({
          created,
          image_blob: blob,
          prompt_text: prompt_text,
          prompt_imgs: [],
        });
        if (gallery.records_by_created) {
          gallery.records_by_created[created] = {
            id: record_id,
            created,
            image_blob: blob,
            prompt_text: prompt_text,
            prompt_imgs: [],
          };
        }
        // Update the first placeholder, remove any extras
        gallery.update_placeholder(placeholders[0], blob, false, prompt_text, created);
        for (let i = 1; i < placeholders.length; i++) {
          if (placeholders[i] && placeholders[i].parentNode) placeholders[i].parentNode.removeChild(placeholders[i]);
        }
      } else {
        // --- Multiple images ---
        // Update each placeholder with the corresponding image, or remove if not enough images returned
        for (let i = 0; i < data.data.length; i++) {
          let base64Data = data.data[i].b64_json;
          let blob = await fetch(`data:image/png;base64,${base64Data}`).then((res) => res.blob());

          // Optionally strip metadata if enabled in config
          const strip_metadata = localStorage.getItem("imaginer.strip_metadata") === "true";
          if (strip_metadata) {
            const arrayBuffer = await blob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            try {
              blob = strip_metadata_from_PNG(uint8Array);
            } catch (err) {
              console.warn("Failed to strip PNG metadata:", err);
            }
          }

          // Optionally add prompt to image if enabled in config
          const embed_itxt = embed_options.embed_itxt ?? localStorage.getItem("imaginer.add_prompt_to_image") === "true";
          const embed_xmp = embed_options.embed_xmp ?? localStorage.getItem("imaginer.add_prompt_to_image_xmp") === "true";
          if (embed_itxt || embed_xmp) {
            const reader = new FileReader();
            const data_url = await new Promise((resolve, reject) => {
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            try {
              if (embed_itxt) {
                blob = await add_iTXt_chunk_to_png(data_url, prompt_text, "prompt_text");
              }
              if (embed_xmp) {
                blob = await embed_XMP_description(
                  embed_itxt
                    ? await (async () => {
                        const r2 = new FileReader();
                        return await new Promise((resolve, reject) => {
                          r2.onload = () => resolve(r2.result);
                          r2.onerror = reject;
                          r2.readAsDataURL(blob);
                        });
                      })()
                    : data_url,
                  prompt_text
                );
              }
            } catch (err) {
              console.warn("Failed to embed prompt metadata:", err);
            }
          }

          const record_id = await session_store.save({
            created,
            image_blob: blob,
            prompt_text: prompt_text,
            prompt_imgs: [],
          });
          console.debug("[App] Saved with ID =", record_id, "created =", created);

          if (placeholders[i]) {
            gallery.update_placeholder(placeholders[i], blob, false, prompt_text, created);
          } else {
            // Create a record object with the ID for the gallery
            const record = {
              id: record_id,
              created,
              image_blob: blob,
              prompt_text: prompt_text,
              prompt_imgs: [],
            };
            gallery.addThumbnail(blob, prompt_text, created);
            // Add to gallery's mapping with the correct ID
            if (gallery.records_by_created) {
              gallery.records_by_created[created] = record;
              console.debug("[App] Added to gallery mapping: created =", created, "id =", record_id);
            } else {
              console.debug("[App] ERROR: gallery.records_by_created is NULL");
            }
          }
        }
        // Remove any extra placeholders if fewer images returned than requested
        for (let i = data.data.length; i < placeholders.length; i++) {
          if (placeholders[i] && placeholders[i].parentNode) placeholders[i].parentNode.removeChild(placeholders[i]);
        }
      }
    } catch (error) {
      console.error("Error generating image:", error);
      Error_modal.show(error && error.message ? error.message : error);
      // Remove all placeholders on error
      for (const ph of placeholders) {
        if (ph && ph.parentNode) ph.parentNode.removeChild(ph);
      }
    } finally {
      activeGenerations--;
      update_generate_button();
    }
  });

  // Listen for config changes from the config dialog (immediate effect)
  window.addEventListener("imaginer.config_changed", (e) => {
    update_generate_button();
  });

  // Still listen for storage events (e.g. multi-tab)
  window.addEventListener("storage", (e) => {
    if (e.key === "imaginer.max_parallel_generations") {
      update_generate_button();
    }
  });

  update_generate_button();
});

// --- Tabula Rasa function: clears all Imaginer data in the browser ---
window.tabula_rasa = function tabula_rasa() {
  try {
    localStorage.clear();
    sessionStorage.clear();
    if (window.indexedDB && indexedDB.databases) {
      indexedDB.databases().then((dbs) => {
        dbs.forEach((db) => indexedDB.deleteDatabase(db.name));
      });
    } else {
      // Fallback: try to delete common Imaginer DBs if you know their names
      // indexedDB.deleteDatabase('imaginer_db');
    }
    console.log("Imaginer data has been wiped clean (tabula rasa). Reload the page to start fresh.");
  } catch (e) {
    console.error("Error during tabula rasa:", e);
  }
};
