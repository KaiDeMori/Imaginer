export function create_toc(items, target_element, options = {}) {
  const { expand_depth = 2 } = options;

  let html = "<ul>";
  let current_level = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const next_item = items[i + 1];
    const has_children = next_item && next_item.level > item.level;

    while (current_level > item.level) {
      html += "</ul></li>";
      current_level--;
    }

    const should_collapse = item.level > expand_depth && has_children;
    const toggle = has_children ? `<span class="toc_toggle">${should_collapse ? "▶" : "▼"}</span>` : `<span class="toc_toggle" style="display:none">▼</span>`;
    html += `<li>${toggle}<a href="#${item.id}">${item.text}</a>`;

    if (!has_children || (next_item && next_item.level <= item.level)) {
      html += "</li>";
    }

    if (has_children) {
      const collapsed_class = should_collapse ? ' class="toc_collapsed"' : "";
      html += `<ul${collapsed_class}>`;
      current_level = next_item.level;
    }
  }

  while (current_level > 1) {
    html += "</ul></li>";
    current_level--;
  }
  html += "</ul>";

  const element = typeof target_element === "string" ? document.getElementById(target_element) : target_element;
  element.innerHTML = html;

  attach_toggle_handlers();
}

function attach_toggle_handlers() {
  document.querySelectorAll(".toc_toggle").forEach((toggle) => {
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      const li = toggle.parentElement;
      const nested_ul = li.querySelector("ul");

      if (nested_ul) {
        nested_ul.classList.toggle("toc_collapsed");
        toggle.textContent = nested_ul.classList.contains("toc_collapsed") ? "▶" : "▼";
      }
    });
  });
}
