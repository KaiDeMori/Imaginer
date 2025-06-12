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

## Example

```js
const asset_max_numbers = {
  cosmic_fog: 9,
  galaxy_streams: 10,
  nebulae: 13,
  star_clusters: 3,
  alien_planet: 1
};

function pad(num, len = 2) {
  return num.toString().padStart(len, "0");
}

const asset_manifest = [];
const base = "/assets/ai_universe";

for (const [folder, max_num] of Object.entries(asset_max_numbers)) {
  for (let i = 1; i <= max_num; i++) {
    if (folder === "alien_planet") {
      asset_manifest.push(`${base}/alien_planet/planet_totale.png`);
      break;
    }
    asset_manifest.push(`${base}/${folder}/${pad(i)}.png`);
  }
}
Object.freeze(asset_manifest);
```

---
