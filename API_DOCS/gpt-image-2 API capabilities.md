# gpt-image-2 API capabilities

## Model overview

- Input fidelity is disabled for this model: `input_fidelity` does not work because output is already high fidelity by default.

## Supported parameters

- `model`: `gpt-image-2`
- `outputQuality`: `low`, `medium`, `high`
- `input_fidelity`: disabled / not applicable
- `size`: any resolution that satisfies the model constraints below

## Resolution / size constraints

`gpt-image-2` supports any resolution passed in the `size` parameter as long as all constraints are met:

- No edge may exceed `3840px` (inclusive: `3840` is allowed)
- Both edges must be a multiple of `16`
- Ratio between the long edge and short edge must not be greater than `3:1`
- Total pixels must not exceed `8,294,400`
- Total pixels must not be less than `655,360`

If the output image exceeds `2560x1440` pixels (`3,686,400` total pixels), commonly referred to as 2K, treat it as experimental because results can be more variable above this size.

### Popular `gpt-image-2` sizes

- `1024x1536` — HD portrait
- `1536x1024` — HD landscape
- `1024x1024` — square default
- `2560x1440` — 2K / QHD, recommended upper reliability boundary for `gpt-image-2`
- `3840x2160` — 4K / UHD, the documented maximum size; experimental

## Photorealism

