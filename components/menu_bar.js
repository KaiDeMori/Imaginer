// menu_bar.js - Menu bar component
import { Config_dialog } from "./config_dialog.js";
import { Session_store } from "../storage/session_store.js";
import { Error_modal } from "./error_modal.js";
import { get_models_for_dropdown, get_selected_model, set_selected_model, refresh_models } from "../model_fetcher.js";

export class Menu_bar {
  constructor(root) {
    this.root = root;

    // Build DOM & wire events
    this.render();
    this.attach_events();
  }

  /* --------------------------------------------------------------- */
  render() {
    // Using innerHTML for brevity – simple static markup
    // --- Orientation drop-down and transparency checkbox added ---
    // See OpenAI API docs: 'size' param for orientation, 'background' param for transparency
    // Orientation: 'landscape' (1536x1024), 'portrait' (1024x1536), 'square' (1024x1024)
    // Transparency: background: 'transparent' (output PNG or WEBP), 'opaque', or 'auto' (default)
    this.root.innerHTML = `
      <div style="display: flex; align-items: center; width: 100%; justify-content: space-between;">
        <div style="display: flex; gap: 12px; align-items: center;">
          <div id="orientation-radio-group" style="display: flex; gap: 8px;">
            <button class="orientation-btn" data-orientation="landscape" title="Landscape" type="button">
              <img src="./assets/Landscape.png" alt="Landscape" class="orientation-img" />
            </button>
            <button class="orientation-btn" data-orientation="portrait" title="Portrait" type="button">
              <img src="./assets/Portrait.png" alt="Portrait" class="orientation-img" />
            </button>
            <button class="orientation-btn" data-orientation="square" title="Square" type="button">
              <img src="./assets/Square.png" alt="Square" class="orientation-img" />
            </button>
          </div>
          <select id="model-select" class="model-select" disabled title="Image Generation Model">
            <option value="">—</option>
          </select>
        </div>
        <button id="config-btn" title="Config" style="margin-left: auto; font-size: 1.3rem; background: none; border: none; cursor: pointer;">⚙️</button>
      </div>
      <style>
        .orientation-btn {
          border: 2px solid transparent;
          background: white;
          border-radius: 6px;
          padding: 2px;
          width: 44px;
          height: 44px;
          cursor: pointer;
          transition: border 0.15s;
        }
        .orientation-btn.selected {
          border: 2px solid #1976d2;
          background: #e3f0ff;
        }
        .orientation-img {
          width: 32px;
          height: 32px;
          display: block;
          filter: grayscale(100%) contrast(0.7);
          transition: filter 0.15s;
        }
        .orientation-btn.selected .orientation-img {
          filter: none;
        }
        .orientation-btn:focus {
          outline: 2px solid #1976d2;
        }
        .model-select {
          padding: 6px 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: white;
          font-size: 0.9rem;
          min-width: 120px;
          cursor: pointer;
        }
        .model-select:disabled {
          background: #f5f5f5;
          color: #999;
          cursor: not-allowed;
        }
      </style>
    `;
  }

  /* --------------------------------------------------------------- */
  async attach_events() {
    const config_button = this.root.querySelector("#config-btn");
    if (!config_button) return;

    // Lazily create dialog when first requested
    let dialog_instance = null;
    // Accept an onSave callback to notify app.js of config changes
    const get_dialog = () => {
      if (!dialog_instance) {
        dialog_instance = new Config_dialog((api_key, max) => {
          // Fire a custom event so app.js can listen for config changes
          window.dispatchEvent(
            new CustomEvent("imaginer.config_changed", {
              detail: { apiKey: api_key, max },
            })
          );
        });
      }
      return dialog_instance;
    };

    config_button.addEventListener("click", () => {
      get_dialog().open();
    });

    // --- Model dropdown population logic ---
    const model_select = this.root.querySelector("#model-select");

    const populate_models = async () => {
      if (!model_select) return;

      try {
        const models = await get_models_for_dropdown();
        if (models.length === 0) {
          // No models available, keep disabled with "—"
          return;
        }

        // Clear existing options
        model_select.innerHTML = "";

        // Add model options
        for (const model_id of models) {
          const option = document.createElement("option");
          option.value = model_id;
          option.textContent = model_id;
          model_select.appendChild(option);
        }

        // Set selected value
        const selected_model = get_selected_model();
        model_select.value = selected_model;

        // Enable dropdown
        model_select.disabled = false;
      } catch (error) {
        console.warn("Failed to populate models:", error);
        // Keep dropdown disabled with "—" on error
      }
    };

    // Check for API key and populate immediately if present
    const api_key = Session_store.get_api_key();
    if (api_key) {
      populate_models();
    }

    // Listen for config changes (when API key is added)
    window.addEventListener("imaginer.config_changed", () => {
      const updated_api_key = Session_store.get_api_key();
      if (updated_api_key) {
        populate_models();
      }
    });

    // Model selection change handler
    if (model_select) {
      model_select.addEventListener("change", (e) => {
        const selected_model = e.target.value;
        if (selected_model) {
          set_selected_model(selected_model);
        }
      });
    }

    // Listen for model refresh events from config dialog
    window.addEventListener("imaginer.models_refreshed", () => {
      populate_models();
    });

    // --- Settings persistence logic ---
    const SETTINGS_KEY = "imaginer.menu_settings";
    // Default settings
    const default_settings = {
      orientation: "square",
      background: "auto",
    };
    // Load settings from localStorage or use defaults
    let settings = { ...default_settings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };

    // UI elements
    // Orientation radio group logic
    const orientation_radio_group = this.root.querySelector("#orientation-radio-group");
    let orientation_buttons = [];
    if (orientation_radio_group) {
      orientation_buttons = Array.from(orientation_radio_group.querySelectorAll(".orientation-btn"));
      // Load current or default orientation
      const SETTINGS_KEY = "imaginer.menu_settings";
      let settings = { orientation: "square", ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
      function select_orientation(orientation) {
        orientation_buttons.forEach((btn) => {
          if (btn.dataset.orientation === orientation) {
            btn.classList.add("selected");
          } else {
            btn.classList.remove("selected");
          }
        });
      }
      // Initial selection
      select_orientation(settings.orientation);
      // Click event
      orientation_buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          settings.orientation = btn.dataset.orientation;
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
          // For backward compatibility, also update old keys
          let size = "1024x1024";
          if (settings.orientation === "landscape") size = "1536x1024";
          else if (settings.orientation === "portrait") size = "1024x1536";
          localStorage.setItem("imaginer.image_size", size);
          select_orientation(settings.orientation);
        });
      });
    }
    // ...existing code...
    // Remove background select logic (now in config dialog)
    // Initial save to ensure settings are present
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    // For backward compatibility, also update old keys (optional, can be removed in future)
    let size = "1024x1024";
    if (settings.orientation === "landscape") size = "1536x1024";
    else if (settings.orientation === "portrait") size = "1024x1536";
    localStorage.setItem("imaginer.image_size", size);
  }
}
