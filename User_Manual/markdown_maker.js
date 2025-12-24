import { versioned_url } from "../version_manager.js";

export async function parse_markdown_with_toc(filename) {
  const response = await fetch(versioned_url(filename));
  const markdown_text = await response.text();

  const toc_items = [];

  const renderer = new marked.Renderer();

  renderer.heading = function (text, level, raw) {
    const id = raw.toLowerCase().replace(/[^\w]+/g, "-");
    toc_items.push({ text, level, id });
    return `<h${level} id="${id}">${text}</h${level}>`;
  };

  marked.setOptions({ renderer });

  const html_content = marked.parse(markdown_text);

  return { html_content, toc_items };
}
