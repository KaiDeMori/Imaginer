# Background selection in the menu bar

## Goal

Add a background dropdown to the menu bar, directly after the model dropdown.
The existing background row in the config dialog stays and keeps working.
Both controls write the same `imaginer.background` key.

The config dialog row gets removed in a later step, once users have moved to the menu bar control.

## Affected files

1. `components/menu_bar/menu_bar.html`
2. `components/menu_bar/menu_bar.js`
3. `components/menu_bar/menu_bar.css`
4. `components/config_dialog/config_dialog.html`
5. `cache_manifest.json`

## 1. `components/menu_bar/menu_bar.html`

Add the dropdown inside the left flex group, directly after `#model-select`:

```html
<select id="background-select" class="background-select" title="Background">
  <option value="auto">Automatic</option>
  <option value="transparent">Transparent</option>
  <option value="opaque">Opaque</option>
</select>
```

The element ID uses kebab-case on purpose.
This file already uses `model-select`, `image-size-select` and `orientation-radio-group`.
The config dialog uses `background_select`, which is that file's own convention and stays unchanged.

## 2. `components/menu_bar/menu_bar.js`

### 2.1 Route the stylesheet through `versioned_url` in `init`

`init` currently builds the stylesheet `<link>` from the plain path and guards against a duplicate link with that same plain path.

Compute the versioned URL once, then use it for both the guard selector and the `href`.
`Config_dialog.init` already does exactly this.
`versioned_url` is imported in this file already.

### 2.2 Add the background dropdown logic in `attach_events`

Place the block after the model dropdown logic and before the settings persistence section.

The block does four things:

1. Reads `#background-select` from the component root.
2. Writes `imaginer.background` on every `change` event, without any confirmation step.
3. Defines a synchronisation helper that reads the stored value, replaces an invalid value with `auto`, writes the replacement back, and then applies the value to the dropdown.
4. Calls the helper once during wire-up and registers it as an `imaginer.config_changed` listener.

The immediate write matches the orientation buttons and the size dropdown, which both write `localStorage` directly in their change handlers.

The value repair matches `get_moderation` in `app.js`.
Without it, a stored value outside the three options leaves the native `select` at `selectedIndex === -1` and the control renders blank.

The `imaginer.config_changed` listener covers the config dialog direction.
The opposite direction needs no work, because `Config_dialog.open` re-reads `localStorage` every time it runs.

The listener must not read `event.detail`.
Two sources dispatch this event:

- the callback the menu bar passes to `Config_dialog`, which supplies a detail object
- the missing API key path in `app.js`, which dispatches a bare `Event`

### 2.3 Remove two dead background remnants

- The `background: "auto"` entry in the `default_settings` object for `imaginer.menu_settings`. Nothing reads it.
- The comment stating that the background select logic moved to the config dialog. It is wrong now, and it is a historic reference.

No migration runs for users whose stored `imaginer.menu_settings` already contains a `background` field.
The settings object is built by spreading the stored value, so the field survives the default removal and stays inert.

## 3. `components/menu_bar/menu_bar.css`

Add a `.background-select` rule that matches `.image-size-select` and `.model-select`.

## 4. `components/config_dialog/config_dialog.html`

Add a hint directly after `#background_select`, inside the same `field_grid`:

```html
<p class="hint_text">Background is also available in the menu bar, next to the model dropdown.</p>
```

The hint names the setting because a hint row in the grid sits at equal distance from the row above and the row below.
Without the name it could read as a hint for the image quality row.

`config_dialog.css` already defines `.hint_text` and `.field_grid .hint_text`, which spans the row across both grid columns.
Neither rule is used in the markup yet, so this needs no CSS change and no JS change.

## 5. `cache_manifest.json`

Add `components/menu_bar/menu_bar.css` next to the existing menu bar entries.

The two halves of this change serve different purposes:

- The `versioned_url` change in `menu_bar.js` busts the cache, because the `href` becomes a new URL on every version.
- The manifest entry makes `refresh_application_cache` re-fetch the plain path with `cache: "reload"`. CSS is not part of `VERSIONED_EXTENSIONS`, so the refresh never builds a versioned variant for it.

Together they match how `config_dialog.css` is already handled.

## No model dependent behaviour

The dropdown stays model agnostic and is never disabled.

- `background: transparent` is supported by both `gpt-image-2.5` models and by `gpt-image-1`.
- Imaginer never sends `output_format`, so the API default PNG satisfies the PNG or WebP requirement for transparency.

This is unlike `size`, which `is_preset_size_only_model` clamps, and unlike `quality`, which `clamp_quality_for_model` clamps.

## Open decision

`.model-select`, `.image-size-select` and `.background-select` differ only in `min-width`.

- **Default**: keep three separate rules. Smaller diff, no edits to the two working controls.
- **Alternative**: introduce one shared class. Tidier, but it requires editing the existing two selects in `menu_bar.html`.

## Out of scope

- `version.json` and the release notes card
- All documentation
- Removing the background row from the config dialog
- Multi-tab synchronisation through `storage` events. The orientation buttons and the size dropdown do not do this either.
