# New models integration tasks

Integration of the `gpt-image-2.5-flare` and `gpt-image-2.5-sunburst` models into Imaginer.
Every task is specific enough to be implemented once the open questions are answered.

Focus: UI, user experience, functionality. Cost is not a focus. Documentation mentions cost at most in one short, general sentence.

---

## Progress

Working method:
- Implementation runs in sequential agents on the Sonnet model, one agent per group. The chat model stays in the chat and never implements a whole group itself.
- Each agent prompt names: the brief `Tasks/Agent_conventions_brief.md`, the sections of this file to read, the files to read, the scope, task-specific implementation notes, and the report format from the brief. The only verification instruction for the agent: re-read the changed files once.
- After an agent finishes: read its report, correct the reported deviations directly in the files, update this section, then write "ready" in the chat and wait for the user. No LSP runs, no syntax tracing, no summaries in the chat. The user reviews the diff in git and commits.
- The documentation steps of every task belong to group 3, not to the code groups.
- Manual heading for the models section: "Choosing a Model", anchor `choosing-a-model` (used by T10 and T11).

Group 3 prompt notes:
- Scope: T11, T12, T13 and the documentation steps of T01 (technical manual, localStorage keys), T03 (manual, technical manual), T05 (manual, API_DOCS), T06 (manual, FAQ), T07 (manual), T09 (manual, FAQ).
- The facts are in "API facts this plan relies on". The transparency test result is in T07. The implemented behaviour is in "Task status" below.
- Files to read before writing: `User_Manual/User_Manual_styleguide.md`, `User_Manual/Imaginer_User_Manual.md`, `User_Manual/Imaginer_FAQ.md`, `User_Manual/Imaginer_Technical_Manual.md`, `User_Manual/localStorage_keys_explained.md`, `API_DOCS/gpt-image-2 API capabilities.md`, and for the implemented behaviour `app.js`, `model_fetcher.js`, `components/config_dialog/config_dialog.html`.
- Cost: one general sentence at most, only in the "Choosing a Model" section.

Group 4 prompt notes:
- Scope: T14. Files to read: `version.json`, `cache_manifest.json`, `version_messages/version_1.11.0.html` and `version_messages/version_1.10.0.html` as style examples, and "Task status" below for the content of the card.

| Group | Tasks | Status |
| --- | --- | --- |
| 1 | T02, T03, T04 | done |
| 2 | T01, T05, T06, T08, T09, T10, code steps only | done |
| 3 | T11, T12, T13, plus the documentation steps of T01, T03, T05, T06, T07, T09 | next |
| 4 | T14 | open |

Task status:
- T02 done. Quality options and hint text in the config dialog. `supports_extended_quality` and `clamp_quality_for_model` in `model_fetcher.js`. Clamping in `app.js` before both request paths. Stale header comment removed.
- T03 done. `generate_image_with_streaming` replaced by `consume_image_stream` in `app.js`, used by both endpoints. Streamed edits send one request per image with `n=1`. Streaming settings are read once before the branch.
- T04 done. Non-streaming edit results pass through `process_image_metadata`; the streaming path does so inside `consume_image_stream`.
- Corrections after group 1: unused import removed from `app.js`, outdated parameter comment block removed, clamping log fires only when the value changed.
- T07: test done, transparency works on both models. Documentation step open (group 3).
- T01 code done. `DEFAULT_MODEL` is `gpt-image-2.5-flare`. Documentation step open (group 3).
- T05 code done. Inclusive edge limit in `validate_size`, label in the config dialog, comment in the menu bar. Manual and API_DOCS steps open (group 3).
- T06 code done. Input fidelity label. Manual and FAQ steps open (group 3).
- T08 done. `show_moderation_content` passes `moderation_stage` and `categories` as query parameters; `moderation_error.html` renders the `moderation_details` paragraph.
- T09 code done. The API key test accepts any model ID starting with `gpt-image-`; the model caching filter in the same method uses the same prefix. Manual and FAQ steps open (group 3).
- T10 done. Tooltip on the model select and the `model_help_link` button opening the manual at `choosing-a-model`.
- Corrections after group 2: the model caching filter in the API key test uses the prefix `gpt-image-`. In `error_modal.js` the vague local `details` is gone; `show_moderation_content` reads its `moderation_details` parameter directly and the call site passes an empty object when the API sends no details. In `moderation_error.html` the query value is `categories_comma_separated` and the displayed string is `categories_text`. The line-break rule in the brief is narrowed to code and comments.
- T11, T12, T13, T14: open.

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

