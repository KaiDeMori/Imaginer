// menu_bar.js - Menu bar component
import { Config_dialog } from './config_dialog.js';

export class Menu_bar {
  constructor(root) {
    this.root = root;

    // Build DOM & wire events
    this.render();
    this.attach_events();
  }

  /* --------------------------------------------------------------- */
  render() {
    // Using innerHTML for brevity – simple static markup
    // --- Orientation drop-down and transparency checkbox added ---
    // See OpenAI API docs: 'size' param for orientation, 'background' param for transparency
    // Orientation: 'landscape' (1536x1024), 'portrait' (1024x1536), 'square' (1024x1024)
    // Transparency: background: 'transparent' (output PNG or WEBP), 'opaque', or 'auto' (default)
    this.root.innerHTML = `
      <div style="display: flex; align-items: center; width: 100%; justify-content: space-between;">
        <div style="display: flex; gap: 12px; align-items: center;">
          <div id="orientation-radio-group" style="display: flex; gap: 8px;">
            <button class="orientation-btn" data-orientation="landscape" title="Landscape" type="button">
              <img src="./assets/Landscape.png" alt="Landscape" class="orientation-img" />
            </button>
            <button class="orientation-btn" data-orientation="portrait" title="Portrait" type="button">
              <img src="./assets/Portrait.png" alt="Portrait" class="orientation-img" />
            </button>
            <button class="orientation-btn" data-orientation="square" title="Square" type="button">
              <img src="./assets/Square.png" alt="Square" class="orientation-img" />
            </button>
          </div>
        </div>
        <button id="config-btn" title="Config" style="margin-left: auto; font-size: 1.3rem; background: none; border: none; cursor: pointer;">⚙️</button>
      </div>
      <style>
        .orientation-btn {
          border: 2px solid transparent;
          background: white;
          border-radius: 6px;
          padding: 2px;
          width: 44px;
          height: 44px;
          cursor: pointer;
          transition: border 0.15s;
        }
        .orientation-btn.selected {
          border: 2px solid #1976d2;
          background: #e3f0ff;
        }
        .orientation-img {
          width: 32px;
          height: 32px;
          display: block;
          filter: grayscale(100%) contrast(0.7);
          transition: filter 0.15s;
        }
        .orientation-btn.selected .orientation-img {
          filter: none;
        }
        .orientation-btn:focus {
          outline: 2px solid #1976d2;
        }
      </style>
    `;
  }

  /* --------------------------------------------------------------- */
  attach_events() {
    const config_button = this.root.querySelector('#config-btn');
    if (!config_button) return;

    // Lazily create dialog when first requested
    let dialog_instance = null;
    // Accept an onSave callback to notify app.js of config changes
    const get_dialog = () => {
      if (!dialog_instance) {
        dialog_instance = new Config_dialog((api_key, max) => {
          // Fire a custom event so app.js can listen for config changes
          window.dispatchEvent(new CustomEvent('imaginer.config_changed', {
            detail: { apiKey: api_key, max }
          }));
        });
      }
      return dialog_instance;
    };

    config_button.addEventListener('click', () => {
      get_dialog().open();
    });

    // --- Settings persistence logic ---
    const SETTINGS_KEY = 'imaginer.menu_settings';
    // Default settings
    const default_settings = {
      orientation: 'square',
      background: 'auto'
    };
    // Load settings from localStorage or use defaults
    let settings = { ...default_settings, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')) };

    // UI elements
    // Orientation radio group logic
    const orientation_radio_group = this.root.querySelector('#orientation-radio-group');
    let orientation_buttons = [];
    if (orientation_radio_group) {
      orientation_buttons = Array.from(orientation_radio_group.querySelectorAll('.orientation-btn'));
      // Load current or default orientation
      const SETTINGS_KEY = 'imaginer.menu_settings';
      let settings = { orientation: 'square', ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')) };
      function select_orientation(orientation) {
        orientation_buttons.forEach(btn => {
          if (btn.dataset.orientation === orientation) {
            btn.classList.add('selected');
          } else {
            btn.classList.remove('selected');
          }
        });
      }
      // Initial selection
      select_orientation(settings.orientation);
      // Click event
      orientation_buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          settings.orientation = btn.dataset.orientation;
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
          // For backward compatibility, also update old keys
          let size = '1024x1024';
          if (settings.orientation === 'landscape') size = '1536x1024';
          else if (settings.orientation === 'portrait') size = '1024x1536';
          localStorage.setItem('imaginer.image_size', size);
          select_orientation(settings.orientation);
        });
      });
    }
    // ...existing code...
    // Remove background select logic (now in config dialog)
    // Initial save to ensure settings are present
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    // For backward compatibility, also update old keys (optional, can be removed in future)
    let size = '1024x1024';
    if (settings.orientation === 'landscape') size = '1536x1024';
    else if (settings.orientation === 'portrait') size = '1024x1536';
    localStorage.setItem('imaginer.image_size', size);
  }
}
