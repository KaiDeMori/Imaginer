# Refactor Preloading - Consolidate Feathering Logic

## Problem Statement

Currently, the engine contains feathering decision logic that branches between two different preloaders:
- Regular preloader (handles mystery image properly)
- Feather preloader (missing mystery image handling)

This creates:
- Duplicated mystery image loading logic
- Engine complexity with branching logic
- Inconsistent callback signatures between preloaders

## Current State Analysis

### Engine Feathering Logic (PROBLEMATIC)
```javascript
// Check if feathering is enabled
const feather_size = window.infinity_zoom_II.config.feather_size;

if (feather_size !== undefined) {
  // Use feathering preloader
  window.infinity_zoom_II.feather_preloader.preload_and_feather_images(layer_data, image_path, feather_size);
  
  // When feathered images are ready, initialize the engine
  window.infinity_zoom_II.feather_preloader.on_feathered_images_ready((feathered_images) => {
    // MISSING: mystery_image parameter
    this.init(layer_data, feathered_images, canvas);
  });
} else {
  // Use normal preloader
  window.infinity_zoom_II.preloader.preload_images(layer_data, image_path);
  
  // When images are loaded, initialize the engine
  window.infinity_zoom_II.preloader.on_images_loaded((loaded_images, mystery_image) => {
    this.init(layer_data, loaded_images, mystery_image, canvas);
  });
}
```

### Regular Preloader (CORRECT)
- ✅ Loads mystery image properly
- ✅ Passes `(images, mystery_image)` to callback
- ✅ Single loading path for both layer and mystery images

### Feather Preloader (INCOMPLETE)
- ✅ Feathers layer images correctly
- ❌ Missing mystery image handling
- ❌ Only passes `(feathered_images)` to callback
- ❌ Calls regular preloader internally but loses mystery_image

## Solution: Unified Preloader Interface

### Design Principles
1. **Single Responsibility**: Regular preloader handles ALL loading decisions
2. **Mystery Image Rule**: Mystery image NEVER gets feathered, always loaded normally
3. **Unified Interface**: Engine calls single function, gets consistent callback signature
4. **No Duplication**: Mystery image loading code exists only once

### Implementation Plan

#### Step 1: Create Unified Interface in Regular Preloader

Add new function `load_all_images()` to `infinity_zoom_preloader.js`:

```javascript
function load_all_images(layer_data, image_folder, callback) {
  // Always load mystery image first (never feathered)
  load_mystery_image_only((mystery_img) => {
    
    // Check config for feathering decision
    const feather_size = window.infinity_zoom_II.config.feather_size;
    
    if (feather_size !== undefined) {
      // Use feather preloader for layers only
      window.infinity_zoom_II.feather_preloader.preload_and_feather_layers_only(
        layer_data, 
        image_folder, 
        feather_size,
        (feathered_images) => {
          callback(feathered_images, mystery_img);
        }
      );
    } else {
      // Use regular preloader for layers only  
      load_layer_images_only(layer_data, image_folder, (images) => {
        callback(images, mystery_img);
      });
    }
  });
}
```

#### Step 2: Refactor Regular Preloader Internal Functions

Split current `preload_images()` into separate functions:

```javascript
// Load mystery image only
function load_mystery_image_only(callback) {
  const mystery_img = new Image();
  mystery_img.onload = () => callback(mystery_img);
  mystery_img.onerror = (e) => log(`[preload_images] ERROR loading mystery image`);
  mystery_img.src = window.infinity_zoom_II.config.MYSTERY_IMAGE;
}

// Load layer images only
function load_layer_images_only(layer_data, image_folder, callback) {
  // Current preload_images logic but without mystery image loading
  let loaded = 0;
  const total = layer_data.length;
  const images = new Array(total);
  
  layer_data.forEach((layer, i) => {
    const img = new Image();
    img.onload = () => {
      images[i] = img;
      loaded++;
      if (loaded === total) {
        callback(images);
      }
    };
    img.src = `${image_folder}/${layer.image}`;
  });
}
```

#### Step 3: Update Feather Preloader Interface

Add `preload_and_feather_layers_only()` function to `infinity_zoom_feather_preloader.js`:

```javascript
function preload_and_feather_layers_only(layer_data, image_folder, feather_size, callback) {
  // Load layers using regular preloader (layers only, no mystery)
  window.infinity_zoom_II.preloader.load_layer_images_only(layer_data, image_folder, (images) => {
    // Apply feathering to layer images
    const feathered_images = apply_feathering_to_images(images, feather_size);
    callback(feathered_images);
  });
}
```

#### Step 4: Simplify Engine

Replace entire feathering branch logic with single call:

```javascript
// Before (COMPLEX - 15+ lines of branching)
const feather_size = window.infinity_zoom_II.config.feather_size;
if (feather_size !== undefined) {
  // feathering path...
} else {
  // regular path...
}

// After (SIMPLE - 3 lines)
window.infinity_zoom_II.preloader.load_all_images(layer_data, image_path, (processed_images, mystery_image) => {
  this.init(layer_data, processed_images, mystery_image, canvas);
});
```

### File Changes Summary

#### `infinity_zoom_preloader.js`
- ✅ Add `load_all_images()` - unified interface
- ✅ Add `load_mystery_image_only()` - mystery image only
- ✅ Add `load_layer_images_only()` - layer images only  
- ✅ Keep existing `preload_images()` for backward compatibility

#### `infinity_zoom_feather_preloader.js`
- ✅ Add `preload_and_feather_layers_only()` - layers only interface
- ✅ Keep existing `preload_and_feather_images()` for backward compatibility

#### `infinity_zoom_II_engine.js`
- ✅ Replace feathering branching logic with single `load_all_images()` call
- ✅ Remove feathering decision code
- ✅ Unified callback signature: `(processed_images, mystery_image)`

### Benefits

1. **Single Responsibility**: Regular preloader owns all loading decisions
2. **No Duplication**: Mystery image loading code exists only once
3. **Consistent Interface**: Both feathered and non-feathered paths return same signature
4. **Engine Simplification**: Remove 15+ lines of branching logic, replace with 3 lines
5. **Clear Separation**: Mystery image always separate from feathering pipeline
6. **Backward Compatibility**: Keep existing functions for other code that might use them

### Testing Strategy

1. **Test non-feathered path**: Set `feather_size = undefined`, verify mystery image loads
2. **Test feathered path**: Set `feather_size = 300`, verify layers get feathered and mystery image loads normally
3. **Test callback signature**: Both paths should call engine init with `(processed_images, mystery_image)`

---

**Implementation Order**: 
1. Regular preloader internal refactor
2. Feather preloader new interface  
3. Engine simplification
4. Test both paths
