// config_dialog.js – Modal UI for entering & saving the OpenAI API key
// Note: This component has a corresponding CSS file: config_dialog.css (in the same folder).
// Usage:
//   const cfg = new Config_dialog();
//   cfg.open();
// ---------------------------------------------------------------------
export class Config_dialog {
  constructor(onSave = () => {}) {
    this.onSave = onSave;
    this.build_DOM();
    this.wire_events();
  }

  /* ------------------------------------------------------------------ */
  build_DOM() {

    // Overlay ---------------------------------------------------------
    this.overlay = document.createElement('div');
    this.overlay.className = 'overlay';

    // Dialog ----------------------------------------------------------
    this.dialog = document.createElement('div');
    this.dialog.className = 'dialog';

    // Title -----------------------------------------------------------
    const title = document.createElement('h2');
    title.textContent = 'Configuration';
    title.className = 'title';

    // Tab bar ---------------------------------------------------------
    const tab_bar = document.createElement('div');
    tab_bar.className = 'tab_bar';
    this.basic_tab_button = document.createElement('button');
    this.basic_tab_button.className = 'tab_button active';
    this.basic_tab_button.textContent = 'Basic';
    this.advanced_tab_button = document.createElement('button');
    this.advanced_tab_button.className = 'tab_button';
    this.advanced_tab_button.textContent = 'Advanced';
    tab_bar.appendChild(this.basic_tab_button);
    tab_bar.appendChild(this.advanced_tab_button);

    // Tab content containers ------------------------------------------
    this.basic_tab_content = document.createElement('div');
    this.basic_tab_content.className = 'tab_content';
    this.advanced_tab_content = document.createElement('div');
    this.advanced_tab_content.className = 'tab_content';

    // API key label & input + test button
    const label = document.createElement('label');
    label.textContent = 'OpenAI API Key';
    label.className = 'label';


    // Row for input and test button, now inside a form
    const key_form = document.createElement('form');
    key_form.className = 'form';
    key_form.autocomplete = 'off';
    key_form.onsubmit = (e) => { e.preventDefault(); this.testBtn.click(); };

    // Hidden username field for accessibility and password managers
    this.hidden_username_input = document.createElement('input');
    this.hidden_username_input.type = 'text';
    this.hidden_username_input.name = 'username';
    this.hidden_username_input.autocomplete = 'username';
    this.hidden_username_input.value = 'user';
    this.hidden_username_input.tabIndex = -1;
    this.hidden_username_input.ariaHidden = 'true';
    this.hidden_username_input.style.position = 'absolute';
    this.hidden_username_input.style.opacity = '0';
    this.hidden_username_input.style.height = '0';
    this.hidden_username_input.style.width = '0';
    this.hidden_username_input.style.pointerEvents = 'none';

    this.input = document.createElement('input');
    this.input.type = 'password';
    this.input.placeholder = 'sk-...';
    this.input.autocomplete = 'new-password';
    this.input.value = '';
    this.input.className = 'input';
    import('../storage/session_store.js').then(({ Session_store }) => {
      this.input.value = Session_store.get_api_key() || '';
    }).catch(() => {
      this.input.value = '';
    });

    // Test button
    this.testBtn = document.createElement('button');
    this.testBtn.type = 'submit';
    this.testBtn.textContent = 'Test';
    this.testBtn.className = 'button test_button';

    // Feedback span
    this.testFeedback = document.createElement('span');
    this.testFeedback.className = 'feedback';

    key_form.appendChild(this.hidden_username_input);
    key_form.appendChild(this.input);
    key_form.appendChild(this.testBtn);
    key_form.appendChild(this.testFeedback);



    // Max parallel generations label & input -------------------------
    const max_label = document.createElement('label');
    max_label.textContent = 'Maximum number of parallel generations';
    max_label.className = 'label';

    this.max_input = document.createElement('input');
    this.max_input.type = 'number';
    this.max_input.min = '1';
    this.max_input.max = '10';
    this.max_input.step = '1';
    this.max_input.value = localStorage.getItem('imaginer.max_parallel_generations') || '3';
    this.max_input.className = 'input';

    // Number of images (n) label & input ----------------------------
    const n_label = document.createElement('label');
    n_label.textContent = 'Number of images to generate (n)';
    n_label.className = 'label';

    this.n_input = document.createElement('input');
    this.n_input.type = 'number';
    this.n_input.min = '1';
    this.n_input.max = '10';
    this.n_input.step = '1';
    this.n_input.value = localStorage.getItem('imaginer.n') || '1';
    this.n_input.className = 'input';

    // Background select (moved from menu_bar.js)
    const background_label = document.createElement('label');
    background_label.textContent = 'Background';
    background_label.className = 'label';

    this.background_select = document.createElement('select');
    this.background_select.className = 'input';
    const backgrounds = [
      { value: 'auto', label: 'Automatic' },
      { value: 'transparent', label: 'Transparent' },
      { value: 'opaque', label: 'Opaque' },
    ];
    for (const bg of backgrounds) {
      const opt = document.createElement('option');
      opt.value = bg.value;
      opt.textContent = bg.label;
      this.background_select.appendChild(opt);
    }
    this.background_select.value = localStorage.getItem('imaginer.background') || 'auto';

    // Quality select (for gpt-image-1 only)
    const quality_label = document.createElement('label');
    quality_label.textContent = 'Image quality';
    quality_label.className = 'label';

    this.quality_select = document.createElement('select');
    this.quality_select.className = 'input';

    const qualities = [
      { value: 'auto', label: 'Automatic (default)' },
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' },
    ];
    for (const q of qualities) {
      const opt = document.createElement('option');
      opt.value = q.value;
      opt.textContent = q.label;
      this.quality_select.appendChild(opt);
    }
    this.quality_select.value = localStorage.getItem('imaginer.quality') ?? 'auto';

    // Strip metadata checkbox ----------------------------------------- 
    const strip_container = document.createElement('div');
    strip_container.className = 'strip_container';

    this.strip_checkbox = document.createElement('input');
    this.strip_checkbox.type = 'checkbox';
    const strip_metadata_setting = localStorage.getItem('imaginer.strip_metadata');
    this.strip_checkbox.checked = (strip_metadata_setting === null || strip_metadata_setting === 'true');

    const strip_label = document.createElement('label');
    strip_label.textContent = 'Strip Server-Side metadata';
    strip_label.className = 'checkbox_label';
    strip_label.setAttribute('for', 'strip_checkbox');
    this.strip_checkbox.id = 'strip_checkbox';

    // Wrap input and label in a flex row for consistent gap
    const strip_row = document.createElement('span');
    strip_row.className = 'checkbox_label';
    strip_row.appendChild(this.strip_checkbox);
    strip_row.appendChild(strip_label);
    strip_container.appendChild(strip_row);

    // Show Mask Mode Button checkbox ---------------------------------
    const mask_mode_container = document.createElement('div');
    mask_mode_container.className = 'mask_mode_container';
    mask_mode_container.style.display = 'flex';
    mask_mode_container.style.alignItems = 'center';
    mask_mode_container.style.margin = '8px 0 0 0';
    mask_mode_container.style.minHeight = '32px';

    this.show_mask_mode_checkbox = document.createElement('input');
    this.show_mask_mode_checkbox.type = 'checkbox';
    this.show_mask_mode_checkbox.id = 'show_mask_mode_checkbox';
    const show_mask_mode_setting = localStorage.getItem('imaginer.show_mask_mode_button');
    this.show_mask_mode_checkbox.checked = (show_mask_mode_setting === null || show_mask_mode_setting === 'true');

    const show_mask_mode_label = document.createElement('label');
    show_mask_mode_label.textContent = 'Show Mask Mode Button';
    show_mask_mode_label.className = 'checkbox_label';
    show_mask_mode_label.setAttribute('for', 'show_mask_mode_checkbox');

    const mask_mode_row = document.createElement('span');
    mask_mode_row.className = 'checkbox_label';
    mask_mode_row.appendChild(this.show_mask_mode_checkbox);
    mask_mode_row.appendChild(show_mask_mode_label);
    mask_mode_container.appendChild(mask_mode_row);

    // Optimized: Embed prompt group with two checkboxes
    const prompt_container = document.createElement('div');
    prompt_container.className = 'prompt_container';

    const prompt_group_label = document.createElement('div');
    prompt_group_label.textContent = 'Embed prompt:';
    prompt_group_label.className = 'prompt_group_label';
    prompt_container.appendChild(prompt_group_label);
    // iTXt option
    const itxt_row = document.createElement('label');
    itxt_row.className = 'checkbox_label';

    this.prompt_checkbox = document.createElement('input');
    this.prompt_checkbox.type = 'checkbox';
    this.prompt_checkbox.checked = localStorage.getItem('imaginer.add_prompt_to_image') === 'true';
    const itxt_desc = document.createElement('span');
    itxt_desc.textContent = 'as iTXt (standard PNG text chunk)';
    itxt_row.appendChild(this.prompt_checkbox);
    itxt_row.appendChild(itxt_desc);
    // XMP option
    const xmp_row = document.createElement('label');
    xmp_row.className = 'checkbox_label';

    this.prompt_xmp_checkbox = document.createElement('input');
    this.prompt_xmp_checkbox.type = 'checkbox';
    const add_prompt_xmp_setting = localStorage.getItem('imaginer.add_prompt_to_image_xmp');
    this.prompt_xmp_checkbox.checked = (add_prompt_xmp_setting === null || add_prompt_xmp_setting === 'true');
    const xmp_desc = document.createElement('span');
    xmp_desc.textContent = 'as XMP (for Adobe/metadata-aware tools)';
    xmp_row.appendChild(this.prompt_xmp_checkbox);
    xmp_row.appendChild(xmp_desc);
    // Add to container
    prompt_container.appendChild(itxt_row);
    prompt_container.appendChild(xmp_row);


    // Button row ------------------------------------------------------
    const button_row = document.createElement('div');
    button_row.className = 'button_row';

    this.button_download_all = document.createElement('button');
    this.button_download_all.textContent = 'Download All Images';
    this.button_download_all.className = 'button download_button';

    this.button_cancel = document.createElement('button');
    this.button_cancel.textContent = 'Cancel';
    this.button_cancel.className = 'button cancel_button';

    this.button_save = document.createElement('button');
    this.button_save.textContent = 'Save';
    this.button_save.className = 'button save_button';

    button_row.appendChild(this.button_download_all);
    button_row.appendChild(this.button_cancel);
    button_row.appendChild(this.button_save);

    // Assemble tab contents -------------------------------------------
    // Basic tab
    this.basic_tab_content.appendChild(label);
    this.basic_tab_content.appendChild(key_form);
    this.basic_tab_content.appendChild(max_label);
    this.basic_tab_content.appendChild(this.max_input);
    this.basic_tab_content.appendChild(n_label);
    this.basic_tab_content.appendChild(this.n_input);
    this.basic_tab_content.appendChild(background_label);
    this.basic_tab_content.appendChild(this.background_select);
    this.basic_tab_content.appendChild(quality_label);
    this.basic_tab_content.appendChild(this.quality_select);

    // Advanced tab
    this.advanced_tab_content.appendChild(strip_container);
    this.advanced_tab_content.appendChild(prompt_container);
    this.advanced_tab_content.appendChild(mask_mode_container);

    // Assemble dialog
    this.dialog.appendChild(title);
    this.dialog.appendChild(tab_bar);
    this.dialog.appendChild(this.basic_tab_content);
    this.dialog.appendChild(this.advanced_tab_content);
    this.dialog.appendChild(button_row);
    this.overlay.appendChild(this.dialog);
    document.body.appendChild(this.overlay);

    // Show only basic tab by default
    this.basic_tab_content.style.display = '';
    this.advanced_tab_content.style.display = 'none';

    // Tab switching logic
    this.basic_tab_button.addEventListener('click', () => {
      this.basic_tab_button.classList.add('active');
      this.advanced_tab_button.classList.remove('active');
      this.basic_tab_content.style.display = '';
      this.advanced_tab_content.style.display = 'none';
    });
    this.advanced_tab_button.addEventListener('click', () => {
      this.advanced_tab_button.classList.add('active');
      this.basic_tab_button.classList.remove('active');
      this.basic_tab_content.style.display = 'none';
      this.advanced_tab_content.style.display = '';
    });
  }

