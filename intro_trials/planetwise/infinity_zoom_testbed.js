const IMAGE_FOLDER = 'zoom_images';

// const LAYERS_DATA = [
//    { zoom: 25, image: '60_alien_island.png' },
//    { zoom: 25, image: '70_alien_forest.png' },
//    { zoom: 25, image: '80_alien_village.png' },
//    { zoom: 25, image: '90_alien_hut.png' },
//    { zoom: 25, image: '100_alien_closeup.png' },
// ];

const LAYERS_DATA = [
   { zoom: 25, image: '10_new_planete.png' },
   { zoom: 25, image: '20_alien_island_II_tricky_transition_continental_B.png' },
   { zoom: 25, image: '30_alien_island_II_tricky_transition.png' },
   { zoom: 25, image: '40_alien_island_II_atoll_tiny_land.png' },
   { zoom: 25, image: '50_alien_island_II_atoll.png' },
   { zoom: 25, image: '60_alien_island_II.png' },
   { zoom: 25, image: '70_alien_forest.png' },
   { zoom: 25, image: '80_alien_village.png' },
   { zoom: 25, image: '90_alien_hut.png' },
   { zoom: 25, image: '100_alien_closeup.png' },
];

let canvas, ctx;

function resize_canvas() {
   canvas.width = window.innerWidth;
   canvas.height = window.innerHeight;
   log(`[resize_canvas] Canvas resized to ${canvas.width}x${canvas.height}`);
}

function setup_canvas() {
   canvas = document.getElementById('zoom_canvas');
   ctx = canvas.getContext('2d');
   log('[setup_canvas] Canvas and context initialized.');
   resize_canvas();
   window.addEventListener('resize', resize_canvas);
}