import { get_version_history, versioned_url } from "../../version_manager.js";

export class About_dialog {
  constructor() {
    this.ready_promise = this.init();
  }

  async init() {
    // 1. Load CSS
    if (!document.querySelector('link[href="components/about_dialog/about_dialog.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "components/about_dialog/about_dialog.css";
      document.head.appendChild(link);
    }

    // 2. Fetch HTML
    const response = await fetch(versioned_url("components/about_dialog/about_dialog.html"));
    const html = await response.text();

    // 3. Inject
    const temp = document.createElement("div");
    temp.innerHTML = html;
    this.overlay = temp.querySelector(".about_overlay");
    document.body.appendChild(this.overlay);

    // 4. Populate Dynamic Content
    await this.populate_versions();
    this.populate_credits();
    this.load_font();

    // 5. Wire Events
    this.wire_events();
  }

  async populate_versions() {
    const version_list = this.overlay.querySelector("#version_list");
    const history = await get_version_history();
    Object.entries(history)
      .reverse()
      .forEach(([version, path]) => {
        const li = document.createElement("li");
        li.className = "about_list_item";
        const link = document.createElement("a");
        link.href = versioned_url(path);
        link.target = "_blank";
        link.textContent = `Version ${version}`;
        link.className = "about_link";
        li.appendChild(link);
        version_list.appendChild(li);
      });
  }

  populate_credits() {
    const credits_paragraph = this.overlay.querySelector("#credits_paragraph");
    const credits_data = [
      { name: "claude-3-7-sonnet-latest", bold: true },
      { name: "claude-sonnet-4-0", bold: true },
      { name: "claude-sonnet-4-5", bold: false },
      { name: "gemini-2.5-pro", bold: false },
      { name: "gemini-3-pro-preview", bold: true },
      { name: "gpt-4.1", bold: true },
      { name: "gpt-4o", bold: false },
      { name: "gpt-5", bold: false },
      { name: "gpt-5-codex", bold: false },
      { name: "gpt-5.1", bold: false },
      { name: "gpt-5.1-codex", bold: false },
      { name: "Kai De–Mori", bold: true },
      { name: "o3-pro", bold: false },
      { name: "VSCode", bold: false },
      { name: "WinGPT", bold: false },
    ];

    credits_data.forEach((item, index) => {
      let el;
      if (item.bold) {
        el = document.createElement("strong");
      } else {
        el = document.createElement("span");
      }
      el.textContent = item.name;
      el.style.whiteSpace = "nowrap";
      credits_paragraph.appendChild(el);

      if (index < credits_data.length - 1) {
        credits_paragraph.appendChild(document.createTextNode(", "));
      }
    });
  }

  load_font() {
    const dedication = this.overlay.querySelector("#dedication");
    const font = new FontFace("HennyPenny", "url(fonts/Henny_Penny/HennyPenny-Regular.ttf)");
    font
      .load()
      .then((loaded_font) => {
        document.fonts.add(loaded_font);
        dedication.style.fontFamily = "HennyPenny, cursive";
      })
      .catch((error) => {
        console.warn("Failed to load HennyPenny font:", error);
        dedication.style.fontFamily = "cursive";
      });
  }

  wire_events() {
    const close_btn = this.overlay.querySelector("#about_close_btn");
    close_btn.onclick = () => this.close();
    this.overlay.onclick = (e) => {
      if (e.target === this.overlay) this.close();
    };
  }

  async open() {
    await this.ready_promise;
    if (this.overlay) {
      this.overlay.style.display = "flex";
    }
  }

  close() {
    if (this.overlay) {
      this.overlay.style.display = "none";
    }
  }
}
