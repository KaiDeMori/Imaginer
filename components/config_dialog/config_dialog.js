// config_dialog.js – Modal UI for entering & saving the OpenAI API key
// Note: This component uses the Runtime Fetch pattern to load its HTML and CSS.
// Usage:
//   const cfg = new Config_dialog();
//   cfg.open();
// ---------------------------------------------------------------------
export class Config_dialog {
  constructor(onSave = () => {}) {
    this.onSave = onSave;
    this.init_promise = this.init();
  }

  async init() {
    // 1. Load CSS (if not already there)
    if (!document.querySelector('link[href="components/config_dialog/config_dialog.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "components/config_dialog/config_dialog.css";
      document.head.appendChild(link);
    }

    // 2. Fetch HTML
    const response = await fetch("components/config_dialog/config_dialog.html");
    const html = await response.text();

    // 3. Create a temporary container to parse the HTML
    const temp = document.createElement("div");
    temp.innerHTML = html;

    // 4. Extract the overlay (root of the dialog)
    this.overlay = temp.querySelector(".overlay");
    document.body.appendChild(this.overlay);

    // 5. Get references to elements
    this.dialog = this.overlay.querySelector(".dialog");
    this.basic_tab_button = this.overlay.querySelector("#basic_tab_button");
    this.advanced_tab_button = this.overlay.querySelector("#advanced_tab_button");
    this.basic_tab_content = this.overlay.querySelector("#basic_tab_content");
    this.advanced_tab_content = this.overlay.querySelector("#advanced_tab_content");

    this.api_key_form = this.overlay.querySelector("#api_key_form");
    this.input = this.overlay.querySelector("#api_key_input");
    this.testBtn = this.overlay.querySelector("#test_button");
    this.testFeedback = this.overlay.querySelector("#test_feedback");

    this.max_input = this.overlay.querySelector("#max_input");
    this.n_input = this.overlay.querySelector("#n_input");
    this.background_select = this.overlay.querySelector("#background_select");
    this.quality_select = this.overlay.querySelector("#quality_select");
    this.input_fidelity_select = this.overlay.querySelector("#input_fidelity_select");

    this.strip_checkbox = this.overlay.querySelector("#strip_checkbox");
    this.show_mask_mode_checkbox = this.overlay.querySelector("#show_mask_mode_checkbox");
    this.prompt_checkbox = this.overlay.querySelector("#prompt_checkbox");
    this.prompt_xmp_checkbox = this.overlay.querySelector("#prompt_xmp_checkbox");

    this.button_download_all = this.overlay.querySelector("#download_all_button");
    this.button_cancel = this.overlay.querySelector("#cancel_button");
    this.button_save = this.overlay.querySelector("#save_button");
    this.refresh_models_button = this.overlay.querySelector("#refresh_models_button");
    this.clear_gallery_button = this.overlay.querySelector("#clear_gallery_button");

    // 6. Wire events
    this.wire_events();
  }

  wire_events() {
    // Tab switching logic
    this.basic_tab_button.addEventListener("click", () => {
      this.basic_tab_button.classList.add("active");
      this.advanced_tab_button.classList.remove("active");
      this.basic_tab_content.style.display = "";
      this.advanced_tab_content.style.display = "none";
    });
    this.advanced_tab_button.addEventListener("click", () => {
      this.advanced_tab_button.classList.add("active");
      this.basic_tab_button.classList.remove("active");
      this.basic_tab_content.style.display = "none";
      this.advanced_tab_content.style.display = "";
    });

    // Form submit
    this.api_key_form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.testBtn.click();
    });

    // Remove feedback if API key field changes
    this.input.addEventListener("input", () => {
      this.testFeedback.textContent = "";
    });

