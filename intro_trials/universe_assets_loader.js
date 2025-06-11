// universe_assets_loader.js
// Handles loading universe formation assets for the cinematic sequence.

// --- Asset lists (from asset_file_list.md) ---
window.asset_paths = {
  nebulae: [
    '../assets/ai_universe/nebulae/01.png',
    '../assets/ai_universe/nebulae/02.png',
    '../assets/ai_universe/nebulae/03.png',
    '../assets/ai_universe/nebulae/04.png',
    '../assets/ai_universe/nebulae/05.png',
    '../assets/ai_universe/nebulae/06.png',
    '../assets/ai_universe/nebulae/07.png',
    '../assets/ai_universe/nebulae/08.png',
    '../assets/ai_universe/nebulae/09.png',
    '../assets/ai_universe/nebulae/big_01.png',
    '../assets/ai_universe/nebulae/big_02.png',
    '../assets/ai_universe/nebulae/big_03.png',
    '../assets/ai_universe/nebulae/big_04.png',
  ],
  galaxy_streams: [
    '../assets/ai_universe/galaxy_streams/01.png',
    '../assets/ai_universe/galaxy_streams/02.png',
    '../assets/ai_universe/galaxy_streams/03.png',
    '../assets/ai_universe/galaxy_streams/04.png',
    '../assets/ai_universe/galaxy_streams/big_01.png',
    '../assets/ai_universe/galaxy_streams/big_02.png',
    '../assets/ai_universe/galaxy_streams/big_03.png',
    '../assets/ai_universe/galaxy_streams/big_04.png',
    '../assets/ai_universe/galaxy_streams/big_05.png',
    '../assets/ai_universe/galaxy_streams/big_06.png',
  ],
  cosmic_fog: [
    '../assets/ai_universe/cosmic_fog/big_01.png',
    '../assets/ai_universe/cosmic_fog/big_02.png',
    '../assets/ai_universe/cosmic_fog/big_03.png',
    '../assets/ai_universe/cosmic_fog/big_04.png',
    '../assets/ai_universe/cosmic_fog/big_05.png',
  ],
  star_clusters: [
    '../assets/ai_universe/star_clusters/big_01.png',
    '../assets/ai_universe/star_clusters/big_02.png',
    '../assets/ai_universe/star_clusters/big_03.png',
  ],
  alien_planet: [
    '../assets/ai_universe/alien_planet/planet_totale.png',
  ],
};

// --- Pure image loading utility ---
function load_universe_assets(callback) {
  // Loads all images in asset_paths, calls callback({category, src, img, error}) for each
Object.entries(window.asset_paths).forEach(([category, paths]) => {
  paths.forEach((src) => {
    const img = new window.Image();
    img.onload = () => callback && callback({ category, src, img, error: null });
    img.onerror = (e) => callback && callback({ category, src, img: null, error: e });
    img.src = src;
  });
});
}

// Export for use in main cinematic script
window.load_universe_assets = load_universe_assets;
