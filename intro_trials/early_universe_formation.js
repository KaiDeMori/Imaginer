// early_universe_formation.js

function random_between(min, max) {
  return Math.random() * (max - min) + min;
}

function create_cosmic_structure(parent, width, height, left, top) {
  const el = document.createElement('div');
  el.className = 'cosmic_structure';
  el.style.width = width + 'px';
  el.style.height = height + 'px';
  el.style.left = left + 'px';
  el.style.top = top + 'px';
  parent.appendChild(el);
}

function create_galaxy_stream(parent, width, height, left, top, delay) {
  const el = document.createElement('div');
  el.className = 'galaxy_stream';
  el.style.width = width + 'px';
  el.style.height = height + 'px';
  el.style.left = left + 'px';
  el.style.top = top + 'px';
  el.style.animationDelay = delay + 's';
  parent.appendChild(el);
}

window.onload = function() {
  const canvas = document.getElementById('universe_canvas');
  const w = window.innerWidth;
  const h = window.innerHeight;

  // Step 1: Fill with diffuse light
  for (let i = 0; i < 12; i++) {
    create_cosmic_structure(
      canvas,
      random_between(120, 400),
      random_between(60, 200),
      random_between(0, w - 200),
      random_between(0, h - 100)
    );
  }

  // Step 2: Gradually reveal galaxy streams
  setTimeout(() => {
    for (let i = 0; i < 5; i++) {
      create_galaxy_stream(
        canvas,
        random_between(180, 320),
        random_between(30, 80),
        random_between(0, w - 200),
        random_between(0, h - 100),
        i * 0.7
      );
    }
  }, 1800);
};
