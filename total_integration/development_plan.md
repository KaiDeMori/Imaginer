# Phase Transition Development Plan

## Objective
Seamlessly transition from phase 1 (cinematic starfield + great everywhere shake) to phase 2 (early universe formation) while maintaining music continuity and allowing separate testing of each phase.

## Architecture Analysis

### Phase 1 - Entry Point: `cinematic_starfield_and_the_great_everywhere_shake.html`
**Dependencies (actual files used):**
- `pre_intro_ui.js` → `asset_loader.js` → loads:
  - `01/cinematic_starfield.css` 
  - `02/the_great_everywhere_shake.css`
  - `01/cinematic_starfield_manager.js`
  - `01/cinematic_starfield.js`
  - `02/the_great_everywhere_shake.js` 
  - `cinematic_bridge.js`
  - `audio/Also_sprach_Zarathustra.ogg`

**Critical transition point:** 
- `the_great_everywhere_shake.js` line 198: `whiteout_complete = true`
- Sets canvas to solid white and triggers 2s text cleanup timeout
- THIS is where we need to inject phase 2 transition

### Phase 2 - Entry Point: `early_universe_formation_V2.html`
**Dependencies (actual files used):**
- `early_universe_formation_V2.css` (inline in HTML)
- `early_universe_formation_V2.js` (ES module) → imports:
  - `preloader_module.js` (loads 37 PNG assets)
  - `deterministic_rng.js` 
  - `canvas_animation.js`
  - `seed_ui_panel.js`

**Required DOM elements:**
- `#whiteScreen` (div overlay, fades out after 1s minimum)
- `#cinematic_canvas` (main render target)

## Implementation Strategy: Dynamic DOM Replacement

### Step 1: Modify Phase 1 Whiteout Completion
**File:** `intro/02/the_great_everywhere_shake.js`
**Location:** Line 198, right after `whiteout_complete = true`

Add transition trigger:
```javascript
whiteout_complete = true;
// Existing canvas white fill code...
ctx.fillRect(0, 0, explosion_canvas.width, explosion_canvas.height);
ctx.restore();

// NEW: Trigger phase 2 transition after 2s (matching text cleanup delay)
setTimeout(() => {
  window.transition_to_phase_2();
}, 2000);
```

### Step 2: Create Phase Transition Module
**New file:** `intro/phase_transition.js`

Responsibilities:
- Preserve audio element and its current state
- Fetch phase 2 HTML template (without `<html>`, `<head>`, `<audio>`)
- Replace body content while keeping audio
- Dynamically load phase 2 CSS and JS modules
- Adapt phase 2 initialization to skip audio setup

### Step 3: Canvas Element Reuse Strategy
**Key Insight:** Reuse phase 1's `#cinematic_canvas` as phase 2's render target

**Advantages:**
- GPU context preservation (no WebGL reinitialization)
- Seamless visual transition (white canvas → universe animation)  
- Simpler DOM management (no element creation/destruction)
- Memory efficiency (avoid canvas allocation spikes)

**Implementation:**
- Keep existing `#cinematic_canvas` in place
- Phase 2 now uses `#cinematic_canvas` (no changes needed during transition)

**New file:** `intro/phase_2_content.html`
Contains only additional DOM elements needed:
```html
<div id="whiteScreen"></div>
<!-- Canvas reused from phase 1, no new canvas element needed -->
```

### Step 4: Adapt Phase 2 Initialization
**Modify:** `intro_trials/early_universe_formation_V2/early_universe_formation_V2.js`

- Make initialization function-callable rather than auto-executing
- Skip the 1s minimum white hold (phase 1 already provides white screen)
- Canvas is already white-filled from phase 1 whiteout - perfect starting state

### Step 5: Asset Path Resolution
**Challenge:** Phase 2 assets are in `../../assets/ai_universe/` relative to `intro_trials/`
**Solution:** Update `preloader_module.js` to resolve paths relative to phase 1 context

## File Modifications Required

1. **`intro/02/the_great_everywhere_shake.js`** - Add transition trigger
2. **`intro/phase_transition.js`** - New transition orchestrator  
3. **`intro/phase_2_content.html`** - New minimal template (just `#whiteScreen` div)
4. **`intro_trials/early_universe_formation_V2/early_universe_formation_V2.js`** - Adapt for dynamic loading
5. **`intro_trials/early_universe_formation_V2/preloader_module.js`** - Fix asset paths

**Canvas ID Strategy:** Both phases use `#cinematic_canvas`

## Testing Strategy
- Phase 1 remains fully testable via `cinematic_starfield_and_the_great_everywhere_shake.html`
- Phase 2 remains fully testable via `early_universe_formation_V2.html`  
- Combined flow testable through phase 1 (automatically transitions)
- Transition can be triggered manually via DevTools: `window.transition_to_phase_2()`

## Key Benefits
- Music never stops or restarts
- White-to-white transition is seamless
- Both phases remain independently testable
- Minimal code changes to existing working systems
- Clean separation of concerns


# Core Philosophy

## Crash Hard and Fast

**NO DEFENSIVE CODE. NO ERROR HANDLING. NO CHECKING.**
- If something is missing, we crash immediately with a clear error
- If loading fails, we fail fast and loud
- If audio doesn't decode, the page breaks visibly
- No fallbacks, no graceful degradation, no "safety nets"
- Use objects directly without checking if they exist
- Let the browser's native error reporting handle failures

This approach makes debugging trivial and prevents silent failures that hide real problems.


## No additional logging

- We do NOT log, until we know exactly **what** we want to log and **why**.
- Any logging that is necessary must be on-point without any clutter.
- We leave already existing logging alone. If you want to modify or delete existing logging, aks first.