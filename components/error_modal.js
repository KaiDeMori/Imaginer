// error_modal.js – Modal dialog for displaying errors
// Usage:
//   Error_modal.show(errorObj)
//   Error_modal.show('Some error message')
export class Error_modal {
  static show(error) {
    // Remove any existing error modal
    Error_modal.close();

    // Overlay
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
    overlay.id = "imaginer-error-modal-overlay";

    // Dialog
    const dialog = document.createElement("div");
    Object.assign(dialog.style, {
      background: "#fff",
      borderRadius: "8px",
      width: "600px",
      maxWidth: "98vw",
      maxHeight: "85vh",
      overflow: "auto",
      boxShadow: "0 2px 24px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "column",
      padding: "24px 20px 16px 20px",
      position: "relative",
      fontFamily: "system-ui, sans-serif",
      color: "#222",
    });

    // Title
    const title = document.createElement("h2");
    title.textContent = "Error";
    Object.assign(title.style, {
      margin: "0 0 12px 0",
      fontSize: "1.3rem",
      color: "#c62828",
      fontWeight: "700",
      letterSpacing: "0.5px",
    });
    dialog.appendChild(title);

    // Error content
    const content = document.createElement("div");
    content.style.marginBottom = "18px";
    content.style.overflowX = "auto";
    content.style.maxWidth = "100%";

    // Format error
    if (typeof error === "string") {
      content.style.wordBreak = "break-word";
      content.textContent = error;
    } else if (error && typeof error === "object") {
      // If error has an 'error' property, use it
      const errObj = error.error || error;
      const table = document.createElement("table");
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";
      table.style.tableLayout = "fixed";
      for (const key of Object.keys(errObj)) {
        const row = document.createElement("tr");
        const keyCell = document.createElement("td");
        keyCell.textContent = key;
        Object.assign(keyCell.style, {
          fontWeight: "bold",
          padding: "4px 8px 4px 0",
          verticalAlign: "top",
          color: "#444",
          width: "32%",
          wordBreak: "break-word",
        });
        const valCell = document.createElement("td");
        let val = errObj[key];
        if (val === null) val = "null";
        if (typeof val === "object" && val !== null) {
          valCell.textContent = JSON.stringify(val, null, 2);
          valCell.style.fontFamily = "monospace";
        } else {
          valCell.textContent = String(val);
        }
        Object.assign(valCell.style, {
          padding: "4px 0 4px 0",
          color: "#222",
          fontFamily: "inherit",
          // Only break on spaces, allow long words to overflow and scroll
          wordBreak: "normal",
          whiteSpace: "pre-wrap",
          maxWidth: "0",
          overflowWrap: "anywhere",
        });
        row.appendChild(keyCell);
        row.appendChild(valCell);
        table.appendChild(row);
      }
      content.appendChild(table);
    } else {
      content.textContent = "An unknown error occurred.";
    }
    dialog.appendChild(content);

    // Close button
    const btnClose = document.createElement("button");
    btnClose.textContent = "Close";
    Object.assign(btnClose.style, {
      alignSelf: "flex-end",
      padding: "7px 18px",
      fontSize: "1rem",
      background: "#c62828",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "600",
      marginTop: "8px",
    });
    btnClose.addEventListener("click", Error_modal.close);
    dialog.appendChild(btnClose);

    // Escape key closes
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape") Error_modal.close();
    });

    // Click outside dialog closes
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) Error_modal.close();
    });

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    // Focus for escape key
    overlay.tabIndex = -1;
    overlay.focus();
  }

  static close() {
    const overlay = document.getElementById("imaginer-error-modal-overlay");
    if (overlay) overlay.remove();
  }
}
