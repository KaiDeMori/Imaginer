# Portal Effect Synchronization Plan

## Overview
Fix the mystery image rotation synchronization issue during global rotation. The mystery image should remain perfectly aligned with the transparent screen region of the alien layer throughout all rotation states.

## Problem Statement
Currently, the mystery image experiences orbital motion around the viewport center during global rotation, causing it to drift out of alignment with the region. This occurs because both the alien layer and mystery image rotate around the viewport center, but they need different transformation behaviors to maintain alignment.

## Solution Architecture
Implement a two-phase transformation system that separates tilt alignment from positional alignment, ensuring the mystery image rotates around the viewport center (matching the alien layer) while maintaining perfect region alignment.

## Transformation Pipeline

### No Global Rotation (rotation_speed = 0)
1. **Tilt Align**: Rotate mystery image by `-region_rotation` to align with region's intrinsic orientation
2. **Center Align**: Translate mystery to region center using aspect-ratio-corrected coordinates

### With Global Rotation (rotation_speed > 0)
1. **Tilt Align**: Rotate mystery image by `-region_rotation` to align with region's intrinsic orientation  
2. **Global Rotate**: Apply additional `+global_rotation` to match alien layer's global rotation
3. **Translate**: Position using the original unrotated region offset vector, then apply global rotation to that vector

## Final Transformation Formulas
- **Position**: `alien_center + rotate_vector(base_region_offset * scale, global_rotation)`
- **Rotation**: `global_rotation - region_rotation`

## File Modifications Required

### `infinity_zoom_II_utils.js`
**Purpose**: Mathematical utilities for coordinate transformations and rendering  
**Changes**: Simplify `calculate_mystery_position_with_region_rotation()` to implement the corrected transformation pipeline

### `infinity_zoom_II_engine.js`  
**Purpose**: Main rendering engine with portal effect logic  
**Changes**: None required - already uses the utils function correctly

## Key Technical Details

### Aspect Ratio Handling
The aspect ratio corrections are already properly implemented in `calculate_base_region_offsets_from_layer()`:
- Converts from image pixels to normalized coordinates (-1 to +1)
- Applies viewport aspect correction factors matching the TRS system
- All subsequent operations work in aspect-ratio-corrected coordinate space

### Coordinate System Flow
1. Region rectangle (image pixels) → `calculate_base_region_offsets_from_layer()`
2. Normalized coordinates with aspect correction → perspective scaling (* layer.scale)
3. Scaled coordinates → vector rotation by global_rotation
4. Final viewport coordinates → WebGL rendering

### Mathematical Foundation
- Uses standard 2D rotation matrices via `rotate_vector(x, y, angle)`
- Maintains viewport-center rotation for both alien and mystery layers
- Region offset vector rotates with global rotation to maintain relative positioning

## Implementation Standards
- **No defensive code**: Assume valid inputs and proper initialization
- **No console logging**: Keep code clean without debug output
- **Loose snake_case naming**: Follow project naming conventions
- **Timeless comments**: Explain "why" and "how", not "what"

## Testing Strategy
1. Test with `rotation_speed = 0` to verify tilt alignment and positioning
2. Test with `rotation_speed > 0` to verify synchronization during global rotation
3. Verify alignment maintains mathematical precision throughout full 360° rotation

## Expected Outcome
Perfect portal effect synchronization with mystery image remaining precisely aligned with the transparent screen region during all rotation states, eliminating orbital motion artifacts.
