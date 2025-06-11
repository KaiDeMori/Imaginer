/*
Seed UI Panel – Early Universe Formation V2
------------------------------------------
Creates a small fixed UI element that shows the current deterministic seed and
allows the user to generate a new one. The seed is stored in
`localStorage["eu_seed"]`; regenerating forces a full page reload so that the
entire experience picks up the new seed.

This module has *side-effects* – simply importing it is enough to render the UI.
No exports.
*/

(function create_seed_ui_panel() {
  // Guard against multiple initialisations (e.g. HMR in dev tools).
  if (document.getElementById("seedUIPanel")) return;

  const current_seed = window.eu_seed || "unknown";

  // -------------------------------------------------------------------------
  // Create DOM ----------------------------------------------------------------
  // -------------------------------------------------------------------------
  const panel = document.createElement("div");
  panel.id = "seedUIPanel";
  panel.innerHTML = `Seed: <code>${current_seed}</code>`;

  const regenerate_btn = document.createElement("button");
  regenerate_btn.type  = "button";
  regenerate_btn.textContent = "Regenerate";
  regenerate_btn.title = "Create a new random seed and reload the page.";

  panel.appendChild(regenerate_btn);
  document.body.appendChild(panel);

  // -------------------------------------------------------------------------
  // Events --------------------------------------------------------------------
  // -------------------------------------------------------------------------
  regenerate_btn.addEventListener("click", () => {
    const new_seed = Date.now().toString();
    try {
      localStorage.setItem("eu_seed", new_seed);
    } catch (_) {
      // localStorage may be unavailable (private mode). Still proceed.
    }
    // Use location.reload() so that *all* modules re-initialise with new seed.
    location.reload();
  });
})();
