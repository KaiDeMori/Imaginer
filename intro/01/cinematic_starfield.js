// Timing sequence definition for the cinematic starfield (simplified, no start_time)
// Each step: { duration: seconds, star_count: { from, to }, zoom_speed: { from, to } }
const cinematic_starfield_timing_sequence = [
  { duration: 2, star_count: { from: 0, to: 10000 }, zoom_speed: { from: 0.1, to: 0.1 } }, // Ramp up stars
  { duration: 1, star_count: { from: 10000, to: 10000 }, zoom_speed: { from: 0.1, to: 0.1 } }, // Hold
  { duration: 2, star_count: { from: 10000, to: 10000 }, zoom_speed: { from: 0.1, to: 0 } }, // Reduce zoom
  { duration: 1, star_count: { from: 10000, to: 10000 }, zoom_speed: { from: 0, to: 0 } }, // Hold
  { duration: 2, star_count: { from: 10000, to: 50000 }, zoom_speed: { from: 0, to: 0 } }, // Ramp up stars again
  { duration: 0, star_count: { from: 50000, to: 50000 }, zoom_speed: { from: 0, to: 0 } }, // Hold 50k static stars forever
];

const cinematic_starfield_timing_sequence_TESTING = [
  { duration: 5, star_count: { from: 0, to: 10000 }, zoom_speed: { from: 0, to: 0.01 } }, // Ramp up stars
];

const active_cinematic_starfield_timing_sequence = cinematic_starfield_timing_sequence;

// Start cinematic starfield on page load
window.addEventListener("DOMContentLoaded", function () {
  const starfield_manager = new CinematicStarfieldManager();
  window.cinematic_starfield_manager = starfield_manager; // Expose for later control
  starfield_manager.start_cinematic_sequence();

  const fade_text = document.getElementById("imagine_fade_text");
  // Calculate duration only from meaningful sequence steps (exclude infinite holds)
  let meaningful_duration = 0;
  for (let i = 0; i < active_cinematic_starfield_timing_sequence.length; i++) {
    meaningful_duration += active_cinematic_starfield_timing_sequence[i].duration;
  }
  console.log(`Meaningful cinematic duration: ${meaningful_duration} seconds`);
  // Show the text only after the meaningful animation sequence is finished
  setTimeout(() => {
    fade_text.style.opacity = "1";
    // Hold for 5 seconds, then fade out quickly
    setTimeout(() => {
      fade_text.style.transition = "opacity 0.5s cubic-bezier(0.4,0,0.2,1)";
      fade_text.style.opacity = "0";
      // After fade out, show static snapshot
      setTimeout(() => {
        const starfield_canvas = document.getElementById("starfield_canvas");
        // Stop animation if possible
        window.cinematic_starfield_manager.stop_cinematic_sequence();
        // Create image snapshot
        const snapshot_img = document.createElement("img");
        const data_url = starfield_canvas.toDataURL("image/png");
        snapshot_img.src = data_url;
        snapshot_img.id = "starfield_snapshot_img";
        snapshot_img.style.position = "absolute";
        snapshot_img.style.width = "100vw";
        snapshot_img.style.height = "100vh";
        snapshot_img.style.zIndex = "1000";
        // Add the image to the same parent
        starfield_canvas.parentNode.appendChild(snapshot_img);
        // Persist the image data URL in localStorage for the next step
        try {
          localStorage.setItem("starfield_snapshot_data_url", data_url);
        } catch (e) {
          // Ignore storage errors (e.g., quota exceeded)
        }
        // Hide the canvas
        setTimeout(() => {
          starfield_canvas.style.opacity = "0";
          starfield_canvas.style.display = "none";
        }, 500);
      }, 600); // Wait for fade out to finish (0.5s + buffer)
    }, 5000);
  }, Math.ceil(meaningful_duration * 1000));
});
