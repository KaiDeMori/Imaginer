// jszip_loader.js – Helper to load JSZip from static_imports/jszip.min.js
export async function get_jszip() {
  if (window.JSZip) return window.JSZip;
  await import('./jszip.min.js');
  return window.JSZip;
}