**Goal.** `gpt-image-2.5-flare` is the default model when no `imaginer.selected_image_model` value is stored. A stored value is not touched.

**Files.** `model_fetcher.js`, `User_Manual/Imaginer_Technical_Manual.md`, `User_Manual/localStorage_keys_explained.md`.

**Steps.**
1. Change `DEFAULT_MODEL` in `model_fetcher.js` to `gpt-image-2.5-flare`. The existing fallback logic in `get_selected_model` stays.
2. Update the default value in both documentation files.

**Acceptance.** A configuration without a stored model selection and with a valid key selects Flare. A stored selection is unchanged after the update.

### T02 Quality levels

**Goal.** Users can select `xhigh` and `max`. Labels: "Extra high" and "Maximum". The default stays `high`. Models without the two levels receive `high` through request-time clamping; the stored value stays untouched.

**Files.** `components/config_dialog/config_dialog.html`, `app.js`, `model_fetcher.js`.

**Steps.**
1. Add the two options to the quality select.
2. Add `supports_extended_quality(model_id)` to `model_fetcher.js`: true when the model ID starts with `gpt-image-2.5`.
3. Add `clamp_quality_for_model(quality, model_id)` to `model_fetcher.js`: returns `high` when the quality is `xhigh` or `max` and the model does not support extended quality, otherwise the quality unchanged. Same naming pattern as `clamp_size_for_model` in the menu bar.
4. In `app.js`, pass the stored quality through `clamp_quality_for_model` before building the request, for both endpoints. Log a clamped value to the console.
5. Add the hint text under the quality select: "Extra high and Maximum are available for the gpt-image-2.5 models. Other models use High instead."
6. Remove the stale header comment in `app.js` that claims only `gpt-image-1` is supported.

**Acceptance.** Flare and Sunburst receive `xhigh` and `max` unchanged. `gpt-image-2` and the `gpt-image-1` family receive `high` when `xhigh` or `max` is stored. The stored value is unchanged afterwards. The hint is visible in the Generation tab.

### T03 Partial preview for edits

**Goal.** Edits show the same progressive preview as generations. Controlled by the existing settings `imaginer.enable_streaming` and `imaginer.partial_images`.

**Files.** `app.js`, `User_Manual/Imaginer_User_Manual.md`, `User_Manual/Imaginer_Technical_Manual.md`.

**Current state.** `generate_image_with_streaming` in `app.js` is bound to the generations endpoint: JSON body and `image_generation.*` event names. The edit path sends one non-streaming multipart request.

**Steps.**
1. Refactor `generate_image_with_streaming` into a shared server-sent events consumer with these parameters: endpoint URL, fetch options, event name prefix (`image_generation` or `image_edit`), placeholder, prompt text, embed options. Generation behaviour stays identical.
2. Edit path with streaming enabled: append `stream` and `partial_images` to the `FormData` and send one request per requested image with `n=1`, mirroring the generation path. One `FormData` instance can be sent several times.
3. Edit path with streaming disabled: unchanged.
4. The shared consumer handles the in-band `error` event and the "stream closed without completion" case exactly as the generation path does today.
5. Manual: "Image Streaming Preview" applies to edits too. Technical manual: streaming is requested on both endpoints.

**Acceptance.** With streaming enabled, an edit shows partial previews and ends with the final image. With streaming disabled, the behaviour is unchanged. A moderation block during a streamed edit shows the moderation dialog.

### T04 Metadata processing for edit results

**Goal.** Edit results receive the same metadata processing as generation results. This is a bug fix: the edit path currently saves results without stripping server metadata and without embedding the prompt.

**Files.** `app.js`.

**Steps.**
1. Call `process_image_metadata` on every edit result before saving, in the streaming and the non-streaming edit path.
2. Pass the embed options the generation path receives from the generation panel.

**Acceptance.** A downloaded edit result contains the embedded prompt when embedding is enabled and no server-side metadata when stripping is enabled.

### T05 Size limits

**Goal.** The size validation matches the API rule: an edge may be at most 3840 pixels.

**Files.** `components/size_picker/size_picker.js`, `components/config_dialog/config_dialog.html`, `components/menu_bar/menu_bar.js` (comment only), `User_Manual/Imaginer_User_Manual.md`, `API_DOCS/gpt-image-2 API capabilities.md`.

