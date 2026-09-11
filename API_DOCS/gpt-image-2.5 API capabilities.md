# gpt-image-2.5 API capabilities

## Model overview

Two models share the `gpt-image-2.5` prefix.

- `gpt-image-2.5-flare`: small model, optimized for speed. Default choice for most applications.
- `gpt-image-2.5-sunburst`: base model, optimized for quality. For edits where precision matters most. Longer generation time.

## Model IDs

- `gpt-image-2.5-flare` and `gpt-image-2.5-sunburst` are aliases. An alias always points to the newest dated snapshot.
- `gpt-image-2.5-flare-2026-09-08` and `gpt-image-2.5-sunburst-2026-09-08` are the dated snapshots. A dated snapshot never changes.
- `/v1/models` returns the aliases and the dated snapshots.

## Endpoints

- `/v1/images/generations`
- `/v1/images/edits`, including masks

## Supported parameters

- `model`: `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst`, or a dated snapshot ID
- `quality`: `low`, `medium`, `high`, `xhigh`, `max`, `auto`
- `size`: any resolution that satisfies the constraints below
- `background`: `transparent`, `opaque`, `auto`
- `stream`: `true` or `false`
- `partial_images`: `0` to `3`
- `input_fidelity`: not applicable. Image inputs are always processed at high fidelity. The parameter must be omitted.

## Quality

- `xhigh` and `max` are restricted to the `gpt-image-2.5` models.
- The rendering budget behind a label differs from `gpt-image-2`: `high` on a `gpt-image-2.5` model renders faster and with a smaller detail budget than `high` on `gpt-image-2`. `max` on a `gpt-image-2.5` model corresponds to `high` on `gpt-image-2`.

## Resolution / size constraints

- Both edges must be a multiple of `16`
- Ratio between the long edge and short edge must be between `1:3` and `3:1`
- Total pixels must be between `655,360` and `8,294,400`
- No edge may exceed `3840px` (inclusive: `3840` is allowed)

`3840x2160` is the documented maximum size. Sizes above `2560x1440` are experimental.

## Transparency

- `background: transparent` is officially supported for both models.
- Requires `png` or `webp` output.

## Masks

- PNG, smaller than 4 MB, same dimensions as the first input image.
- Fully transparent pixels mark the editable area.
- The mask applies to the first input image only.

## Streaming

- Generations emit `image_generation.partial_image` and `image_generation.completed`.
- Edits emit `image_edit.partial_image` and `image_edit.completed`.
- Both endpoints can emit an in-band `error` event.

## Moderation errors

`moderation_blocked` errors may carry `moderation_details` with:

- `moderation_stage`: `input`, `output`, `unknown`
- `categories`: list of coarse labels
