// gallery.js – Thumbnail grid with placeholder support
export class Gallery {
  constructor(root, viewer) {
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

    // Listen for delete mode toggle
    window.addEventListener("imaginer.delete_mode_toggled", (e) => {
      this.delete_mode = e.detail.active;
      if (this.delete_mode) {
        this.grid.classList.add("delete-mode");
      } else {
        this.grid.classList.remove("delete-mode");
      }
    });

    // Add style for delete mode cursor
    const style = document.createElement("style");
    style.textContent = `
      .delete-mode img {
        cursor: not-allowed !important;
      }
      .delete-mode .gallery-thumb:hover {
        opacity: 0.7;
        transition: opacity 0.2s;
      }
    `;
    this.root.appendChild(style);

    this.loadImages();
  }

  async loadImages() {
    let records = [];
    if (window.sessionStore?.get_all) {
      // Get images in ascending order (oldest first)
      records = await window.sessionStore.get_all({ reverse: false });
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
      this.addThumbnail(rec.image_blob, rec.prompt_text, rec.created);
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
          .catch(() => null)
      );
    }
    return (await Promise.all(promises)).filter(Boolean);
  }

  addThumbnail(blob, promptText = "", created = null) {
    const url = URL.createObjectURL(blob);
    // Container for image and download button
    const container = document.createElement("div");
    container.classList.add("gallery-thumb");
    Object.assign(container.style, {
      position: "relative",
      width: "100%",
      aspectRatio: "1 / 1",
      display: "block",
    });
    // Add mask-active attribute if mask_blob is present
    if (typeof created === "number" && this.records_by_created && this.records_by_created[created]) {
      const rec = this.records_by_created[created];
      if (rec && rec.mask_blob instanceof Blob) {
        container.setAttribute("mask-active", "");
      }
    }
    // Store a reference for later updates
    if (typeof created === "number") {
      if (!this._thumbnail_containers) this._thumbnail_containers = {};
      this._thumbnail_containers[created] = container;
    }
    // --- Make the container draggable for DnD to prompt panel ---
    container.draggable = true;
    container.addEventListener("dragstart", (event) => {
      // We'll handle the data transfer logic in the next step
      event.dataTransfer.setData("application/x-imaginer-blob", "gallery-thumbnail");
      // Optionally, set a drag image for better visuals
      if (event.dataTransfer.setDragImage) {
        event.dataTransfer.setDragImage(container, 32, 32);
      }
      // Store the blob and metadata in a global singleton for retrieval on drop
      if (!window.imaginer_gallery_drag_store) window.imaginer_gallery_drag_store = {};
      const drag_id = "drag_" + Date.now() + "_" + Math.floor(Math.random() * 1e6);
      // Try to get mask_blob and uuid if available in the record
      let mask_blob = null;
      let uuid = null;
      if (typeof created === "number" && this.records_by_created) {
        const rec = this.records_by_created[created];
        if (rec) {
          if (rec.mask_blob instanceof Blob) {
            mask_blob = rec.mask_blob;
          }
          if (rec.uuid) {
            uuid = rec.uuid;
          }
        }
      }
      window.imaginer_gallery_drag_store[drag_id] = { blob, promptText, created, mask_blob, uuid };
      event.dataTransfer.setData("application/x-imaginer-blob-id", drag_id);
    });

    const imgEl = document.createElement("img");
    imgEl.src = url;
    Object.assign(imgEl.style, {
      width: "100%",
      aspectRatio: "1 / 1",
      objectFit: "contain",
      cursor: "pointer",
      borderRadius: "4px",
      background: "#ddd",
      display: "block",
    });

    imgEl.addEventListener("click", async () => {
      // Check for delete mode
      if (this.delete_mode) {
        if (confirm("Delete this image?")) {
          // Remove from DB
          if (typeof created === "number" && this.records_by_created) {
            const rec = this.records_by_created[created];
            if (rec && rec.id !== undefined) {
              try {
                await window.sessionStore.delete(rec.id);
              } catch (err) {
                console.error("Failed to delete image:", err);
                alert("Failed to delete image.");
                return;
              }
              // Remove from memory
              delete this.records_by_created[created];
              if (this._thumbnail_containers) {
                delete this._thumbnail_containers[created];
              }
            }
          }
          // Remove from UI
          container.remove();
        }
        return;
      }

      // Try to pass image id if available (for mask support)
      if (typeof created === "number" && this.records_by_created) {
        const rec = this.records_by_created[created];
        if (rec && rec.id !== undefined) {
          this.viewer.open(blob, { image_id: rec.id });
          return;
        }
      }
      this.viewer.open(blob);
    });

    // Download button (upper left)
    const btnDownload = document.createElement("button");
    btnDownload.textContent = "⬇️";
    Object.assign(btnDownload.style, {
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
    btnDownload.title = "Download image";

    // Download logic
    btnDownload.addEventListener("click", (e) => {
      e.stopPropagation();
      // Generate filename: first 20 chars of prompt, plus timestamp
      let base = (promptText || "image")
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

    // Prompt-to-box button (upper right)
    const btnPrompt = document.createElement("button");
    btnPrompt.textContent = "💬";
    Object.assign(btnPrompt.style, {
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
    btnPrompt.title = "Load this prompt into the prompt box";

    btnPrompt.addEventListener("click", (e) => {
      e.stopPropagation();
      // Find the prompt input box and set its value
      const promptInput = document.querySelector("#prompt-input");
      if (promptInput) {
        promptInput.value = promptText || "";
        // Save to localStorage for persistence
        localStorage.setItem("imaginer.prompt", promptText || "");
        // Optionally, trigger input event for listeners
        promptInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    // Show buttons on hover
    container.addEventListener("mouseenter", () => {
      btnDownload.style.opacity = 1;
      btnPrompt.style.opacity = 1;
    });
    container.addEventListener("mouseleave", () => {
      btnDownload.style.opacity = 0;
      btnPrompt.style.opacity = 0;
    });

    container.appendChild(imgEl);
    container.appendChild(btnDownload);
    container.appendChild(btnPrompt);

    // --- Insert at the beginning to keep descending order ---
    if (this.grid.firstChild) {
      this.grid.insertBefore(container, this.grid.firstChild);
    } else {
      this.grid.appendChild(container);
    }
  }

  addPlaceholder(startTime = Math.floor(Date.now() / 1000)) {
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
    // Timer element
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
    placeholder._startTime = startTime;
    this.grid.prepend(placeholder);
    Gallery._activePlaceholders = Gallery._activePlaceholders || [];
    Gallery._activePlaceholders.push(placeholder);
    Gallery._ensureTimerInterval();
    return placeholder;
  }

  update_placeholder(placeholder, blob, isError = false, promptText = "", created = null) {
    // Remove timer interval tracking for this placeholder
    if (Gallery._activePlaceholders) {
      const idx = Gallery._activePlaceholders.indexOf(placeholder);
      if (idx !== -1) Gallery._activePlaceholders.splice(idx, 1);
    }
    if (isError) {
      placeholder.style.background = "#f88";
      // Remove timer if present
      if (placeholder._timer) placeholder._timer.remove();
      return;
    }
    // Replace placeholder with a thumbnail (with download button)
    this.addThumbnail(blob, promptText, created);
    placeholder.remove();
  }

  // --- Timer update logic (static, shared for all Gallery instances) ---
  static _ensureTimerInterval() {
    if (Gallery._timerInterval) return;
    Gallery._timerInterval = setInterval(() => {
      if (!Gallery._activePlaceholders || Gallery._activePlaceholders.length === 0) {
        clearInterval(Gallery._timerInterval);
        Gallery._timerInterval = null;
        return;
      }
      const now = Math.floor(Date.now() / 1000);
      for (const ph of Gallery._activePlaceholders) {
        if (!ph._timer || !ph._startTime) continue;
        const elapsed = Math.max(0, now - ph._startTime);
        const min = Math.floor(elapsed / 60);
        const sec = elapsed % 60;
        ph._timer.textContent = `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
      }
    }, 1000);
  }
}
