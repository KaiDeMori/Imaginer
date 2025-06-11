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
        img.onerror = function(e) {
            console.warn('Failed to load starfield image from data URL. Falling back to black.', e);
            fallback_black = true;
            start_zoom_animation();
        };
        // Defensive: set timeout in case onload/onerror never fire
        let load_timeout = setTimeout(function() {
            if (!starfield_img) {
                console.warn('Timeout: starfield image did not load in time. Falling back to black.');
                fallback_black = true;
                start_zoom_animation();
            }
        }, 2000);
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

    function draw_scaled_and_shaken(scale, shake_x, shake_y) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
        ctx.clearRect(0, 0, explosion_canvas.width, explosion_canvas.height);
        // Center zoom and shake
        const cx = explosion_canvas.width / 2;
        const cy = explosion_canvas.height / 2;
        ctx.translate(cx + shake_x, cy + shake_y);
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
        const shake_amplitude_px = 12; // harsher shake
        const start_time = performance.now();

        function animate_zoom_and_shake(now) {
            const elapsed = now - start_time;
            let t = Math.min(elapsed / zoom_duration_ms, 1);
            // Smooth in-out: sine wave from 0 to PI
            const scale = zoom_base + zoom_amplitude * Math.sin(Math.PI * t);
            // Harsher shake: random per frame, modulated by fade
            const shake_fade = Math.sin(Math.PI * t); // 0 at start/end, 1 at middle
            const shake_x = shake_fade * shake_amplitude_px * (2 * Math.random() - 1);
            const shake_y = shake_fade * shake_amplitude_px * (2 * Math.random() - 1);
            draw_scaled_and_shaken(scale, shake_x, shake_y);
            if (elapsed < zoom_duration_ms) {
                requestAnimationFrame(animate_zoom_and_shake);
            } else {
                draw_scaled_and_shaken(zoom_base, 0, 0); // Reset to normal at end
            }
        }
        requestAnimationFrame(animate_zoom_and_shake);
    }
});
