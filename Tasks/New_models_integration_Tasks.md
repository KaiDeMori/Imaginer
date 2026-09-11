# New models integration tasks

Integration of the `gpt-image-2.5-flare` and `gpt-image-2.5-sunburst` models into Imaginer.

Focus: UI, user experience, functionality. Cost is not a focus. Documentation mentions cost at most in one short, general sentence.

---

## Progress

Working method:
- Implementation runs in sequential agents on the Sonnet model, one agent per group. The chat model stays in the chat and never implements a whole group itself.
- Each agent prompt names: the brief `Tasks/Agent_conventions_brief.md`, the sections of this file to read, the files to read, the scope, task-specific implementation notes, and the report format from the brief. The only verification instruction for the agent: re-read the changed files once.
- After an agent finishes: read its report, correct the reported deviations directly in the files, update this section, then write "ready" in the chat and wait for the user. No LSP runs, no syntax tracing, no summaries in the chat. The user reviews the diff in git and commits.
- Manual heading for the models section: "Choosing a Model", anchor `choosing-a-model` (used by T10 and T11).

| Group | Tasks | Status |
| --- | --- | --- |
| 1 | T02, T03, T04 | done |
| 2 | T01, T05, T06, T08, T09, T10, code steps | done |
| 3 | T11, T12, T13, plus the remaining documentation steps of T01, T03, T05, T06, T07, T09 | done (implemented in the chat, no agent) |
| 4 | T14 | next |

Group 3 prompt notes:
- Scope: T11, T12, T13 and the remaining steps listed under T01, T03, T05, T06, T07, T09.
- The facts are in "API facts this plan relies on". The implemented behaviour is stated in the status line of each done task.
- Files to read before writing: `User_Manual/User_Manual_styleguide.md`, `User_Manual/Imaginer_User_Manual.md`, `User_Manual/Imaginer_FAQ.md`, `User_Manual/Imaginer_Technical_Manual.md`, `User_Manual/localStorage_keys_explained.md`, `API_DOCS/gpt-image-2 API capabilities.md`, and for the implemented behaviour `app.js`, `model_fetcher.js`, `components/config_dialog/config_dialog.html`.
- Cost: one general sentence at most, only in the "Choosing a Model" section.

Group 4 prompt notes:
- Scope: T14. Files to read: `version.json`, `cache_manifest.json`, `version_messages/version_1.11.0.html` and `version_messages/version_1.10.0.html` as style examples, and the status lines of the done tasks for the content of the card.

---

## API facts this plan relies on

Verified against the OpenAI OpenAPI specification, the image generation guide, the model pages and the deprecations page (state of 2026-09-11).

- **Model IDs.** `gpt-image-2.5-flare` and `gpt-image-2.5-sunburst` are aliases. `gpt-image-2.5-flare-2026-09-08` and `gpt-image-2.5-sunburst-2026-09-08` are the dated snapshots. The same mechanic applies to `gpt-image-2` and `gpt-image-2-2026-04-21`.
- **Endpoints.** Both new models support `/v1/images/generations` and `/v1/images/edits`, including masks.
- **Positioning.** Flare: small model, optimized for speed, default choice for most applications. Sunburst: base model, optimized for quality, for edits where precision matters most, longer generation time.
- **Quality.** All GPT image models accept `low`, `medium`, `high`, `auto`. The two 2.5 models additionally accept `xhigh` and `max`. The specification restricts `xhigh` and `max` to the 2.5 models. The rendering budget behind a label shifted: `high` on a 2.5 model renders faster and with a smaller detail budget than `high` on `gpt-image-2`; `max` on a 2.5 model corresponds to `high` on `gpt-image-2`.
- **Size.** `gpt-image-2` and both 2.5 models accept any `WIDTHxHEIGHT` where both edges are multiples of 16, the aspect ratio is between 1:3 and 3:1, the total pixel count is between 655,360 and 8,294,400, and no edge exceeds 3840 pixels. The edge limit is inclusive; `3840x2160` is the documented maximum. Sizes above `2560x1440` are experimental. The `gpt-image-1` family accepts `1024x1024`, `1536x1024`, `1024x1536` and `auto` only.
- **Input fidelity.** `input_fidelity` exists for `gpt-image-1` and `gpt-image-1.5`. `gpt-image-2` and the 2.5 models always process image inputs at high fidelity; the parameter must be omitted for them.
- **Transparency.** `background` accepts `transparent`, `opaque`, `auto`. Officially supported for the 2.5 models. For `gpt-image-2` the support is labeled "preview". Requires `png` or `webp` output. Imaginer always uses `png`.
- **Masks.** Unchanged. PNG, smaller than 4 MB, same dimensions as the first input image, fully transparent pixels mark the editable area, applied to the first image only.
- **Streaming.** `stream` and `partial_images` (0 to 3) exist on both endpoints. Edits emit `image_edit.partial_image` and `image_edit.completed`. Generations emit `image_generation.partial_image` and `image_generation.completed`. Both endpoints can emit an in-band `error` event.
- **Moderation errors.** `moderation_blocked` errors may carry `moderation_details` with `moderation_stage` (`input`, `output`, `unknown`) and a `categories` list of coarse labels.
- **Deprecation schedule.** `gpt-image-1`: removal from the API on 2026-10-23. `gpt-image-1.5`, `gpt-image-1-mini`, `chatgpt-image-latest`: removal on 2026-12-01.

