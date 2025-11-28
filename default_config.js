// default_config.js
// Central configuration management for Imaginer
// Ensures all config keys have default values in localStorage

const DEFAULT_CONFIG = {
  "imaginer.prompt": "A unicorn-dinosaur.",
  "imaginer.max_parallel_generations": "3",
  "imaginer.n": "1",
  "imaginer.background": "auto",
  "imaginer.quality": "auto",
  "imaginer.image_size": "1024x1024",
  "imaginer.strip_metadata": "true",
  "imaginer.add_prompt_to_image": "false",
  "imaginer.add_prompt_to_image_xmp": "true",
  "imaginer.show_mask_mode_button": "false",
  "imaginer.dividerWidth": "300",
  "imaginer.mode": "generation",
};

/**
 * Ensures all default config values are set in localStorage.
 * Only sets values that don't already exist.
 * Call this once at app startup to guarantee all config keys exist.
 */
function ensure_config_defaults() {
  for (const [key, default_value] of Object.entries(DEFAULT_CONFIG)) {
    if (localStorage.getItem(key) === null) {
      localStorage.setItem(key, default_value);
    }
  }
}

export { DEFAULT_CONFIG, ensure_config_defaults };
