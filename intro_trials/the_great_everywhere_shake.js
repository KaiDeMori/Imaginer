// JS for The Great Everywhere Shake cinematic step
// Explosion and shake logic will be added here

document.addEventListener('DOMContentLoaded', function() {
    // Draw the starfield snapshot as a static background, exactly as it was shown in the starfield page
    const explosion_canvas = document.getElementById('explosion_canvas');
    if (explosion_canvas) {
        const ctx = explosion_canvas.getContext('2d');
        // Set canvas size to match the snapshot (assume full viewport)
        explosion_canvas.width = window.innerWidth;
        explosion_canvas.height = window.innerHeight;

        // Try to load the starfield snapshot from localStorage
        const data_url = localStorage.getItem('starfield_snapshot_data_url');
        if (data_url) {
            const img = new window.Image();
            img.onload = function() {
                // Draw the image to fill the canvas, preserving the original aspect ratio
                ctx.clearRect(0, 0, explosion_canvas.width, explosion_canvas.height);
                ctx.drawImage(img, 0, 0, explosion_canvas.width, explosion_canvas.height);
            };
            img.src = data_url;
        } else {
            // Fallback: fill with black if no snapshot is available
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, explosion_canvas.width, explosion_canvas.height);
        }
    }
});
