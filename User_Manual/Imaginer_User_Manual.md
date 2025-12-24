# Imaginer User Manual

## Getting Started

### What is Imaginer?

Imaginer is a browser-based AI image generation tool that lets you create images using text prompts. It connects directly to OpenAI's image generation API, putting powerful AI creativity at your fingertips.

**Key capabilities:**

- **Generate images from text**: Describe what you want, and Imaginer creates it.
- **Edit existing images**: Import images and modify specific areas using masks and prompts.
- **Manage your creations**: Built-in gallery to view, organize, and download your generated images.
- **No installation required**: Runs entirely in your browser, no software to install.

Imaginer stores everything locally in your browser. Your images, settings, and API key stay on your device. The app only communicates with OpenAI's servers when generating images.

**What you'll need:**

- A modern web browser (made for Firefox 🤗).
- An OpenAI API key.
- Internet connection for image generation.

Once set up, you can start creating images immediately. The interface is designed to be straightforward: write a prompt, click generate, and watch your ideas come to life.


### First-Time Setup

When you launch Imaginer for the first time, you'll be prompted to enter your OpenAI API key. This connects Imaginer to OpenAI's image generation service.

**You'll need an OpenAI API key** to use Imaginer. Keys start with `sk-` (legacy format) or `sk-proj-` (modern format). Both formats work.

#### Entering Your API Key

On first launch, Imaginer displays an API key entry screen:

1. **Paste your API key** into the input field.
   - As you type, Imaginer validates the key format.
   - Modern keys (`sk-proj-...`) should be at least 108 characters.
   - Legacy keys (`sk-...`) should be exactly 51 characters.

2. **Click the Test button** to verify your key.
   - Imaginer checks if the key works and confirms you have access to image generation.
   - Test results appear below the input field:
     - ✅ **"API key valid and ready!"** - You're all set.
     - ❌ **"Invalid API key"** - Check the key and try again.
     - ❌ **"Valid key but no gpt-image-1 access"** - Your API key doesn't have permission to generate images.
     - ❌ **"Connection failed"** - Check your internet connection.

3. **Click OK** once the test succeeds.
   - Your API key is saved in your browser.

#### What Happens Next

After entering your API key successfully:

- **First launch only**: An epic cinematic intro sequence plays (requires WebGL support).
  - The intro features a space-themed animation with a dramatic soundtrack.
  - See Appendix E for detailed information about the intro sequence.

- **You're taken to the main app**, where you can immediately start generating images.

#### Security Note

Your API key is stored in your browser and stays on your device. It's only sent to OpenAI when generating images. Important things to know:

- Anyone who can access your browser can potentially access the key.
- Clearing your browser data will delete your stored API key.
- You can change or remove your API key anytime using the **Configuration** dialog (gear icon in the menu bar).


### Understanding the Interface

Imaginer's interface is divided into three main areas:

#### The Menu Bar (Top)

The menu bar spans the top of the screen and contains all your controls and settings:

**Left side:**
- **Orientation buttons**: Three icon buttons to select image orientation.
  
- **Model dropdown**: Select which AI model to use for generation.
  - Shows available image generation models from your OpenAI account.
  - Auto-populates when you add an API key.
  - Use Config → Advanced → **Refresh Models** to update the list.


**Right side:**
- 🗑️ **Delete Mode button**: Toggle deletion mode to remove images from gallery.
- ⚙️ **Config button**: Open configuration dialog for settings and API key management.
- 🛈 **About button**: View app information and version.

The menu bar also manages your image orientation selection, which persists between sessions.

#### The Gallery (Left)

The gallery displays all your generated and imported images as a grid of thumbnails:

- **Thumbnail grid**: Images shown in chronological order (oldest first).
- **Click any thumbnail** to open it in the Viewer.
- **Drag images** from the gallery to the Prompt Panel to use them as reference images for editing.
- **Import images**: Drag-and-drop images from your computer directly into the gallery.
  - Non-PNG images are automatically converted to PNG format.
- **Empty state**: When the gallery is empty, you'll see "Drop image(s) for import".

The gallery stores all images in your browser using IndexedDB. Images persist between sessions unless you clear browser data or manually delete them.

#### The Prompt Panel (Right)

The prompt panel is where you describe what you want to generate or edit:

- **Large text area**: Write your prompt describing the image you want.
  - Your prompt is automatically saved as you type.
  - Supports multi-line text for detailed descriptions.
  
