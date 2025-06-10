// prompt_panel.js - Prompt panel component (updated with generate button logic)
export class Prompt_panel {
  constructor(root, onGenerate) {
    this.root = root;
    this.onGenerate = onGenerate; // callback when generate is clicked
    this.render();
    this.attach_events();
  }

  render() {
    // Load prompt from localStorage if available
    const savedPrompt = localStorage.getItem('imaginer_prompt') || 'A unicorn-dinosaur.';
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
        >${savedPrompt}</textarea>
        <div
          id="input-image-dummy"
          style="
            height: 18%;
            min-height: 48px;
            max-height: 120px;
            background: #f5f5f5;
            border-radius: 0;
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #bbb;
            font-size: 1.1rem;
            flex-shrink: 0;
          "
        >[input image area]</div>
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
  }

  attach_events() {
    const generateBtn = this.root.querySelector('#generate-btn');
    const promptInput = this.root.querySelector('#prompt-input');

    // Save prompt to localStorage on change
    promptInput.addEventListener('input', () => {
      localStorage.setItem('imaginer_prompt', promptInput.value);
    });

    generateBtn.addEventListener('click', () => {
      const promptText = promptInput.value.trim();
      if (promptText && this.onGenerate) {
        // Use config values from localStorage
        this.onGenerate(promptText, {
          embed_itxt: localStorage.getItem('imaginer.add_prompt_to_image') === 'true',
          embed_xmp: localStorage.getItem('imaginer.add_prompt_to_image_xmp') === 'true'
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
