# Troubleshooting & FAQ

## Common Issues

### API Key Problems
- Without a key, Imaginer shows a banner and opens the API key input.
- Keys are stored scrambled in `localStorage`. Clearing browser data removes the key and requires re-entry.
- The **Test** button succeeds when your account has access to at least one GPT image model. If the test reports "API key is valid, but you do not have access to any GPT image model.", the key works but your OpenAI account or organization has no image model enabled. Check your account permissions at OpenAI.

### Generation Failures
- API errors show in the error modal and turn placeholders red. Use 💬 to retry.
- If OpenAI's content-safety system blocks a prompt, a dedicated dialog appears (a 🙈 🤷 🔄 header above a playful "oops" creature); the placeholder turns red so you can adjust the prompt and retry. When OpenAI provides details, the dialog names whether the input or the output was blocked and lists the affected categories. Note that moderation can be intermittent — the same prompt may succeed on another attempt.
- Hitting the parallel generation limit disables **Generate** until a job finishes.
- If models are missing, use Config → Account → **Refresh Image Models**. Older models and dated snapshots are listed only with Config → Advanced → **Show older models** enabled.

### Browser Issues
- Imaginer is web-only. Clearing browser data deletes images, masks, prompts, and your API key.
- The gallery and the edit drop area both accept common image formats, up to a certain size and count per drop (see the Technical Manual for exact figures). If a dropped batch has one invalid file, or exceeds the count limit, none of the files are imported.
- WebGL is required for the intro and viewer.

## Frequently Asked Questions
- **How can I edit an image?** Drag a gallery thumbnail into the prompt panel, add a prompt, and click **Generate**. For edits that must keep every detail of the input image, select `gpt-image-2.5-sunburst` in the model dropdown.
- **Why can't I edit with the mini model?** When a `*-mini` model is selected, dropped images are ignored and Imaginer generates a brand-new image from your prompt instead of editing. For image editing, switch to a `gpt-image-2.5` model: `gpt-image-2.5-flare` for fast edits, `gpt-image-2.5-sunburst` for the highest precision.
- **Which model should I pick?** Start with `gpt-image-2.5-flare`. It is the default and handles most generations and edits well. Switch to `gpt-image-2.5-sunburst` when an edit changes things it should keep, or when a result lacks detail. Sunburst takes longer. See the User Manual section **Choosing a Model**.
- **Why does the model dropdown show only two models?** By default the dropdown lists the two recommended models, `gpt-image-2.5-flare` and `gpt-image-2.5-sunburst`. Enable Config → Advanced → **Show older models** to list every image model of your account.
- **Why does the model list contain entries with dates?** With **Show older models** enabled, OpenAI's full list appears. It contains each model twice: as an alias without a date (for example `gpt-image-2.5-flare`) and as a dated snapshot (for example `gpt-image-2.5-flare-2026-09-08`). The alias always points to the newest version of that model. The dated snapshot never changes. Use the alias unless your results must stay reproducible over a long time.
- **Why are Extra high and Maximum not applied with my model?** These two quality levels exist only for the `gpt-image-2.5` models. With any other model, Imaginer sends **High** for the request. Your saved quality setting stays unchanged and takes effect again when you select a `gpt-image-2.5` model.
- **My selected model changed to `gpt-image-2.5-flare`. Why?** Disabling Config → Advanced → **Show older models** while an older model is selected switches the selection to `gpt-image-2.5-flare`. Enable the setting again to select an older model.
- **My selected model disappeared from the list. What happened?** OpenAI retires older models over time. After Config → Account → **Refresh Image Models**, retired models are no longer listed. Pick a model from the dropdown.
- **How can I import an external image?** Drag a supported image file into the gallery — the app tells you if the format, size, or count doesn't qualify.
- **Why won't Chrome on Linux import my images?** This is a known Linux/Chromium drag-and-drop bug — the browser reports the file as valid but can't actually read its bytes. Try Firefox instead.
- **How can I save an image?** Hover a thumbnail and click ⬇️, or use Config → Files → **Download All Images**.
- **How can I backup my images?** Use Config → Files → **Download All Images** for a ZIP file.
- **How can I delete images?** Use 🗑️ Delete Mode for single images, or Config → Files → **Delete Gallery** to clear everything.
- **Where are my images stored?** In your browser's storage. Each browser/device keeps its own copy.
- **Can I use Imaginer offline?** No. An internet connection and OpenAI API key are required.
- **Why can't I see the Mask Mode button?** Enable Config → Generation → **Show Mask Mode Button**.
- **Is there a keyboard shortcut to generate?** Yes — press **Ctrl+Enter** (or **Cmd+Enter**) while the prompt box is focused.
- **How do I move between images without closing the Viewer?** Use the **◀** and **▶** buttons at the sides of the Viewer, or the **left/right arrow keys**, to step through the gallery. They dim at the first and last image.
- **Why are new features not visible after an update?** Use Config → Files → **Refresh Cache**. Imaginer refreshes its app files and reloads, without deleting your images or settings.
