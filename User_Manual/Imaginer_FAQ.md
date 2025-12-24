# Troubleshooting & FAQ

## Common Issues

### API Key Problems
- Without a key, Imaginer shows a banner and opens the API key input.
- Keys are stored scrambled in `localStorage`. Clearing browser data removes the key and requires re-entry.

### Generation Failures
- API errors show in the error modal and turn placeholders red. Use 💬 to retry.
- Hitting the parallel generation limit disables **Generate** until a job finishes.
- If models are missing, use Config → Advanced → **Refresh Image Models**.

### Browser Issues
- Imaginer is web-only. Clearing browser data deletes images, masks, prompts, and your API key.
- PNG and JPEG imports are supported. Files above 4 MB are rejected.
- WebGL is required for the intro and viewer.

## Frequently Asked Questions
- **How can I edit an image?** Drag a gallery thumbnail into the prompt panel, add a prompt, and click **Generate**.
- **How can I import an external image?** Drag a PNG or JPEG into the gallery.
- **How can I save an image?** Hover a thumbnail and click ⬇️, or use Config → **Download All Images**.
- **How can I backup my images?** Use Config → **Download All Images** for a ZIP file.
- **How can I delete images?** Use 🗑️ Delete Mode for single images, or Config → Advanced → **Delete Gallery** to clear everything.
- **Where are my images stored?** In your browser's storage. Each browser/device keeps its own copy.
- **Can I use Imaginer offline?** No. An internet connection and OpenAI API key are required.
- **Why can't I see the Mask Mode button?** Enable Config → Advanced → **Show Mask Mode Button**.
