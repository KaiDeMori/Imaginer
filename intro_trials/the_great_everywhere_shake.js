// JS for The Great Everywhere Shake cinematic step
// Explosion and shake logic will be added here

document.addEventListener('DOMContentLoaded', function() {
    // Draw the starfield snapshot as a static background, exactly as it was shown in the starfield page
    const explosion_canvas = document.getElementById('explosion_canvas');
    if (!explosion_canvas) return;
    const ctx = explosion_canvas.getContext('2d');
    explosion_canvas.width = window.innerWidth;
    explosion_canvas.height = window.innerHeight;

    // Store the original image for redraw
    let starfield_img = null;
    let fallback_black = false;

    // Try to load the starfield snapshot from localStorage
    const data_url = localStorage.getItem('starfield_snapshot_data_url');
    if (data_url) {
        const img = new window.Image();
        img.onload = function() {
            starfield_img = img;
            start_zoom_animation();
        };
        img.src = data_url;
    } else {
        fallback_black = true;
        start_zoom_animation();
    }

    function draw_scaled(scale) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
        ctx.clearRect(0, 0, explosion_canvas.width, explosion_canvas.height);
        // Center zoom
        const cx = explosion_canvas.width / 2;
        const cy = explosion_canvas.height / 2;
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);
        if (starfield_img) {
            ctx.drawImage(starfield_img, 0, 0, explosion_canvas.width, explosion_canvas.height);
        } else if (fallback_black) {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, explosion_canvas.width, explosion_canvas.height);
        }
        ctx.restore();
    }

    function start_zoom_animation() {
        const zoom_duration_ms = 5000;
        const zoom_amplitude = 0.08; // 8% zoom in/out
        const zoom_base = 1.0;
        const start_time = performance.now();

        function animate_zoom(now) {
            const elapsed = now - start_time;
            let t = Math.min(elapsed / zoom_duration_ms, 1);
            // Smooth in-out: sine wave from 0 to PI
            const scale = zoom_base + zoom_amplitude * Math.sin(Math.PI * t);
            draw_scaled(scale);
            if (elapsed < zoom_duration_ms) {
                requestAnimationFrame(animate_zoom);
            } else {
                draw_scaled(zoom_base); // Reset to normal at end
            }
        }
        requestAnimationFrame(animate_zoom);
    }
});
