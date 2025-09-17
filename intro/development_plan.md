# Pre-Intro & Asset Loading Development Plan

## Core Philosophy: Crash Hard and Fast

**NO DEFENSIVE CODE. NO ERROR HANDLING. NO CHECKING.**
- If something is missing, we crash immediately with a clear error
- If loading fails, we fail fast and loud
- If audio doesn't decode, the page breaks visibly
- No fallbacks, no graceful degradation, no "safety nets"
- Use objects directly without checking if they exist
- Let the browser's native error reporting handle failures

This approach makes debugging trivial and prevents silent failures that hide real problems.

## Problem Analysis

**Current Issues:**
- Unreliable audio preloading using HTML audio element `readyState` checks
- WebM audio files don't reliably trigger `canplay` events or proper readyState values
- Mixed responsibilities between UI and asset loading
- Duplicated code across `audio.js`, `pre_intro_ui.js`, and `cinematic_bridge.js`
- Multiple initialization paths causing confusion

**Target Architecture:**
1. **Pre-intro Page**: Minimal HTML, immediate load, clean UI-only responsibilities
2. **Reliable Audio Loading**: Web Audio API with `fetch()` + `decodeAudioData()`
3. **Clear Separation**: UI handles UI, loader handles assets, bridge connects them
4. **Single Initialization Flow**: One clear path from loading to ready state

## Technical Solution

### 1. Pre-Intro HTML Structure
```
cinematic_starfield_and_the_great_everywhere_shake.html
├── Inline CSS (minimal, essential styles only)
├── Preloaded font (Orbitron)
├── Small blip.wav audio file (inline, immediate)
├── pre_intro_ui.js (handles UI only)
└── Minimal DOM structure for UI elements
```

**Requirements:**
- Black background displays immediately
- Font loads before UI shows
- Start button shows "Loading..." and disabled initially
- All UI interactions work during loading phase
- No external CSS/JS dependencies in initial load

### 2. Web Audio API Loading Strategy

**Current Broken Approach:**
```javascript
// ❌ Unreliable for WebM files
audio.addEventListener('canplay', callback);
if (audio.readyState >= 4) callback();
```

**New Crash-Hard Approach:**
```javascript
// ✅ Web Audio API loading - crashes immediately on any failure
async function load_audio_with_web_audio_api(url) {
  const response = await fetch(url);
  const array_buffer = await response.arrayBuffer();
  const audio_context = new AudioContext();
  const decoded_buffer = await audio_context.decodeAudioData(array_buffer);
  return { audio_context, decoded_buffer };
}
```

**Benefits:**
- `fetch()` crashes immediately on network failures
- `decodeAudioData()` crashes immediately on invalid audio data
- No browser compatibility checks - use AudioContext directly
- Audio loads completely or fails completely - no partial states

### 3. Asset Loading Phases

**Phase 1: Pre-Intro Assets (Immediate)**
- Orbitron font file (~50KB)
- blip.wav audio file (~5KB) 
- Inline CSS and JS (~10KB total)
- **Target**: < 100KB total, loads in ~200ms

**Phase 2: Background Assets (Progressive)**
1. **CSS Loading**: `01/cinematic_starfield.css`, `02/the_great_everywhere_shake.css`
2. **JavaScript Loading**: Sequential dependency order
   - `01/cinematic_starfield_manager.js`
   - `01/cinematic_starfield.js` 
   - `02/the_great_everywhere_shake.js`
   - `cinematic_bridge.js`
3. **Heavy Audio Loading**: `Also_sprach_Zarathustra.webm` via Web Audio API

**Phase 3: Ready State**
- Enable Start button only when ALL phases complete
- Change button text from "Loading..." to "Start"
- Add visual feedback (green border, hover effects)

### 4. File Architecture Refactoring

**Delete/Consolidate:**
- `audio.js` → merge relevant parts into `cinematic_bridge.js`
- Remove duplicate initialization code
- Simplify audio manager interface

**Keep/Refactor:**
- `pre_intro_ui.js` → UI-only responsibilities
- `asset_loader.js` → add Web Audio API loading
- `cinematic_bridge.js` → final initialization when ready

**New Structure:**
```
intro/
├── cinematic_starfield_and_the_great_everywhere_shake.html (minimal, self-contained)
├── pre_intro_ui.js (UI interactions only)
├── asset_loader.js (Web Audio API + sequential loading)
├── cinematic_bridge.js (initialization when ready)
└── audio/ (asset files)
```

### 5. Loading Progress & User Experience

**Visual Loading States:**
- Start button: "Loading..." (disabled, gray)
- Optional: Progress indicator for background loading
- Ready state: "Start" (enabled, green, hover effects)

**User Interactions During Loading:**
- Volume controls work immediately (using blip.wav)
- Fullscreen toggle functional
- Language switching works
- Skip button available at all times

**Failure Behavior:**
- Network failures: Page crashes with native browser error
- Audio codec issues: Page crashes with decoding error
- Missing assets: Immediate JavaScript errors halt execution

### 6. Implementation Steps

1. **Refactor `asset_loader.js`**
   - Replace HTML audio loading with Web Audio API
   - Remove all error handling - let native errors bubble up
   - Keep sequential CSS/JS loading logic

2. **Simplify `pre_intro_ui.js`**
   - Remove asset loading responsibilities  
   - Use DOM elements directly without checking existence
   - Clean up duplicate audio manager code

3. **Update `cinematic_bridge.js`**
   - Access Web Audio API decoded buffer directly from window
   - Use existing cinematic objects without validation
   - Single initialization entry point with no safety checks

### 7. Technical Specifications

**Web Audio API Integration:**
```javascript
// In asset_loader.js
async load_audio_with_web_audio() {
  const response = await fetch("audio/Also_sprach_Zarathustra.webm");
  const buffer = await response.arrayBuffer();
  const context = new AudioContext();
  const decoded = await context.decodeAudioData(buffer);
  
  // Store directly on window - crashes if context/buffer invalid
  window.decoded_audio_buffer = decoded;
  window.audio_context = context;
}
```

**Cinematic Bridge Audio Setup:**
```javascript
// In cinematic_bridge.js
function start_sequence() {
  // Use decoded buffer directly - crashes if not loaded
  const source = window.audio_context.createBufferSource();
  source.buffer = window.decoded_audio_buffer;
  source.connect(window.audio_context.destination);
  source.start(0);
  
  // Start visual sequence - crashes if objects don't exist
  initialize_starfield();
  window.cinematic_starfield_manager.start_cinematic_sequence();
}
```

**Loading Completion Detection:**
```javascript
// In pre_intro_ui.js
function on_all_assets_loaded() {
  // Access button directly - crashes if element missing
  document.getElementById("start_button").textContent = "Start";
  document.getElementById("start_button").disabled = false;
  document.getElementById("start_button").classList.add("start_button");
}
```

---

## Next Actions

1. Implement Web Audio API loading in `asset_loader.js` with no error handling
2. Refactor `pre_intro_ui.js` to remove asset loading code and defensive checks
3. Update `cinematic_bridge.js` for Web Audio compatibility without validation