# Occlusion Culling Optimization: First Visible Layer Index

## Context

In the infinity zoom animation system, multiple layers are rendered in sequence to create a seamless zoom effect. As the zoom progresses, earlier layers in the sequence become completely hidden behind later layers that have grown large enough to "cover" the entire viewport. This creates an opportunity for performance optimization by eliminating unnecessary rendering operations.

## The Problem

During the zoom animation, all layers continue to be rendered even when they are completely occluded by layers that appear "in front" of them. This becomes computationally expensive, particularly in later phases of the zoom where many layers are hidden but still being processed.

## Core Optimization Concept

The key insight is that zoom progression is **monotonic** - we only zoom IN, making things progressively larger. Once a layer becomes permanently hidden, it will never become visible again. This allows us to maintain a single tracking variable that advances forward through the layer array.

## The `first_visible_layer_index` Variable

**Purpose**: Tracks the index of the first layer that still needs to be rendered.

**Initialization**: Starts at `0` (the planet layer).

**Behavior**: Can only increase, never decrease.

**Usage**: The render loop begins from this index instead of always starting from `0`.

## The "i+2" Logic Explained

### Why Check Layer `first_visible_layer_index + 2`?

The covering detection checks layer `first_visible_layer_index + 2` because of the specific rendering requirements:

1. **Layer at index `i`**: The layer we're considering hiding
2. **Layer at index `i+1`**: Must remain visible for proper alpha blending and rotation gap handling
3. **Layer at index `i+2`**: The layer being tested for covering behavior

**Critical principle**: When layer `i+2` becomes covering (fills the entire viewport), we can safely hide layer `i` because layer `i+1` provides the necessary visual continuity.

### Example Progression

- **Start**: `first_visible_layer_index = 0`
- **Check**: Is layer `2` covering? 
- **If yes**: Set `first_visible_layer_index = 1` (hide layer `0`)
- **Next check**: Is layer `3` covering?
- **If yes**: Set `first_visible_layer_index = 2` (hide layer `1`)
- **Continue**: This pattern repeats throughout the zoom

## Algorithm Implementation

```javascript
// Engine state
first_visible_layer_index: 0

// Per frame check
const check_index = this.first_visible_layer_index + 2;
if (check_index < this.layers.length && layer_is_covering(check_index)) {
    this.first_visible_layer_index++;
}
```

## Edge Cases and Safety Measures

### Array Bounds Protection
**Issue**: `first_visible_layer_index + 2` could exceed the array length.
**Solution**: Always check `check_index < this.layers.length` before proceeding.

### End of Layer Sequence
**Issue**: When approaching the final layers, the `+2` offset may not apply.
**Solution**: The bounds check naturally handles this - no increment occurs when we reach the end.

### No Covering Layers
**Issue**: If no layers ever achieve covering status during a zoom sequence.
**Solution**: `first_visible_layer_index` remains at `0`, and all layers continue to render (correct fallback behavior).

### Animation Phase Transitions
**Issue**: The optimization must work across different animation states.
**Solution**: The covering detection is based on pure geometric calculations, independent of animation phase.

## Performance Characteristics

- **Early zoom phases**: No change (all layers still visible)
- **Mid zoom phases**: Skip 2-3 layers (modest performance gain)
- **Late zoom phases**: Skip 6-8 layers (significant performance improvement)

## Monotonic Progression Guarantee

The optimization relies on the mathematical certainty that in a zoom-in-only system:
- Once a layer becomes hidden, it remains hidden
- Layer visibility only progresses forward through the array
- No backtracking or oscillation occurs

This ensures the `first_visible_layer_index` variable provides a reliable optimization without compromising visual correctness.

## Integration with Existing System

The optimization integrates seamlessly with the existing rendering pipeline:
- No changes to layer calculations or transforms
- No modification to animation logic
- Single additional variable and minimal per-frame logic
- Maintains full visual fidelity while improving performance

## Detection Timing

**Frequency**: Checked every frame during active animation.
**Precision**: Does not require exact threshold detection - approximate "covering enough" is sufficient.
**Performance**: Single covering calculation per frame, no loops or searches required.
