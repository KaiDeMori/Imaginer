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

- A modern web browser (it's called Firefox 😉)
- An OpenAI API key (you'll need to obtain this from OpenAI)
- Internet connection for image generation

Once set up, you can start creating images immediately. The interface is designed to be straightforward: write a prompt, click generate, and watch your ideas come to life.

---

### 2. First-Time Setup

When you launch Imaginer for the first time, you'll be prompted to enter your OpenAI API key. This setup ensures Imaginer can communicate with OpenAI's servers to generate images.

**You'll need an OpenAI API key** to use Imaginer. Keys start with `sk-` (legacy format) or `sk-proj-` (modern format). Both formats work.

#### Entering Your API Key

On first launch, Imaginer displays an API key entry screen:

1. **Paste your API key** into the input field
   - As you type, Imaginer validates the key format
   - Modern keys (`sk-proj-...`) should be at least 108 characters
   - Legacy keys (`sk-...`) should be exactly 51 characters

2. **Click the Test button** to verify your key
   - Imaginer connects to OpenAI to check if the key is valid
   - It also confirms you have access to the `gpt-image-1` model (required for image generation)
   - Test results appear below the input field:
     - ✅ **"API key valid and ready!"** - You're all set
     - ❌ **"Invalid API key"** - Check the key and try again
     - ❌ **"Valid key but no gpt-image-1 access"** - Your account doesn't have access to the image model
     - ❌ **"Connection failed"** - Check your internet connection

3. **Click OK** once the test succeeds
   - Your API key is saved securely in your browser's local storage
   - Imaginer encrypts the key before storing it

#### What Happens Next

After entering your API key successfully:

- **First launch only**: An epic cinematic intro sequence plays (requires WebGL support)
  - The intro features a space-themed animation with a dramatic soundtrack
  - See Appendix E for detailed information about the intro sequence

- **You're taken to the main app**, where you can immediately start generating images

#### Security Note

Your API key is stored locally in your browser using localStorage. It never leaves your device except when making API calls to OpenAI. The key is scrambled before storage for basic protection, but remember:

- Anyone with access to your browser can potentially retrieve the key
- Clear browser data will delete your stored API key
- You can change or remove your API key anytime via the Configuration dialog (gear icon in the menu bar)
