const FILENAME_PROMPT_CHARS_KEY = "imaginer.filename_prompt_chars";
const DEFAULT_FILENAME_PROMPT_CHARS = 110;
const MAX_FILENAME_PROMPT_CHARS = 230;
const MIN_FILENAME_PROMPT_CHARS = 1;

function clamp_filename_prompt_chars(value) {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_FILENAME_PROMPT_CHARS;
  return Math.max(MIN_FILENAME_PROMPT_CHARS, Math.min(MAX_FILENAME_PROMPT_CHARS, parsed));
}

function get_filename_prompt_chars() {
  return clamp_filename_prompt_chars(localStorage.getItem(FILENAME_PROMPT_CHARS_KEY));
}

function sanitize_prompt_for_filename(prompt_text, fallback_text = "image") {
  let base = (prompt_text || "image")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_\-]/g, "")
    .slice(0, get_filename_prompt_chars());
  if (!base) base = fallback_text;
  return base;
}

function build_image_filename(prompt_text, created, extension) {
  const base = sanitize_prompt_for_filename(prompt_text);
  const ts = created ? String(created) : String(Math.floor(Date.now() / 1000));
  return `${base}_${ts}.${extension}`;
}

export {
  DEFAULT_FILENAME_PROMPT_CHARS,
  FILENAME_PROMPT_CHARS_KEY,
  MAX_FILENAME_PROMPT_CHARS,
  MIN_FILENAME_PROMPT_CHARS,
  build_image_filename,
  clamp_filename_prompt_chars,
  get_filename_prompt_chars,
  sanitize_prompt_for_filename,
};