  /* ------------------------------------------------------------------ */
  wire_events() {
    // Remove feedback if API key field changes
    this.input.addEventListener('input', () => {
      this.testFeedback.textContent = '';
    });
    // Test button logic
    this.testBtn.addEventListener('click', async () => {
      this.testFeedback.textContent = '';
      this.testBtn.disabled = true;
      this.testBtn.textContent = 'Testing...';
      const key = this.input.value.trim();
      if (!key) {
        this.testFeedback.textContent = '';
        this.testBtn.disabled = false;
        this.testBtn.textContent = 'Test';
        return;
      }
      try {
        const resp = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
        });
        if (!resp.ok) {
          let errObj = null;
          try {
            errObj = await resp.json();
          } catch (_) {
            errObj = { message: `API request failed: ${resp.status} ${resp.statusText}` };
          }
          import('./error_modal.js').then(({ Error_modal }) => {
            Error_modal.show(errObj);
          });
          this.testFeedback.textContent = '👎';
          this.testBtn.disabled = false;
          this.testBtn.textContent = 'Test';
          return;
        }
        const data = await resp.json();
        if (data && Array.isArray(data.data)) {
          const found = data.data.some(m => m.id === 'gpt-image-1');
          if (found) {
            this.testFeedback.textContent = '👍';
          } else {
            this.testFeedback.textContent = '😢';
            import('./error_modal.js').then(({ Error_modal }) => {
              Error_modal.show({
                message: 'API key is valid, but you do not have access to the gpt-image-1 model.',
                hint: 'Check your OpenAI account or organization permissions.'
              });
            });
          }
        } else {
          this.testFeedback.textContent = '👎';
          import('./error_modal.js').then(({ Error_modal }) => {
            Error_modal.show({ message: 'Unexpected response from API.' });
          });
        }
      } catch (err) {
        this.testFeedback.textContent = '👎';
        import('./error_modal.js').then(({ Error_modal }) => {
          Error_modal.show(err && err.message ? err.message : err);
        });
      } finally {
        this.testBtn.disabled = false;
        this.testBtn.textContent = 'Test';
      }
    });
    // Click outside dialog closes (acts like cancel)
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    // Cancel button
    this.button_cancel.addEventListener('click', () => this.close());


    // Save button
    this.button_save.addEventListener('click', () => this.save());

    // Download All Images button
    this.button_download_all.addEventListener('click', async () => {
      this.button_download_all.disabled = true;
      this.button_download_all.textContent = 'Preparing...';
      try {
        // Dynamically import JSZip
        const { get_jszip } = await import('../static_imports/jszip_loader.js');
        const JSZip = await get_jszip();
        // Get all images from session store
        const { Session_store } = await import('../storage/session_store.js');
        const store = new Session_store();
        const records = await store.get_all({ reverse: false });
        if (!records.length) throw new Error('No images to download.');
        const zip = new JSZip();
        for (const rec of records) {
          if (rec.image_blob instanceof Blob) {
            // Use the same naming as gallery.js: first 20 chars of prompt, plus timestamp
            let base = (rec.prompt_text || 'image').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 20);
            if (!base) base = 'image';
            const ts = rec.created ? String(rec.created) : String(Math.floor(Date.now() / 1000));
            const filename = `${base}_${ts}.png`;
            zip.file(filename, rec.image_blob);
          }
        }
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        // Use export name: Imaginer_Export_<timestamp>.zip
        const export_ts = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
        const zip_name = `Imaginer_Export_${export_ts}.zip`;
        const a = document.createElement('a');
        a.href = url;
        a.download = zip_name;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 1000);
      } catch (err) {
        alert('Download failed: ' + (err && err.message ? err.message : err));
      } finally {
        this.button_download_all.disabled = false;
        this.button_download_all.textContent = 'Download All Images';
      }
    });

    // Enter key inside input triggers save
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.save();
      }
    });
  }

  /* ------------------------------------------------------------------ */
  open() {
    // Show Mask Mode Button checkbox
    const show_mask_mode_setting = localStorage.getItem('imaginer.show_mask_mode_button');
    this.show_mask_mode_checkbox.checked = (show_mask_mode_setting === null || show_mask_mode_setting === 'true');
    // Use Session_store to get the decoded API key
    this.input.value = '';
    import('../storage/session_store.js').then(({ Session_store }) => {
      this.input.value = Session_store.get_api_key() || '';
    }).catch(() => {
      this.input.value = '';
    });
    this.max_input.value = localStorage.getItem('imaginer.max_parallel_generations') || '3';
    this.n_input.value = localStorage.getItem('imaginer.n') || '1';
    this.quality_select.value = localStorage.getItem('imaginer.quality') ?? 'auto';
    this.background_select.value = localStorage.getItem('imaginer.background') || 'auto';
    // Always checked by default unless explicitly set to false
    const strip_metadata_setting = localStorage.getItem('imaginer.strip_metadata');
    this.strip_checkbox.checked = (strip_metadata_setting === null || strip_metadata_setting === 'true');
    // iTXt embedding is off by default
    this.prompt_checkbox.checked = localStorage.getItem('imaginer.add_prompt_to_image') === 'true';
    // XMP embedding is ON by default unless explicitly set to false
    if (this.prompt_xmp_checkbox) {
      const add_prompt_xmp_setting = localStorage.getItem('imaginer.add_prompt_to_image_xmp');
      this.prompt_xmp_checkbox.checked = (add_prompt_xmp_setting === null || add_prompt_xmp_setting === 'true');
    }
    this.overlay.style.display = 'flex';
    this.input.focus();
  }

  close() {
    this.overlay.style.display = 'none';
  }

  /* ------------------------------------------------------------------ */
  save() {
    const key = this.input.value.trim();
    const max = Math.max(1, parseInt(this.max_input.value, 10) || 3);
    const n = Math.max(1, Math.min(10, parseInt(this.n_input.value, 10) || 1));
    const quality = this.quality_select.value;
    const background = this.background_select.value;
    const strip = this.strip_checkbox.checked;
    const add_prompt = this.prompt_checkbox.checked;
    const add_prompt_xmp = this.prompt_xmp_checkbox?.checked;
    // Use Session_store to set the scrambled API key
    import('../storage/session_store.js').then(({ Session_store }) => {
      if (key) {
        Session_store.set_api_key(key);
      } else {
        localStorage.removeItem('imaginer.scrambled_api_key');
      }
    });
    localStorage.setItem('imaginer.max_parallel_generations', String(max));
    localStorage.setItem('imaginer.n', String(n));
    localStorage.setItem('imaginer.background', background);
    localStorage.setItem('imaginer.quality', quality);
    localStorage.setItem('imaginer.strip_metadata', String(strip));
    localStorage.setItem('imaginer.add_prompt_to_image', String(add_prompt));
    localStorage.setItem('imaginer.add_prompt_to_image_xmp', String(add_prompt_xmp));
    localStorage.setItem('imaginer.show_mask_mode_button', String(this.show_mask_mode_checkbox.checked));
    this.close();
    this.onSave(key, max, n, strip, add_prompt, quality);
  }
}
