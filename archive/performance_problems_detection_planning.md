# Performance Problems Detection Planning

## Context
Users have reported long loading times and unresponsive pages when the gallery contains hundreds of images. While this indicates good usage, we need a way to detect when the application's performance degrades significantly due to the volume of data.

## Goal
Detect performance degradation dynamically and suggest to the user that they should export their images and clear/reset the gallery to restore responsiveness.

## Approaches

### 1. Initialization Time Measurement (Selected for Early Warning)
Measure the time it takes for the gallery to load images from the database and render them initially.

*   **Mechanism:** Capture `performance.now()` at the start and end of the `loadImages` function.
*   **Trigger:** If the duration exceeds a dynamic threshold (e.g., > 1-2 seconds), trigger the warning.
*   **Pros:** 
    *   Adapts to the user's specific hardware speed (CPU/Disk I/O).
    *   Provides an immediate check upon application startup.

### 2. Scroll Performance / FPS Monitoring (Selected for Runtime Detection)
Monitor the frame rate specifically when the user is interacting with the gallery (scrolling).

*   **Mechanism:** Attach a scroll listener to the gallery grid. Measure the time delta between `requestAnimationFrame` calls during scroll events.
*   **Trigger:** If the frame rate drops consistently below a threshold (e.g., < 30 FPS) during scrolling, trigger the warning.
*   **Pros:** 
    *   Directly measures the "jankiness" and unresponsiveness the user actually feels.
    *   Detects issues that might not be apparent during initial load (e.g., rendering complexity, memory pressure).

### Rejected Approaches

*   **Fixed Item Count:** Rejected because performance is heavily dependent on system specifications (CPU, RAM, GPU). A fixed number (e.g., 300 images) might be too low for a high-end PC or too high for a low-end device.
*   **Main Thread Blocking (Long Tasks API):** Deemed less helpful for this specific scenario compared to direct load time and scroll smoothness.
