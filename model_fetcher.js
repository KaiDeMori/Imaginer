// model_fetcher.js - Utility functions for managing image generation models
// Handles fetching, caching, and retrieving available OpenAI image models

import { Session_store } from "./storage/session_store.js";

const CACHE_KEY = "imaginer.available_image_models";
const SELECTED_KEY = "imaginer.selected_image_model";

/**
 * Fetch available image models from OpenAI API
 * Filters for gpt-image models and sorts lexically
 * @returns {Promise<Array>} Array of model ID strings
 */
export async function fetch_available_models() {
  const api_key = Session_store.get_api_key();
  if (!api_key) {
    throw new Error("No API key available");
  }

  const response = await fetch("https://api.openai.com/v1/models", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${api_key}`,
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
    .filter((model) => model.id && model.id.startsWith("gpt-image"))
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

/**
 * Get currently selected model with fallback
 * @returns {string} Selected model ID or fallback to first available or "gpt-image-1"
 */
export function get_selected_model() {
  // Check localStorage for user selection
  const selected = localStorage.getItem(SELECTED_KEY);
  if (selected) {
    return selected;
  }

  // Fallback to first available model from cache
  const cached_model_ids = get_cached_models();
  if (cached_model_ids.length > 0) {
    const first_model = cached_model_ids[0];
    localStorage.setItem(SELECTED_KEY, first_model);
    return first_model;
  }

  // Ultimate fallback
  return "gpt-image-1";
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
 * Get models for dropdown population
 * Returns cached model IDs if available, otherwise tries to fetch fresh
 * @returns {Promise<Array>} Array of model IDs
 */
export async function get_models_for_dropdown() {
  const cached = get_cached_models();
  if (cached.length > 0) {
    return cached;
  }

  // Try to fetch fresh models if cache is empty
  try {
    return await refresh_models();
  } catch (error) {
    console.warn("Failed to fetch models:", error);
    return [];
  }
}
