// menu_bar.js - Menu bar component
import { Config_dialog } from "../config_dialog/config_dialog.js";
import { About_dialog } from "../about_dialog/about_dialog.js";
import { Database_store } from "../../storage/database_store.js";
import { Error_modal } from "../error_modal.js";
import { get_models_for_dropdown, get_selected_model, set_selected_model, refresh_models } from "../../model_fetcher.js";

export class Menu_bar {
  constructor(root) {
    this.root = root;
    this.pending_conversation_mode = false; // Store pending state
    this.init();
  }

  async init() {
    // 1. Load CSS (if not already there)
    if (!document.querySelector('link[href="components/menu_bar/menu_bar.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "components/menu_bar/menu_bar.css";
      document.head.appendChild(link);
    }

    // 2. Fetch HTML
    const response = await fetch("components/menu_bar/menu_bar.html");
    const html = await response.text();

    // 3. Inject
    this.root.innerHTML = html;

    // 4. Start Logic
    this.attach_events();

    // Apply pending conversation mode if set before init completed
    this.set_conversation_mode(this.pending_conversation_mode);
  }

  /* --------------------------------------------------------------- */
  async attach_events() {
    const delete_btn = this.root.querySelector("#delete-mode-btn");
    if (delete_btn) {
      delete_btn.addEventListener("click", () => {
        const is_active = delete_btn.style.opacity === "1";
        // Toggle state
        if (is_active) {
          delete_btn.style.opacity = "0.5";
          delete_btn.style.background = "none";
        } else {
          delete_btn.style.opacity = "1";
          delete_btn.style.background = "rgb(255, 82, 82)"; // Light red background to indicate danger/delete
          delete_btn.style.borderRadius = "4px";
        }

        window.dispatchEvent(
          new CustomEvent("imaginer.delete_mode_toggled", {
            detail: { active: !is_active },
          })
        );
      });
    }

    const new_conv_btn = this.root.querySelector("#new-conversation-btn");
    if (new_conv_btn) {
      new_conv_btn.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("imaginer.new_conversation"));
      });
    }

    const history_btn = this.root.querySelector("#conversation-history-btn");
    if (history_btn) {
      history_btn.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("imaginer.toggle_history"));
      });
    }

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
        const selected_model = get_selected_model();
        const needs_injection = !models.includes(selected_model);
        const final_models = needs_injection ? [selected_model, ...models] : models;
        console.log("[menu_bar] populate_models", "api_models", models, "selected", selected_model, "injected", needs_injection);

        model_select.innerHTML = "";

        for (const model_id of final_models) {
          const option = document.createElement("option");
          option.value = model_id;
          option.textContent = model_id;
          model_select.appendChild(option);
        }

        model_select.value = selected_model;
        model_select.disabled = false;
        console.log("[menu_bar] model_select ready", model_select.value);
      } catch (error) {
        console.warn("Failed to populate models:", error);
        // Keep dropdown disabled with "—" on error
      }
    };

    // Check for API key and populate immediately if present
    const api_key = Database_store.get_api_key();
    if (api_key) {
      populate_models();
    }

    // Listen for config changes (when API key is added)
    window.addEventListener("imaginer.config_changed", () => {
      const updated_api_key = Database_store.get_api_key();
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
          // Fire event to notify other components of model change
          window.dispatchEvent(
            new CustomEvent("imaginer.model_changed", {
              detail: { model: selected_model },
            })
          );
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
    // Help button
    const help_button = this.root.querySelector("#help-btn");
    if (help_button) {
      help_button.addEventListener("click", () => {
        window.open("User_Manual/Imaginer_User_Manual.html", "_blank");
      });
    }

    // About Dialog
    const about_button = this.root.querySelector("#about-btn");
    if (about_button) {
      let about_dialog = null;
      about_button.addEventListener("click", () => {
        if (!about_dialog) {
          about_dialog = new About_dialog();
        }
        about_dialog.open();
      });
    }

    // Remove background select logic (now in config dialog)
    // Initial save to ensure settings are present
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    // For backward compatibility, also update old keys (optional, can be removed in future)
    let size = "1024x1024";
    if (settings.orientation === "landscape") size = "1536x1024";
    else if (settings.orientation === "portrait") size = "1024x1536";
    localStorage.setItem("imaginer.image_size", size);
  }

  set_conversation_mode(is_conversation) {
    this.pending_conversation_mode = is_conversation;
    const new_conv_btn = this.root.querySelector("#new-conversation-btn");
    const history_btn = this.root.querySelector("#conversation-history-btn");

    if (new_conv_btn) new_conv_btn.style.display = is_conversation ? "block" : "none";
    if (history_btn) history_btn.style.display = is_conversation ? "block" : "none";
  }
}