---

## Constraints

- The app never hides anything automatically: no hidden models, no hidden dated snapshots, no hidden options.
- The app never removes models by date. The existing model list refresh after an update handles models that disappear from the API.
- The app never changes stored configuration values on behalf of the user. A stored `imaginer.selected_image_model` value stays as it is; the version card announces the new default and asks the user to switch.
- Quality values that the selected model does not support are clamped at request time. The stored `imaginer.quality` value stays as it is.
- Mask handling stays untouched. The current implementation is the tested one.
- No cost estimates anywhere in the UI.

---

## Tasks

### T01 Default model

**Status.** Done. `DEFAULT_MODEL` in `model_fetcher.js` is `gpt-image-2.5-flare`. A stored selection is not touched. Technical manual and localStorage document name the new default.

### T02 Quality levels

**Status.** Done. The quality select offers "Extra high" (`xhigh`) and "Maximum" (`max`) with a hint text under it. Models without the two levels receive `high` through request-time clamping in `clamp_quality_for_model`; the stored value stays as it is. The default stays `high`.

### T03 Partial preview for edits

**Status.** Done. Edits stream partial previews through `consume_image_stream` in `app.js`, one request per image, controlled by the existing streaming settings. Manual and technical manual describe streaming for both endpoints.

### T04 Metadata processing for edit results

**Status.** Done. Edit results pass through `process_image_metadata` like generation results.

### T05 Size limits

**Status.** Done. `validate_size` accepts an edge of 3840 pixels. The advanced size setting label names the `gpt-image-2` and `gpt-image-2.5` models. Manual and `API_DOCS/gpt-image-2 API capabilities.md` state the inclusive edge limit.

### T06 Input fidelity texts

**Status.** Done. The select label reads "Input fidelity (gpt-image-1 and gpt-image-1.5 only)". The parameter is sent for `gpt-image-1` and `gpt-image-1.5` only. Manual and FAQ updated.

### T07 Transparency

**Status.** Done. Tested on 2026-09-11 with Flare and Sunburst: transparent backgrounds work on both models. No code change. The manual names the `gpt-image-2.5` models under "Background".

### T08 Moderation error details

**Status.** Done. The moderation dialog shows the moderation stage and the categories when the API provides them.

### T09 API key test

**Status.** Done. The test succeeds when at least one model ID starts with `gpt-image-`, in the config dialog and in the first-run API key screen (`intro/00/pre_intro_ui.js`). Failure message in both places: "API key is valid, but you do not have access to any GPT image model." Manual and FAQ describe the new test results.

### T10 Model guidance in the UI

**Status.** Done. Tooltip on the model select and the `model_help_link` button opening the manual at `choosing-a-model`.

### T11 User manual

**Goal.** A dedicated section explains the models, and every setting description touched by the new models is updated.

**Files.** `User_Manual/Imaginer_User_Manual.md`.

