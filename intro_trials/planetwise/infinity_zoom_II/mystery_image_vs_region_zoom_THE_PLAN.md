# Mystery Image Region Zoom Implementation Plan

## Glossary

**Display Region**: The rectangular area within the alien image that represents the alien's screen surface. This region contains transparent pixels, allowing content behind it to show through. The region has its own orientation (tilt) and dimensions independent of the alien image's natural axes.
It is defined by 4 points (p0-p3). The points are given in pixels relative to the alien image coordinates (0,0 is top-left corner).

**Covering Scale**: A scaling behavior where an image is sized to completely fill a target area, using the larger of the width or height scaling ratios. May result in parts of the image extending beyond the target area boundaries.

**Fitting Scale**: A scaling behavior where an image is sized to fit entirely within a target area, using the smaller of the width or height scaling ratios. Ensures no parts of the image are cropped.

**Mystery Image**: The square image content that renders behind the alien image and appears to be displayed on the alien's screen surface through the transparent display region. Represents what is "showing" on the alien's display.

**Alien Image**: The primary image containing the alien figure with a transparent display region through which the mystery image is visible.

**Covering Square**: A conceptual square derived from the display region by taking the longer edge of the region rectangle and using it as both width and height, centered on the region's center point.

**Synchronized Transformation**: The behavior where both images (alien and mystery) undergo identical mathematical transformations simultaneously, maintaining their relative positioning and alignment.

**Orthographic Coordinate Space**: A coordinate system where measurements are in actual pixel units relative to image dimensions, as opposed to normalized viewport-relative coordinates.

## Target Effect Description

### Initial State

At the beginning of region zoom, the scene consists of two perfectly aligned images:

1. **Alien Image Positioning**: The alien image is positioned at its final covering scale state from the previous animation phase, completely filling the viewport with proper rotation and centering.

2. **Mystery Image Initial Setup**: The mystery image must be positioned, scaled, and rotated to appear as authentic screen content within the alien's display region:
   - **Center Alignment**: Mystery image center coincides exactly with the display region's center point
   - **Covering Scale Application**: Mystery image is scaled using covering scale relative to the covering square derived from the display region
   - **Axis Alignment**: Mystery image rotation matches the display region's intrinsic orientation, ensuring the mystery content appears properly aligned with the tilted screen edges
   - **Portal Effect Maintenance**: The mystery image renders behind the alien image, becoming visible through the transparent display region pixels, creating the illusion that the mystery content is genuine screen material displayed on the alien's device

### Animation Behavior

During the region zoom animation sequence:

1. **Synchronized Transformation**: Both alien image and mystery image undergo identical mathematical transformations simultaneously
   - Same translation vectors applied to both images
   - Same scaling factors applied to both images  
   - Same rotation increments applied to both images

2. **Relative Positioning Preservation**: The initial spatial relationship between the two images remains constant throughout the animation
   - Mystery image maintains its position relative to the display region
   - Display region continues to frame the mystery content perfectly
   - Portal effect persists seamlessly during all transformation phases

3. **Dual-Target Convergence**: Both images animate toward the same final target state
   - The display region becomes the focal point for both transformations
   - Both images scale and translate to bring the display region to viewport center
   - Final framing shows the display region filling the viewport with mystery content properly positioned within

### Final State

At animation completion:

1. **Display Region Prominence**: The display region occupies the central viewport area, properly scaled and positioned for optimal viewing

2. **Complete Mystery Content Visibility**: The mystery image now effectively fills the entire viewport through the covering scale relationship. Since the display region has expanded to cover the viewport, only the mystery content is visible - no alien image pixels remain in view, creating a seamless transition to pure mystery content presentation

3. **Seamless Portal Illusion**: The viewer perceives having "zoomed through" the alien's screen into the mystery content itself, with the portal effect achieving complete immersion
