import { versioned_url } from "../../version_manager.js";

export class Conversation_panel {
  constructor(container) {
    this.container = container;
    this.init();
  }

  async init() {
    // Load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./components/conversation_panel/conversation_panel.css";
    document.head.appendChild(link);

    // Load HTML
    const response = await fetch(versioned_url("./components/conversation_panel/conversation_panel.html"));
    const html = await response.text();
    this.container.innerHTML = html;

    this.history_container = this.container.querySelector("#conversation-history");
    this.prompt_input = this.container.querySelector("#conversation-prompt-input");
    this.send_btn = this.container.querySelector("#conversation-send-btn");
    // this.new_conv_btn = this.container.querySelector("#new-conversation-btn"); // Removed
    this.resize_handle = this.container.querySelector("#conversation-resize-handle");
    this.prompt_area = this.container.querySelector("#conversation-prompt-area");

    this.attach_event_listeners();
    this.add_dummy_data();
  }

  attach_event_listeners() {
    this.send_btn.addEventListener("click", () => this.handle_send());
    // this.new_conv_btn.addEventListener("click", () => this.clear_history()); // Removed

    // Resize logic
    let is_resizing = false;
    let start_y = 0;
    let start_height = 0;

    this.resize_handle.addEventListener("mousedown", (e) => {
      is_resizing = true;
      start_y = e.clientY;
      start_height = this.prompt_area.offsetHeight;
      document.body.style.cursor = "row-resize";
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!is_resizing) return;
      const dy = start_y - e.clientY; // Drag up increases height
      this.prompt_area.style.height = `${start_height + dy}px`;
    });

    document.addEventListener("mouseup", () => {
      if (is_resizing) {
        is_resizing = false;
        document.body.style.cursor = "";
      }
    });
  }

  handle_send() {
    const text = this.prompt_input.value.trim();
    if (!text) return;

    this.add_message("user", text);
    this.prompt_input.value = "";

    // Simulate response
    setTimeout(() => {
      this.add_message("assistant", "This is a simulated response from the Conversation API mock-up.");
    }, 1000);
  }

  add_message(role, text, image_url = null) {
    const msg_div = document.createElement("div");
    msg_div.className = `message ${role}`;

    const text_p = document.createElement("p");
    text_p.textContent = text;
    msg_div.appendChild(text_p);

    if (image_url) {
      const img = document.createElement("img");
      img.src = image_url;
      img.className = "message-image";
      msg_div.appendChild(img);

      if (role === "assistant") {
        const btn = document.createElement("button");
        btn.className = "add-to-gallery-btn";
        btn.textContent = "Add to Gallery";
        btn.onclick = () => alert("Mock: Added to gallery");
        msg_div.appendChild(btn);
      }
    }

    this.history_container.appendChild(msg_div);
    this.history_container.scrollTop = this.history_container.scrollHeight;
  }

  clear_history() {
    this.history_container.innerHTML = "";
  }

  add_dummy_data() {
    this.add_message("user", "Hello, I want to edit an image.");
    this.add_message("assistant", "Sure! Please drag and drop an image into the input area.");
    // Add a dummy image message using a local asset if available, or just text for now.
    // this.add_message("assistant", "Here is a sample:", "assets/favicons/Imaginer_Icon_crop_circle_192x192.png");
  }
}
