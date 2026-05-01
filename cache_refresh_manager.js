import { versioned_url } from "./version_manager.js";

const CACHE_MANIFEST_PATH = "cache_manifest.json";
const VERSIONED_EXTENSIONS = new Set([".html", ".js"]);

function get_extension(path) {
  const clean_path = path.split("?")[0].split("#")[0];
  const dot_index = clean_path.lastIndexOf(".");
  return dot_index === -1 ? "" : clean_path.slice(dot_index).toLowerCase();
}

function normalize_manifest_file(path) {
  if (!path || typeof path !== "string") {
    return null;
  }

  const trimmed_path = path.trim();
  if (!trimmed_path || trimmed_path.startsWith("http://") || trimmed_path.startsWith("https://")) {
    return null;
  }

  return trimmed_path.replace(/^\.\//, "").replace(/^\//, "");
}

function get_manifest_files(manifest) {
  const files = Array.isArray(manifest) ? manifest : manifest?.files;
  if (!Array.isArray(files)) {
    throw new Error("cache_manifest.json must contain a files array.");
  }

  return files.map(normalize_manifest_file).filter(Boolean);
}

function build_refresh_urls(files) {
  const refresh_urls = new Set();

  for (const file of files) {
    refresh_urls.add(file);

    if (VERSIONED_EXTENSIONS.has(get_extension(file))) {
      refresh_urls.add(versioned_url(file));
    }
  }

  return Array.from(refresh_urls);
}

async function fetch_cache_manifest() {
  const response = await fetch(CACHE_MANIFEST_PATH, { cache: "reload" });
  if (!response.ok) {
    throw new Error(`Failed to load ${CACHE_MANIFEST_PATH}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function get_error_message(error) {
  return error && error.message ? error.message : String(error);
}

function format_cache_refresh_failures(failures) {
  if (!failures.length) {
    return "";
  }

  const shown_failures = failures.slice(0, 12).map((failure) => `- ${failure.url}: ${failure.message}`);
  const hidden_count = failures.length - shown_failures.length;
  if (hidden_count > 0) {
    shown_failures.push(`- ...and ${hidden_count} more`);
  }

  return `Cache refresh finished with ${failures.length} failed request(s):\n\n${shown_failures.join("\n")}`;
}

async function refresh_application_cache({ on_status = null } = {}) {
  on_status?.({ phase: "manifest", message: "Loading cache manifest..." });

  const manifest = await fetch_cache_manifest();
  const files = get_manifest_files(manifest);
  const urls = build_refresh_urls(files);
  const failures = [];

  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];
    on_status?.({
      phase: "refresh",
      message: `Refreshing cache ${index + 1} of ${urls.length}...`,
      current: index + 1,
      total: urls.length,
      url,
    });

    try {
      const response = await fetch(url, { cache: "reload" });
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      await response.blob();
    } catch (error) {
      failures.push({ url, message: get_error_message(error) });
    }
  }

  on_status?.({
    phase: "complete",
    message: failures.length ? "Cache refresh completed with errors." : "Cache refresh complete.",
    current: urls.length,
    total: urls.length,
    failures,
  });

  return {
    manifest,
    files,
    urls,
    failures,
  };
}

export { CACHE_MANIFEST_PATH, build_refresh_urls, format_cache_refresh_failures, refresh_application_cache };