export class Intro_remote_control {
  constructor(target_window = window) {
    this.target_window = target_window;
    this.target_document = target_window.document;
    this.target_filename = "Final_recursion.webp";
  }

  async execute() {
    await this.wait_for_app_ready();
    const image_blob = await this.find_intro_picture();
    await this.open_image_covering(image_blob);
  }

  async wait_for_app_ready() {
    while (!this.is_app_ready()) {
      await this.sleep(100);
    }
  }

  is_app_ready() {
    const gallery = this.target_document.getElementById("gallery");
    const gallery_grid = gallery ? gallery.querySelector('div[style*="grid"]') : null;
    const viewer_overlay = this.target_document.getElementById("imaginer-viewer");
    return gallery && gallery_grid && viewer_overlay && this.target_window.sessionStore && this.target_window.expose_internals_for_intro;
  }

  async find_intro_picture() {
    // Use target window fetch to ensure paths are relative to the app
    const response = await this.target_window.fetch(`assets/dummy_pictures/${this.target_filename}`);
    return await response.blob();
  }

  async open_image_covering(blob) {
    const internals = this.target_window.expose_internals_for_intro();
    internals.add_image(blob, "intro_image");
    await this.sleep(100);
    internals.open_image(blob);
    await this.sleep(200);
    await this.apply_covering_mode(blob);
  }

  async apply_covering_mode(blob) {
    const internals = this.target_window.expose_internals_for_intro();
    const viewer = internals.viewer;

    // Use target window createImageBitmap to ensure compatibility
    const bitmap = await this.target_window.createImageBitmap(blob);
    const viewport_width = this.target_window.innerWidth;
    const viewport_height = this.target_window.innerHeight;
    const image_width = bitmap.width;
    const image_height = bitmap.height;

    // Calculate normal fit scale (what the app would normally use)
    const normal_fit_scale = Math.min((viewport_width * 0.9) / image_width, (viewport_height * 0.9) / image_height, 1);

    // Calculate covering scale
    const scale_x = viewport_width / image_width;
    const scale_y = viewport_height / image_height;
    const covering_scale = Math.max(scale_x, scale_y);

    // Set fit_scale to normal, zoom_factor to achieve covering
    viewer.fit_scale = normal_fit_scale;
    viewer.zoom_factor = covering_scale / normal_fit_scale;
    viewer.pan_X = 0;
    viewer.pan_Y = 0;
    viewer.redraw();

    bitmap.close();
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default Intro_remote_control;
