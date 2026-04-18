// gallery.js – Thumbnail grid with placeholder support
import { read_png_metadata } from "./png_metadata_reader.js";
import { read_jpeg_metadata } from "./jpeg_metadata_reader.js";
import { read_webp_metadata } from "./webp_metadata_reader.js";
import { convert_image_to_png } from "./image_converter.js";
import { process_image_metadata } from "../process_image_metadata.js";

/**
 * @param {File|Blob} file
 * @returns {Promise<string>}
 */
async function read_image_prompt(file) {
  const type = file.type;
  if (type === "image/png")  return read_png_metadata(file);
  if (type === "image/jpeg") return read_jpeg_metadata(file);
  if (type === "image/webp") return read_webp_metadata(file);
  // Signature-based fallback for unknown/empty MIME types
  return (await read_png_metadata(file))
      || (await read_jpeg_metadata(file))
      || (await read_webp_metadata(file));
}

export class Gallery {
  constructor(root, viewer, options = {}) {
    this.on_loading_complete = options.on_loading_complete;
    // Listen for mask updates to synchronize in-memory records and update UI
    window.addEventListener("imaginer.mask-updated", (e) => {
      const { image_id, mask_blob, uuid } = e.detail || {};

      if (image_id != null && this.records_by_id[image_id]) {
        const rec = this.records_by_id[image_id];
        rec.mask_blob = mask_blob;
        rec.uuid = uuid;

        const container = this._thumbnail_containers[image_id];
        if (container) {
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
    this.records_by_id = {};
    this._thumbnail_containers = {};
    this.delete_mode = false;
    this.selected_for_deletion = new Set();

    // Listen for delete mode toggle
    window.addEventListener("imaginer.delete_mode_toggled", (e) => {
      if (e.detail.active) {
        this.delete_mode = true;
        this._clear_selection();
        this.grid.classList.add("delete-mode");
      } else {
        if (this.selected_for_deletion.size > 0) {
          this._confirm_and_delete_selected();
        } else {
          this._exit_delete_mode();
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
    this.records_by_id = {};
    for (const rec of records) {
      if (rec && rec.id != null) {
        this.records_by_id[rec.id] = rec;
      }
      if (rec && rec.image_blob && rec.uuid) {
        rec.image_blob.imaginer_uuid = rec.uuid;
      }
      this.create_or_update_thumbnail(null, rec.image_blob, rec.prompt_text, rec.created, rec.id);
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

          // Extract metadata before any conversion (which strips it)
          const text = await read_image_prompt(file);
          if (text) prompt = text;

          if (file.type !== "image/png") {
            try {
              blob = await convert_image_to_png(file);
            } catch (err) {
              console.error("Failed to convert image:", file.name, err);
              alert(`Failed to convert image: ${file.name}\n${err.message || "Unknown error"}`);
              continue;
            }
          }

          const created = Math.floor(Date.now() / 1000);

          let id = null;
          // Save to DB
          if (window.database_store) {
            const record = {
              created,
              image_blob: blob,
              prompt_imgs: [],
            };
            if (prompt) record.prompt_text = prompt;

            id = await window.database_store.save(record);

            this.records_by_id[id] = { id, ...record };
          }

          // Update UI
          this.create_or_update_thumbnail(null, blob, prompt, created, id);
        }
      }
    });
  }

  _build_thumbnail_content(blob, prompt_text, created, record_id) {
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
        const id = Number(container.dataset.recordId);
        if (isNaN(id)) return;
        if (this.selected_for_deletion.has(id)) {
          this.selected_for_deletion.delete(id);
          container.classList.remove("selected-for-deletion");
        } else {
          this.selected_for_deletion.add(id);
          container.classList.add("selected-for-deletion");
        }
        return;
      }

      if (record_id != null) {
        this.viewer.open(blob, { image_id: record_id });
        return;
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

    button_download.addEventListener("click", async (e) => {
      e.stopPropagation();
      let base = (prompt_text || "image")
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_\-]/g, "")
        .slice(0, 20);
      if (!base) base = "image";
      const ts = created ? String(created) : String(Math.floor(Date.now() / 1000));
      const filename = `${base}_${ts}.png`;
      const processed_blob = await process_image_metadata(blob, prompt_text || "", {});
      const download_url = URL.createObjectURL(processed_blob);
      const a = document.createElement("a");
      a.href = download_url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { a.remove(); URL.revokeObjectURL(download_url); }, 100);
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

  _make_draggable(container, blob, prompt_text, record_id) {
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
      let created = null;
      if (record_id != null && this.records_by_id) {
        const rec = this.records_by_id[record_id];
        if (rec) {
          if (rec.mask_blob instanceof Blob) mask_blob = rec.mask_blob;
          if (rec.uuid) uuid = rec.uuid;
          if (rec.created) created = rec.created;
        }
      }

      window.imaginer_gallery_drag_store[drag_id] = { blob, promptText: prompt_text, created, mask_blob, uuid };
      event.dataTransfer.setData("application/x-imaginer-blob-id", drag_id);
    });
  }

  _exit_delete_mode() {
    this.delete_mode = false;
    this._clear_selection();
    this.grid.classList.remove("delete-mode");
    window.dispatchEvent(new CustomEvent("imaginer.delete_mode_exited"));
  }

  _clear_selection() {
    for (const id of this.selected_for_deletion) {
      const container = this._thumbnail_containers[id];
      if (container) container.classList.remove("selected-for-deletion");
    }
    this.selected_for_deletion.clear();
  }

  _confirm_and_delete_selected() {
    const count = this.selected_for_deletion.size;
    if (!confirm(`Delete ${count} image${count !== 1 ? "s" : ""}? This cannot be undone.`)) {
      return;
    }
    this._delete_selected_images();
  }

  async _delete_selected_images() {
    const ids_to_delete = [...this.selected_for_deletion];

    for (const id of ids_to_delete) {
      await window.database_store.delete(id);
      const container = this._thumbnail_containers[id];
      if (container) container.remove();
      delete this.records_by_id[id];
      delete this._thumbnail_containers[id];
      this.selected_for_deletion.delete(id);
    }

    this._exit_delete_mode();
    this.update_empty_state();
  }

  create_or_update_thumbnail(container, blob, prompt_text, created, record_id = null) {
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

    if (record_id != null) {
      container.dataset.recordId = record_id;
      const rec = this.records_by_id[record_id];
      if (rec && rec.mask_blob instanceof Blob) {
        container.setAttribute("mask-active", "");
      }
      this._thumbnail_containers[record_id] = container;
    }

    this._make_draggable(container, blob, prompt_text, record_id);

    const { image_element, button_download, button_prompt } = this._build_thumbnail_content(blob, prompt_text, created, record_id);

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

  update_placeholder(placeholder, blob, is_error = false, prompt_text = "", created = null, record_id = null) {
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

    this.create_or_update_thumbnail(placeholder, blob, prompt_text, created, record_id);
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
