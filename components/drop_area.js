// drop_area.js
// UI logic for the image drop area, using drop_area_manager for state management.
// Naming follows loose_snake_case as per project standards.

import drop_area_manager from './drop_area_manager.js';

/**
 * Initializes the drop area UI and binds event handlers.
 * @param {HTMLElement} drop_area_element - The DOM element for the drop area.
 * @param {Function} render_callback - Function to call when the drop area state changes.
 */
export function initialize_drop_area(drop_area_element, render_callback) {
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event_name => {
        drop_area_element.addEventListener(event_name, event => {
            event.preventDefault();
            event.stopPropagation();
        });
    });

    // Highlight drop area on dragover
    drop_area_element.addEventListener('dragover', () => {
        drop_area_element.classList.add('dragover');
    });
    drop_area_element.addEventListener('dragleave', () => {
        drop_area_element.classList.remove('dragover');
    });
    drop_area_element.addEventListener('drop', event => {
        drop_area_element.classList.remove('dragover');
        handle_drop(event, render_callback);
    });

    // Initial render
    render_callback();
}

/**
 * Handles files dropped into the drop area.
 * @param {DragEvent} event
 * @param {Function} render_callback
 */
function handle_drop(event, render_callback) {
    const files = Array.from(event.dataTransfer.files);
    // For each file, check if it's an image or a mask (simple PNG mask detection)
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            // Check for in-memory UUID property
            let uuid = file.imaginer_uuid || null;
            // If not present, check for a custom property (for future extensibility)
            if (!uuid && file.uuid) uuid = file.uuid;

            // For now, assume mask is a PNG with 'mask' in the filename
            if (file.name.toLowerCase().includes('mask') && file.type === 'image/png') {
                // Try to associate with the last image
                const images = drop_area_manager.get_images();
                if (images.length > 0 && !images[images.length - 1].mask) {
                    images[images.length - 1].mask = file;
                } else {
                    // No image to associate, just add as image (no mask)
                    drop_area_manager.add_image(file, null, uuid);
                }
            } else {
                // If UUID is present, try to find mask in sessionStore
                if (uuid && window.sessionStore) {
                    window.sessionStore.get_all({ reverse: false }).then(records => {
                        const rec = records.find(r => r.uuid === uuid && r.mask_blob);
                        if (rec && rec.mask_blob) {
                            // Attach mask from sessionStore
                            drop_area_manager.add_image(file, rec.mask_blob, uuid);
                        } else {
                            // UUID not found in sessionStore, treat as new image
                            file.imaginer_uuid = null;
                            drop_area_manager.add_image(file, null, null);
                        }
                        render_callback();
                    });
                } else {
                    drop_area_manager.add_image(file, null, uuid);
                    render_callback();
                }
            }
        }
    });
    // If any async mask lookup, render_callback will be called in the promise above
    // Otherwise, call it here
    if (!files.some(file => file.type.startsWith('image/') && file.imaginer_uuid)) {
        render_callback();
    }
}

/**
 * Renders the drop area images and outlines.
 * @param {HTMLElement} container_element - The container for thumbnails.
 */
export function render_drop_area(container_element) {
    const images = drop_area_manager.get_images();
    container_element.innerHTML = '';
    images.forEach((entry, idx) => {
        const thumb = document.createElement('div');
        thumb.className = 'thumbnail';
        if (idx === 0 && entry.mask) {
            thumb.classList.add('mask-outline'); // e.g., red outline
        }
        thumb.textContent = entry.image.name;
        container_element.appendChild(thumb);
    });
}

/**
 * Removes an image from the drop area by index and re-renders.
 * @param {number} index
 * @param {Function} render_callback
 */
export function remove_image_from_drop_area(index, render_callback) {
    drop_area_manager.remove_image(index);
    render_callback();
}

/**
 * Reorders images in the drop area and re-renders.
 * @param {number} from_index
 * @param {number} to_index
 * @param {Function} render_callback
 */
export function reorder_image_in_drop_area(from_index, to_index, render_callback) {
    drop_area_manager.reorder_image(from_index, to_index);
    render_callback();
}
