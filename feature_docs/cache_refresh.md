# Cache Refresh

Imaginer keeps normal browser caching enabled during everyday use. Cache refreshes happen only when a user accepts a version update message or clicks **Refresh Cache** in the configuration dialog.

## Refresh Flow

- `cache_manifest.json` lists the core JS, JSON, and HTML files that should be refreshed.
- The refresh flow loads the manifest with `cache: "reload"`.
- Each listed JS and HTML file is fetched twice: once as the plain path and once with the current version query string.
- Each listed JSON file is fetched as the plain path only.
- Every refresh request uses `cache: "reload"`, which bypasses the old cached response for that request and updates the browser cache with the fresh response.
- Images and CSS are intentionally excluded from the first manifest scope.

## Hosting Notes

If the hosting layer allows cache header configuration, use revalidation for update-signal files rather than disabling caching.

```http
Cache-Control: no-cache
```

Good candidates for this header are:

- `index.html`
- `version.json`
- `cache_manifest.json`

Do not use `no-store` for these files unless the goal is to prevent caching entirely. `no-cache` still permits caching, but requires the browser to revalidate before reusing a cached response.