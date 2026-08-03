# Troubleshooting & FAQ

## Common Issues

### API Key Problems
- Without a key, Imaginer shows a banner and opens the API key input.
- Keys are stored scrambled in `localStorage`. Clearing browser data removes the key and requires re-entry.

### Generation Failures
- API errors show in the error modal and turn placeholders red. Use 💬 to retry.
- If OpenAI's content-safety system blocks a prompt, a dedicated dialog appears (a 🙈 🤷 🔄 header above a playful "oops" creature); the placeholder turns red so you can adjust the prompt and retry. Note that moderation can be intermittent — the same prompt may succeed on another attempt.
- Hitting the parallel generation limit disables **Generate** until a job finishes.
- If models are missing, use Config → Account → **Refresh Image Models**.

### Browser Issues
- Imaginer is web-only. Clearing browser data deletes images, masks, prompts, and your API key.
- The gallery and the edit drop area both accept common image formats, up to a certain size and count per drop (see the Technical Manual for exact figures). If a dropped batch has one invalid file, or exceeds the count limit, none of the files are imported.
- WebGL is required for the intro and viewer.

## Frequently Asked Questions
- **How can I edit an image?** Drag a gallery thumbnail into the prompt panel, add a prompt, and click **Generate**.
- **Why can't I edit with the mini model?** When a `*-mini` model is selected, dropped images are ignored and Imaginer generates a brand-new image from your prompt instead of editing. For image editing, switch to `gpt-image-1` or `gpt-image-1.5` (these also support the **Input fidelity** setting).
- **How can I import an external image?** Drag a supported image file into the gallery — the app tells you if the format, size, or count doesn't qualify.
- **How can I save an image?** Hover a thumbnail and click ⬇️, or use Config → Files → **Download All Images**.
- **How can I backup my images?** Use Config → Files → **Download All Images** for a ZIP file.
- **How can I delete images?** Use 🗑️ Delete Mode for single images, or Config → Files → **Delete Gallery** to clear everything.
- **Where are my images stored?** In your browser's storage. Each browser/device keeps its own copy.
- **Can I use Imaginer offline?** No. An internet connection and OpenAI API key are required.
- **Why can't I see the Mask Mode button?** Enable Config → Generation → **Show Mask Mode Button**.
- **Is there a keyboard shortcut to generate?** Yes — press **Ctrl+Enter** (or **Cmd+Enter**) while the prompt box is focused.
- **How do I move between images without closing the Viewer?** Use the **◀** and **▶** buttons at the sides of the Viewer, or the **left/right arrow keys**, to step through the gallery. They dim at the first and last image.
- **Why are new features not visible after an update?** Use Config → Files → **Refresh Cache**. Imaginer refreshes its app files and reloads, without deleting your images or settings.
