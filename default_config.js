// default_config.js
// Central configuration management for Imaginer
// Ensures all config keys have default values in localStorage

const INITIAL_PROMPT = "A unicorn-dinosaur.";

const DEFAULT_CONFIG = {
  "imaginer.prompt": INITIAL_PROMPT,
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
 * Sets missing keys and missing or empty values.
 * Call this once at app startup to guarantee all config keys exist and have valid defaults.
 */
function ensure_config_defaults() {
  for (const [key, default_value] of Object.entries(DEFAULT_CONFIG)) {
    const current_value = localStorage.getItem(key);
    if (current_value === null || current_value === "") {
      localStorage.setItem(key, default_value);
    }
  }
}

export { INITIAL_PROMPT, DEFAULT_CONFIG, ensure_config_defaults };
