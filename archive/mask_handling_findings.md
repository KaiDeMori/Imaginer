# Mask Handling and OpenAI Image Edit API: Findings Summary

## Key Points


**OpenAI API Mask Requirement:**
  - The `mask` PNG must have alpha=0 (fully transparent) in areas to be edited, and alpha>0 (opaque) in areas to be protected.
  - RGB values do not matter for the API, but using white for protected and black for editable is conventional for clarity.
  - The mask must be the same dimensions as the image and under 4MB.

**Previous Implementation:**
  - The app generated mask PNGs with alpha=100 for masked (protected) pixels and 0 for editable, with red RGB (255,0,0).
  - This worked technically, but was nonstandard and potentially confusing.

**Current Implementation:**
  - Now, mask PNGs are exported with alpha=255 (fully opaque) and white (255,255,255) for protected, and alpha=0 (fully transparent) and black (0,0,0) for editable.
  - This matches the OpenAI API's requirements and is visually clear.

**Debugging and Testing:**
  - If edits appear outside the masked area, check:
    - The mask's alpha channel (should be 0 where edits are allowed).
    - The mask's orientation and dimensions (must match the image exactly).
    - That the correct mask is being sent with the request.
  - Paint.NET and similar tools set alpha=0 and RGB=0 for erased (transparent) areas, which works as expected with the API.

**Best Practice:**
  - Always use alpha=0 for editable (transparent) and alpha=255 for protected (opaque) in the mask PNG.
  - Use white/black for clarity, but only alpha matters for the API.

---

## 2025 Update: gpt-image-1 Mask Limitation

- As of June 2025, the OpenAI community and staff have confirmed that the `gpt-image-1` model does **not** strictly respect the provided mask. Edits may ignore the mask and affect the entire image, even if the mask is formatted correctly.
- This is a known limitation of the model, not a bug in your code or mask format. See:
  - https://community.openai.com/t/gpt-image-1-problems-with-mask-edits/1240639/46
  - https://community.openai.com/t/gpt-image-1-problems-with-mask-edits/1240639/37
- The only current workaround for strict mask-based edits is to use DALL-E 2, which does respect the mask, but with lower image quality.
- OpenAI has stated that documentation will be updated to clarify this, and that precise inpainting is planned for the future, but no timeline is given.

**Summary:**
Your mask handling and export are correct. The current issue is a limitation of the `gpt-image-1` model itself. For strict mask-based edits, use DALL-E 2 until OpenAI updates `gpt-image-1` with proper inpainting support.