**Steps.**
1. Replace the current "Choosing a Model" section with a full section. Keep the heading "Choosing a Model" unchanged, because T10 links to its anchor. Content, in this order:
   - The two current models: Flare as the everyday default, Sunburst for edits that must preserve every detail and for demanding results, with longer generation time.
   - Which to use when: start with Flare; switch to Sunburst when an edit changes things it should keep or when the result lacks detail; older models remain available.
   - Alias versus dated snapshot: an alias such as `gpt-image-2.5-flare` always points to the newest dated version; a dated ID such as `gpt-image-2.5-flare-2026-09-08` never changes. Use the alias unless results must stay reproducible over a long time. The list shows both because the API returns both.
   - Older models: OpenAI retires older models over time; retired models disappear from the list after a model refresh. No dates in the manual; dates belong in the version card.
   - Quality levels per model: Extra high and Maximum exist for the 2.5 models; the same label can mean a different amount of detail on different models.
   - Cost: one general sentence at most, for example "Higher quality levels and larger sizes take longer and use more of your API budget."
2. "Image Quality": the two new options, the models that support them, and the clamping to High for other models.
3. "Orientation and Size" and "Advanced size setting": both `gpt-image-2` and the `gpt-image-2.5` models support free sizes; edge limit "at most 3840 px".
4. "Input Fidelity": per T06.
5. "Background": per T07.
6. "Image Streaming Preview": per T03.
7. API key test descriptions: per T09.
8. Follow `User_Manual/User_Manual_styleguide.md`: navigation path format, bold UI labels, full stops, no section numbers.

**Acceptance.** Every statement in the section is backed by the API facts above or by the manual test results.

### T12 FAQ, technical manual, localStorage keys

**Files.** `User_Manual/Imaginer_FAQ.md`, `User_Manual/Imaginer_Technical_Manual.md`, `User_Manual/localStorage_keys_explained.md`.

**Steps.**
1. FAQ: new entries "Which model should I pick?", "Why does the model list contain entries with dates?", "Why are Extra high and Maximum not applied with my model?". Update the editing entry (T06) and the API key entries (T09).
2. Technical manual, OpenAI Integration: default model, quality values per model and the request-time clamping, streaming on both endpoints, metadata processing for edit results (T04), moderation details (T08).
3. localStorage keys: range of `imaginer.quality` (add `xhigh`, `max`), default of `imaginer.selected_image_model`.

### T13 API documentation files

**Files.** `API_DOCS/gpt-image-2 API capabilities.md`, new file `API_DOCS/gpt-image-2.5 API capabilities.md`.

**Steps.**
1. Correct the edge rule in the `gpt-image-2` file.
2. Create the `gpt-image-2.5` file from the API facts at the top of this document.

### T14 Release

**Files.** `version.json`, `version_messages/version_1.12.0.html`, `cache_manifest.json`.

**Steps.**
1. Add version `1.12` to `version.json` with the new message file.
2. Write the version card in the established style: title line, one intro paragraph, feature list with emoji icons, subtle note. Content: the two new models and how to pick them, Flare as the new default with the request to switch to it in the model dropdown, Extra high and Maximum quality, partial previews for edits, metadata processing for edit results, moderation details, the corrected 4K size limit, and the removal dates of the older models.
3. Add the new version message file to `cache_manifest.json`.

**Acceptance.** The update flow shows the card once, refreshes the cache and the model list, and reloads.

---

## Manual test checklist before the release

- Model dropdown lists both 2.5 aliases and their dated snapshots after a model refresh.
- Generation with Flare and Sunburst at quality Extra high and Maximum.
- Generation with `gpt-image-2` while Maximum is stored: the request succeeds with High and the stored value is unchanged.
- Edit with streaming enabled: partial previews appear, the final image replaces them.
- Edit result downloaded: prompt embedded, server metadata stripped.
- Edit with a mask on Flare and on Sunburst.
- Transparent background with Flare and Sunburst, generation and edit; inspect the alpha channel of the saved file.
- Custom size `3840x2160` accepted; `3856x2160` rejected.
- API key test with a valid key.
- Moderation block shows the details line when the API provides details.
- Version update flow: card, cache refresh, model refresh, reload.

---

## Sources

- https://developers.openai.com/api/docs/guides/image-generation
- https://developers.openai.com/api/docs/guides/image-prompting
- https://developers.openai.com/api/docs/models/gpt-image-2.5-flare
- https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst
- https://developers.openai.com/api/docs/deprecations
- https://developers.openai.com/api/docs/changelog
- https://github.com/openai/openai-openapi (openapi.yaml on the master branch, the tie-breaker for parameter rules)
- https://openai.com/index/introducing-chatgpt-images-2-5/
