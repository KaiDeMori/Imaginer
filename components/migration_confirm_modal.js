// migration_confirm_modal.js – Modal dialog that asks before the gallery files are converted
// Usage:
//   const action = await Migration_confirm_modal.show(count, total, strip); // "convert" | "later"

export class Migration_confirm_modal {
  static show(count, total, strip) {
    Migration_confirm_modal.close();

    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(0,0,0,0.35)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "3000",
    });
    overlay.id = "imaginer-migration-confirm-modal-overlay";

    const dialog = document.createElement("div");
    Object.assign(dialog.style, {
      background: "#fff",
      borderRadius: "8px",
      width: "420px",
      maxWidth: "92vw",
      boxShadow: "0 2px 24px rgba(0,0,0,0.25)",
      padding: "24px 20px 16px 20px",
      fontFamily: "system-ui, sans-serif",
      color: "#222",
    });

    const image_count_sentence = count === 1 ? `1 of your ${total} images is still in its original form.` : `${count} of your ${total} images are still in their original form.`;
    const removal_sentence = strip
      ? "Converting them removes all metadata from these files, such as a camera's location or OpenAI's provenance data, and the prompt copies Imaginer wrote into them; the prompts stay in the gallery."
      : "Converting them removes the prompt copies Imaginer wrote into these files; the prompts stay in the gallery. Other metadata stays, because Strip Server-Side metadata is off.";
    const paragraph_texts = [
      `Imaginer now keeps every image as a clean PNG. ${image_count_sentence}`,
      removal_sentence,
      "An animated PNG keeps only its first image, orientation stored as metadata is dropped, and JPEG and WebP images take more storage as PNG. This cannot be undone.",
      "For an exact copy of the originals first, choose Later, turn off Strip Server-Side metadata and both Embed prompt options in Config → Advanced, and use Config → Files → Download All Images. Later asks again at the next start.",
    ];
    paragraph_texts.forEach((text, index) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      Object.assign(paragraph.style, {
        margin: index === paragraph_texts.length - 1 ? "0 0 20px 0" : "0 0 12px 0",
        fontSize: "1.05rem",
        lineHeight: "1.4",
      });
      dialog.appendChild(paragraph);
    });

    const button_row = document.createElement("div");
    Object.assign(button_row.style, {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
    });

    const button_later = document.createElement("button");
    button_later.textContent = "Later";
    Object.assign(button_later.style, {
      padding: "7px 14px",
      fontSize: "0.95rem",
      background: "#eee",
      color: "#222",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "600",
    });

    const button_convert = document.createElement("button");
    button_convert.textContent = "Convert now";
    Object.assign(button_convert.style, {
      padding: "7px 14px",
      fontSize: "0.95rem",
      background: "#2d7ef7",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "600",
    });

    button_row.appendChild(button_later);
    button_row.appendChild(button_convert);
    dialog.appendChild(button_row);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    overlay.tabIndex = -1;
    overlay.focus();

    return new Promise((resolve) => {
      const finish = (action) => {
        Migration_confirm_modal.close();
        resolve(action);
      };

      button_convert.addEventListener("click", () => finish("convert"));
      button_later.addEventListener("click", () => finish("later"));

      overlay.addEventListener("keydown", (e) => {
        if (e.key === "Escape") finish("later");
      });

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) finish("later");
      });
    });
  }

  static close() {
    const overlay = document.getElementById("imaginer-migration-confirm-modal-overlay");
    if (overlay) overlay.remove();
  }
}
