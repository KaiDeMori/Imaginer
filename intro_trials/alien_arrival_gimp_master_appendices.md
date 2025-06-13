# Alien Arrival — GIMP Master Document: Appendices

## Appendix A — Auto-alignment Plug-ins (not used now, but noted)
GIMP 2.10 ships with **Filters → Enhance → Align Visible Layers**. Choosing *Translation Only* can automatically stack photographic plates around common features. We are **not** using this in the current workflow, but it remains an option if hand-alignment becomes too time-consuming in later phases.

## Appendix B — JSON Offset Workflow (for future consideration)
Instead of baking alignment into the PNGs you may store per-layer offsets in a companion JSON consumed by the JS animation engine:
```json
[
  { "file": "zoom_01.png", "dx":  37, "dy": 12 },
  { "file": "zoom_02.png", "dx": 102, "dy": 79 },
  { "file": "zoom_03.png", "dx":  -4, "dy": -8 }
]
```
At runtime each plate is rendered with
```css
transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(var(--z));
```
We are **currently not adopting** this approach, but the section is preserved for easy switching if project requirements change.
