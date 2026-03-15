# Cache Busting Implementation Plan

## Problem
When users update from one version to another (e.g., v1.1 → v1.2), browsers cache HTML and JS files, causing stale assets to be served even after the version update message appears. The `location.reload(true)` approach is unreliable across browsers.

## Solution
Append version parameter (`?v=1.2`) to all dynamically loaded HTML and JS files. Since `version.json` already uses cache-busting and is loaded early in app initialization, we can reliably detect the current version and append it to all subsequent resource loads.

## Implementation Steps

1. **✅ DONE - Modified `version_manager.js`:**
   - Added `CURRENT_VERSION` module-level variable (initialized to `null`)
   - Added `versioned_url(url)` function that:
     - Returns URL unchanged if it's falsy or not a string
     - Skips absolute URLs (starting with `http://` or `https://`)
     - Uses timestamp fallback: `CURRENT_VERSION || Date.now()`
     - Handles existing query parameters (uses `&` instead of `?`)
   - Set `CURRENT_VERSION` in `check_and_show_update_message()` when config is loaded
   - Exported `versioned_url` alongside existing exports

2. **✅ DONE - Update all components to use `versioned_url()`:**
   - Import `versioned_url` from `version_manager.js` in each file
   - Wrap all `fetch()` calls for local HTML files
   - Wrap iframe `src` assignments for local HTML
   - Wrap dynamic `import()` statements for local JS files

---

## Files to Modify

### Core Files
- ✅ `version_manager.js` — Added `CURRENT_VERSION` variable and `versioned_url()` helper

### Components with HTML Fetching
All these files fetch local HTML templates that need cache busting:

1. ✅ `components/about_dialog/about_dialog.js`
   - `fetch("components/about_dialog/about_dialog.html")`
   - Also version history links: `link.href = path` (version message HTML)

2. ✅ `components/menu_bar/menu_bar.js`
   - `fetch("components/menu_bar/menu_bar.html")`

3. ✅ `components/config_dialog/config_dialog.js`
   - `fetch("components/config_dialog/config_dialog.html")`

4. ✅ `components/conversation_panel/conversation_panel.js`
   - `fetch("./components/conversation_panel/conversation_panel.html")`

5. ✅ `components/download_progress_dialog/download_progress_dialog.js`
   - `fetch("components/download_progress_dialog/download_progress_dialog.html")`

6. ✅ `components/performance_limit_warning/performance_limit_warning.js`
   - `fetch("components/performance_limit_warning/performance_limit_warning.html")`

7. ✅ `components/error_modal.js`
   - `iframe.src = "components/moderation_error.html"`

8. ✅ `components/version_message_modal.js` — **The most critical one!**
   - `fetch(version_html_path)` for version release notes HTML

### Dynamic Module Imports (Optional but Recommended)
These are less critical since browsers generally handle JS module imports better, but for consistency:

9. ✅ `app.js`
   - `import("./storage/database_store.js")`
   - `import("./components/config_dialog/config_dialog.js")`
   - `import("./components/performance_limit_warning/performance_limit_warning.js")`
   - `import("./components/conversation_panel/conversation_panel.js")`

10. ✅ `static_imports/jszip_loader.js`
    - `await import('./jszip.min.js')`

---

## Edge Cases to Handle

### Completely ignore the `intro` directory
Since the intro only plays on first run, cache busting is unnecessary there.

### Relative vs Absolute URLs
```javascript
// Version these (relative paths):
versioned_url("components/menu_bar/menu_bar.html")
versioned_url("./config_dialog.html")
versioned_url("../shared/template.html")

// DON'T version these (absolute/external URLs):
"https://api.openai.com/v1/models"  // External API
"http://localhost:9222/test.html"   // Absolute URL
```
→ Helper should only version relative paths (no protocol prefix)

### Version Not Yet Loaded (Timestamp Fallback)
If a component somehow initializes before `check_and_show_update_message()` completes:
```javascript
// Fallback to timestamp if version not available yet
export function versioned_url(url) {
  const version = CURRENT_VERSION || Date.now();
  // ... rest of logic
}
```
This ensures cache busting works even if version fetch is delayed.

