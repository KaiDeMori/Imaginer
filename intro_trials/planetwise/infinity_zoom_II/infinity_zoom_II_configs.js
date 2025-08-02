if (!window.infinity_zoom_II) window.infinity_zoom_II = {};
if (!window.infinity_zoom_II.config) window.infinity_zoom_II.config = {};
if (!window.infinity_zoom_II.region_zoom) window.infinity_zoom_II.region_zoom = {};

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
  { zoom: 25, image: "100_alien_closeup_transparent_display.png" },
  //{ zoom: 25, image: "90_alien_hut_debug.jpg" },
  //{ zoom: 25, image: "alien_display_mystery_image_grid.png" },
  // { zoom: 25, image: "100_alien_closeup.jpg" },
  //{ zoom: 25, image: "100_alien_closeup_square_corner_region.png" },
  //{ zoom: 25, image: "100_alien_closeup_debug_display_square.png" },
  //{ zoom: 25, image: "100_alien_closeup_debug_display_extreme_AR.png" },
  //{ zoom: 25, image: "100_alien_closeup_transparent_display_empty.png" },
  //{ zoom: 25, image: "100_alien_debug_grid_transparent.png" },
];

// Add default configuration for region zoom
window.infinity_zoom_II.config.region_zoom = {
  anim_duration: 10000, // Animation duration in milliseconds
  region_rect: window.infinity_zoom_II.regions.original,
};

// Display images for alien screen portal effect during region zoom
window.infinity_zoom_II.config.REGION_DISPLAY_IMAGE_PATHS = [
  "../zoom_images_planete/display_images/region_zoom/u1264212648_photo_of_of_a_traditional_French_mime_riding_a_bicy_bab8869e-91ed-4290-b766-63beb51c844d.png",
  "../zoom_images_planete/display_images/region_zoom/u1264212648_a_blonde_little_girl_sitting_in_front_of_a_laptop_i_c6f87405-230c-468c-bca1-590f6fd9a9ce.png",
];

// Display images for main zoom portal effect
window.infinity_zoom_II.config.MAIN_DISPLAY_IMAGE_PATHS = [
  "../zoom_images_planete/display_images/main_zoom/A_unicorn-dinosaur_1749938156.png",
  "../zoom_images_planete/display_images/main_zoom/An_ancient_library_h_1749941586.png",
];

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
// Initial rotation angle in radians.
window.infinity_zoom_II.config.start_rotation_angle = 0;
// Global rotation speed in radians per second. Positive values rotate counter-clockwise (gl convention).
window.infinity_zoom_II.config.rotation_speed = -0.2;
// Exponential zoom rate (growth constant per second).
window.infinity_zoom_II.config.zoom_speed = 1;

// Animation phase durations (in seconds)
window.infinity_zoom_II.config.intro_planet_zoom_duration = 0.2; // How long planet takes to grow from tiny to fitting
window.infinity_zoom_II.config.visible_layers_fade_duration = 0.2; // How long additional layers take to fade in
window.infinity_zoom_II.config.pre_main_zoom_hold_duration = 0.2; // How long to hold before starting main zoom

// Exposed flag for triggering final reveal from  ALWAYS FALSE UNTIL SET EXTERNALLY.
window.infinity_zoom_II.FLAG_initiate_final_reveal = false;
