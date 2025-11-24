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
    title.style.marginBottom = "20px";

    const content = document.createElement("div");
    content.style.marginBottom = "24px";
    content.innerHTML = `
      <p style="margin: 10px 0; font-size: 1.1rem;"><strong>Imaginer</strong></p>
      <p style="margin: 10px 0; color: #666;">Version 1.0</p>
      <p style="margin: 10px 0;">A creative tool for AI image generation.</p>
    `;

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
