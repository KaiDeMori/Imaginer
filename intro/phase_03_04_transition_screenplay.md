# Phase 3 to Phase 4 Transition Screenplay

## Visual Flow:
1. **End of Phase 3:** Star clusters fly away, leaving a black screen
2. **Transition:** Use the black screen to switch to Phase 4's 3D canvas
3. **Start of Phase 4:** Planet appears far away and gradually approaches until it fills the screen
4. **Planet Display:** Once in full view, planet just rotates slowly (no other movement)

## Audio Flow:
1. **Phase 3 End:** First song (Zarathustra) continues playing as phase 3 ends
2. **Planet Approach:** Zarathustra keeps playing while planet approaches and comes into full view
3. **Planet Rotation:** Planet rotates slowly while Zarathustra reaches its final crescendo
4. **Song End Timestamp:** Record the exact timestamp when Zarathustra ends
5. **Silence Wait:** Ensure **at least 2 seconds** have elapsed from the Zarathustra end timestamp
6. **Second Song Start:** Begin playing "Air" by J.S. Bach
7. **Main Zoom:** Once "Air" starts playing, initiate the main zoom approaching the planet's surface
8. **Continue:** Let both the visual zoom and "Air" play out naturally

## Critical Timing Logic:
- Record `zarathustra_end_time` when the first song finishes
- Before starting "Air", check: `current_time - zarathustra_end_time >= 2000ms`
- If less than 2 seconds have passed, wait for the remaining time
- Example: If other processes took 0.5s, wait additional 1.5s (total = 2s from song end)

## Key Points:
- Planet should be peacefully rotating in full view during Zarathustra's crescendo
- 2-second silence is mandatory minimum from song end timestamp
- "Air" triggers the surface approach zoom
- The silence moment provides dramatic pause between cosmic overview and surface approach