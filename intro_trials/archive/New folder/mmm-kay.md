────────────  quick, straight-to-the-point rundown (Bill Lumbergh voice)  ────────────

Yeah, so if you could just remember that the **alien’s little screen** is fully described by three things—
• one corner (origin),
• the vector across the top edge (u-axis),
• the vector down the left edge (v-axis)—
and if you could just feed those three `vec2`s to the GPU, it’ll stretch that rectangle across the whole canvas, no trig, everybody’s happy.  Mmm-kay?

The fourth corner is *implicit*: `p2 = p0 + uAxis + vAxis`.  We *still* accept it from the caller so humans can type rectangles naturally and (optionally) sanity-check their numbers really form a parallelogram.

Drop the helper and its little parallelogram-checker into your codebase:

*code migrated to file `show_alien_display.js`*


That’ll about cover it, mmm-kay?