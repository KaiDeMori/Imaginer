# localStorage Keys Documentation

Complete list of all localStorage keys used in Imaginer.

---

## App Configuration

### `imaginer.prompt`
Last entered prompt text.  
**Range:** Any string  
**Default:** `"A unicorn-dinosaur."`

### `imaginer.max_parallel_generations`
Maximum number of simultaneous image generation requests.  
**Range:** Integer (typically 1-10)  
**Default:** `"3"`

### `imaginer.n`
Number of images to generate per request.  
**Range:** Integer (1-10)  
**Default:** `"1"`

### `imaginer.background`
Background handling for transparent images.  
**Range:** `"auto"`, `"white"`, `"black"`  
**Default:** `"auto"`

### `imaginer.quality`
Image generation quality setting.  
**Range:** `"auto"`, `"hd"`, `"standard"`  
**Default:** `"auto"`

### `imaginer.image_size`
Output image dimensions.  
**Range:** `"1024x1024"`, `"1792x1024"`, `"1024x1792"`  
**Default:** `"1024x1024"`

### `imaginer.strip_metadata`
Remove metadata from downloaded images.  
**Range:** `"true"`, `"false"`  
**Default:** `"true"`

### `imaginer.add_prompt_to_image`
Embed prompt as iTXt metadata in PNG.  
**Range:** `"true"`, `"false"`  
**Default:** `"false"`

### `imaginer.add_prompt_to_image_xmp`
Embed prompt as XMP metadata in PNG.  
**Range:** `"true"`, `"false"`  
**Default:** `"true"`

### `imaginer.show_mask_mode_button`
Show mask mode button in viewer.  
**Range:** `"true"`, `"false"`  
**Default:** `"false"`

### `imaginer.dividerWidth`
Width of gallery panel in pixels.  
**Range:** Integer (pixels)  
**Default:** `"300"`

### `imaginer.mode`
Current app mode.  
**Range:** `"generation"`, `"conversation"`  
**Default:** `"generation"`

---

## Model Management

### `imaginer.available_image_models`
Cached list of available image generation models.  
**Range:** JSON array of model ID strings  
**Default:** None (fetched from API)

### `imaginer.selected_image_model`
Currently selected image generation model.  
**Range:** Model ID string (e.g., `"gpt-image-1.5"`)  
**Default:** `"gpt-image-1.5"` (fallback)

---

## API Key Storage

### `imaginer.scrambled_api_key`
XOR-encoded OpenAI API key.  
**Range:** Scrambled string  
**Default:** None (user must provide)

### `imaginer.scramble_key`
Random key used for XOR encoding the API key.  
**Range:** Base64 string (128 chars)  
**Default:** Auto-generated on first use

---

## Version Management

### `imaginer_app_version`
Last known app version for update detection.  
**Range:** Semantic version string (e.g., `"1.2.0"`)  
**Default:** None (set on first run)

---

## Intro Sequence State

### `imaginer.intro.first_start`
Tracks whether intro sequence should play.  
**Range:** `"true"`, `"false"`, `null`  
**Default:** `"true"` on first visit

### `eu_seed`
Seed for deterministic RNG in Early Universe intro phase.  
**Range:** Integer string (timestamp)  
**Default:** `Date.now()` on first run

### `imaginer_audio_volume`
Global audio volume for intro sequences.  
**Range:** Float string (0.0-1.0)  
**Default:** `"1.0"`

### `imaginer_font_scale`
Font scale multiplier for intro UI.  
**Range:** Float string (typically 0.5-2.0)  
**Default:** `"1.0"`

---

## Menu Bar Settings

### `imaginer.menu_settings`
Persistent state for menu bar (e.g., advanced options visibility).  
**Range:** JSON object  
**Default:** Empty object `{}`

---

## Debug/Development Keys

### `imaginer_intro_debug_font_index`
Font selection in intro debug tools.  
**Range:** Integer string (1-5)  
**Default:** `"4"` (Orbitron)

### `infinity_zoom_debug_{key}`
Debug state for infinity zoom animation.  
**Range:** JSON value  
**Default:** Varies by key

---

## Notes

- All boolean values are stored as strings (`"true"` or `"false"`)
- Numeric values are stored as strings and parsed when read
- Keys prefixed with `imaginer.` are main app settings
- Keys without prefix are typically intro-specific or global utilities
- The scrambled API key uses XOR encoding with a browser-specific random key for basic obfuscation
