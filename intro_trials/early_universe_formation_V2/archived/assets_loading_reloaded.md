# Assets Loading Reloaded – Approach Summary

## Goal

Always load **all PNG assets** in each folder, shuffle them, and select the first N for use in the animation.  
No need to care about PNG numbering or manual file lists, as long as all files are named sequentially and there are no gaps.

## Approach

1. **Store the max number for each asset folder** (e.g., `galaxy_streams: 10`).
2. **Programmatically generate the asset manifest** by iterating from `01.png` up to the max number for each folder.
3. **Special case**: For folders with a single, non-numbered file (like `alien_planet/planet_totale.png`), just add that file directly.
4. **Shuffle the manifest** as before and select the first N as needed.

## Benefits

- No need to manually update the manifest for every new file—just update the max number.
- No dependency on Node.js or server-side directory listing.
- Keeps the code simple and maintainable for client-side-only projects.


---

**Note:** The generator is live—just bump the numbers when new files land.
