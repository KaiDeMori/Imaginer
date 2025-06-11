// JS for The Great Everywhere Shake cinematic step
// Explosion and shake logic will be added here


// JS for The Great Everywhere Shake cinematic step
// Explosion and shake logic

document.addEventListener('DOMContentLoaded', function() {
    const explosion_canvas = document.getElementById('explosion_canvas');
    if (!explosion_canvas) return;
    const ctx = explosion_canvas.getContext('2d');
    explosion_canvas.width = window.innerWidth;
    explosion_canvas.height = window.innerHeight;

    // Starfield background
    let starfield_img = null;
    let fallback_black = false;
    const data_url = localStorage.getItem('starfield_snapshot_data_url');
    if (data_url) {
        const img = new window.Image();
        img.onload = function() {
            starfield_img = img;
            start_zoom_and_explosion_animation();
        };
        img.onerror = function(e) {
            console.warn('Failed to load starfield image from data URL. Falling back to black.', e);
            fallback_black = true;
            start_zoom_and_explosion_animation();
        };
        setTimeout(function() {
            if (!starfield_img) {
                console.warn('Timeout: starfield image did not load in time. Falling back to black.');
                fallback_black = true;
                start_zoom_and_explosion_animation();
            }
        }, 2000);
        img.src = data_url;
    } else {
        fallback_black = true;
        start_zoom_and_explosion_animation();
    }

    // Explosion model
    function create_explosion() {
        const cx = Math.random() * explosion_canvas.width;
        const cy = Math.random() * explosion_canvas.height;
        const max_radius = 40 + Math.random() * 60; // px
        const color_palette = [
            '#ffec00', '#ff0080', '#00ffe7', '#ff5e00', '#00ff6a', '#a800ff', '#fff', '#00bfff', '#ff00c8'
        ];
        const color = color_palette[Math.floor(Math.random() * color_palette.length)];
        const duration = 500 + Math.random() * 400; // ms
        const start_time = performance.now();
        // Optionally, add sparks
        const spark_count = 3 + Math.floor(Math.random() * 4);
        const sparks = [];
        for (let i = 0; i < spark_count; ++i) {
            const angle = Math.random() * 2 * Math.PI;
            const speed = 1.5 + Math.random() * 2.5;
            sparks.push({
                angle,
                speed,
                radius: 2 + Math.random() * 2,
                color: color_palette[Math.floor(Math.random() * color_palette.length)]
            });
        }
        return { cx, cy, max_radius, color, duration, start_time, sparks };
    }

    let explosions = [];
    const max_explosions = 40;
    const explosion_spawn_rate = 3; // per frame

    function draw_scaled_and_shaken(scale, shake_x, shake_y) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
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

    function draw_explosions(now) {
        for (let i = 0; i < explosions.length; ++i) {
            const exp = explosions[i];
            const t = (now - exp.start_time) / exp.duration;
            if (t > 1) continue;
            // Animate radius and opacity
            const radius = exp.max_radius * (0.2 + 0.8 * t);
            const opacity = 1 - t;
            // Draw main burst (radial gradient)
            const grad = ctx.createRadialGradient(exp.cx, exp.cy, 0, exp.cx, exp.cy, radius);
            grad.addColorStop(0, exp.color);
            // Use rgba for alpha stops to avoid invalid hex codes
            // Convert hex color to rgb
            function hex_to_rgb(hex) {
                let c = hex.replace('#', '');
                if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
                const num = parseInt(c, 16);
                return [
                    (num >> 16) & 255,
                    (num >> 8) & 255,
                    num & 255
                ];
            }
            const [r, g, b] = hex_to_rgb(exp.color);
            grad.addColorStop(0.5, `rgba(${r},${g},${b},0.8)`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.save();
            ctx.globalAlpha = opacity * 0.85;
            ctx.globalCompositeOperation = 'lighter';
            ctx.beginPath();
            ctx.arc(exp.cx, exp.cy, radius, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.filter = 'blur(1.5px)';
            ctx.fill();
            ctx.filter = 'none';
            // Draw sparks
            for (let s = 0; s < exp.sparks.length; ++s) {
                const spark = exp.sparks[s];
                const spark_dist = radius * (0.7 + 0.3 * Math.random());
                const spark_x = exp.cx + Math.cos(spark.angle) * spark_dist;
                const spark_y = exp.cy + Math.sin(spark.angle) * spark_dist;
                ctx.beginPath();
                ctx.arc(spark_x, spark_y, spark.radius, 0, 2 * Math.PI);
                ctx.closePath();
                ctx.fillStyle = spark.color;
                ctx.globalAlpha = opacity * 0.7;
                ctx.fill();
            }
            ctx.restore();
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }

    function start_zoom_and_explosion_animation() {
        const zoom_duration_ms = 5000;
        const zoom_amplitude = 0.08;
        const zoom_base = 1.0;
        const shake_amplitude_px = 12;
        const start_time = performance.now();

        function animate(now) {
            const elapsed = now - start_time;
            let t = Math.min(elapsed / zoom_duration_ms, 1);
            const scale = zoom_base + zoom_amplitude * Math.sin(Math.PI * t);
            const shake_fade = Math.sin(Math.PI * t);
            const shake_x = shake_fade * shake_amplitude_px * (2 * Math.random() - 1);
            const shake_y = shake_fade * shake_amplitude_px * (2 * Math.random() - 1);
            draw_scaled_and_shaken(scale, shake_x, shake_y);

            // Spawn new explosions
            for (let i = 0; i < explosion_spawn_rate; ++i) {
                if (explosions.length < max_explosions && Math.random() < 0.7) {
                    explosions.push(create_explosion());
                }
            }
            // Remove finished explosions
            const now_time = performance.now();
            explosions = explosions.filter(exp => (now_time - exp.start_time) < exp.duration);
            draw_explosions(now_time);

            if (elapsed < zoom_duration_ms) {
                requestAnimationFrame(animate);
            } else {
                draw_scaled_and_shaken(zoom_base, 0, 0);
                draw_explosions(performance.now());
            }
        }
        requestAnimationFrame(animate);
    }
});
