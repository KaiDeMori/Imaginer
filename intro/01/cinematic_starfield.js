// Timing sequence definition for the cinematic starfield (simplified, no start_time)
// Each step: { duration: seconds, star_count: { from, to }, zoom_speed: { from, to } }
const cinematic_starfield_timing_sequence = [
  { duration: 19, star_count: { from: 0, to: 10000 }, zoom_speed: { from: 0.1, to: 0.1 } }, // Ramp up stars
  { duration: 10, star_count: { from: 10000, to: 10000 }, zoom_speed: { from: 0.1, to: 0.1 } }, // Hold
  { duration: 2, star_count: { from: 10000, to: 10000 }, zoom_speed: { from: 0.1, to: 0 } }, // Reduce zoom
  { duration: 1, star_count: { from: 10000, to: 10000 }, zoom_speed: { from: 0, to: 0 } }, // Hold
  { duration: 2, star_count: { from: 10000, to: 50000 }, zoom_speed: { from: 0, to: 0 } }, // Ramp up stars again
  { duration: 0, star_count: { from: 50000, to: 50000 }, zoom_speed: { from: 0, to: 0 } }, // Hold 50k static stars forever
];

const cinematic_starfield_timing_sequence_TESTING = [
  { duration: 2, star_count: { from: 0, to: 10000 }, zoom_speed: { from: 0, to: 0.01 } }, // Ramp up stars
];

const active_cinematic_starfield_timing_sequence = cinematic_starfield_timing_sequence;

// Simple timing sequencer - array of [delay_ms, function] pairs
function execute_timing_sequence(sequence) {
  let cumulative_time = 0;

  sequence.forEach(([delay_ms, action]) => {
    cumulative_time += delay_ms;
    console.log(`Scheduling action in ${cumulative_time} ms`);
    setTimeout(action, cumulative_time);
  });
}

function initialize_starfield() {
  const starfield_manager = new CinematicStarfieldManager();
  window.cinematic_starfield_manager = starfield_manager;

  // Create and inject the text element
  const imagine_text_element = document.createElement("div");
  imagine_text_element.id = "imagine_text_element";
  imagine_text_element.innerHTML = '<span class="imagine_bloom_text">Imagine…</span>';
  document.body.appendChild(imagine_text_element);

  // Calculate when starfield animation ends
  let meaningful_duration = 0;
  for (let i = 0; i < active_cinematic_starfield_timing_sequence.length; i++) {
    meaningful_duration += active_cinematic_starfield_timing_sequence[i].duration;
  }
  console.log(`Total meaningful duration: ${meaningful_duration} seconds`);

  // Timing sequence for text and transition effects
  const text_timing_sequence = [
    [
      meaningful_duration * 1000,
      () => {
        imagine_text_element.style.opacity = "1";
      },
    ],

    [
      6000,
      () => {
        // Start fading out the text
        imagine_text_element.style.transition = "opacity 0.5s cubic-bezier(0.4,0,0.2,1)";
        imagine_text_element.style.opacity = "0";
      },
    ],

    [
      600,
      () => {
        // Take snapshot and prepare for shake
        const starfield_canvas = document.getElementById("cinematic_canvas");
        window.cinematic_starfield_manager.stop_cinematic_sequence();
        const snapshot_img = document.createElement("img");
        const data_url = starfield_canvas.toDataURL("image/png");
        snapshot_img.src = data_url;
        snapshot_img.id = "starfield_snapshot_img";
        snapshot_img.style.position = "absolute";
        snapshot_img.style.width = "100vw";
        snapshot_img.style.height = "100vh";
        snapshot_img.style.zIndex = "50";
        starfield_canvas.parentNode.appendChild(snapshot_img);
      },
    ],

    [
      500,
      () => {
        // Initialize the shake effect
        const snapshot_img = document.getElementById("starfield_snapshot_img");
        starfield_manager.starfield_snapshot = snapshot_img;
        window.initialize_shake();
      },
    ],
  ];

  execute_timing_sequence(text_timing_sequence);
}
