# Config Dialog Refactor Plan: Basic & Advanced Tabs

We plan to split the configuration dialog into two tabs: **Basic** and **Advanced**. This will improve usability by grouping essential and advanced options separately.

---

## Basic Tab
Contains all options required for making a request:
- **OpenAI API Key** (`this.input`): The API key for authentication.
- **Maximum number of parallel generations** (`this.max_input`): Controls how many images can be generated in parallel.
- **Number of images to generate (n)** (`this.n_input`): Sets how many images are requested per operation.
- **Image quality** (`this.quality_select`): Selects the quality of generated images.
- **Background** (`this.background_select`): Sets the background mode for generated images.

## Advanced Tab
Contains additional, non-essential, or expert options:
- **Strip Server-Side metadata** (`this.strip_checkbox`): Option to remove metadata from images.
- **Embed prompt as iTXt** (`this.prompt_checkbox`): Option to embed the prompt in the PNG as iTXt.
- **Embed prompt as XMP** (`this.prompt_xmp_checkbox`): Option to embed the prompt as XMP metadata.
- **Activate Mask Mode** (`this.mask_mode_checkbox`): Enables mask mode for advanced editing features.

---

**Plan:**
- Refactor the config dialog UI to use two tabs: Basic and Advanced.
- Move the listed options into their respective tabs.
- Update the following files:
  - `components/config_dialog.js` (main logic and UI for the dialog)
  - `components/config_dialog.css` (styling for the dialog and new tab layout)
- Ensure all naming follows loose_snake_case as per project standards.
- No options will be invented or removed; only the UI grouping will change.
# Note: There is a corresponding CSS file for the config dialog component (`components/config_dialog.css`). Ensure any UI changes are reflected in both the JS and CSS files.
