# Infinity Zoom II Logic Verification Checklist

## Philosophy
- No error handling, no defensive code, no "checking if X exists"
- We want to fail hard and fast
- Focus on logic correctness, not robustness

## Critical Goals & Code Verification Points

### Goal 1: Images shown in natural 1:1 aspect ratio (square) at all times

**Code locations to verify:**
- `TRS_to_matrix()` in utils - matrix scale calculations
- `create_texture()` in utils - texture parameter setup
- Fragment shader - texture sampling

**What must be correct:**
- `TRS_to_matrix()`: norm_scale_x and norm_scale_y must maintain square aspect ratio
- Scale calculation uses Math.min(viewport_width, viewport_height) for both X and Y
- Texture wrapping set to CLAMP_TO_EDGE (no stretching)
- No distortion in matrix transformation

**Failure points:**
- Using viewport_width for X and viewport_height for Y (creates rectangle)
- Wrong texture filtering causing aspect ratio issues

### Goal 2: First layer fitting behavior (touches viewport from inside)

**Code locations to verify:**
- `calc_fitting_scale()` in utils
- `TRS_to_matrix()` scale conversion
- `update_intro_state()` transition condition

**What must be correct:**
- `calc_fitting_scale()` returns exactly 1.0 always
- TRS scale=1.0 makes image touch shorter viewport dimension
- Intro state stops when first layer reaches scale=1.0
- Matrix math: scale * Math.min(w,h) gives fitting size

**Failure points:**
- calc_fitting_scale using image size instead of returning 1.0
- Wrong scale comparison for transition condition

### Goal 3: Final layer covering behavior (fills entire viewport)

**Code locations to verify:**
- `calc_covering_scale()` in utils
- `update_main_zoom_state()` stop condition
- Scale clamping logic to prevent overshoot

**What must be correct:**
- `calc_covering_scale()` returns Math.max(w,h)/Math.min(w,h)
- Stop condition uses exact covering scale, not >=
- Clamp calculation prevents exponential overshoot
- Final layer reaches exactly covering scale, no bigger

**Failure points:**
- Using >= instead of exact calculation allows overshoot
- Wrong aspect ratio calculation in calc_covering_scale
- Exponential growth continues past target

### Goal 4: Relative layer scaling (each layer size relative to previous)

**Code locations to verify:**
- `calc_layer_relative_scale()` in utils
- `update_all_layer_TRS()` in utils
- Layer zoom property usage

**What must be correct:**
- `calc_layer_relative_scale()` multiplies all zoom percentages from layer 1 to target
- Each layer.zoom is percentage (25 = 25% of previous layer)
- `update_all_layer_TRS()` applies base_scale * relative_scale to each layer
- Relationships preserved during all scaling operations

**Failure points:**
- Zoom values treated as absolute instead of relative percentages
- Cumulative scaling calculation errors
- Base scale applied incorrectly

### Goal 5: Synchronized exponential growth during main_zoom

**Code locations to verify:**
- `update_main_zoom_state()` growth calculation
- `apply_exponential_growth()` in utils
- All layer TRS updates

**What must be correct:**
- Same exponential_growth_factor applied to all layers
- Math.exp(zoom_speed * elapsed_time) calculation
- All layers scale simultaneously with same rate
- Relative relationships maintained throughout

**Failure points:**
- Different growth rates applied to different layers
- Time calculation errors causing jumpiness
- Base scale vs relative scale confusion

### Goal 6: Dynamic visibility with proper fade behavior

**Code locations to verify:**
- `update_layer_visibility()` state checking
- `update_layer_alphas()` fade calculation
- `is_layer_visible()` threshold logic

**What must be correct:**
- Fade only during "intro_visible_layers_fade_in" state
- Immediate appearance during "main_zoom" state
- `fade_start_time` only set during intro fade state
- Visibility threshold using minimum_render_size correctly

**Failure points:**
- Fading in wrong states
- Visibility threshold using wrong scale calculation
- Alpha calculation errors during fade

### Goal 7: Viewport-relative scale system consistency

**Code locations to verify:**
- All scale calculations throughout codebase
- `TRS_to_matrix()` viewport conversion
- Scale meaning: 1.0 = fitting behavior

**What must be correct:**
- Scale=1.0 always means fitting (touches viewport from inside)
- All scale calculations viewport-independent
- Matrix conversion uses viewport dimensions correctly
- No mixing of pixel-based and scale-based calculations

**Failure points:**
- Scale meanings inconsistent between functions
- Pixel calculations mixed with viewport-relative scales
- Viewport dependencies in wrong places

### Goal 8: State machine transitions at exact conditions

**Code locations to verify:**
- Each state's transition condition
- Timing calculations for durations
- Scale threshold comparisons

**What must be correct:**
- intro→intro_fade: first layer reaches scale=1.0 exactly
- intro_fade→hold: fade duration completed
- hold→main_zoom: hold duration completed  
- main_zoom→final_rotation: final layer reaches covering scale exactly

**Failure points:**
- Off-by-one errors in scale comparisons
- Timing drift in duration calculations
- Wrong layer used for transition conditions

## Verification Method

For each goal:
1. Locate the specified code sections
2. Verify the logic matches "What must be correct"
3. Check for any "Failure points" present
4. Test the specific behavior in isolation if needed