- **Drop area (bottom)**: Shows input images for editing mode.
  - Displays thumbnails of images you've dragged from the gallery.
  - Images with masks show a red border indicator.
  - Click any thumbnail to remove it from the input.
  - When empty, shows "Drop image(s) for edit reference".

#### The Resizable Divider

Between the Gallery and Prompt Panel is a thin vertical divider:

- **Drag the divider** left or right to resize the gallery and prompt areas.
- Find your preferred layout balance.
- Your preferred width is saved automatically and restored next time you use Imaginer.

The interface is designed to be flexible—adjust the layout to match your workflow and screen size.


## Core Features

### Image Generation

#### Basic Generation

Creating images in Imaginer is straightforward:

1. **Type your prompt** in the text area at the top of the Prompt Panel.
   - Describe what you want to see (e.g., "A robot playing chess in a park").
   - Your prompt saves automatically as you type.

2. **Click the ▶️ Generate button** at the bottom of the Prompt Panel.
   - The button spans the full width and has a blue background.

3. **Watch as your image generates**:
   - A placeholder appears instantly in the Gallery with a timer showing elapsed time.
   - The placeholder has a gray background while generation is in progress.
   - Generation typically takes about a minute, depending on the selected model and settings.

4. **View your completed image**:
   - When generation finishes, the placeholder is replaced with your image thumbnail.
   - The thumbnail appears at the top of the Gallery grid.
   - Click the thumbnail to view it full-screen in the Viewer.

**If generation fails**, the placeholder turns red. Click the 💬 button on the error placeholder to reload the prompt into the text area and try again.

#### Multiple Images

Generate several variations of your prompt at once:

- **How to enable**: Adjust Config → Basic → **Number of Images (n)** (default is 1, maximum is 10).
- **How it works**: When you click Generate, Imaginer creates the specified number of placeholders and requests that many images from the API.
- **Display**: All images appear as separate thumbnails in the Gallery as they complete.
- **Generation limit**: The **Maximum Parallel Generations** setting (default: 3) controls how many Generate requests can run simultaneously. If you reach this limit, the Generate button becomes disabled until a generation completes.


### The Gallery

The gallery displays your images as thumbnails (newest at the top). **Click any thumbnail** to view it full-screen in the Viewer.

#### Importing Images

**Drag and drop image files** from your computer into the gallery area.  
Images with embedded prompts are automatically detected.

#### Deleting Images

1. Click the 🗑️ button in the menu bar to enable delete mode.
2. Click any thumbnail to delete it (confirmation required).
3. Click 🗑️ again to exit delete mode.

**⚠️ Warning**: Deletion is permanent.

#### Thumbnail Actions

**Hover over any thumbnail** to reveal action buttons:

- ⬇️ **Download** (top-left): Save the image to your computer.
- 💬 **Use Prompt** (top-right): Load the image's prompt into the text area.

#### Using Images for Editing

**Drag thumbnails to the drop area** at the bottom of the Prompt Panel to use them as edit references. See **Image Editing** for details.

#### Storage

Images are stored in your browser and persist between sessions. Each browser has its own storage. 

**⚠️ Warning**: Clearing browser data deletes all gallery images permanently.


### The Viewer

**Click any thumbnail** to open it full-screen in the Viewer.

**Controls:**
- **Mouse wheel**: Zoom in/out (zoom centers on your cursor).
- **Escape** or **click outside the image**: Close the Viewer.

#### Mask Mode

Mask Mode lets you paint on images to control which areas get regenerated during editing.

**Enable the button** first in Config → Advanced → **Show Mask Mode Button** (off by default).

**Using Mask Mode:**
1. Open an image in the Viewer.
2. Click **Mask Mode** (button turns red when active).
3. **Left-click and drag** to paint mask areas (red overlay marks areas that will be regenerated).
4. **Right-click and drag** or **Shift + drag** to erase masks (protect areas from changes).
5. **Ctrl + mouse wheel** to adjust brush size.
6. Click **Mask Mode** again to exit.

**Remove Mask** button clears all masks (appears only when masks exist).

Masks save automatically when you close the Viewer. Gallery thumbnails with masks show a red border.


### Image Editing

**Drag thumbnails from the gallery or image files from your computer** to the drop area at the bottom of the Prompt Panel. Write a prompt describing your changes and click **Generate**. The edited image appears in the gallery.

The drop area highlights in blue when you drag over it. **Click thumbnails in the drop area** to remove them.

