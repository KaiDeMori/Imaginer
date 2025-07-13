# Infinity Zoom Sequence Screenplay

## Layer Nomenclature

- **1st Layer (index 0)**: Planet - must always show **fitting** behavior (touches viewport from inside)
- **2nd Layer (index 1)**: First zoom level - 25% smaller than 1st Layer
- **3rd Layer (index 2)**: Second zoom level - 25% smaller than 2nd Layer  
- **...continuing with 25% reduction each time...**
- **Final Layer (index 9)**: Alien closeup - must show **covering** behavior (fills entire viewport)

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
- All layers exponentially grow while maintaining relative size relationships
- **Dynamic visibility continues**: As layers grow, more may become "big enough" and appear
- **1st Layer (planet)**: Always maintains fitting behavior throughout
- **Final Layer (alien)**: Grows toward covering behavior  
- **Stop condition**: When Final Layer reaches perfect covering size

### State: "final_rotation" 
- All layers stop scaling, only rotation continues
- 1st Layer (planet) shows fitting behavior
- Final Layer (alien) shows covering behavior

### State: "region_zoom"
- Transition to final closeup animation

## Key Requirements

- Single covering matrix used throughout (no matrix switching)
- Planet always fits, never covers
- Final alien always covers at the end
- Smooth transitions between all states
- Viewport-independent behavior
- Dynamic layer visibility based on minimum_render_size throughout

## Implementation Challenge

The challenge is implementing this design intent with a single matrix type while achieving the planet-fits/alien-covers behavior! 🌍➡️👽