**Steps.**
1. In `validate_size`, reject an edge only when it is greater than `MAX_EDGE`. Change the error message to "at most".
2. Update the constraint comment at the top of `size_picker.js`.
3. Change the configuration label "Advanced size setting (`gpt-image-2` ONLY!)" to name the `gpt-image-2` and `gpt-image-2.5` models.
4. Manual: "less than 3840 px" becomes "at most 3840 px"; the note about other models names the `gpt-image-1` family as the one without free sizes.
5. Correct the edge rule in the `gpt-image-2` capabilities file.

**Acceptance.** `3840x2160` and `2160x3840` pass the custom size validation. `3856x2160` is rejected.

### T06 Input fidelity texts

**Goal.** Labels and documentation state which models use the setting. The request logic stays as it is: the parameter is sent for `gpt-image-1` and `gpt-image-1.5` only.

**Files.** `components/config_dialog/config_dialog.html`, `User_Manual/Imaginer_User_Manual.md`, `User_Manual/Imaginer_FAQ.md`.

**Steps.**
1. Label of the select: "Input fidelity (gpt-image-1 and gpt-image-1.5 only)".
2. Manual paragraph: the setting applies to `gpt-image-1` and `gpt-image-1.5`; `gpt-image-2` and the `gpt-image-2.5` models always keep input details at high fidelity and ignore the setting.
3. FAQ entry on editing: recommend the `gpt-image-2.5` models instead of `gpt-image-1` or `gpt-image-1.5`.

**Acceptance.** No wording in the app or the manual suggests that the setting affects the new models.

### T07 Transparency

**Goal.** Documented behaviour matches tested behaviour. No code change.

**Files.** `User_Manual/Imaginer_User_Manual.md`, `User_Manual/Imaginer_FAQ.md`.

**Test result.** Tested on 2026-09-11 with Flare and Sunburst: transparent backgrounds work on both models.

**Steps.**
1. The manual states that transparent backgrounds are supported by the `gpt-image-2.5` models.
2. No FAQ entry is needed.

**Acceptance.** The manual statement about transparency matches the test result.

### T08 Moderation error details

**Goal.** The moderation dialog shows the moderation stage and the categories when the API provides them.

**Files.** `components/error_modal.js`, `components/moderation_error.html`.

**Steps.**
1. In `Error_modal.show`, read `moderation_details` from the error object.
2. Pass stage and categories to the dialog page through the iframe URL query string. Build the query string before `versioned_url` appends the version parameter.
3. In `moderation_error.html`, read the query string and render one short line below the header, for example "Blocked at input: harassment". Render nothing when the details are missing.

**Acceptance.** A blocked request with details shows the line. A blocked request without details shows the dialog exactly as before.

### T09 API key test

**Goal.** The API key test no longer depends on one specific model that is scheduled for removal from the API.

**Files.** `components/config_dialog/config_dialog.js`, `User_Manual/Imaginer_User_Manual.md`, `User_Manual/Imaginer_FAQ.md`.

**Current state.** The test succeeds only when the model list contains `gpt-image-1`.

**Steps.**
1. The test succeeds when at least one model ID starts with `gpt-image-`.
2. Error message: "API key is valid, but you do not have access to any GPT image model."
3. Update the test result descriptions in the manual (First-Time Setup and Account Settings) and in the FAQ.

**Acceptance.** A key with access to any GPT image model passes the test.

### T10 Model guidance in the UI

**Goal.** A user hovering the model dropdown gets a one-line orientation and a link to the manual section.

**Files.** `components/menu_bar/menu_bar.html`, `components/menu_bar/menu_bar.js`, `components/menu_bar/menu_bar.css`.

**Steps.**
1. Set the `title` attribute of the model select: "Flare: fast everyday model. Sunburst: highest editing precision. See Help for details."
2. Add a small info link next to the select that opens the manual at the models section in a new tab. Build the URL as `versioned_url("User_Manual/Imaginer_User_Manual.html")` followed by the anchor, because `versioned_url` appends the version query parameter and the anchor must come last.
3. The heading of the manual section is "Choosing a Model". `markdown_maker.js` derives the anchor as lower case with every run of non-word characters replaced by a hyphen, so the anchor is `choosing-a-model`.

**Acceptance.** Hovering shows the tooltip. The link opens the manual scrolled to the models section.

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
1. FAQ: new entries "Which model should I pick?", "Why does the model list contain entries with dates?", "Why are Extra high and Maximum not applied with my model?". Update the editing entry (T06) and the API key entries (T09). Add a transparency entry if T07 requires it.
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
- Edit result downloaded: prompt embedded, server metadata stripped.
- Edit with streaming enabled: partial previews appear, the final image replaces them.
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
