// Timing sequence definition for the cinematic starfield (simplified, no start_time)
// Each step: { duration: seconds, star_count: value, zoom_speed: value }
const cinematic_starfield_timing_sequence = [
    { duration: 2, star_count: [0, 10000], zoom_speed: 0.1 }, // Ramp up stars
    { duration: 1, star_count: 10000, zoom_speed: 0.1 },      // Hold
    { duration: 2, star_count: 10000, zoom_speed: [0.1, 0] }, // Reduce zoom
    { duration: 1, star_count: 10000, zoom_speed: 0 },        // Hold
    { duration: 2, star_count: [10000, 50000], zoom_speed: 0 } // Ramp up stars again
];

const cinematic_starfield_timing_sequence_TESTING = [
    { duration: 5, star_count: [0, 10000], zoom_speed: [0, 0.01] }, // Ramp up stars
];

const active_cinematic_starfield_timing_sequence = cinematic_starfield_timing_sequence;

// Start cinematic starfield on page load
window.addEventListener('DOMContentLoaded', function() {
    const starfield_manager = new CinematicStarfieldManager();
    window.cinematic_starfield_manager = starfield_manager; // Expose for later control
    starfield_manager.start_cinematic_sequence();

    const fade_text = document.getElementById('imagine_fade_text');
    // Calculate total duration of the cinematic sequence
    let total_duration = 0;
    for (const step of (active_cinematic_starfield_timing_sequence || [])) {
        total_duration += step.duration;
    }
    console.log(`Total cinematic duration: ${total_duration} seconds`);
    // Show the text only after the animation sequence is truly finished
    setTimeout(() => {
        if (fade_text) {
            fade_text.style.opacity = '1';
            // Hold for 5 seconds, then fade out quickly
            setTimeout(() => {
                fade_text.style.transition = 'opacity 0.5s cubic-bezier(0.4,0,0.2,1)';
                fade_text.style.opacity = '0';
                // After fade out, show static snapshot
                setTimeout(() => {
                    const starfield_canvas = document.getElementById('starfield_canvas');
                    if (starfield_canvas) {
                        // Stop animation if possible
                        if (window.cinematic_starfield_manager && typeof window.cinematic_starfield_manager.stop_cinematic_sequence === 'function') {
                            window.cinematic_starfield_manager.stop_cinematic_sequence();
                        }
                        // Create image snapshot
                        const snapshot_img = document.createElement('img');
                        const data_url = starfield_canvas.toDataURL('image/png');
                        snapshot_img.src = data_url;
                        snapshot_img.id = 'starfield_snapshot_img';
                        snapshot_img.style.position = 'absolute';
                        snapshot_img.style.left = starfield_canvas.offsetLeft + 'px';
                        snapshot_img.style.top = starfield_canvas.offsetTop + 'px';
                        snapshot_img.style.width = starfield_canvas.width + 'px';
                        snapshot_img.style.height = starfield_canvas.height + 'px';
                        snapshot_img.style.zIndex = '1000';
                        // Hide the canvas
                        starfield_canvas.style.visibility = 'hidden';
                        // Add the image to the same parent
                        starfield_canvas.parentNode.appendChild(snapshot_img);
                        // Persist the image data URL in localStorage for the next step
                        try {
                            localStorage.setItem('starfield_snapshot_data_url', data_url);
                        } catch (e) {
                            // Ignore storage errors (e.g., quota exceeded)
                        }
                    }
                }, 600); // Wait for fade out to finish (0.5s + buffer)
            }, 5000);
        }
    }, Math.ceil(total_duration * 1000));
});