**For precise edits**, create a mask in the Viewer (see **The Viewer → Mask Mode**), then drag that masked image to the drop area. Only masked areas will be modified.

**When using multiple images**: If you drop several images with masks, only the first image's mask is used. The first thumbnail shows a red border when its mask is active. Other masked images show a regular border.


### Model Selection

The dropdown in the menu bar (next to the orientation buttons) lets you choose which AI model generates your images.

Different models offer trade-offs between quality, speed, and cost.

Use Config → Advanced → **Refresh Models** to update the list when new models become available.


## Configuration & Settings

### Accessing Configuration

Click the **⚙️ Config button** (gear icon) in the menu bar to open the Configuration dialog.

The Configuration dialog has two tabs:

- **Basic**: API key, generation settings, image quality, and background options.
- **Advanced**: PNG metadata options, mask mode settings, data management, and model refresh.

Click between tabs to access different settings. Changes save automatically when you close the dialog.


### Basic Settings

#### API Key

**OpenAI API Key** is where you enter or update your API key.

**Test button** verifies your key works and that you have access to image generation. Test results appear as icons below the input field:
- 👍 = Key is valid and has image generation access.
- 👎 = Key is invalid or connection failed.
- 😢 = Key is valid but lacks access to image models.

Press Enter in the key field to test automatically.


#### Maximum Parallel Generations

**Maximum number of parallel generations** limits how many images can generate at the same time.

**Default**: 3 (range: 1-10)

When you reach this limit, the Generate button becomes disabled until a generation completes. This prevents accidental overuse and keeps your browser responsive.


#### Number of Images (n)

**Number of images to generate (n)** sets how many images to create per Generate click.

**Default**: 1 (range: 1-10)

All images use the same prompt but produce different variations. Each image is billed separately.


#### Background

**Background** controls whether generated images have transparent or opaque backgrounds.

**Options**:
- **Automatic** (default): The model decides based on your prompt.
- **Transparent**: Generates images with transparent backgrounds.
- **Opaque**: Generates images with solid backgrounds.

Transparency works best for isolated objects like logos and icons.


#### Image Quality

**Image quality** controls the rendering quality of generated images.

**Options**:
- **Automatic** (default): The model selects the best quality based on your prompt.
- **High**: Higher quality rendering.
- **Medium**: Balanced quality.
- **Low**: Lower quality rendering.

#### Orientation and Size

Use Menu Bar → **Orientation buttons** to choose the canvas shape for generation and edits.

**Options**:
- **Landscape** (1536×1024) for wide scenes.
- **Portrait** (1024×1536) for tall subjects.
- **Square** (1024×1024, default) for balanced framing.

Your selection persists between sessions and applies to the next generation or edit request.


### Advanced Settings

#### PNG Metadata Options

- **Strip Server-Side metadata** (default: on): Removes metadata from OpenAI responses before saving, keeping files lean. Prompt embedding still runs after stripping.
- **Embed prompt as iTXt** (default: off): Stores your prompt in a standard PNG text chunk for tools that read PNG metadata.
- **Embed prompt as XMP** (default: on): Writes the prompt in an XMP block for metadata-aware apps. If both options are on, the prompt is written to iTXt first, then XMP.

#### Mask Mode Button

Config → Advanced → **Show Mask Mode Button** toggles whether the Viewer shows the mask tools. Enable it when you need to paint or remove masks; disable it to keep the Viewer simpler by hiding the mask buttons.


### Data Management

#### Delete Mode

Menu Bar → **Delete Mode** toggles deletion. When active, the button turns red and gallery thumbnails use a “no” cursor and dim on hover. Click any thumbnail to confirm “Delete this image?”. Confirmed deletes remove the image from the gallery and storage permanently. Click the button again to exit delete mode.

#### Download All Images

Config → **Download All Images** bundles every stored image (generated and imported) into a ZIP. Filenames use the first 20 characters of the prompt plus the image timestamp; the ZIP is named `Imaginer_Export_<timestamp>.zip`. A progress dialog shows status. If no images are present, you see an error instead of a download.

#### Clear Gallery

Config → Advanced → **Delete Gallery** wipes all stored images. The first click only highlights **Download All Images** as a warning. The second click asks you to type `YES`. Confirming clears the gallery database and reloads the app. This cannot be undone — export first if needed.

#### Refresh Models

Config → Advanced → **Refresh Image Models** fetches the latest `gpt-image-*` models and repopulates the model dropdown. The button shows “Refreshing…” while it runs and briefly shows a checkmark when done. Use it after adding an API key or when new models become available.


