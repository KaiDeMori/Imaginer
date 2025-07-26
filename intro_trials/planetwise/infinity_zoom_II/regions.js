if (!window.infinity_zoom_II) window.infinity_zoom_II = {};

window.infinity_zoom_II.regions = {
  original: {
    p0: { x: 1152, y: 1125 }, // origin (top-left)
    p1: { x: 1014, y: 1136 }, // end of top edge (u-axis)
    p2: { x: 1004, y: 1036 }, // far corner (bottom-right)
    p3: { x: 1142, y: 1024 }, // end of left edge (v-axis)
  },

  // 100_alien_debug_grid
  debug_grid: {
    p0: { x: 726, y: 726 }, // top left
    p1: { x: 921, y: 726 }, // top right
    p2: { x: 921, y: 921 }, // bottom right
    p3: { x: 726, y: 921 }, // bottom left
  },

  // 100_alien_debug_grid tilted 90° ccw
  debug_grid_tilted_90: {
    p0: { x: 726, y: 921 },
    p1: { x: 726, y: 726 },
    p2: { x: 921, y: 726 },
    p3: { x: 921, y: 921 },
  },

  // 100_alien_debug_grid tilted 45° ccw
  debug_grid_tilted_45: {
    p0: { x: 684, y: 823 },
    p1: { x: 823, y: 684 },
    p2: { x: 962, y: 823 },
    p3: { x: 823, y: 962 },
  },
};
