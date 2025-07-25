# Mystery Image Region Zoom Implementation Roadmap

## Overview

Implementing the mystery image portal effect requires three phases: getting the initial position right (static), getting the final position right (static), then connecting them with animation. The mystery image needs to render between penultimate and alien layers to create the portal effect through the alien's transparent display region.

## Current Architecture Analysis

**Engine Structure:**
- `alien_display_screen` object contains mystery image and texture
- Region zoom uses orthographic projection system with image pixel coordinates
- Render order: penultimate → final (alien) 
- Transformation system uses `current_params` for alien positioning

**Key Files:**
- `region_zoom.js` - handles alien image positioning and rendering
- `mystery_image_region_zoom.js` - empty, needs mystery implementation
- `infinity_zoom_II_engine.js` - contains mystery image as `alien_display_screen`

## Phase 1: Static Initial Position (Immediate Focus)

**Goal:** Mystery image appears correctly positioned within display region at animation start, no movement yet.

### Mystery Image Access
- Access mystery image from `engine.alien_display_screen.image` and `engine.alien_display_screen.texture`
- Create mystery quad buffer using mystery image dimensions
- Store mystery references in `mystery_image_region_zoom.js`

### Initial Position Calculation  
- Calculate display region center from region rectangle points
- Calculate covering square dimensions from region rectangle
- Calculate mystery image scale using covering scale relative to covering square
- Calculate mystery image rotation to match display region orientation
- Mystery center = region center

### Mystery Rendering Integration
- Add mystery layer rendering in `render_region_zoom_frame()` between penultimate and alien
- Use same orthographic rendering system as existing layers
- Static transformation parameters (no animation yet)



## Phase 2: Static Final Position (Next Steps)

**Goal:** Mystery image appears correctly at animation end position.

### Final Position Logic
- At animation end, display region fills viewport
- Mystery image should fill entire viewport through covering scale relationship
- Calculate final transformation parameters for mystery image

## Phase 3: Animation Implementation (Future)

**Goal:** Smooth animation between initial and final positions.

### Synchronized Transformation
- Mystery image uses same scale/rotation values as alien image during animation
- Mystery center stays locked to region center throughout animation
- Both images animate toward same target state
- Maintain relative positioning throughout

## Implementation Notes

### Coding Standards
- Use **loose_snake_case** for all variable, method, and file names
- Use proper English words, avoid abbreviations except standard ones (DB, SQL, JSON)
- No defensive code - crash hard and fast, no checking if something exists
- NO logging without explicit user consent!
- No comments! (except when really needed)
- IF comments are needed:
  - Keep comments timeless and general - explain "why" and "how", not "what"
  - No redundant comments - let code be self-explanatory where possible
- DO NOT start servers or try to test anything. Only the user can do that.

### Coordinate Systems
- Mystery image uses image pixel coordinates (same as alien)
- Display region defined in alien image pixel coordinates
- Orthographic projection converts to WebGL clip space

### Critical Requirements
- Mystery image renders BETWEEN penultimate and alien (render order)
- Mystery transformation parameters calculated separately from alien
- Mystery center always aligns with display region center
- Same scale/rotation values as alien for synchronized movement