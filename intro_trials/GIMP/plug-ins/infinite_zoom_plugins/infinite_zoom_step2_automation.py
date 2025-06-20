#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
GIMP 2.10 Python-Fu Plug-in: Infinite Zoom Step 2 Automation
Automates post-stacking steps for infinite zoom projects.

- Operates on the currently open (active) image in GIMP.
- Upscales all layers to the target size (default: 4096x4096, 4x upscaling).
- Adds center guides for alignment.
- (Hooks for future alignment and mask automation.)
"""

from gimpfu import *

# Configurable upscale factor and interpolation
UPSCALE_FACTOR = 4
INTERPOLATION = INTERPOLATION_NONE  # Nearest-neighbour


def upscale_all_layers(image, upscale_factor=UPSCALE_FACTOR, interpolation=INTERPOLATION):
    width = image.width * upscale_factor // 1
    height = image.height * upscale_factor // 1
    for layer in image.layers:
        pdb.gimp_item_transform_scale(layer, 0, 0, width, height)
    pdb.gimp_image_resize(image, width, height, 0, 0)
    pdb.gimp_message("All layers upscaled to {}x{}.".format(width, height))


def add_center_guides(image):
    width = image.width
    height = image.height
    pdb.gimp_image_add_hguide(image, height // 2)
    pdb.gimp_image_add_vguide(image, width // 2)
    pdb.gimp_message("Center guides added.")


def infinite_zoom_step2_automation(image, drawable):
    # Step 1: Upscale all layers
    upscale_all_layers(image)
    # Step 2: Add center guides
    add_center_guides(image)
    # Step 3: (Hooks for future automation: alignment, masking)
    pdb.gimp_message("Step 2 automation complete. Please proceed with alignment and masking as needed.")


register(
    "python_fu_infinite_zoom_step2_automation",
    "Infinite Zoom Step 2 Automation",
    "Automate upscaling and guide creation for infinite zoom projects.\n\n- Operates on the currently open image.\n- Upscales all layers.\n- Adds center guides.",
    "AIxGIMP Team",
    "AIxGIMP Team",
    "2025",
    "Infinite Zoom Step 2: Automate Layers...",
    "*",
    [
        (PF_IMAGE, "image", "Input image", None),
        (PF_DRAWABLE, "drawable", "Input drawable", None),
    ],
    [],
    infinite_zoom_step2_automation,
    menu="<Image>/AIxGIMP/Infinite Zoom"
)

main()