## Advanced Features

### PNG Metadata

#### Reading metadata from imported images
- Imaginer reads PNG iTXt chunks with the `prompt_text` keyword and XMP descriptions when you drop a PNG into the gallery.
- If metadata is found, the prompt is stored with the image and the 💬 button appears on the thumbnail to load it into the prompt box.
- JPEG imports are converted to PNG before storage. Non-PNG files lose any original metadata during conversion.

#### Writing metadata to generated images
- Config → Advanced → **Strip Server-Side metadata** removes metadata from API responses before saving (default on).
- Config → Advanced → **Embed prompt as iTXt** adds the prompt to a `prompt_text` iTXt chunk (default off).
- Config → Advanced → **Embed prompt as XMP** writes the prompt into XMP metadata (default on). If both options are on, iTXt is written first, then XMP.
- Metadata embedding applies to both single and multi-image generations. Imported images are not modified unless you regenerate them.

### Keyboard Shortcuts (Main App Only)
- Viewer: `Escape` closes the viewer or exits mask mode.
- Viewer: `D` toggles the debug overlay while the viewer is open.
- Mask mode: `Ctrl` + `D` toggles the debug overlay while painting.
- Mask mode: `Ctrl` + mouse wheel adjusts brush size.

### Debug Features
- The debug overlay is available in the viewer. Toggle it with `D` (viewer mode) or `Ctrl` + `D` (mask mode).
- The overlay draws a red outline of the rendered image and shows live stats: bitmap size, fit scale, zoom factor, and pan offsets.
- Debug view appears only while the viewer overlay is visible.


## Understanding Image Generation

### The Generation Process
- Write your prompt and click **▶️ Generate**. Placeholders appear in the gallery with a timer while requests run.
- Imaginer sends /v1/images/generations requests when no input images are dropped. When images are dropped and the model supports editing, it sends /v1/images/edits with the first mask attached if one exists.
- Orientation buttons set the `size` (square 1024×1024, landscape 1536×1024, portrait 1024×1536). Background, quality, and `n` come from Config.
- Generated images are stored in IndexedDB with their prompt and shown as thumbnails. The 💬 button copies the stored prompt back into the prompt box.
- If a request fails, the placeholder turns red and keeps a 💬 button so you can retry with the same prompt.

### Quality and Performance
- **Quality** passes directly to the API; leave it on Automatic to let the model choose.
- **Background** can be Automatic, Transparent, or Opaque and is sent with each request.
- **Number of Images (n)** creates multiple images per click; **Maximum Parallel Generations** limits how many requests run at once (Generate disables when you hit the limit).
- Edits send `input_fidelity=high` for `gpt-image-1` to preserve input detail. JPEG imports are converted to PNG; images over 4 MB are rejected on drop.
- A performance warning appears if gallery loading takes more than about 15 seconds and offers quick download or clear options.

### Costs
- Each generated image is billed by OpenAI according to the selected model and `n`. Edits and generations are both billable per image.
- Parallel requests and multiple images multiply usage; there is no in-app usage meter. Track spending in your OpenAI account dashboard.


## Troubleshooting & FAQ

### Common Issues

#### API Key Problems
- If no key is saved, Imaginer shows a banner and opens Config → Basic → **OpenAI API Key**.
- The **Test** button calls `/v1/models` and shows 👍 (valid with image access), 😢 (valid but no image model access), or 👎 (invalid/failed). Error details appear in the modal.
- Keys are stored scrambled in `localStorage`. Clearing browser data removes the key and requires re-entry.

#### Generation Failures
- API errors or empty responses show in the error modal and turn placeholders red. Use the 💬 button on the red tile to reload the prompt.
- Hitting Maximum Parallel Generations disables **Generate** until a running job finishes.
- If models are missing after adding a key, use Config → Advanced → **Refresh Image Models**.

#### Browser Issues
- Imaginer is web-only and keeps everything in the browser. Clearing site data deletes images, masks, prompts, and the API key.
- PNG and JPEG imports are supported; files above 4 MB are rejected. Non-PNG files are converted to PNG before storage.
- The intro sequence and viewer require WebGL. The app is tuned for Firefox but works in other modern browsers.

