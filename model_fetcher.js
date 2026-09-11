// model_fetcher.js - Utility functions for managing image generation models
// Handles fetching, caching, and retrieving available OpenAI image models

import { Database_store } from "./storage/database_store.js";

const CACHE_KEY = "imaginer.available_image_models";
const SELECTED_KEY = "imaginer.selected_image_model";
const SHOW_OLDER_MODELS_KEY = "imaginer.show_older_models";
const IMAGE_MODEL_FILTER = "gpt-image-";
const EXTENDED_QUALITY_MODEL_FILTER = "gpt-image-2.5";
const EXTENDED_QUALITY_VALUES = new Set(["xhigh", "max"]);

const DEFAULT_MODEL = "gpt-image-2.5-flare";
const RECOMMENDED_MODEL_IDS = [DEFAULT_MODEL, "gpt-image-2.5-sunburst"];

/**
 * Fetch available image models from OpenAI API
 * Filters for gpt-image models and sorts lexically
 * @returns {Promise<Array>} Array of model ID strings
 */
export async function fetch_available_models() {
  const api_key = Database_store.get_api_key();
  if (!api_key) {
    throw new Error("No API key available");
  }

  const response = await fetch("https://api.openai.com/v1/models", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${api_key}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    let error_obj = null;
    try {
      error_obj = await response.json();
    } catch (_) {
      error_obj = { message: `API request failed: ${response.status} ${response.statusText}` };
    }
    throw error_obj;
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.data)) {
    throw new Error("Unexpected response format from API");
  }

  // Filter for gpt-image models and sort lexically
  const image_model_ids = data.data
    .filter((model) => model.id && model.id.startsWith(IMAGE_MODEL_FILTER))
    .map((model) => model.id)
    .sort();

  return image_model_ids;
}

/**
 * Get cached models from localStorage
 * @returns {Array} Array of cached model IDs, empty array if none
 */
export function get_cached_models() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return [];
    const model_ids = JSON.parse(cached);
    return Array.isArray(model_ids) ? model_ids : [];
  } catch (error) {
    console.warn("Failed to parse cached models:", error);
    return [];
  }
}

/**
 * Refresh models by fetching from API and updating cache
 * @returns {Promise<Array>} Fresh array of model IDs
 */
export async function refresh_models() {
  const model_ids = await fetch_available_models();
  localStorage.setItem(CACHE_KEY, JSON.stringify(model_ids));
  return model_ids;
}

export function is_older_model(model_id) {
  return !RECOMMENDED_MODEL_IDS.includes(model_id);
}

export function get_show_older_models() {
  return localStorage.getItem(SHOW_OLDER_MODELS_KEY) === "true";
}

export function set_show_older_models(show_older_models) {
  localStorage.setItem(SHOW_OLDER_MODELS_KEY, String(show_older_models));
}

/**
 * Reduce a model list to the models the dropdown shows.
 * Older models are only listed when the user enabled them.
 * @param {Array} model_ids - Model IDs as returned by the API
 * @returns {Array} Model IDs to show in the dropdown
 */
export function filter_models_for_dropdown(model_ids) {
  if (get_show_older_models()) {
    return model_ids;
  }
  return model_ids.filter((model_id) => !is_older_model(model_id));
}

/**
 * Get currently selected model with fallback
 * A stored selection that the dropdown does not show is replaced by the default model.
 * @returns {string} Selected model ID or a fallback model ID
 */
export function get_selected_model() {
  const selected = localStorage.getItem(SELECTED_KEY);
  if (selected) {
    const selected_is_shown = get_show_older_models() || !is_older_model(selected);
    if (selected_is_shown) {
      return selected;
    }
    set_selected_model(DEFAULT_MODEL);
    return DEFAULT_MODEL;
  }

  // Fallback to first available model from cache
  const cached_model_ids = get_cached_models();
  if (cached_model_ids.length > 0) {
    const has_default_model = cached_model_ids.includes(DEFAULT_MODEL);
    const fallback_model = has_default_model ? DEFAULT_MODEL : cached_model_ids[0];
    localStorage.setItem(SELECTED_KEY, fallback_model);
    return fallback_model;
  }

  // Ultimate fallback
  return DEFAULT_MODEL;
}

/**
 * Set the selected model
 * @param {string} model_id - The model ID to select
 */
export function set_selected_model(model_id) {
  if (model_id) {
    localStorage.setItem(SELECTED_KEY, model_id);
  }
}

/**
 * Check whether a model supports the extended quality levels "xhigh" and "max"
 * @param {string} model_id - The model ID to check
 * @returns {boolean} True when the model supports extended quality levels
 */
export function supports_extended_quality(model_id) {
  return model_id.startsWith(EXTENDED_QUALITY_MODEL_FILTER);
}

/**
 * Clamp a quality value to one a model actually supports
 * @param {string} quality - The requested quality value
 * @param {string} model_id - The model ID the request targets
 * @returns {string} "high" when the quality is an extended level the model does not support, otherwise the quality unchanged
 */
export function clamp_quality_for_model(quality, model_id) {
  if (EXTENDED_QUALITY_VALUES.has(quality) && !supports_extended_quality(model_id)) {
    return "high";
  }
  return quality;
}

/**
 * Get models for dropdown population
 * Returns cached model IDs if available, otherwise tries to fetch fresh
 * @returns {Promise<Array>} Array of model IDs
 */
export async function get_models_for_dropdown() {
  const cached = get_cached_models();
  if (cached.length > 0) {
    return filter_models_for_dropdown(cached);
  }

  // Try to fetch fresh models if cache is empty
  try {
    return filter_models_for_dropdown(await refresh_models());
  } catch (error) {
    console.warn("Failed to fetch models:", error);
    return [];
  }
}
