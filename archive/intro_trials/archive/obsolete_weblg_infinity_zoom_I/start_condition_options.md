# Options for Implementing a Smooth Infinity Zoom Start Condition


## 1. Animation State Machine
- Tried previously in this codebase, but failed due to the tight coupling of the animation loop to incremental scale updates and the risk of time/scale drift or jumps if the state transition is not handled with perfect precision.
- The animate function expects to always update all layers, so introducing a state machine here is error-prone unless the time and scale logic is made state-aware everywhere.
- **Summary:** Fragile in this code structure; easy to get subtle bugs.


## 2. Separate Static and Zoom Loops
- Conceptually clean: static display for 1s, then switch to main animation loop.
- The debug function already does this for a single image.
- Integrating into the main engine is tricky because the main loop expects to always update all layers, and the transition must ensure the scale is exactly 1.0 at the start of zoom.
- If timer and scale variables are not reset correctly, a jump will occur.
- **Summary:** Possible, but requires careful state and variable resets.


## 3. Delay Scale Updates
- Least invasive: just skip the scale update for the first 1s, then start updating as normal.
- Problem: the code’s time delta (`dt`) is always based on the previous frame, so if you just “skip” scale updates for 1s, the first update after the delay will use a `dt` that is much larger than a normal frame, causing a jump in scale.
- To avoid this, you must reset the time reference (e.g., `last_time`) right at the end of the delay, so the first zoom frame uses a small, correct `dt`.
- **Summary:** Will cause a jump unless you reset the time reference after the delay.


## 4. Use a "zoom_start_time" (Recommended for this code)
- Most robust for the current code structure.
- For the first second, always draw with scale 1.0, and do not update any scales.
- When the time is up, set `zoom_start_time = ts` and from then on, always compute the zoom scale as a function of `(ts - zoom_start_time)`, not by incrementally multiplying the scale each frame.
- The scale is always mathematically correct, and there is no risk of a jump or drift.
- Requires changing the scale update logic to be “absolute” (based on total elapsed time since zoom start), not “incremental.”
- **Summary:** Cleanest and most reliable for this codebase; avoids all pitfalls of incremental time/scale updates and state transitions.

---

**Key Points for All Approaches:**
- The scale of the first layer must remain exactly 1.0 for the entire static period.
- The zoom animation must begin from scale 1.0, using elapsed time since the end of the static period.
- The transition between static and zooming must not reset or jump the scale.

---

**Recommendation:**
Option 4 (“zoom_start_time”) is the cleanest and most maintainable for this codebase. It keeps the logic clear, avoids subtle bugs with time or scale drift, and ensures a mathematically smooth transition from static to zoom.
