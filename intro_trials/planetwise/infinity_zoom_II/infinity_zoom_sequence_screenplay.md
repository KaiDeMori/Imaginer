# Infinity Zoom Sequence Screenplay

## Layer Nomenclature

- **1st Layer (index 0)**: Planet - must always show **fitting** behavior (touches viewport from inside)
- **2nd Layer (index 1)**: First zoom level - Example: 25% the size of 1st Layer (aka: "the width and height of this layer are 25% of the previous layer")
- **3rd Layer (index 2)**: Second zoom level
- **...continuing with 25% reduction each time...**
- **Final Layer (index 9)**: Alien closeup - must show **covering** behavior (fills entire viewport)

## Images
- The images are all square.
- Each consecutive layer "fits" into the previous one as specified in the layer zoom.
- The images must **ALWAYS** apear in their natural (1:1) aspect ration.

## Animation Sequence

### State: "intro"
- 1st Layer (planet) starts tiny (1px) and exponentially grows to **fitting** size
- All other layers invisible (alpha = 0)
- Planet reaches perfect fitting behavior (touching viewport from inside)

### State: "intro_visible_layers_fade_in" 
- 1st Layer (planet) stays at **fitting** size
- **Dynamic layer visibility**: Check which layers are large enough to be visible (above minimum_render_size)
- Only those "big enough" layers fade in (could be 2nd + 3rd, or 2nd + 3rd + 4th, etc. - depends on their calculated sizes)
- Each visible layer fades from alpha=0 to alpha=1
- **Purpose**: Hide the initial "pop-in" appearance of newly visible layers - they fade in smoothly instead

### State: "hold"
- All currently visible layers hold their sizes and relationships
- Planet continues to show fitting behavior
- Only rotation continues

### State: "main_zoom"
- **All layers scale together in perfect synchronization** - exponential growth with identical rates
- **Relative size relationships preserved** - each layer maintains its relative size to the previous layer
- **Dynamic visibility continues**: As layers grow, more may become "big enough" and appear
- **Synchronized exponential growth**: All layers scale up together until Final Layer reaches covering size
  - **1st Layer (index 0)**: Starts at fitting scale, grows beyond fitting.
  - **Final Layer (index 9)**: Starts small, grows until it reaches perfect covering scale (stop condition)
  - **Middle layers**: Grow proportionally between these extremes
- **Stop condition**: When Final Layer reaches perfect covering scale

### State: "final_rotation" 
- All layers stop scaling, only rotation continues
- Final Layer shows covering behavior
- **Exit condition**: When `FLAG_initiate_final_reveal` is set externally

### State: "region_zoom"
- Transition to final "region zoom"
- ignored for now.

## Key Requirements

- **TRS-based transforms** for all layers with direct component interpolation
- **1st Layer (index 0)**: Detect when fitting (touches viewport from inside)
- **Final Layer (index 9)**: Detect when covering (fills entire viewport)
- All layers maintain synchronized growth through TRS interpolation
- Smooth transitions between all states with continuous TRS parameters
- Viewport-independent behavior with dynamic TRS recalculation on resize
- Dynamic layer visibility based on minimum_render_size throughout
- **Seamless region zoom integration** via direct TRS state passing (ignore for now)

## Implementation Solution

**TRS Architecture:**
- **Transform Representation**: Each layer uses `{center_x, center_y, scale, rotation}` (TRS)
- **Animation logic**: Direct interpolation of TRS components:
  - Center: `lerp(start_center, end_center, t)`
  - Scale: `lerp(start_scale, end_scale, t)` 
  - Rotation: `lerp_angle(start_rotation, end_rotation, t)`
- **Render pipeline**: Build final matrix from TRS only at WebGL draw time
- **Covering detection**: Simple scale comparison against calculated thresholds
- **Viewport independence**: Recalculate TRS parameters on resize events
- **Region zoom transition**: Pass final TRS state directly - no conversion needed!

**Result:** Clean architectural solution with seamless phase transitions! 🌍➡️👽
