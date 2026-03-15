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

**You'll need an OpenAI API key** to use Imaginer. Keys usually look like `sk-...` (older format) or `sk-proj-...` (newer project keys). Both formats work.

#### Entering Your API Key

On first launch, Imaginer displays an API key entry screen:

1. **Paste your API key** into the input field.
   - Imaginer checks that the key looks valid (correct prefix and length) on pasting.

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
   - With streaming preview enabled, you'll see your image forming in real-time.
   - Generation typically takes about a minute, depending on the selected model and settings.

4. **View your completed image**:
   - When generation finishes, the preview is replaced with your final full-quality image.
   - Click the thumbnail to view it full-screen in the Viewer.

**If generation fails**, the placeholder turns red. Click the 💬 button on the error placeholder to reload the prompt into the text area and try again.

#### Multiple Images

Generate several variations of your prompt at once:

 **How to enable**: Adjust Config → Basic → **Number of Images (n)**.
 **What it does**: When you click Generate, Imaginer creates that many images.
 **Display**: All images appear as separate thumbnails in the Gallery as they complete.


### The Gallery

The gallery displays your images as thumbnails (newest at the top). **Click any thumbnail** to view it full-screen in the Viewer.

#### Importing Images

**Drag and drop image files** from your computer into the gallery area to import them.  
Images with embedded prompts are automatically detected. Images over 4 MB are rejected.

#### Deleting Images

1. Click the 🗑️ button in the menu bar to enable delete mode (the button turns red).
2. Click thumbnails to select them for deletion — selected images get a red highlight and border. Click again to deselect.
3. Click 🗑️ again to confirm. A dialog shows how many images will be deleted. Confirm to proceed or cancel to clear the selection and exit delete mode.
4. A loading overlay is shown while deletion is in progress. All other interactions are blocked until it completes.

**⚠️ Warning**: Deletion is permanent and removes the images from the gallery and local storage.

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

**Drag thumbnails from the gallery or image files from your computer** to the drop area at the bottom of the Prompt Panel to edit them. Write a prompt describing your changes and click **Generate**. The edited image appears in the gallery.

The drop area highlights in blue when you drag over it. **Click thumbnails in the drop area** to remove them.

**For precise edits**, create a mask in the Viewer (see **The Viewer → Mask Mode**), then drag that masked image to the drop area. Only masked areas will be modified.

**When using multiple images**: If you drop several images with masks, only the first image's mask is used. The first thumbnail shows a red border when its mask is active. Other masked images show a regular border.




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

All images use the same prompt but produce different variations.


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

#### Input Fidelity

**Input fidelity** controls how much effort the model exerts to preserve style and features (especially facial features) from input images during edits. Only applies to `gpt-image-1` and `gpt-image-1.5`. Not supported by `gpt-image-1-mini`.

**Options**:
- **Low** (default): Standard editing with moderate input preservation.
- **High**: Enhanced preservation of details like faces and logos from input images.

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

#### Image Streaming Preview

Config → Advanced → **Enable Image Streaming Preview** toggles progressive image previews during generation (default: on).

When enabled, you see dimmed preview images as generation progresses instead of waiting for the final result. The **Number of partial images** setting (0-3, default: 3) controls how many preview updates you receive.

Higher preview counts provide more frequent updates but use slightly more API resources. The timer continues running throughout all previews.


### Data Management

#### Delete Mode
Menu Bar → **Delete Mode** toggles whether clicks on gallery thumbnails delete images instead of opening them. See The Gallery → **Deleting Images** for how it looks and behaves.

#### Download All Images

Config → **Download All Images** bundles every stored image (generated and imported) into a ZIP. Filenames use the first 20 characters of the prompt plus the image timestamp; the ZIP is named `Imaginer_Export_<timestamp>.zip`. A progress dialog shows status. If no images are present, you see an error instead of a download.

#### Clear Gallery

Config → Advanced → **Delete Gallery** wipes all stored images. The first click only highlights **Download All Images** as a warning. The second click asks you to type `YES`. Confirming clears the gallery database and reloads the app. This cannot be undone — export first if needed.


## Advanced Features

### PNG Metadata

#### Reading metadata from imported images
- Imaginer reads prompts from PNG metadata when you drop an image into the gallery.
- If found, the 💬 button appears to load the prompt.
- JPEG imports are converted to PNG and lose original metadata.

### Debug Features
- Toggle debug overlay with `D` (viewer) or `Ctrl` + `D` (mask mode).
- The overlay draws a red outline of the rendered image and shows live stats: bitmap size, fit scale, zoom factor, and pan offsets.
