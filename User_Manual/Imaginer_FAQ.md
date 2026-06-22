# Troubleshooting & FAQ

## Common Issues

### API Key Problems
- Without a key, Imaginer shows a banner and opens the API key input.
- Keys are stored scrambled in `localStorage`. Clearing browser data removes the key and requires re-entry.

### Generation Failures
- API errors show in the error modal and turn placeholders red. Use 💬 to retry.
- If OpenAI's content-safety system blocks a prompt, a dedicated dialog appears showing a cute shrugging alien; the placeholder turns red so you can adjust the prompt and retry. Note that moderation can be intermittent — the same prompt may succeed on another attempt.
- Hitting the parallel generation limit disables **Generate** until a job finishes.
- If models are missing, use Config → Account → **Refresh Image Models**.

### Browser Issues
- Imaginer is web-only. Clearing browser data deletes images, masks, prompts, and your API key.
- PNG and JPEG imports are supported. Files above 4 MB are rejected.
- WebGL is required for the intro and viewer.

## Frequently Asked Questions
- **How can I edit an image?** Drag a gallery thumbnail into the prompt panel, add a prompt, and click **Generate**.
- **Why doesn't the mini model work well for editing?** The mini model accepts input images but does not support the `input_fidelity` parameter and produces poor editing results. Use `gpt-image-1` or `gpt-image-1.5` for image editing.
- **How can I import an external image?** Drag a PNG or JPEG into the gallery.
- **How can I save an image?** Hover a thumbnail and click ⬇️, or use Config → Files → **Download All Images**.
- **How can I backup my images?** Use Config → Files → **Download All Images** for a ZIP file.
- **How can I delete images?** Use 🗑️ Delete Mode for single images, or Config → Files → **Delete Gallery** to clear everything.
- **Where are my images stored?** In your browser's storage. Each browser/device keeps its own copy.
- **Can I use Imaginer offline?** No. An internet connection and OpenAI API key are required.
- **Why can't I see the Mask Mode button?** Enable Config → Generation → **Show Mask Mode Button**.
- **Why are new features not visible after an update?** Use Config → Files → **Refresh Cache**. Imaginer refreshes its app files and reloads, without deleting your images or settings.
