import { Conversation_history } from "../conversation_history/conversation_history.js";
import { Conversation_prompt } from "../conversation_prompt/conversation_prompt.js";

export class Conversation_panel {
  constructor(container) {
    this.container = container;
    this.init();
  }

  async init() {
    // Load HTML
    const response = await fetch("components/conversation_panel/conversation_panel.html");
    const html = await response.text();
    this.container.innerHTML = html;

    // Load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "components/conversation_panel/conversation_panel.css";
    document.head.appendChild(link);

    // Initialize sub-components
    const history_container = this.container.querySelector("#conversation-history-container");
    const prompt_container = this.container.querySelector("#conversation-prompt-container");

    this.history = new Conversation_history(history_container);
    this.prompt = new Conversation_prompt(prompt_container);
  }
}
