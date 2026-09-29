# Metadata terms

## Terms

- **Imaginer metadata**: all data that Imaginer puts in the file. Two versions, configurable and completely deactivatable via config.
- **External metadata**: everything else.
- **Import to Gallery**: a file is added to the gallery and it did NOT come from the text-to-image model (external file).
- **Import to `input-image-drop-area`**: an external file is dragged and dropped onto the input area.
- **Gallery → input area**: a file is dragged and dropped from the gallery onto the input area. By definition in-app. No import of anything.

## Proposed changes (not agreed yet)

- **Imaginer metadata**: "two versions" → "two forms (iTXt, XMP)". They coexist in one file. Add "PNG only".
- **Import to Gallery**: define it by the entry point, not by the origin: "An external file is added to the gallery." Edit results are model output too, and a re-imported Imaginer download did come from the model.
- **Input area**: use one name. "Input area" is the term; `input-image-drop-area` is only the DOM reference.
- **Model output** (new): an image returned by generation or edit.
- **Download** (new): a single image via ⬇️.
- **Export** (new): the whole gallery as a ZIP file. The UI labels it "Download All Images".
