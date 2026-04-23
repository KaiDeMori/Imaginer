// custom_size_modal.js
// Modal for entering a custom image size. Validates input live and only allows
// submission when the size satisfies gpt-image-2 constraints.

import { versioned_url } from "../../version_manager.js";
import { validate_size, format_size, EDGE_MULTIPLE, parse_size } from "../size_picker/size_picker.js";

export class Custom_size_modal {
  constructor() {
    this.ready_promise = this.init();
  }

  async init() {
    if (!document.querySelector('link[href="components/custom_size_modal/custom_size_modal.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "components/custom_size_modal/custom_size_modal.css";
      document.head.appendChild(link);
    }

    const response = await fetch(versioned_url("components/custom_size_modal/custom_size_modal.html"));
    const html = await response.text();
    const temp = document.createElement("div");
    temp.innerHTML = html;
    this.overlay = temp.querySelector(".custom_size_overlay");
    this.overlay.style.display = "none";
    document.body.appendChild(this.overlay);

    this.width_input = this.overlay.querySelector("#custom_size_width");
    this.height_input = this.overlay.querySelector("#custom_size_height");
    this.feedback = this.overlay.querySelector("#custom_size_feedback");
    this.save_button = this.overlay.querySelector("#custom_size_save");
    this.cancel_button = this.overlay.querySelector("#custom_size_cancel");

    this.width_input.addEventListener("input", () => this.revalidate());
    this.height_input.addEventListener("input", () => this.revalidate());
    this.cancel_button.addEventListener("click", () => this.close(null));
    this.save_button.addEventListener("click", () => this.submit());
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.close(null);
    });
    this.overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.close(null);
      if (e.key === "Enter" && !this.save_button.disabled) this.submit();
    });
  }

  async open(initial_value) {
    await this.ready_promise;
    const parsed = parse_size(initial_value || "");
    this.width_input.value = parsed ? parsed.width : 1024;
    this.height_input.value = parsed ? parsed.height : 1024;
    this.feedback.textContent = "";
    this.feedback.className = "custom_size_feedback";
    this.revalidate();
    this.overlay.style.display = "flex";
    setTimeout(() => this.width_input.focus(), 0);

    return new Promise((resolve) => {
      this._resolve = resolve;
    });
  }

  revalidate() {
    const w = parseInt(this.width_input.value, 10);
    const h = parseInt(this.height_input.value, 10);
    if (!Number.isInteger(w) || !Number.isInteger(h) || w <= 0 || h <= 0) {
      this.feedback.textContent = `Enter width and height (multiples of ${EDGE_MULTIPLE}).`;
      this.feedback.className = "custom_size_feedback";
      this.save_button.disabled = true;
      return;
    }
    const result = validate_size(w, h);
    if (!result.ok) {
      this.feedback.textContent = result.errors.join("\n");
      this.feedback.className = "custom_size_feedback error";
      this.save_button.disabled = true;
      return;
    }
    if (result.warnings.length > 0) {
      this.feedback.textContent = result.warnings.join("\n");
      this.feedback.className = "custom_size_feedback warning";
    } else {
      this.feedback.textContent = `OK — ${(w * h).toLocaleString()} pixels.`;
      this.feedback.className = "custom_size_feedback ok";
    }
    this.save_button.disabled = false;
  }

  submit() {
    const w = parseInt(this.width_input.value, 10);
    const h = parseInt(this.height_input.value, 10);
    const result = validate_size(w, h);
    if (!result.ok) return;
    this.close(format_size(w, h));
  }

  close(value) {
    this.overlay.style.display = "none";
    if (this._resolve) {
      const r = this._resolve;
      this._resolve = null;
      r(value);
    }
  }
}
