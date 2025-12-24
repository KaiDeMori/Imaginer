# Imaginer User Manual

---

## I. Getting Started

### 1. What is Imaginer?

Imaginer is a browser-based AI image generation tool that lets you create images using text prompts. It connects directly to OpenAI's image generation API, putting powerful AI creativity at your fingertips.

**Key capabilities:**

- **Generate images from text**: Describe what you want, and Imaginer creates it
- **Edit existing images**: Import images and modify specific areas using masks and prompts
- **Manage your creations**: Built-in gallery to view, organize, and download your generated images
- **No installation required**: Runs entirely in your browser, no software to install

Imaginer stores everything locally in your browser. Your images, settings, and API key stay on your device. The app only communicates with OpenAI's servers when generating images.

**What you'll need:**

- A modern web browser (made for Firefox 🤗)
- An OpenAI API key
- Internet connection for image generation

Once set up, you can start creating images immediately. The interface is designed to be straightforward: write a prompt, click generate, and watch your ideas come to life.

---

### 2. First-Time Setup

When you launch Imaginer for the first time, you'll be prompted to enter your OpenAI API key. This connects Imaginer to OpenAI's image generation service.

**You'll need an OpenAI API key** to use Imaginer. Keys start with `sk-` (legacy format) or `sk-proj-` (modern format). Both formats work.

#### Entering Your API Key

On first launch, Imaginer displays an API key entry screen:

1. **Paste your API key** into the input field
   - As you type, Imaginer validates the key format
   - Modern keys (`sk-proj-...`) should be at least 108 characters
   - Legacy keys (`sk-...`) should be exactly 51 characters

2. **Click the Test button** to verify your key
   - Imaginer checks if the key works and confirms you have access to image generation
   - Test results appear below the input field:
     - ✅ **"API key valid and ready!"** - You're all set
     - ❌ **"Invalid API key"** - Check the key and try again
     - ❌ **"Valid key but no gpt-image-1 access"** - Your API key doesn't have permission to generate images
     - ❌ **"Connection failed"** - Check your internet connection

3. **Click OK** once the test succeeds
   - Your API key is saved in your browser

#### What Happens Next

After entering your API key successfully:

- **First launch only**: An epic cinematic intro sequence plays (requires WebGL support)
  - The intro features a space-themed animation with a dramatic soundtrack
  - See Appendix E for detailed information about the intro sequence

- **You're taken to the main app**, where you can immediately start generating images

#### Security Note

Your API key is stored in your browser and stays on your device. It's only sent to OpenAI when generating images. Important things to know:

- Anyone who can access your browser can potentially access the key
- Clearing your browser data will delete your stored API key
- You can change or remove your API key anytime using the **Configuration** dialog (gear icon in the menu bar)

---

### 3. Understanding the Interface

Imaginer's interface is divided into three main areas:

#### The Menu Bar (Top)

The menu bar spans the top of the screen and contains all your controls and settings:

**Left side:**
- **Orientation buttons**: Three icon buttons to select image orientation
  - 🖼️ Landscape (1536×1024 pixels)
  - 🖼️ Portrait (1024×1536 pixels)  
  - 🖼️ Square (1024×1024 pixels, default)
  
- **Model dropdown**: Select which AI model to use for generation
  - Shows available image generation models from your OpenAI account
  - Auto-populates when you add an API key
  - Use **Refresh Models** in Config → Advanced to update the list


**Right side:**
- 🗑️ **Delete Mode button**: Toggle deletion mode to remove images from gallery (starts dimmed)
- ⚙️ **Config button**: Open configuration dialog for settings and API key management
- 🛈 **About button**: View app information and version

The menu bar also manages your image orientation selection, which persists between sessions.

#### The Gallery (Left)

The gallery displays all your generated and imported images as a grid of thumbnails:

- **Thumbnail grid**: Images shown in chronological order (oldest first)
- **Click any thumbnail** to open it in the full-screen Viewer
- **Drag images** from the gallery to the Prompt Panel to use them as reference images for editing
- **Import images**: Drag-and-drop images from your computer directly into the gallery
  - Non-PNG images are automatically converted to PNG format
- **Empty state**: When the gallery is empty, you'll see "Drop image(s) for import"

The gallery stores all images in your browser using IndexedDB. Images persist between sessions unless you clear browser data or manually delete them.

#### The Prompt Panel (Right)

The prompt panel is where you describe what you want to generate or edit:

- **Large text area**: Write your prompt describing the image you want
  - Your prompt is automatically saved as you type
  - Supports multi-line text for detailed descriptions
  
- **Drop area (bottom)**: Shows input images for editing mode
  - Displays thumbnails of images you've dragged from the gallery
  - Images with masks show a red border indicator
  - Click any thumbnail to remove it from the input
  - When empty, shows "Drop image(s) for edit reference"

#### The Resizable Divider

Between the Gallery and Prompt Panel is a thin vertical divider:

- **Drag the divider** left or right to resize the gallery and prompt areas
- Find your preferred layout balance
- Your preferred width is saved automatically and restored next time you use Imaginer

The interface is designed to be flexible—adjust the layout to match your workflow and screen size.
