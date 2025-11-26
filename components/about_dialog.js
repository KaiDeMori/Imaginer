import { VERSION_HTML_FILES } from "../version_manager.js";

export class About_dialog {
  constructor() {
    this.build_DOM();
    this.wire_events();
  }

  build_DOM() {
    this.overlay = document.createElement("div");
    this.overlay.className = "overlay";

    this.dialog = document.createElement("div");
    this.dialog.className = "dialog";
    this.dialog.style.textAlign = "center";

    const title = document.createElement("h2");
    title.textContent = "About Imaginer";
    title.className = "title";
    title.style.marginBottom = "10px";

    const content = document.createElement("div");
    content.style.marginBottom = "0";
    content.style.textAlign = "center";

    // Version History
    const version_header = document.createElement("h3");
    version_header.textContent = "Version History";
    version_header.style.fontSize = "1rem";
    version_header.style.marginTop = "0";
    version_header.style.marginBottom = "4px";
    content.appendChild(version_header);

    const version_list = document.createElement("ul");
    version_list.style.listStyle = "none";
    version_list.style.padding = "0";
    version_list.style.margin = "0 0 12px 0";

    Object.entries(VERSION_HTML_FILES)
      .reverse()
      .forEach(([version, path]) => {
        const li = document.createElement("li");
        li.style.marginBottom = "4px";
        const link = document.createElement("a");
        link.href = path;
        link.target = "_blank";
        link.textContent = `Version ${version}`;
        link.style.color = "#1976d2";
        link.style.textDecoration = "none";
        li.appendChild(link);
        version_list.appendChild(li);
      });
    content.appendChild(version_list);

    // Credits
    const credits_header = document.createElement("h3");
    credits_header.textContent = "Credits";
    credits_header.style.fontSize = "1rem";
    credits_header.style.marginTop = "0";
    credits_header.style.marginBottom = "4px";
    content.appendChild(credits_header);

    const credits_paragraph = document.createElement("p");
    credits_paragraph.style.margin = "0 0 12px 0";
    credits_paragraph.style.fontSize = "0.9rem";
    credits_paragraph.style.lineHeight = "1.5";

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
    content.appendChild(credits_paragraph);

    // Links
    const links_container = document.createElement("div");
    links_container.style.display = "flex";
    links_container.style.flexDirection = "column";
    links_container.style.alignItems = "center";
    links_container.style.gap = "4px";

    const music_link = document.createElement("a");
    music_link.href = "intro/intro_music_credits.html";
    music_link.target = "_blank";
    music_link.textContent = "Intro Music Credits";
    music_link.style.color = "#1976d2";
    music_link.style.textDecoration = "none";
    links_container.appendChild(music_link);

    const repo_link = document.createElement("a");
    repo_link.href = "https://github.com/KaiDeMori/Imaginer";
    repo_link.target = "_blank";
    repo_link.textContent = "GitHub Repository";
    repo_link.style.color = "#1976d2";
    repo_link.style.textDecoration = "none";
    links_container.appendChild(repo_link);

    content.appendChild(links_container);

    // Dedication
    const dedication = document.createElement("p");
    dedication.style.marginTop = "16px";
    dedication.style.marginBottom = "0";
    dedication.style.fontSize = "1.2rem";
    dedication.style.color = "#555";
    dedication.textContent = "For Lilly with ❤️";

    // Load custom font
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

    content.appendChild(dedication);

    // Icon
    const icon_img = document.createElement("img");
    icon_img.src = "assets/Imaginer_Icon_crop_circle.webp";
    icon_img.alt = "Imaginer Icon";
    icon_img.style.width = "100px";
    icon_img.style.height = "100px";
    icon_img.style.marginTop = "0";
    icon_img.style.display = "block";
    icon_img.style.marginLeft = "auto";
    icon_img.style.marginRight = "auto";
    content.appendChild(icon_img);

    const button_row = document.createElement("div");
    button_row.className = "button_row";
    button_row.style.justifyContent = "center";

    this.close_btn = document.createElement("button");
    this.close_btn.textContent = "Close";
    this.close_btn.className = "button save_button";

    button_row.appendChild(this.close_btn);

    this.dialog.appendChild(title);
    this.dialog.appendChild(content);
    this.dialog.appendChild(button_row);
    this.overlay.appendChild(this.dialog);
    document.body.appendChild(this.overlay);
  }

  wire_events() {
    this.close_btn.onclick = () => this.close();
    this.overlay.onclick = (e) => {
      if (e.target === this.overlay) this.close();
    };
  }

  open() {
    this.overlay.style.display = "flex";
  }

  close() {
    this.overlay.style.display = "none";
  }
}
