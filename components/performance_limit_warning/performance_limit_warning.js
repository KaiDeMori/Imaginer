export class Performance_limit_warning {
  constructor() {
    this.init_promise = this.init();
  }

  async init() {
    // 1. Load CSS
    if (!document.querySelector('link[href="components/performance_limit_warning/performance_limit_warning.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "components/performance_limit_warning/performance_limit_warning.css";
      document.head.appendChild(link);
    }

    // 2. Fetch HTML
    const response = await fetch("components/performance_limit_warning/performance_limit_warning.html");
    const html = await response.text();

    // 3. Create container
    const temp = document.createElement("div");
    temp.innerHTML = html;

    // 4. Extract overlay
    this.overlay = temp.querySelector(".overlay");
    document.body.appendChild(this.overlay);

    // 5. Get references
    this.button_download_all = this.overlay.querySelector("#download_all_button");
    this.button_clear_gallery = this.overlay.querySelector("#clear_gallery_button");
    this.button_close = this.overlay.querySelector("#close_button");

    // 6. Attach listeners
    this.button_close.addEventListener("click", () => this.close());
    this.button_download_all.addEventListener("click", () => this.download_all());
    this.button_clear_gallery.addEventListener("click", () => this.clear_gallery());
  }

  async open() {
    await this.init_promise;
    this.overlay.style.display = "flex";
  }

  close() {
    if (this.overlay) {
      this.overlay.style.display = "none";
    }
  }

  async download_all() {
    this.button_download_all.disabled = true;
    this.button_download_all.textContent = "Preparing...";
    try {
      // Dynamically import JSZip
      const { get_jszip } = await import("../../static_imports/jszip_loader.js");
      const JSZip = await get_jszip();

      // Get all images from database store
      const { Database_store } = await import("../../storage/database_store.js");
      const store = new Database_store();
      const records = await store.get_all({ reverse: false });

      if (!records.length) throw new Error("No images to download.");

      const zip = new JSZip();
      for (const rec of records) {
        if (rec.image_blob instanceof Blob) {
          // Use the same naming as gallery.js: first 20 chars of prompt, plus timestamp
          let base = (rec.prompt_text || "image")
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_\-]/g, "")
            .slice(0, 20);
          if (!base) base = "image";
          const ts = rec.created ? String(rec.created) : String(Math.floor(Date.now() / 1000));
          const filename = `${base}_${ts}.png`;
          zip.file(filename, rec.image_blob);
        }
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);

      // Use export name: Imaginer_Export_<timestamp>.zip
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

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      alert("Download failed: " + (err && err.message ? err.message : err));
    } finally {
      this.button_download_all.disabled = false;
      this.button_download_all.textContent = "Download All Images (ZIP)";
    }
  }

  async clear_gallery() {
    const confirmation = prompt("WARNING: This will remove ALL images from your gallery!\n\nType 'YES' to confirm:");

    if (confirmation && confirmation.toUpperCase() === "YES") {
      try {
        const { Database_store } = await import("../../storage/database_store.js");
        const store = new Database_store();
        await store.clear();
        location.reload();
      } catch (err) {
        alert("Failed to clear gallery: " + err.message);
      }
    }
  }
}
