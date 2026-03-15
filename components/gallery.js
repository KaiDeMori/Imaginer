// gallery.js – Thumbnail grid with placeholder support
import { read_png_metadata } from "./png_metadata_reader.js";
import { convert_image_to_png } from "./image_converter.js";

export class Gallery {
  constructor(root, viewer, options = {}) {
    this.on_loading_complete = options.on_loading_complete;
    // Listen for mask updates to synchronize in-memory records and update UI
    window.addEventListener("imaginer.mask-updated", (e) => {
      const { created, mask_blob, uuid } = e.detail || {};

      if (created && this.records_by_created && this.records_by_created[created]) {
        const rec = this.records_by_created[created];
        rec.mask_blob = mask_blob;
        rec.uuid = uuid;

        // Update mask-active attribute on the thumbnail container
        if (this._thumbnail_containers && this._thumbnail_containers[created]) {
          const container = this._thumbnail_containers[created];
          if (mask_blob instanceof Blob) {
            container.setAttribute("mask-active", "");
          } else {
            container.removeAttribute("mask-active");
          }
        }
      }
    });
    this.root = root;
    this.viewer = viewer;
    this.grid = document.createElement("div");
    Object.assign(this.grid.style, {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
      gap: "8px",
      padding: "8px",
    });
    this.root.appendChild(this.grid);
    this.records_by_created = {};
    this.delete_mode = false;
    this.selected_for_deletion = new Set();

    // Listen for delete mode toggle
    window.addEventListener("imaginer.delete_mode_toggled", (e) => {
      this.delete_mode = e.detail.active;
      if (this.delete_mode) {
        this._clear_selection();
        this.grid.classList.add("delete-mode");
      } else {
        this.grid.classList.remove("delete-mode");
        if (this.selected_for_deletion.size > 0) {
          this._confirm_and_delete_selected();
        } else {
          this._clear_selection();
        }
      }
    });

    // Add style for delete mode
    const style = document.createElement("style");
    style.textContent = `
      .delete-mode img {
        cursor: pointer !important;
      }
      .delete-mode .gallery-thumb:hover {
        opacity: 0.7;
        transition: opacity 0.2s;
      }
      .gallery-thumb.selected-for-deletion {
        outline: 3px solid #ff5252;
        border-radius: 4px;
      }
      .gallery-thumb.selected-for-deletion::after {
        content: "";
        position: absolute;
        inset: 0;
        background: rgba(220, 40, 40, 0.45);
        border-radius: 4px;
        pointer-events: none;
        z-index: 3;
      }
    `;
    this.root.appendChild(style);

    // Placeholder for empty state
    this.root.style.position = "relative";
    this.empty_placeholder = document.createElement("div");
    this.empty_placeholder.textContent = "Drop image(s) for import";
    Object.assign(this.empty_placeholder.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      color: "#bbb",
      fontSize: "1.1rem",
      pointerEvents: "none",
      textAlign: "center",
      width: "100%",
      display: "none",
    });
    this.root.appendChild(this.empty_placeholder);

