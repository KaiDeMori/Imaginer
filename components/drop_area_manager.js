// drop_area_manager.js
// Logic for managing the image drop area, including mask association and selection.
// Naming follows loose_snake_case as per project standards.

/**
 * Manages dropped images and their associated masks and UUIDs for the image edit feature.
 * Only the mask of the first image is used for the API request.
 */
class drop_area_manager {
  constructor() {
    /**
     * @type {Array<{ image: File, mask: File|null, uuid?: string }>}
     * Each entry: { image: File, mask: File|null, uuid?: string }
     */
    this.dropped_images = [];
  }

  /**
   * Add a new image (and optional mask) to the drop area, with optional uuid.
   * @param {File} image_file - The image file to add.
   * @param {File|null} mask_file - The mask file to associate, or null.
   * @param {string|null} uuid - The uuid to associate, or null.
   */
  add_image(image_file, mask_file = null, uuid = null) {
    if (uuid) {
      image_file.imaginer_uuid = uuid;
    }
    this.dropped_images.push({ image: image_file, mask: mask_file, uuid: uuid || image_file.imaginer_uuid });
  }

  /**
   * Remove an image by index.
   * @param {number} index - The index of the image to remove.
   */
  remove_image(index) {
    if (index >= 0 && index < this.dropped_images.length) {
      this.dropped_images.splice(index, 1);
    }
  }

  /**
   * Reorder images in the drop area.
   * @param {number} from_index - The current index of the image.
   * @param {number} to_index - The new index for the image.
   */
  reorder_image(from_index, to_index) {
    if (from_index === to_index) return;
    const images = this.dropped_images;
    if (from_index >= 0 && from_index < images.length && to_index >= 0 && to_index < images.length) {
      const [moved] = images.splice(from_index, 1);
      images.splice(to_index, 0, moved);
    }
  }

  /**
   * Get the mask file to use for the API request (mask of the first image, if present).
   * @returns {File|null}
   */
  get_active_mask() {
    if (this.dropped_images.length > 0) {
      return this.dropped_images[0].mask;
    }
    return null;
  }

  /**
   * Get the UUIDs of all dropped images (for orphan cleanup).
   * @returns {Set<string>}
   */
  get_all_uuids() {
    return new Set(this.dropped_images.map((entry) => entry.uuid).filter(Boolean));
  }

  /**
   * Get the list of dropped images (with masks and uuids).
   * @returns {Array<{ image: File, mask: File|null, uuid?: string }>}
   */
  get_images() {
    return this.dropped_images;
  }

  /**
   * Check if the first image has a mask (for UI outline).
   * @returns {boolean}
   */
  first_image_has_mask() {
    return this.dropped_images.length > 0 && !!this.dropped_images[0].mask;
  }
}

// Export as singleton for use in UI logic
const drop_area_manager_instance = new drop_area_manager();
export default drop_area_manager_instance;
