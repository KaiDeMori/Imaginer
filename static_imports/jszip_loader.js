// jszip_loader.js – Helper to load JSZip from static_imports/jszip.min.js
import { versioned_url } from "../version_manager.js";

export async function get_jszip() {
  if (window.JSZip) return window.JSZip;
  await import(versioned_url('./jszip.min.js'));
  return window.JSZip;
}
