# Universe Animation – Fine-Tuning Task List

Collected notes based on the latest internal review.  These items **do not change the current milestone scope** but should be addressed before we declare the multi-layer fly-through “final”.  Each task is intentionally phrased in an *outcome-oriented* way – the implementation team can decide which exact module/file to touch.

---

## 1 · Off-Centre Spawn (= better tunnel parallax)

Goal: Newly spawned sprites (especially the early *cosmic_fog* and *galaxy_streams* layers) should **not** start dead-centre.  Instead they should materialise further away from the viewport centre so the camera seems to dive through a tunnel.

Implementation hints:
* Extend `sprite_instance_manager.js` – add two extra seeded randoms per sprite: `spawn_offset_x`, `spawn_offset_y` (range e.g. ±40 % of viewport shortest side).
* Modify the draw step in `canvas_animation.js` to translate each sprite by that offset **scaled by its pseudo-Z** so objects still converge nicely.
* Keep the *planet* layer exempt – it must stay perfectly centred.


## 2 · Increased Rotation Dynamics

Goal: Give sprites a stronger sense of motion.

Implementation hints:
* In `sprite_instance_manager.js`, raise the random rotation speed envelope.
  • Current: `rot_speed = rand() * 0           // non-planet`
  • Proposed: `rot_speed = (rand()*2-1) * 0.06 // ±3.4° s⁻¹`
* Consider allowing a *small* random wobble for the planet as soon as it is >50 % of screen width (optional polish).
  
✔︎ Increased rotation dynamics (already merged).


## 3 · Early Animation Bootstrapping (white overlay)

Goal: The first 300–500 ms of the master animation should *already* be running **behind the white screen** so that, once the overlay fades, fog is visibly moving.

Implementation hints:
* In `early_universe_formation_V2.js` – after preload finishes but *before* calling `_fade_out_white_overlay()`, set `universe_animator.start()` immediately.
* Delay the fade-out (`setTimeout`) by the chosen *pre-roll* (say 350 ms) minus any remaining 1 s minimum.
* Make sure `UniverseAnimator` handles negative `elapsed` values gracefully (or simply call `pause` → `resume` once the fade starts).
  
✔︎ Early animation bootstrapping (white overlay) (implemented).

## 4 · Perceptual Alpha Fall-off

Goal: Linear alpha ramps currently look harsh because human perception of transparency is non-linear.

Implementation hints:
* Introduce a *gamma-corrected* opacity mapping. Example:
  $$\alpha_{out} = \alpha_{in}^{\gamma},\; \text{with}\; \gamma\;\approx\; 1/2.2$$
* Apply this mapping *once* inside `timeline_engine.js` right before returning `opacity`.
* Optionally expose `GAMMA_OPACITY = 2.2` as a constant for easier tweaking.

## 5 · QA Checklist After Changes

- [ ] No sprite appears within the innermost 15 % radius of the viewport at spawn time (except planet).
- [ ] Rotation speeds feel natural and do not trigger motion-sickness in user test.
- [ ] When the white screen fades, fog is already half-visible and moving.
- [ ] Fade-out of layers feels smoother with the new gamma correction (compare A/B).
- [ ] No new dropped-frame warnings on reference hardware.

---