    // Test button logic
    this.testBtn.addEventListener("click", async () => {
      this.testFeedback.textContent = "";
      this.testBtn.disabled = true;
      this.testBtn.textContent = "Testing...";
      const key = this.input.value.trim();
      if (!key) {
        this.testFeedback.textContent = "";
        this.testBtn.disabled = false;
        this.testBtn.textContent = "Test";
        return;
      }
      try {
        const resp = await fetch("https://api.openai.com/v1/models", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json",
          },
        });
        if (!resp.ok) {
          let errObj = null;
          try {
            errObj = await resp.json();
          } catch (_) {
            errObj = { message: `API request failed: ${resp.status} ${resp.statusText}` };
          }
          import("../error_modal.js").then(({ Error_modal }) => {
            Error_modal.show(errObj);
          });
          this.testFeedback.textContent = "👎";
          this.testBtn.disabled = false;
          this.testBtn.textContent = "Test";
          return;
        }
        const data = await resp.json();
        if (data && Array.isArray(data.data)) {
          // Cache the model IDs from test request to avoid duplicate API calls
          const image_model_ids = data.data
            .filter((model) => model.id && model.id.startsWith("gpt-image"))
            .map((model) => model.id)
            .sort();

          if (image_model_ids.length > 0) {
            localStorage.setItem("imaginer.available_image_models", JSON.stringify(image_model_ids));
          }

          const found = data.data.some((m) => m.id === "gpt-image-1");
          if (found) {
            this.testFeedback.textContent = "👍";
          } else {
            this.testFeedback.textContent = "😢";
            import("../error_modal.js").then(({ Error_modal }) => {
              Error_modal.show({
                message: "API key is valid, but you do not have access to the gpt-image-1 model.",
                hint: "Check your OpenAI account or organization permissions.",
              });
            });
          }
        } else {
          this.testFeedback.textContent = "👎";
          import("../error_modal.js").then(({ Error_modal }) => {
            Error_modal.show({ message: "Unexpected response from API." });
          });
        }
      } catch (err) {
        this.testFeedback.textContent = "👎";
        import("../error_modal.js").then(({ Error_modal }) => {
          Error_modal.show(err && err.message ? err.message : err);
        });
      } finally {
        this.testBtn.disabled = false;
        this.testBtn.textContent = "Test";
      }
    });

    // Click outside dialog closes (acts like cancel)
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.close();
    });

    // Cancel button
    this.button_cancel.addEventListener("click", () => this.close());

    // Save button
    this.button_save.addEventListener("click", async () => {
      await this.save();
    });

    // Download All Images button
    this.button_download_all.addEventListener("click", async () => {
      const { Download_progress_dialog } = await import("../../components/download_progress_dialog/download_progress_dialog.js");
      const progress = new Download_progress_dialog();
      await progress.init_promise;

      try {
        progress.show();
        progress.set_status("Preparing download...");

        const { get_jszip } = await import("../../static_imports/jszip_loader.js");
        const JSZip = await get_jszip();
        const { Database_store } = await import("../../storage/database_store.js");

        const store = new Database_store();
        const records = await store.get_all({ reverse: false });

        if (!records.length) throw new Error("No images to download.");

        const zip = new JSZip();
        progress.set_status("Processing images...");

        for (let i = 0; i < records.length; i++) {
          const rec = records[i];
          if (rec.image_blob instanceof Blob) {
            let base = (rec.prompt_text || "image")
              .replace(/\s+/g, "_")
              .replace(/[^a-zA-Z0-9_\-]/g, "")
              .slice(0, 20);
            if (!base) base = "image";
            const ts = rec.created ? String(rec.created) : String(Math.floor(Date.now() / 1000));
            const filename = `${base}_${ts}.png`;

            zip.file(filename, rec.image_blob);
            progress.update_progress(i + 1, records.length);
          }
        }

        progress.set_status("Saving to disk...");
        const blob = await zip.generateAsync({ type: "blob" });

        const url = URL.createObjectURL(blob);
        const export_ts = new Date()
          .toISOString()
          .replace(/[-:T.]/g, "")
          .slice(0, 14);
        const zip_name = `Imaginer_Export_${export_ts}.zip`;
        const a = document.createElement("a");
        a.href = url;
        a.download = zip_name;
        document.body.appendChild(a);
        a.click();

        await new Promise((resolve) => setTimeout(resolve, 500));
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        progress.close();
      } catch (err) {
        progress.show_error(err.message || String(err));
      }
    });

    // Enter key inside input triggers save
    this.input.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        await this.save();
      }
    });

    // Refresh Image Models button
    this.refresh_models_button.addEventListener("click", async () => {
      this.refresh_models_button.disabled = true;
      this.refresh_models_button.textContent = "Refreshing...";

      try {
        const { refresh_models } = await import("../../model_fetcher.js");
        await refresh_models();

        // Fire event to notify menu bar
        window.dispatchEvent(new CustomEvent("imaginer.models_refreshed"));

        this.refresh_models_button.textContent = "✓ Refreshed";
        setTimeout(() => {
          this.refresh_models_button.textContent = "Refresh Image Models";
        }, 2000);
      } catch (error) {
        this.refresh_models_button.textContent = "Failed to refresh";
        setTimeout(() => {
          this.refresh_models_button.textContent = "Refresh Image Models";
        }, 2000);

        const { Error_modal } = await import("../error_modal.js");
        Error_modal.show(error);
      } finally {
        this.refresh_models_button.disabled = false;
      }
    });

    // Clear Gallery button
    this.clear_gallery_button.addEventListener("click", async () => {
      if (!this.clear_gallery_warned) {
        this.clear_gallery_warned = true;
        this.button_download_all.classList.add("glow-animation");
        return;
      }

      const confirmation = prompt("WARNING: This will remove ALL images from your gallery!\n\nType 'YES' to confirm:");

      if (confirmation && confirmation.toUpperCase() === "YES") {
        try {
          await window.database_store.clear();
          location.reload();
        } catch (err) {
          alert("Failed to clear gallery: " + err.message);
        }
      }
    });
  }

  async open() {
    await this.init_promise;

    // Reset clear gallery warning state
    this.clear_gallery_warned = false;
    this.button_download_all.classList.remove("glow-animation");

    // Show Mask Mode Button checkbox
    this.show_mask_mode_checkbox.checked = localStorage.getItem("imaginer.show_mask_mode_button") === "true";
    // Use Database_store to get the decoded API key
    this.input.value = "";
    import("../../storage/database_store.js")
      .then(({ Database_store }) => {
        this.input.value = Database_store.get_api_key() || "";
      })
      .catch(() => {
        this.input.value = "";
      });
    this.max_input.value = localStorage.getItem("imaginer.max_parallel_generations");
    this.n_input.value = localStorage.getItem("imaginer.n");
    this.quality_select.value = localStorage.getItem("imaginer.quality");
    this.background_select.value = localStorage.getItem("imaginer.background");
    this.input_fidelity_select.value = localStorage.getItem("imaginer.input_fidelity");
    this.strip_checkbox.checked = localStorage.getItem("imaginer.strip_metadata") === "true";
    // iTXt embedding is off by default
    this.prompt_checkbox.checked = localStorage.getItem("imaginer.add_prompt_to_image") === "true";
    if (this.prompt_xmp_checkbox) {
      this.prompt_xmp_checkbox.checked = localStorage.getItem("imaginer.add_prompt_to_image_xmp") === "true";
    }
    this.overlay.style.display = "flex";
    this.input.focus();
  }

  close() {
    if (this.overlay) {
      this.overlay.style.display = "none";
    }
  }

  async save() {
    const key = this.input.value.trim();
    const max = Math.max(1, parseInt(this.max_input.value));
    const n = Math.max(1, Math.min(10, parseInt(this.n_input.value)));
    const quality = this.quality_select.value;
    const background = this.background_select.value;
    const input_fidelity = this.input_fidelity_select.value;
    const strip = this.strip_checkbox.checked;
    const add_prompt = this.prompt_checkbox.checked;
    const add_prompt_xmp = this.prompt_xmp_checkbox?.checked;

    // Use Database_store to set the scrambled API key - wait for it to complete
    const { Database_store } = await import("../../storage/database_store.js");
    if (key) {
      Database_store.set_api_key(key);
    } else {
      localStorage.removeItem("imaginer.scrambled_api_key");
    }

    localStorage.setItem("imaginer.max_parallel_generations", String(max));
    localStorage.setItem("imaginer.n", String(n));
    localStorage.setItem("imaginer.background", background);
    localStorage.setItem("imaginer.quality", quality);
    localStorage.setItem("imaginer.input_fidelity", input_fidelity);
    localStorage.setItem("imaginer.strip_metadata", String(strip));
    localStorage.setItem("imaginer.add_prompt_to_image", String(add_prompt));
    localStorage.setItem("imaginer.add_prompt_to_image_xmp", String(add_prompt_xmp));
    localStorage.setItem("imaginer.show_mask_mode_button", String(this.show_mask_mode_checkbox.checked));
    this.close();
    this.onSave(key, max, n, strip, add_prompt, quality);
  }
}