### Frequently Asked Questions
- **How can I edit an image?** Drag a gallery thumbnail into the prompt panel drop area, add a prompt, and click **Generate**. Enable Config → Advanced → **Show Mask Mode Button** if you need masking.
- **How can I import an external image?** Drag a PNG or JPEG into the gallery. Prompts embedded as iTXt/XMP are detected automatically.
- **How can I save an image?** Hover a thumbnail and click ⬇️. For all images, use Config → **Download All Images**.
- **How can I backup/export my images?** Use Config → **Download All Images** (ZIP). Each filename includes a timestamp and part of the prompt.
- **How can I delete images or clear the gallery?** Use the 🗑️ Delete Mode button for single images, or Config → Advanced → **Delete Gallery** to wipe everything.
- **Where are my images stored?** In your browser’s IndexedDB. Each browser/device keeps its own copy; data does not sync across devices.
- **Can I use Imaginer offline?** No. An internet connection and a valid OpenAI API key are required for generation and model refresh.
- **Why can’t I see the Mask Mode button?** Enable it in Config → Advanced → **Show Mask Mode Button**. Masks are hidden by default.


## Technical Information

### Architecture Overview
- Imaginer runs entirely in the browser. There is no server-side storage.
- Image generation uses OpenAI’s `/v1/images/generations` and `/v1/images/edits` endpoints. Model lists come from `/v1/models`.
- The conversation panel is a local mock; it does not call the Responses API.

### Data Storage
- Images, prompts, masks, creation timestamps, and UUIDs are stored in IndexedDB (`imaginer-db`, `images` object store). Masks save when you close the viewer if you loaded the image from the gallery.
- Settings (prompt text, orientation, quality, background, n, maximum parallel jobs, metadata options, mask button visibility, model selection) live in `localStorage`.
- The API key is XOR-obfuscated and base64-encoded in `localStorage`. Tabula rasa (`window.tabula_rasa`) clears all local data.

### Image Formats
- All stored images are PNG. JPEG imports are converted to PNG on drop.
- Optional prompt embedding uses iTXt (`prompt_text`) and XMP blocks. Mask PNGs store editable areas with transparent alpha.

### OpenAI Integration
- Default model fallback is `gpt-image-1.5`; the dropdown shows cached or refreshed `gpt-image-*` models.
- Generations send `model`, `prompt`, `n`, `size`, and optional `quality`/`background` values. Edits send dropped images, prompt, `n`, `size`, optional `quality`/`background`, and `input_fidelity=high` for `gpt-image-1`.
- Model refresh and API key tests both call `/v1/models` and cache image model IDs in `localStorage`.


## Appendices

### Glossary
- **Mask**: A painted area in the viewer that marks which pixels may change during an edit. Red overlay = editable area.
- **Inpainting**: Editing only the masked regions of an image while preserving the rest.
- **iTXt**: A PNG text chunk that stores UTF-8 metadata alongside the image.
- **XMP**: A metadata format embedded in images; used here to store prompts for compatible tools.
- **Input fidelity**: API hint that preserves input detail when sending edits (used with `gpt-image-1`).

### Keyboard Reference (Main App)
- `Escape`: Close viewer / exit mask mode.
- `D`: Toggle debug overlay in viewer mode.
- `Ctrl` + `D`: Toggle debug overlay while in mask mode.
- `Ctrl` + mouse wheel: Increase or decrease brush size in mask mode.

### Default Values
- Initial prompt text: “A unicorn-dinosaur.”
- Maximum Parallel Generations: 3
- Number of Images (n): 1
- Orientation: Square 1024×1024 (Landscape 1536×1024 and Portrait 1024×1536 available via orientation buttons)
- Background: Automatic
- Image Quality: Automatic
- Strip Server-Side metadata: On
- Embed prompt as iTXt: Off
- Embed prompt as XMP: On
- Show Mask Mode Button: Off

### Version History
- Version info lives in `version.json`. Release notes are stored as HTML files in `version_messages/`.
- On update, Imaginer shows a version message modal and stores the current version in `localStorage` so the message appears once per update.

### The Intro Sequence (Advanced)
- First launch redirects to `intro/00/cinematic_starfield_and_the_great_everywhere_shake.html` after API key entry. WebGL is required; if unavailable, the intro is skipped and you go to the app.
- The intro preload screen lets you test audio, toggle fullscreen, and pick a font. Saved controls: `1`–`5` switch fonts, `+`/`-` (or `=`/`-`) change font scale, Arrow Up/Down adjust audio volume. Settings persist in `localStorage` and carry into the cinematic.
- If the intro is interrupted, the next start asks whether to replay. Completing or skipping it sets `imaginer.intro.first_start` to false so the app opens normally.

