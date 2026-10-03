// import_confirm_modal.js – Modal dialog that asks before a large import into the gallery
// Usage:
//   const action = await Import_confirm_modal.show(count); // "import" | "cancel"
//   const action = await Import_confirm_modal.show(count, zip_name); // the same question for the pictures of one ZIP file

export class Import_confirm_modal {
  static show(count, zip_name = null) {
    Import_confirm_modal.close();

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
    overlay.id = "imaginer-import-confirm-modal-overlay";

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
    message.textContent = zip_name === null ? `You picked ${count} pictures. Should all of them go into the gallery?` : `"${zip_name}" holds ${count} pictures. Should all of them go into the gallery?`;
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

    const button_cancel = document.createElement("button");
    button_cancel.textContent = "Cancel";
    Object.assign(button_cancel.style, {
      padding: "7px 14px",
      fontSize: "0.95rem",
      background: "#eee",
      color: "#222",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "600",
    });

    const button_import = document.createElement("button");
    button_import.textContent = "Yes, all of them";
    Object.assign(button_import.style, {
      padding: "7px 14px",
      fontSize: "0.95rem",
      background: "#1976d2",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "600",
    });

    button_row.appendChild(button_cancel);
    button_row.appendChild(button_import);
    dialog.appendChild(button_row);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    overlay.tabIndex = -1;
    overlay.focus();

    return new Promise((resolve) => {
      const finish = (action) => {
        Import_confirm_modal.close();
        resolve(action);
      };

      button_import.addEventListener("click", () => finish("import"));
      button_cancel.addEventListener("click", () => finish("cancel"));

      overlay.addEventListener("keydown", (e) => {
        if (e.key === "Escape") finish("cancel");
      });

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) finish("cancel");
      });
    });
  }

  static close() {
    const overlay = document.getElementById("imaginer-import-confirm-modal-overlay");
    if (overlay) overlay.remove();
  }
}
