#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
GIMP 2.10 Python-Fu Plug-in: Import PNG Sequence as Layers
Step 1 of Infinite Zoom Workflow (AIxGIMP)

Reads a user-specified text file containing a list of PNG files (one per line),
imports each PNG as a separate layer in a new GIMP image, and names each layer
according to the file name (without extension).

Future extensions: upscaling, alignment, masking, etc.
"""

from gimpfu import *
import os

def read_file_list(file_list_path):
    """Read a text file and return a list of non-empty, stripped lines."""
    with open(file_list_path, 'r') as f:
        lines = [line.strip() for line in f if line.strip()]
    return lines

def import_png_sequence_as_layers(file_list_path):
    """
    Import PNG files listed in file_list_path as layers in a new GIMP image.
    Each layer is named after the file (without extension).
    """
    png_files = read_file_list(file_list_path)
    if not png_files:
        pdb.gimp_message("No PNG files found in the list.")
        return

    # Load the first image to get dimensions and mode
    first_image_path = png_files[0]
    if not os.path.isfile(first_image_path):
        pdb.gimp_message("File not found: {}".format(first_image_path))
        return
    first_layer = pdb.gimp_file_load_layer(None, first_image_path)
    width = first_layer.width
    height = first_layer.height
    image = pdb.gimp_image_new(width, height, RGB)

    # Import each PNG as a layer
    for png_path in png_files:
        if not os.path.isfile(png_path):
            pdb.gimp_message("File not found: {}".format(png_path))
            continue
        layer = pdb.gimp_file_load_layer(image, png_path)
        # Name the layer after the file (without extension)
        layer_name = os.path.splitext(os.path.basename(png_path))[0]
        layer.name = layer_name
        pdb.gimp_image_insert_layer(image, layer, None, 0)  # Insert at top

    # Display the new image
    gimp.Display(image)
    gimp.displays_flush()

# Register the plug-in with GIMP
register(
    "python_fu_import_png_sequence_as_layers",
    "Import PNG Sequence as Layers",
    "Reads a text file listing PNG files and imports each as a layer in a new image.",
    "AIxGIMP Team",
    "AIxGIMP Team",
    "2025",
    "Import PNG Sequence as Layers...",
    "",
    [
        (PF_STRING, "file_list_path", "Path to text file with PNG file list", ""),
    ],
    [],
    import_png_sequence_as_layers,
    menu="<Image>/AIxGIMP/Infinite Zoom"
)

# For GIMP to recognize the script
main()