    this.enable_drag_and_drop();
    this.loadImages();
  }

  async loadImages() {
    let records = [];
    if (window.database_store?.get_all) {
      // Get images in ascending order (oldest first)
      records = await window.database_store.get_all({ reverse: false });
    } else {
      records = await this.loadDummyImages();
    }
    // Build mapping from created timestamp to record (for id lookup)
    this.records_by_created = {};
    for (const rec of records) {
      if (rec && typeof rec.created === "number") {
        this.records_by_created[rec.created] = rec;
      }
      // Attach uuid in memory to blob for DnD
      if (rec && rec.image_blob && rec.uuid) {
        rec.image_blob.imaginer_uuid = rec.uuid;
      }
      this.create_or_update_thumbnail(null, rec.image_blob, rec.prompt_text, rec.created);
    }
    this.update_empty_state();

    if (this.on_loading_complete) {
      setTimeout(() => this.on_loading_complete(), 0);
    }
  }

  async loadDummyImages() {
    const count = 6;
    const promises = [];
    for (let i = 1; i <= count; i++) {
      const path = `assets/dummy_pictures/${String(i).padStart(2, "0")}.png`;
      promises.push(
        fetch(path)
          .then((r) => (r.ok ? r.blob() : Promise.reject()))
          .then((blob) => ({ image_blob: blob }))
          .catch(() => null),
      );
    }
    return (await Promise.all(promises)).filter(Boolean);
  }

  enable_drag_and_drop() {
    this.root.addEventListener("dragover", (e) => {
      e.preventDefault();
      this.root.style.backgroundColor = "#e6f7ff"; // Visual feedback
      this.root.style.borderColor = "#1890ff";
    });

    this.root.addEventListener("dragleave", (e) => {
      this.root.style.backgroundColor = "";
      this.root.style.borderColor = "";
    });

    this.root.addEventListener("drop", async (e) => {
      e.preventDefault();
      this.root.style.backgroundColor = "";
      this.root.style.borderColor = "";

      for (const file of e.dataTransfer.files) {
        if (file.type.startsWith("image/")) {
          let blob = file;
          let prompt = null;

          if (file.type === "image/png") {
            const text = await read_png_metadata(file);
            if (text) prompt = text;
          } else {
            try {
              blob = await convert_image_to_png(file);
            } catch (err) {
              console.error("Failed to convert image:", file.name, err);
              alert(`Failed to convert image: ${file.name}\n${err.message || "Unknown error"}`);
              continue;
            }
          }

          const created = Math.floor(Date.now() / 1000);

          // Save to DB
          if (window.database_store) {
            const record = {
              created,
              image_blob: blob,
              prompt_imgs: [],
            };
            if (prompt) record.prompt_text = prompt;

            const id = await window.database_store.save(record);

            // Update internal record
            if (this.records_by_created) {
              this.records_by_created[created] = {
                id,
                ...record,
              };
            }
          }

          // Update UI
          this.create_or_update_thumbnail(null, blob, prompt, created);
        }
      }
    });
  }

  _build_thumbnail_content(blob, prompt_text, created) {
    const url = URL.createObjectURL(blob);

    const image_element = document.createElement("img");
    image_element.src = url;
    Object.assign(image_element.style, {
      width: "100%",
      aspectRatio: "1 / 1",
      objectFit: "contain",
      cursor: "pointer",
      borderRadius: "4px",
      background: "#ddd",
      display: "block",
    });

    image_element.addEventListener("click", async () => {
      if (this.delete_mode) {
        const container = image_element.closest(".gallery-thumb");
        if (this.selected_for_deletion.has(created)) {
          this.selected_for_deletion.delete(created);
          container.classList.remove("selected-for-deletion");
        } else {
          this.selected_for_deletion.add(created);
          container.classList.add("selected-for-deletion");
        }
        return;
      }

      if (typeof created === "number" && this.records_by_created) {
        const rec = this.records_by_created[created];
        if (rec && rec.id !== undefined) {
          this.viewer.open(blob, { image_id: rec.id });
          return;
        }
      }
      this.viewer.open(blob);
    });

    const button_download = document.createElement("button");
    button_download.textContent = "⬇️";
    Object.assign(button_download.style, {
      position: "absolute",
      top: "6px",
      left: "6px",
      zIndex: 2,
      background: "#fff",
      border: "none",
      borderRadius: "4px",
      padding: "2px 6px",
      fontSize: "1.1rem",
      cursor: "pointer",
      opacity: 0,
      transition: "opacity 0.1s",
    });
    button_download.title = "Download image";

    button_download.addEventListener("click", (e) => {
      e.stopPropagation();
      let base = (prompt_text || "image")
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_\-]/g, "")
        .slice(0, 20);
      if (!base) base = "image";
      const ts = created ? String(created) : String(Math.floor(Date.now() / 1000));
      const filename = `${base}_${ts}.png`;
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => a.remove(), 100);
    });

    let button_prompt = null;
    if (prompt_text) {
      button_prompt = document.createElement("button");
      button_prompt.textContent = "💬";
      Object.assign(button_prompt.style, {
        position: "absolute",
        top: "6px",
        right: "6px",
        zIndex: 2,
        background: "#fff",
        border: "none",
        borderRadius: "4px",
        padding: "2px 6px",
        fontSize: "1.1rem",
        cursor: "pointer",
        opacity: 0,
        transition: "opacity 0.1s",
      });
      button_prompt.title = "Load this prompt into the prompt box";

      button_prompt.addEventListener("click", (e) => {
        e.stopPropagation();
        const promptInput = document.querySelector("#prompt-input");
        if (promptInput) {
          promptInput.value = prompt_text || "";
          localStorage.setItem("imaginer.prompt", prompt_text || "");
          promptInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
    }

    return { image_element, button_download, button_prompt };
  }

  _make_draggable(container, blob, prompt_text, created) {
    container.draggable = true;
    container.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("application/x-imaginer-blob", "gallery-thumbnail");
      if (event.dataTransfer.setDragImage) {
        event.dataTransfer.setDragImage(container, 32, 32);
      }

      if (!window.imaginer_gallery_drag_store) window.imaginer_gallery_drag_store = {};
      const drag_id = "drag_" + Date.now() + "_" + Math.floor(Math.random() * 1e6);

      let mask_blob = null;
      let uuid = null;
      if (typeof created === "number" && this.records_by_created) {
        const rec = this.records_by_created[created];
        if (rec) {
          if (rec.mask_blob instanceof Blob) mask_blob = rec.mask_blob;
          if (rec.uuid) uuid = rec.uuid;
        }
      }

      window.imaginer_gallery_drag_store[drag_id] = { blob, promptText: prompt_text, created, mask_blob, uuid };
      event.dataTransfer.setData("application/x-imaginer-blob-id", drag_id);
    });
  }

  async _delete_image(created, container) {
    if (typeof created === "number" && this.records_by_created) {
      const rec = this.records_by_created[created];
      if (rec && rec.id !== undefined) {
        try {
          await window.database_store.delete(rec.id);
        } catch (err) {
          console.error("Failed to delete image:", err);
          alert("Failed to delete image.");
          return;
        }
        delete this.records_by_created[created];
        if (this._thumbnail_containers) {
          delete this._thumbnail_containers[created];
        }
      }
    }
    container.remove();
    this.update_empty_state();
  }

  _clear_selection() {
    for (const created of this.selected_for_deletion) {
      const container = this._thumbnail_containers?.[created];
      if (container) container.classList.remove("selected-for-deletion");
    }
    this.selected_for_deletion.clear();
  }

  _confirm_and_delete_selected() {
    const count = this.selected_for_deletion.size;
    if (!confirm(`Delete ${count} image${count !== 1 ? "s" : ""}? This cannot be undone.`)) {
      this._clear_selection();
      return;
    }
    this._delete_selected_images();
  }

  async _delete_selected_images() {
    const count = this.selected_for_deletion.size;
    this._show_deletion_overlay(count);

    const deletions = [...this.selected_for_deletion].map(async (created) => {
      const container = this._thumbnail_containers?.[created];
      const rec = this.records_by_created?.[created];
      if (rec?.id !== undefined) {
        await window.database_store.delete(rec.id);
        delete this.records_by_created[created];
        if (this._thumbnail_containers) {
          delete this._thumbnail_containers[created];
        }
      }
      if (container) container.remove();
    });

    await Promise.all(deletions);

    this._remove_deletion_overlay();
    this._clear_selection();
    this.update_empty_state();
  }

  _show_deletion_overlay(count) {
    const overlay = document.createElement("div");
    overlay.id = "imaginer-deletion-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(0,0,0,0.45)",
      zIndex: "9999",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "all",
    });
    overlay.innerHTML = `<div style="background:#fff;border-radius:8px;padding:24px 36px;font-size:1.1rem;display:flex;gap:12px;align-items:center;">
      <span style="font-size:1.5rem">⏳</span> Deleting ${count} image${count !== 1 ? "s" : ""}…
    </div>`;
    document.body.appendChild(overlay);
    this._deletion_overlay = overlay;
  }

  _remove_deletion_overlay() {
    this._deletion_overlay?.remove();
    this._deletion_overlay = null;
  }

  create_or_update_thumbnail(container, blob, prompt_text, created) {
    if (!container) {
      container = document.createElement("div");
    }

    container.classList.add("gallery-thumb");

    Object.assign(container.style, {
      position: "relative",
      width: "100%",
      aspectRatio: "1 / 1",
      display: "block",
      background: "",
      borderRadius: "4px",
      alignItems: "",
      justifyContent: "",
    });

    if (typeof created === "number" && this.records_by_created && this.records_by_created[created]) {
      const rec = this.records_by_created[created];
      if (rec && rec.mask_blob instanceof Blob) {
        container.setAttribute("mask-active", "");
      }
    }

    if (typeof created === "number") {
      if (!this._thumbnail_containers) this._thumbnail_containers = {};
      this._thumbnail_containers[created] = container;
    }

    this._make_draggable(container, blob, prompt_text, created);

    const { image_element, button_download, button_prompt } = this._build_thumbnail_content(blob, prompt_text, created);

    container.appendChild(image_element);
    container.appendChild(button_download);
    if (button_prompt) container.appendChild(button_prompt);

    container.addEventListener("mouseenter", () => {
      button_download.style.opacity = 1;
      if (button_prompt) button_prompt.style.opacity = 1;
    });
    container.addEventListener("mouseleave", () => {
      button_download.style.opacity = 0;
      if (button_prompt) button_prompt.style.opacity = 0;
    });

    const is_new_container = !container.parentNode;
    if (is_new_container) {
      if (this.grid.firstChild) {
        this.grid.insertBefore(container, this.grid.firstChild);
      } else {
        this.grid.appendChild(container);
      }
      this.update_empty_state();
    }

    return container;
  }

  create_placeholder(start_time = Math.floor(Date.now() / 1000)) {
    const placeholder = document.createElement("div");
    Object.assign(placeholder.style, {
      width: "100%",
      aspectRatio: "1 / 1",
      background: "#ccc",
      borderRadius: "4px",
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });
    const timer = document.createElement("span");
    Object.assign(timer.style, {
      position: "absolute",
      bottom: "6px",
      right: "8px",
      fontSize: "0.85rem",
      color: "#555",
      background: "rgba(255,255,255,0.7)",
      borderRadius: "3px",
      padding: "1px 5px",
      fontFamily: "monospace",
      zIndex: 2,
    });
    placeholder.appendChild(timer);
    placeholder._timer = timer;
    placeholder._start_time = start_time;
    this.grid.prepend(placeholder);
    Gallery.tracked_placeholders = Gallery.tracked_placeholders || [];
    Gallery.tracked_placeholders.push(placeholder);
    Gallery.start_placeholder_timer_if_needed();
    this.update_empty_state();
    return placeholder;
  }

  update_placeholder_with_partial_image(placeholder, blob, partial_index) {
    const existing_image = placeholder.querySelector("img.partial-preview");
    if (existing_image) {
      URL.revokeObjectURL(existing_image.src);
      existing_image.remove();
    }

    const image = document.createElement("img");
    image.className = "partial-preview";
    const url = URL.createObjectURL(blob);
    image.src = url;
    Object.assign(image.style, {
      width: "100%",
      height: "100%",
      objectFit: "contain",
      position: "absolute",
      top: "0",
      left: "0",
    });

    placeholder.appendChild(image);
  }

  update_placeholder(placeholder, blob, is_error = false, prompt_text = "", created = null) {
    if (Gallery.tracked_placeholders) {
      const idx = Gallery.tracked_placeholders.indexOf(placeholder);
      if (idx !== -1) Gallery.tracked_placeholders.splice(idx, 1);
    }

    const partial_image = placeholder.querySelector("img.partial-preview");
    if (partial_image) {
      URL.revokeObjectURL(partial_image.src);
      partial_image.remove();
    }
    const partial_label = placeholder.querySelector(".partial-label");
    if (partial_label) partial_label.remove();

    if (is_error) {
      placeholder.style.background = "#f88";
      if (placeholder._timer) placeholder._timer.remove();

      const button_prompt = document.createElement("button");
      button_prompt.textContent = "💬";
      Object.assign(button_prompt.style, {
        position: "absolute",
        top: "6px",
        right: "6px",
        zIndex: 2,
        background: "#fff",
        border: "none",
        borderRadius: "4px",
        padding: "2px 6px",
        fontSize: "1.1rem",
        cursor: "pointer",
        opacity: 1,
      });
      button_prompt.title = "Load this prompt into the prompt box";

      button_prompt.addEventListener("click", (e) => {
        e.stopPropagation();
        const promptInput = document.querySelector("#prompt-input");
        if (promptInput) {
          promptInput.value = prompt_text || "";
          localStorage.setItem("imaginer.prompt", prompt_text || "");
          promptInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
      placeholder.appendChild(button_prompt);
      return;
    }

    if (placeholder._timer) placeholder._timer.remove();

    this.create_or_update_thumbnail(placeholder, blob, prompt_text, created);
    this.update_empty_state();
  }

  update_empty_state() {
    const has_images = this.grid.children.length > 0;
    if (this.empty_placeholder) {
      this.empty_placeholder.style.display = has_images ? "none" : "block";
    }
  }

  // --- Timer update logic (static, shared for all Gallery instances) ---
  static start_placeholder_timer_if_needed() {
    if (Gallery.timer_interval_id) return;
    Gallery.timer_interval_id = setInterval(() => {
      if (!Gallery.tracked_placeholders || Gallery.tracked_placeholders.length === 0) {
        clearInterval(Gallery.timer_interval_id);
        Gallery.timer_interval_id = null;
        return;
      }
      const now = Math.floor(Date.now() / 1000);
      for (const ph of Gallery.tracked_placeholders) {
        if (!ph._timer || !ph._start_time) continue;
        const elapsed = Math.max(0, now - ph._start_time);
        const min = Math.floor(elapsed / 60);
        const sec = elapsed % 60;
        ph._timer.textContent = `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
      }
    }, 1000);
  }
}
