// menu_bar.js - Menu bar component
import { Config_dialog } from "../config_dialog/config_dialog.js";
import { About_dialog } from "../about_dialog/about_dialog.js";
import { Database_store } from "../../storage/database_store.js";
import { Error_modal } from "../error_modal.js";
import { get_models_for_dropdown, get_selected_model, set_selected_model, refresh_models } from "../../model_fetcher.js";
import { versioned_url } from "../../version_manager.js";
import {
  POPULAR_SIZES,
  get_custom_sizes,
  add_custom_size,
  is_advanced_size_mode,
  orientation_for_size,
  parse_size,
  format_size,
  format_size_label,
} from "../size_picker/size_picker.js";
import { Custom_size_modal } from "../custom_size_modal/custom_size_modal.js";
import { Remove_custom_size_modal } from "../remove_custom_size_modal/remove_custom_size_modal.js";

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
    const response = await fetch(versioned_url("components/menu_bar/menu_bar.html"));
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
          delete_btn.style.background = "rgb(255, 82, 82)";
          delete_btn.style.borderRadius = "4px";
        }

        window.dispatchEvent(
          new CustomEvent("imaginer.delete_mode_toggled", {
            detail: { active: !is_active },
          }),
        );
      });

      window.addEventListener("imaginer.delete_mode_exited", () => {
        delete_btn.style.opacity = "0.5";
        delete_btn.style.background = "none";
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
            }),
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
            }),
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
    const image_size_select = this.root.querySelector("#image-size-select");
    const ADD_CUSTOM_SIZE_VALUE = "__add_custom__";
    const REMOVE_CUSTOM_SIZE_VALUE = "__remove_custom__";
    let custom_size_modal = null;
    let remove_custom_size_modal = null;
    let orientation_buttons = [];

    function size_for_orientation(o) {
      if (o === "landscape") return "1536x1024";
      if (o === "portrait") return "1024x1536";
      return "1024x1024";
    }

    // gpt-image-1 family models (1.0, 1.5, dated, mini variants) only support
    // the three legacy sizes. gpt-image-2 supports arbitrary sizes.
    const LEGACY_SIZES = new Set(["1024x1024", "1024x1536", "1536x1024"]);
    function is_legacy_size_only_model(model_id) {
      return typeof model_id === "string" && model_id.startsWith("gpt-image-1");
    }
    function clamp_size_for_model(value, model_id) {
      if (!is_legacy_size_only_model(model_id)) return value;
      if (LEGACY_SIZES.has(value)) return value;
      return size_for_orientation(orientation_for_size(value));
    }

    function select_orientation(orientation) {
      orientation_buttons.forEach((btn) => {
        if (btn.dataset.orientation === orientation) {
          btn.classList.add("selected");
        } else {
          btn.classList.remove("selected");
        }
      });
    }

    function build_size_select_options(current_value) {
      if (!image_size_select) return;
      const model_id = get_selected_model();
      const legacy_only = is_legacy_size_only_model(model_id);
      image_size_select.innerHTML = "";
      const seen = new Set();
      const append_option = (value, label) => {
        if (seen.has(value)) return;
        seen.add(value);
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = label;
        image_size_select.appendChild(opt);
      };

      const popular_group = document.createElement("optgroup");
      popular_group.label = "Popular sizes";
      image_size_select.appendChild(popular_group);
      for (const entry of POPULAR_SIZES) {
        if (legacy_only && !LEGACY_SIZES.has(entry.value)) continue;
        if (seen.has(entry.value)) continue;
        seen.add(entry.value);
        const opt = document.createElement("option");
        opt.value = entry.value;
        opt.textContent = entry.label;
        popular_group.appendChild(opt);
      }

      // Skip Your custom sizes / Add / Remove entries entirely for legacy-only models.
      if (!legacy_only) {
        const customs = get_custom_sizes();
        if (customs.length > 0) {
          const custom_group = document.createElement("optgroup");
          custom_group.label = "Your custom sizes";
          image_size_select.appendChild(custom_group);
          for (const value of customs) {
            if (seen.has(value)) continue;
            seen.add(value);
            const parsed = parse_size(value);
            if (!parsed) continue;
            const opt = document.createElement("option");
            opt.value = value;
            opt.textContent = format_size_label(parsed.width, parsed.height);
            custom_group.appendChild(opt);
          }
        }

        // Make sure the current value is selectable even if not in either list.
        if (current_value && !seen.has(current_value)) {
          const parsed = parse_size(current_value);
          if (parsed) {
            append_option(current_value, format_size_label(parsed.width, parsed.height));
          }
        }

        const add_opt = document.createElement("option");
        add_opt.value = ADD_CUSTOM_SIZE_VALUE;
        add_opt.textContent = "Add custom size\u2026";
        image_size_select.appendChild(add_opt);

        if (customs.length > 0) {
          const remove_opt = document.createElement("option");
          remove_opt.value = REMOVE_CUSTOM_SIZE_VALUE;
          remove_opt.textContent = "Remove custom size\u2026";
          image_size_select.appendChild(remove_opt);
        }
      }

      if (current_value && seen.has(current_value)) {
        image_size_select.value = current_value;
      }
    }

    const apply_size_mode = () => {
      const advanced = is_advanced_size_mode();
      if (orientation_radio_group) {
        orientation_radio_group.style.display = advanced ? "none" : "flex";
      }
      if (image_size_select) {
        image_size_select.style.display = advanced ? "" : "none";
      }
      if (advanced) {
        let current = localStorage.getItem("imaginer.image_size") || "1024x1024";
        const clamped = clamp_size_for_model(current, get_selected_model());
        if (clamped !== current) {
          current = clamped;
          localStorage.setItem("imaginer.image_size", current);
        }
        build_size_select_options(current);
      } else {
        // Snap orientation from current size
        const current = localStorage.getItem("imaginer.image_size") || "1024x1024";
        const orientation = orientation_for_size(current);
        settings.orientation = orientation;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        localStorage.setItem("imaginer.image_size", size_for_orientation(orientation));
        select_orientation(orientation);
      }
    };

    if (orientation_radio_group) {
      orientation_buttons = Array.from(orientation_radio_group.querySelectorAll(".orientation-btn"));
      // Initial selection
      select_orientation(settings.orientation);
      // Click event
      orientation_buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          settings.orientation = btn.dataset.orientation;
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
          localStorage.setItem("imaginer.image_size", size_for_orientation(settings.orientation));
          select_orientation(settings.orientation);
        });
      });
    }

    if (image_size_select) {
      image_size_select.addEventListener("change", async () => {
        const value = image_size_select.value;
        if (value === ADD_CUSTOM_SIZE_VALUE) {
          if (!custom_size_modal) custom_size_modal = new Custom_size_modal();
          const current = localStorage.getItem("imaginer.image_size") || "1024x1024";
          const result = await custom_size_modal.open(current);
          if (result) {
            add_custom_size(result);
            localStorage.setItem("imaginer.image_size", result);
            build_size_select_options(result);
          } else {
            build_size_select_options(localStorage.getItem("imaginer.image_size") || "1024x1024");
          }
          return;
        }
        if (value === REMOVE_CUSTOM_SIZE_VALUE) {
          if (!remove_custom_size_modal) remove_custom_size_modal = new Remove_custom_size_modal();
          await remove_custom_size_modal.open();
          // After removal(s), if current image_size was removed it stays valid
          // (still parses) and will appear under the dropdown via the
          // "current_value not in seen" fallback.
          build_size_select_options(localStorage.getItem("imaginer.image_size") || "1024x1024");
          return;
        }
        if (parse_size(value)) {
          localStorage.setItem("imaginer.image_size", value);
        }
      });
    }

    apply_size_mode();
    window.addEventListener("imaginer.advanced_size_mode_changed", apply_size_mode);
    window.addEventListener("imaginer.model_changed", apply_size_mode);
    window.addEventListener("imaginer.models_refreshed", apply_size_mode);
    // Help button
    const help_button = this.root.querySelector("#help-btn");
    if (help_button) {
      help_button.addEventListener("click", () => {
        window.open(versioned_url("User_Manual/Imaginer_User_Manual.html"), "_blank");
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
    // For backward compatibility, mirror orientation -> image_size only in basic mode.
    if (!is_advanced_size_mode()) {
      localStorage.setItem("imaginer.image_size", size_for_orientation(settings.orientation));
    }
  }

  set_conversation_mode(is_conversation) {
    this.pending_conversation_mode = is_conversation;
    const new_conv_btn = this.root.querySelector("#new-conversation-btn");
    const history_btn = this.root.querySelector("#conversation-history-btn");

    if (new_conv_btn) new_conv_btn.style.display = is_conversation ? "block" : "none";
    if (history_btn) history_btn.style.display = is_conversation ? "block" : "none";
  }
}
