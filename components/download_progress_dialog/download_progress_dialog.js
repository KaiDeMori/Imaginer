export class Download_progress_dialog {
  constructor() {
    this.init_promise = this.init();
  }

  async init() {
    if (!document.querySelector('link[href="components/download_progress_dialog/download_progress_dialog.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "components/download_progress_dialog/download_progress_dialog.css";
      document.head.appendChild(link);
    }

    const response = await fetch("components/download_progress_dialog/download_progress_dialog.html");
    const html = await response.text();

    const temp = document.createElement("div");
    temp.innerHTML = html;

    this.overlay = temp.querySelector(".download_progress_overlay");
    document.body.appendChild(this.overlay);

    this.dialog = this.overlay.querySelector(".download_progress_dialog");
    this.status_text = this.overlay.querySelector("#status_text");
    this.progress_counter = this.overlay.querySelector("#progress_counter");
    this.progress_container = this.overlay.querySelector("#progress_container");
    this.progress_bar_fill = this.overlay.querySelector("#progress_bar_fill");
    this.waiting_image = this.overlay.querySelector("#waiting_image");
    this.error_message = this.overlay.querySelector("#error_message");
    this.close_button = this.overlay.querySelector("#close_button");

    this.overlay.style.display = "none";
    this.beforeunload_handler = null;
  }

  show() {
    this.overlay.style.display = "flex";

    this.status_text.style.display = "block";
    this.status_text.textContent = "Preparing download...";
    this.progress_counter.style.display = "none";
    this.progress_container.style.display = "none";
    this.waiting_image.style.display = "none";
    this.error_message.style.display = "none";
    this.close_button.style.display = "none";

    this.beforeunload_handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", this.beforeunload_handler);
  }

  set_status(message) {
    this.status_text.textContent = message;

    if (message === "Saving to disk...") {
      this.progress_counter.style.display = "none";
      this.progress_container.style.display = "none";
      this.waiting_image.style.display = "block";
    }
  }

  update_progress(current, total) {
    this.status_text.textContent = "Processing images...";
    this.progress_counter.textContent = `${current} / ${total}`;
    this.progress_counter.style.display = "block";
    this.progress_container.style.display = "block";
    this.waiting_image.style.display = "none";

    const percentage = (current / total) * 100;
    this.progress_bar_fill.style.width = `${percentage}%`;
  }

  show_error(error_message) {
    if (this.beforeunload_handler) {
      window.removeEventListener("beforeunload", this.beforeunload_handler);
      this.beforeunload_handler = null;
    }

    this.status_text.style.display = "none";
    this.progress_counter.style.display = "none";
    this.progress_container.style.display = "none";
    this.waiting_image.style.display = "none";

    this.error_message.textContent = error_message;
    this.error_message.style.display = "block";
    this.close_button.style.display = "block";

    this.close_button.addEventListener("click", () => this.close());
  }

  close() {
    if (this.beforeunload_handler) {
      window.removeEventListener("beforeunload", this.beforeunload_handler);
      this.beforeunload_handler = null;
    }

    this.overlay.remove();
  }
}
