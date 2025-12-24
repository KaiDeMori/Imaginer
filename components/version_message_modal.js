/*
version_message_modal.js

This component provides a reusable modal dialog for displaying version messages in the Imaginer app.

Key features and design decisions:
- Version messages are stored as standalone HTML files (in the version_messages/ directory), allowing for rich formatting, easy editing, and standalone previewing.
- The modal dynamically loads the appropriate HTML snippet for a version and injects its <body> content into the dialog.
- Styling is handled via a dedicated CSS file (version_message_modal.css), included in the main HTML.
- The modal is decoupled from error handling and can be extended for other informational dialogs in the future.
- For quick testing, a global function show_version_message_modal() is exposed, which can be called from the browser console.

This system is designed for flexibility, maintainability, and a clean user experience for version-related announcements.
*/
// version_message_modal.js
// Modal for displaying version messages using standalone HTML snippets
// Uses loose_snake_case naming throughout

export class version_message_modal {
  constructor() {
    this.modal_element = null;
    this.overlay_element = null;
    this.on_close_callback = null;
  }

  async open(version_html_path, on_close = null) {
    // Remove any existing modal
    this.close();
    this.on_close_callback = on_close;
    // Create overlay
    this.overlay_element = document.createElement("div");
    this.overlay_element.className = "version_message_overlay";
    this.overlay_element.addEventListener("click", () => this.close());
    // Create modal
    this.modal_element = document.createElement("div");
    this.modal_element.className = "version_message_modal";
    // Prevent modal click from closing
    this.modal_element.addEventListener("click", (e) => e.stopPropagation());
    // Load HTML snippet
    try {
      const response = await fetch(version_html_path);
      if (!response.ok) throw new Error("Failed to load version message");
      const html_text = await response.text();
      // Extract body content if present
      const body_match = html_text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      this.modal_element.innerHTML = body_match ? body_match[1] : html_text;
      this._activate_embedded_scripts();
    } catch (err) {
      this.modal_element.innerHTML = `<div class='version_message_error'>Could not load version message.</div>`;
    }
    // Add close button
    const close_btn = document.createElement("button");
    close_btn.className = "version_message_close_btn";
    close_btn.innerText = "Close";
    close_btn.addEventListener("click", () => this.close());
    this.modal_element.appendChild(close_btn);
    // Add to DOM
    this.overlay_element.appendChild(this.modal_element);
    document.body.appendChild(this.overlay_element);
  }

  _activate_embedded_scripts() {
    if (!this.modal_element) {
      return;
    }

    const script_nodes = Array.from(this.modal_element.querySelectorAll("script"));
    for (const original_script of script_nodes) {
      const executable_script = document.createElement("script");
      const type_attribute = original_script.getAttribute("type");
      if (type_attribute) {
        executable_script.setAttribute("type", type_attribute);
      }
      if (original_script.src) {
        executable_script.src = original_script.src;
      } else {
        executable_script.textContent = original_script.textContent;
      }
      original_script.parentNode.replaceChild(executable_script, original_script);
    }
  }

  close() {
    if (this.overlay_element && this.overlay_element.parentNode) {
      this.overlay_element.parentNode.removeChild(this.overlay_element);
    }
    this.overlay_element = null;
    this.modal_element = null;

    if (this.on_close_callback) {
      this.on_close_callback();
      this.on_close_callback = null;
    }
  }
}

// For quick browser testing: expose a global function
window.show_version_message_modal = function (version_html_path = "version_messages/version_1.0.0.html") {
  if (!window._version_message_modal_instance) {
    window._version_message_modal_instance = new version_message_modal();
  }
  window._version_message_modal_instance.open(version_html_path);
};
// Usage: In the browser console, call show_version_message_modal() or provide a path
