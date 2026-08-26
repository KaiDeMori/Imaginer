// delete_confirm_modal.js – Modal dialog with explicit delete/disable actions
// Usage:
//   const action = await Delete_confirm_modal.show(count); // "delete" | "disable"

export class Delete_confirm_modal {
  static show(count) {
    Delete_confirm_modal.close();

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
    overlay.id = "imaginer-delete-confirm-modal-overlay";

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

    const message = document.createElement("p");
    message.textContent = `Delete ${count} image${count !== 1 ? "s" : ""}? This cannot be undone.`;
    Object.assign(message.style, {
      margin: "0 0 20px 0",
      fontSize: "1.05rem",
      lineHeight: "1.4",
    });
    dialog.appendChild(message);

    const button_row = document.createElement("div");
    Object.assign(button_row.style, {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
    });

    const button_disable = document.createElement("button");
    button_disable.textContent = "Disable delete mode";
    Object.assign(button_disable.style, {
      padding: "7px 14px",
      fontSize: "0.95rem",
      background: "#eee",
      color: "#222",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "600",
    });

    const button_delete = document.createElement("button");
    button_delete.textContent = "Delete";
    Object.assign(button_delete.style, {
      padding: "7px 14px",
      fontSize: "0.95rem",
      background: "#c62828",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "600",
    });

    button_row.appendChild(button_disable);
    button_row.appendChild(button_delete);
    dialog.appendChild(button_row);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    overlay.tabIndex = -1;
    overlay.focus();

    return new Promise((resolve) => {
      const finish = (action) => {
        Delete_confirm_modal.close();
        resolve(action);
      };

      button_delete.addEventListener("click", () => finish("delete"));
      button_disable.addEventListener("click", () => finish("disable"));

      overlay.addEventListener("keydown", (e) => {
        if (e.key === "Escape") finish("disable");
      });

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) finish("disable");
      });
    });
  }

  static close() {
    const overlay = document.getElementById("imaginer-delete-confirm-modal-overlay");
    if (overlay) overlay.remove();
  }
}
