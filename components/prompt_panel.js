// prompt_panel.js - Prompt panel component (updated with generate button logic)
export class Prompt_panel {
  _update_input_image_thumbnails() {
    const drop_area = this.root.querySelector('#input-image-drop-area');
    if (!drop_area) return;
    // Remove old thumbnails
    drop_area.querySelectorAll('.input-image-thumb').forEach(el => el.remove());
    // Remove placeholder if present
    let placeholder = drop_area.querySelector('#input-image-drop-placeholder');
    if (this.dropped_images && this.dropped_images.length > 0) {
      if (placeholder) placeholder.style.display = 'none';
      this.dropped_images.forEach((file, idx) => {
        const url = URL.createObjectURL(file);
        const img = document.createElement('img');
        img.src = url;
        img.className = 'input-image-thumb';
        img.title = file.name + '\nClick to remove';
        img.style.height = '40px';
        img.style.width = '40px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '4px';
        img.style.border = '1px solid #bbb';
        img.style.marginRight = '4px';
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
          // Remove this image from dropped_images and update thumbnails
          this.dropped_images.splice(idx, 1);
          this._update_input_image_thumbnails();
        });
        drop_area.appendChild(img);
      });
    } else {
      if (placeholder) placeholder.style.display = '';
    }
  }
  constructor(root, onGenerate) {
    this.root = root;
    this.onGenerate = onGenerate; // callback when generate is clicked
    this.dropped_images = [];
    this.render();
    this.attach_events();
  }

  render() {
    // Load prompt from localStorage if available
    const saved_prompt = localStorage.getItem('imaginer_prompt') || 'A unicorn-dinosaur.';
    this.root.innerHTML = `
      <div id="prompt-panel-inner" style="display: flex; flex-direction: column; height: 100%; width: 100%;">
        <textarea
          id="prompt-input"
          rows="4"
          style="
            flex: 1 1 0;
            width: 100%;
            font-size: 1.2rem;
            resize: none;
            border: none;
            outline: none;
            background: #fff;
            margin: 0;
            padding: 2px;
            box-sizing: border-box;
            min-height: 0;
            overflow: auto;
          "
        >${saved_prompt}</textarea>
        <div
          id="input-image-drop-area"
          style="
            height: 18%;
            min-height: 48px;
            max-height: 120px;
            background: #f5f5f5;
            border-radius: 0;
            margin: 0;
            padding: 0 8px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            color: #bbb;
            font-size: 1.1rem;
            flex-shrink: 0;
            border: 2px dashed #bbb;
            transition: background 0.2s, border-color 0.2s;
            cursor: pointer;
            gap: 8px;
            overflow-x: auto;
          "
        >
          <span id="input-image-drop-placeholder" style="color:#bbb;">Drag & drop PNG image(s) here</span>
        </div>
        <button
          id="generate-btn"
          style="
            width: 100%;
            height: 56px;
            font-size: 1.5rem;
            padding: 0;
            margin: 0;
            border: none;
            border-radius: 0;
            background: #2d7ef7;
            color: #fff;
            font-weight: 600;
            cursor: pointer;
            flex-shrink: 0;
            display: block;
          "
        >▶️ Generate</button>
      </div>
    `;
    this._update_input_image_thumbnails();
  }

  attach_events() {
    const generate_btn = this.root.querySelector('#generate-btn');
    const prompt_input = this.root.querySelector('#prompt-input');
    const drop_area = this.root.querySelector('#input-image-drop-area');

    // Save prompt to localStorage on change
    prompt_input.addEventListener('input', () => {
      localStorage.setItem('imaginer_prompt', prompt_input.value);
    });

    generate_btn.addEventListener('click', () => {
      const prompt_text = prompt_input.value.trim();
      if (prompt_text && this.onGenerate) {
        // Use config values from localStorage
        this.onGenerate(prompt_text, {
          embed_itxt: localStorage.getItem('imaginer.add_prompt_to_image') === 'true',
          embed_xmp: localStorage.getItem('imaginer.add_prompt_to_image_xmp') === 'true'
        });
      }
    });

    // --- Drag-and-drop events for input image area ---
    drop_area.addEventListener('dragover', (event) => {
      event.preventDefault();
      drop_area.style.background = '#e6f7ff';
      drop_area.style.borderColor = '#1890ff';
      drop_area.style.color = '#1890ff';
    });
    drop_area.addEventListener('dragleave', (event) => {
      event.preventDefault();
      drop_area.style.background = '#f5f5f5';
      drop_area.style.borderColor = '#bbb';
      drop_area.style.color = '#bbb';
    });
    drop_area.addEventListener('drop', (event) => {
      event.preventDefault();
      drop_area.style.background = '#f5f5f5';
      drop_area.style.borderColor = '#bbb';
      drop_area.style.color = '#bbb';

      // --- Check for internal gallery drag ---
      const drag_id = event.dataTransfer.getData('application/x-imaginer-blob-id');
      if (drag_id && window.imaginer_gallery_drag_store && window.imaginer_gallery_drag_store[drag_id]) {
        const { blob, promptText, created } = window.imaginer_gallery_drag_store[drag_id];
        // Only accept PNGs for now
        if (blob && blob.type === 'image/png') {
          // Give the blob a name for thumbnail UI
          blob.name = promptText ? (promptText.slice(0, 20).replace(/\s+/g, '_') + '.png') : 'gallery_image.png';
          this.dropped_images = (this.dropped_images || []).concat([blob]);
          this._update_input_image_thumbnails();
        }
        // Clean up the drag store
        delete window.imaginer_gallery_drag_store[drag_id];
        return;
      }

      // --- Fallback: external file drop (original logic) ---
      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0) {
        import('./error_modal.js').then(({ Error_modal }) => {
          let any_error = false;
          const valid_files = [];
          for (const file of files) {
            if (file.type !== 'image/png') {
              Error_modal.show(`File "${file.name}" is not a PNG image.`);
              any_error = true;
              break;
            }
            if (file.size > 4 * 1024 * 1024) {
              Error_modal.show(`File "${file.name}" exceeds the 4MB size limit.`);
              any_error = true;
              break;
            }
            valid_files.push(file);
          }
          if (!any_error) {
            // Add valid PNG files to memory (append to existing)
            this.dropped_images = (this.dropped_images || []).concat(valid_files);
            this._update_input_image_thumbnails();
            console.log('Stored valid PNG files in memory:', this.dropped_images);
          }
        });
      }
    });
  }

  set_generate_button_enabled(enabled) {
    const generateBtn = this.root.querySelector('#generate-btn');
    generateBtn.disabled = !enabled;
    generateBtn.style.opacity = enabled ? '1' : '0.5';
    generateBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
  }
}
