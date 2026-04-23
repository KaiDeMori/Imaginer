// size_picker.js
// gpt-image-2 size validation, presets and persistence helpers.
//
// Constraints (per API_DOCS/gpt-image-2 API capabilities.md):
//   - Both edges must be a multiple of 16
//   - Maximum edge length must be < 3840
//   - Ratio between long edge and short edge must be <= 3:1
//   - Total pixels must be in [655_360 .. 8_294_400]
// Above 2560x1440 (3_686_400 total px) is "experimental" and triggers a warning
// (still allowed).

export const MIN_PIXELS = 655_360;
export const MAX_PIXELS = 8_294_400;
export const EXPERIMENTAL_PIXELS = 3_686_400; // 2560 * 1440
export const MAX_EDGE = 3840; // strict: must be <
export const EDGE_MULTIPLE = 16;
export const MAX_RATIO = 3;
export const MAX_CUSTOM_SIZES = 20;

export const POPULAR_SIZES = [
  { value: "1024x1536", label: "1024×1536" }, // HD portrait
  { value: "1536x1024", label: "1536×1024" }, // HD landscape
  { value: "1024x1024", label: "1024×1024" }, // square default
  { value: "2560x1440", label: "2560×1440" }, // 2K / QHD
  { value: "3824x2144", label: "3824×2144" }, // 4K-ish, experimental
];

export function parse_size(value) {
  if (typeof value !== "string") return null;
  const match = value
    .trim()
    .toLowerCase()
    .match(/^(\d+)\s*x\s*(\d+)$/);
  if (!match) return null;
  return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) };
}

export function format_size(width, height) {
  return `${width}x${height}`;
}

export function format_size_label(width, height) {
  return `${width}×${height}`;
}

export function validate_size(width, height) {
  const errors = [];
  const warnings = [];

  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    errors.push("Width and height must be positive integers.");
    return { ok: false, errors, warnings };
  }
  if (width % EDGE_MULTIPLE !== 0 || height % EDGE_MULTIPLE !== 0) {
    errors.push(`Both edges must be a multiple of ${EDGE_MULTIPLE}.`);
  }
  if (width >= MAX_EDGE || height >= MAX_EDGE) {
    errors.push(`Each edge must be smaller than ${MAX_EDGE}px.`);
  }
  const long_edge = Math.max(width, height);
  const short_edge = Math.min(width, height);
  if (long_edge / short_edge > MAX_RATIO) {
    errors.push(`Aspect ratio must not exceed ${MAX_RATIO}:1 (got ${(long_edge / short_edge).toFixed(2)}:1).`);
  }
  const pixels = width * height;
  if (pixels < MIN_PIXELS) {
    errors.push(`Total pixels (${pixels.toLocaleString()}) is below the minimum of ${MIN_PIXELS.toLocaleString()}.`);
  }
  if (pixels > MAX_PIXELS) {
    errors.push(`Total pixels (${pixels.toLocaleString()}) exceeds the maximum of ${MAX_PIXELS.toLocaleString()}.`);
  }
  if (errors.length === 0 && pixels > EXPERIMENTAL_PIXELS) {
    warnings.push(`Above 2560×1440 is experimental — results can be more variable.`);
  }
  return { ok: errors.length === 0, errors, warnings };
}

export function orientation_for_size(value) {
  const parsed = parse_size(value);
  if (!parsed) return "square";
  if (parsed.width > parsed.height) return "landscape";
  if (parsed.height > parsed.width) return "portrait";
  return "square";
}

export function get_custom_sizes() {
  try {
    const raw = localStorage.getItem("imaginer.custom_sizes");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v) => typeof v === "string" && parse_size(v));
  } catch (_e) {
    return [];
  }
}

export function add_custom_size(value) {
  const parsed = parse_size(value);
  if (!parsed) return get_custom_sizes();
  const normalized = format_size(parsed.width, parsed.height);
  const existing = get_custom_sizes().filter((v) => v !== normalized);
  // most-recent first
  const next = [normalized, ...existing].slice(0, MAX_CUSTOM_SIZES);
  localStorage.setItem("imaginer.custom_sizes", JSON.stringify(next));
  return next;
}

export function remove_custom_size(value) {
  const parsed = parse_size(value);
  if (!parsed) return get_custom_sizes();
  const normalized = format_size(parsed.width, parsed.height);
  const next = get_custom_sizes().filter((v) => v !== normalized);
  localStorage.setItem("imaginer.custom_sizes", JSON.stringify(next));
  return next;
}

export function is_advanced_size_mode() {
  return localStorage.getItem("imaginer.advanced_size_mode") === "true";
}
