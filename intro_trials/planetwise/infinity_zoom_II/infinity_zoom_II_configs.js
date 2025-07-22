(window.infinity_zoom_II = {
  assert_all_namespaces: function () {
    if (!window.infinity_zoom_II) window.infinity_zoom_II = {};
    if (!window.infinity_zoom_II.config) window.infinity_zoom_II.config = {};
    if (!window.infinity_zoom_II.region_zoom) window.infinity_zoom_II.region_zoom = {};
  },
}).assert_all_namespaces();

// Infinity Zoom II Configuration Module

// Constants originally from HTML file
window.infinity_zoom_II.config.version_code = "templar";
window.infinity_zoom_II.config.RELATIVE_IMAGE_PATH = "../zoom_images_planete/jpg";
window.infinity_zoom_II.config.LAYERS_DATA = [
  { zoom: 25, image: "10_new_planete_fixed.jpg" },
  { zoom: 25, image: "20_alien_island_II_tricky_transition_continental_B.jpg" },
  { zoom: 25, image: "30_alien_island_II_tricky_transition.jpg" },
  { zoom: 25, image: "40_alien_island_II_atoll_tiny_land.jpg" },
  { zoom: 25, image: "50_alien_island_II_atoll.jpg" },
  { zoom: 25, image: "60_alien_island_II.jpg" },
  { zoom: 25, image: "70_alien_forest.jpg" },
  { zoom: 25, image: "80_alien_village.jpg" },
  { zoom: 25, image: "90_alien_hut.jpg" },
  { zoom: 25, image: "100_alien_closeup.jpg" },
  //{ zoom: 25, image: "100_alien_closeup_square_corner_region.png" },
  //{ zoom: 25, image: "100_alien_closeup_debug_display_square.png" },
  //{ zoom: 25, image: "100_alien_closeup_debug_display_extreme_AR.png" },
  //{ zoom: 25, image: "100_alien_closeup_transparent_display_empty.png" },
  //{ zoom: 25, image: "100_alien_debug_grid_transparent.png" },
  //{ zoom: 25, image: "100_alien_closeup_transparent_display.png" },
];

// Mystery image for alien screen portal effect
window.infinity_zoom_II.config.MYSTERY_IMAGE = "../zoom_images_planete/debug/alien_display_mystery_image_grid.png";

/*
// Example: with feathering
window.infinity_zoom_II.config.feather_size = 300;
// Example: without feathering
window.infinity_zoom_II.config.feather_size = undefined;
*/
window.infinity_zoom_II.config.feather_size = 30;

// Engine configuration settings
// Minimum rendered layer size in pixels
window.infinity_zoom_II.config.minimum_render_size = 3;
// Edge feathering for all but first layer (fraction of edge).
window.infinity_zoom_II.config.feather_value = 0.1;
// Minimum feather width for edge alpha ramp in pixels.
window.infinity_zoom_II.config.feather_min_px = 2;
// Initial rotation angle in radians.
window.infinity_zoom_II.config.start_rotation_angle = 0;
// Global rotation speed in radians per second. Positive values rotate counter-clockwise (gl convention).
window.infinity_zoom_II.config.rotation_speed = 0.2;
// Exponential zoom rate (growth constant per second).
window.infinity_zoom_II.config.zoom_speed = 2;

// Animation phase durations (in seconds)
window.infinity_zoom_II.config.intro_planet_zoom_duration = 0.2; // How long planet takes to grow from tiny to fitting
window.infinity_zoom_II.config.visible_layers_fade_duration = 0.2; // How long additional layers take to fade in
window.infinity_zoom_II.config.pre_main_zoom_hold_duration = 0.2; // How long to hold before starting main zoom

// Exposed flag for triggering final reveal from  ALWAYS FALSE UNTIL SET EXTERNALLY.
window.infinity_zoom_II.FLAG_initiate_final_reveal = false;
