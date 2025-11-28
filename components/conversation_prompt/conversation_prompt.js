export class Conversation_prompt {
  constructor(container) {
    this.container = container;
    this.init();
  }

  async init() {
    const response = await fetch("components/conversation_prompt/conversation_prompt.html");
    const html = await response.text();
    this.container.innerHTML = html;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "components/conversation_prompt/conversation_prompt.css";
    document.head.appendChild(link);
  }
}
