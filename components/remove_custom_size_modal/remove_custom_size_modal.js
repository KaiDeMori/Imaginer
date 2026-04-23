// remove_custom_size_modal.js
// Modal listing all stored custom sizes. Clicking an entry asks for
// confirmation and removes it from localStorage.

import { versioned_url } from "../../version_manager.js";
import { get_custom_sizes, remove_custom_size, parse_size, format_size_label } from "../size_picker/size_picker.js";

export class Remove_custom_size_modal {
  constructor() {
    this.ready_promise = this.init();
  }

  async init() {
    if (!document.querySelector('link[href="components/remove_custom_size_modal/remove_custom_size_modal.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "components/remove_custom_size_modal/remove_custom_size_modal.css";
      document.head.appendChild(link);
    }

    const response = await fetch(versioned_url("components/remove_custom_size_modal/remove_custom_size_modal.html"));
    const html = await response.text();
    const temp = document.createElement("div");
    temp.innerHTML = html;
    this.overlay = temp.querySelector(".remove_size_overlay");
    this.overlay.style.display = "none";
    document.body.appendChild(this.overlay);

    this.list = this.overlay.querySelector("#remove_size_list");
    this.close_button = this.overlay.querySelector("#remove_size_close");
    this.close_button.addEventListener("click", () => this.close());
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.close();
    });
    this.overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.close();
    });
  }

  async open() {
    await this.ready_promise;
    this.changed = false;
    this.render_list();
    this.overlay.style.display = "flex";
    return new Promise((resolve) => {
      this._resolve = resolve;
    });
  }

  render_list() {
    this.list.innerHTML = "";
    const sizes = get_custom_sizes();
    if (sizes.length === 0) {
      const empty = document.createElement("li");
      empty.className = "remove_size_empty";
      empty.textContent = "No custom sizes saved.";
      this.list.appendChild(empty);
      return;
    }
    for (const value of sizes) {
      const parsed = parse_size(value);
      if (!parsed) continue;
      const li = document.createElement("li");
      li.className = "remove_size_item";
      li.textContent = format_size_label(parsed.width, parsed.height);
      li.title = "Click to remove";
      li.addEventListener("click", () => {
        const ok = window.confirm(`Remove custom size ${format_size_label(parsed.width, parsed.height)}?`);
        if (!ok) return;
        remove_custom_size(value);
        this.changed = true;
        this.render_list();
      });
      this.list.appendChild(li);
    }
  }

  close() {
    this.overlay.style.display = "none";
    if (this._resolve) {
      const r = this._resolve;
      this._resolve = null;
      r(this.changed);
    }
  }
}
