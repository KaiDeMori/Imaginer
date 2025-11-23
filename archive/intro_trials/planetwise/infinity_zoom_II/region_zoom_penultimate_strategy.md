# Keeping the Penultimate Image Visible During Region Zoom

## Overview

When transitioning from the main zoom to the region zoom in the Infinity Zoom II engine, feathered borders on the last image can reveal the background (usually black) if the penultimate image is removed. To avoid this, we can keep the penultimate image visible underneath the last image during the region zoom phase.

## What This Means

- **Both the last and penultimate images must be rendered during the region zoom.**
- The penultimate image acts as a "backdrop" to fill in the transparent (feathered) borders of the last image, preventing the background from showing through.
- This approach preserves the visual continuity and avoids cropping more of the last image than necessary.
- **Note:** Even if there is no feathering, rotation of the last image alone can cause the background to appear at the corners. Keeping the penultimate image visible also solves this issue.

## Key Considerations

### 1. Transformation Matching
- The penultimate image must be transformed (zoomed, rotated, translated) **identically** to the last image during the region zoom.
- Any mismatch in scale, rotation, or position will cause visible seams, ghosting, or misalignment in the feathered border region.
- The transformation logic (matrix math) used for the last image must be applied to the penultimate image as well.

### 2. Rendering Order
- The penultimate image should be rendered **first**, followed by the last image on top.
- The last image's feathered (semi-transparent) border will blend with the penultimate image, creating a seamless transition.

## Implementation Steps
1. **During region zoom, render both the last and penultimate images using the same transformation matrix.**
2. **Draw the penultimate image first, then the last image on top.**
3. **Test with various feather sizes and rotations to confirm no background is visible.**

## Summary

By keeping the penultimate image visible and perfectly aligned under the last image during the region zoom, you can prevent feathered borders or rotation from revealing the background. The key is to apply identical transformations and render in the correct order.
