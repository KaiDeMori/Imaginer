# Imaginer Intro Asset Loading Refactoring Plan

## ⚠️ NO DEFENSIVE CODE
We crash hard and fast. No checking if things exist. No error handling. No fallbacks. If it breaks, it breaks.

## Simple Two-Phase Loading Strategy

**Current problem**: All assets load in HTML `<head>` before pre-intro can function.
**Simple solution**: Remove heavy assets from `<head>`, load them dynamically with JavaScript.

## What We Do

### Step 1: Clean Up HTML Head
**File**: `intro/cinematic_starfield_and_the_great_everywhere_shake.html`
- Remove all `<script>` and `<link>` tags for heavy assets from `<head>`
- Keep only: font preload, blip audio, pre-intro JS
- Inline critical pre-intro CSS
- Remove `preload="auto"` from cinematic audio

### Step 2: Split audio.js 
**Split current `audio.js` into two files:**
- `pre_intro_ui.js` - Only UI functions (setup_audio_interface, volume, fullscreen, etc.)
- `cinematic_bridge.js` - Only cinematic functions (start_sequence, initialize_cinematic)

### Step 3: Create Dynamic Loader
**File**: `asset_loader.js`
- Load heavy assets with JavaScript after pre-intro works
- Load in order: CSS → JS (in dependency order) → audio
- Update start button: "Loading..." → "Start" when done

### Step 4: Wire It Together
- `pre_intro_ui.js` loads the page, sets up UI, starts asset loader
- Asset loader calls back when done
- Start button becomes enabled  
- User clicks Start → calls dynamically loaded cinematic functions

## Assets That Load When

**Phase 1 (in HTML head):**
- Orbitron font (38KB)
- blip.wav (9.6KB)
- pre_intro_ui.js

**Phase 2 (dynamic loading):**
- cinematic_starfield.css (1.9KB)
- the_great_everywhere_shake.css (1.8KB)  
- cinematic_starfield_manager.js (12.9KB)
- cinematic_starfield.js (3.6KB)
- the_great_everywhere_shake.js (16.3KB)
- cinematic_bridge.js
- Also_sprach_Zarathustra.webm (1.9MB)

## Deep Technical Solutions for Each Problem

### 1. **Volume Control Decoupling**
**Problem**: Pre-intro needs to control volume for both audio elements, but cinematic audio isn't loaded yet

**Solution**: Use global volume storage
```javascript
// Global volume state (accessible to both phases)
let global_audio_volume = 1.0;

// In pre_intro_ui.js
function adjust_volume(delta) {
  global_audio_volume = Math.max(0, Math.min(1, global_audio_volume + delta));
  blip_audio.volume = global_audio_volume;
  play_blip();
}

// In cinematic_bridge.js  
function initialize_cinematic() {
  cinematic_audio = document.getElementById("cinematic_audio");
  cinematic_audio.volume = global_audio_volume; // Apply stored volume
}
```

### 2. **Sequential Asset Loading Strategy**
**Problem**: Scripts must load in exact dependency order or everything breaks

**Solution**: Bulletproof sequential async loading
```javascript
async function load_cinematic_assets() {
  // CSS first (immediate DOM effect)
  await load_css('01/cinematic_starfield.css');
  await load_css('02/the_great_everywhere_shake.css');
  
  // JS in strict dependency order
  await load_script('01/cinematic_starfield_manager.js');  // Creates class
  await load_script('01/cinematic_starfield.js');          // Uses class
  await load_script('02/the_great_everywhere_shake.js');   // Uses manager
  await load_script('cinematic_bridge.js');               // Calls others
  
  // Audio last (heaviest)
  await load_audio_content();
  
  // Only NOW is start_sequence() safe to call
  enable_start_button();
}
```

### 3. **Font Loading Before UI Display**
**Problem**: UI appears before Orbitron font loads, causing FOUT

**Solution**: Explicit font loading detection
```javascript
async function initialize_pre_intro() {
  // Wait for font BEFORE showing any UI
  await document.fonts.load('16px Orbitron');
  
  // Now font is guaranteed available
  show_ui_elements();
  start_asset_loading();
}
```

### 4. **Audio Preloading Control**  
**Problem**: `preload="auto"` defeats controlled loading

**Solution**: Change HTML + programmatic loading
```html
<!-- In HTML: Change to preload="none" -->
<audio id="cinematic_audio" preload="none">
  <source src="audio/Also_sprach_Zarathustra.webm" type="audio/webm" />
</audio>
```

```javascript
// In asset loader: Control exactly when audio loads
async function load_audio_content() {
  const audio = document.getElementById("cinematic_audio");
  audio.preload = "auto";
  await new Promise((resolve) => {
    audio.addEventListener('canplaythrough', resolve, { once: true });
    audio.load(); // Start loading
  });
}
```

### 5. **start_sequence() Dependency Guarantee**
**Problem**: start_sequence() assumes all code is loaded when called

**Solution**: Asset loader guarantees + no defensive code
- By design, start button only enables AFTER all assets loaded
- start_sequence() can safely assume everything exists
- If something's missing, we crash fast (per our ⚠️ rule)

### 6. **CSS Timing (Actually Not a Problem)**
**Analysis**: CSS loads before JS, JS triggers animations after loading
- Sequential loading ensures CSS available before JS runs
- Not actually risky with proper loading order

## Files to Create
- `pre_intro_ui.js` (from audio.js)
- `cinematic_bridge.js` (from audio.js)  
- `asset_loader.js` (dynamic loading)

## Files to Modify
- `cinematic_starfield_and_the_great_everywhere_shake.html` (clean up head)
- `audio.js` (delete after splitting)