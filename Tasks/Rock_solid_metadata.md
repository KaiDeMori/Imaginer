# Rock-solid metadata

## Goal

Every path through Imaginer treats metadata according to agreed rules, and code, config, and documentation match those rules.

## Plan

The terms and the rules are in [misc/metadata_terms.md](../misc/metadata_terms.md), the reference for metadata in Imaginer.
How the code applies them is in the [Technical Manual](../User_Manual/Imaginer_Technical_Manual.md), section "Image Formats".

Core idea: every gallery file is a PNG. Intake converts JPEG and WebP once, and a PNG keeps its pixels, so Export and the edit request only remove or add PNG chunks.

## Steps

- [x] Unique export filenames: `<prompt>_<created>_<id>.<ext>`, so the ZIP export never drops an image.
- [x] One PNG chunk module: `PNG_chunks.js` and `XML_entities.js` for strip, pixels only, the two prompt forms, and reading the prompt.
- [x] One Export function: `image_export.js` for Download and ZIP export.
- [x] Browser tests for the conversion: `tools/browser_tests/conversion_tests.html`, with the results in [misc/metadata_research.md](../misc/metadata_research.md).
- [x] Intake: `image_intake.js` and `image_conversion.js`, one intake for both doors and the conversion of JPEG and WebP.
- [x] Existing gallery files: the one-time migration in `gallery_migration.js`, offered with a warning beforehand.
- [x] Edit request: images and mask as pixels only, with neutral filenames.
- [x] Cleanup: `components/image_converter.js` and `components/generation_panel.options.js` deleted; the intro image stays outside intake.
- [x] Orientation in Chromium: the conversion applies the frame's `rotation` and `flip`.
