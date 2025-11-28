export class Conversation_history {
  constructor(container) {
    this.container = container;
    this.init();
  }

  async init() {
    const response = await fetch("components/conversation_history/conversation_history.html");
    const html = await response.text();
    this.container.innerHTML = html;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "components/conversation_history/conversation_history.css";
    document.head.appendChild(link);

    this.render_dummy_data();
  }

  render_dummy_data() {
    const list = this.container.querySelector(".conversation-list");

    const dummy_messages = [
      { role: "user", text: "Generate a picture of a futuristic city." },
      { role: "model", text: "Here is a futuristic city for you.", image: true },
      { role: "user", text: "Make it more cyberpunk, with neon lights." },
      { role: "model", text: "Updated with neon lights.", image: true },
    ];

    dummy_messages.forEach((msg) => {
      const msg_el = document.createElement("div");
      msg_el.className = `message ${msg.role}`;

      const text_el = document.createElement("div");
      text_el.textContent = msg.text;
      msg_el.appendChild(text_el);

      if (msg.image) {
        const img = document.createElement("div");
        img.style.width = "200px";
        img.style.height = "200px";
        img.style.backgroundColor = "#ddd";
        img.style.marginTop = "8px";
        img.style.display = "flex";
        img.style.alignItems = "center";
        img.style.justifyContent = "center";
        img.style.color = "#666";
        img.textContent = "[Generated Image]";
        img.className = "message-image";

        msg_el.appendChild(img);

        if (msg.role === "model") {
          const btn = document.createElement("button");
          btn.className = "add-to-gallery-btn";
          btn.textContent = "Add to Gallery";
          msg_el.appendChild(btn);
        }
      }

      list.appendChild(msg_el);
    });
  }
}
