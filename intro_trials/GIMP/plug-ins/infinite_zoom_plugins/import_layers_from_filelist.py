#!/usr/bin/env python
# -*- coding: utf-8 -*-
from gimpfu import *
import os

def import_layers_from_filelist(filelist_path, output_xcf_path):
    # Read file list
    with open(filelist_path, 'r') as f:
        files = [line.strip() for line in f if line.strip()]
    if not files:
        pdb.gimp_message('No files found in file list.')
        return

    # Open first image to get dimensions and mode
    first_image = pdb.gimp_file_load(files[0], files[0])
    width = pdb.gimp_image_width(first_image)
    height = pdb.gimp_image_height(first_image)
    image_type = first_image.base_type
    upscale_factor = 4
    new_width = width * upscale_factor
    new_height = height * upscale_factor

    # Create new image
    new_image = pdb.gimp_image_new(new_width, new_height, image_type)

    for file_path in files:
        layer_image = pdb.gimp_file_load(file_path, file_path)
        layer = pdb.gimp_image_get_active_layer(layer_image)
        # Scale layer
        pdb.gimp_layer_scale(layer, new_width, new_height, False)
        # Copy layer to new image
        pdb.gimp_edit_copy(layer)
        floating_sel = pdb.gimp_edit_paste(pdb.gimp_image_get_active_layer(new_image), True)
        pasted_layer = pdb.gimp_floating_sel_to_layer(floating_sel)
        pdb.gimp_item_set_name(pasted_layer, os.path.splitext(os.path.basename(file_path))[0])
        pdb.gimp_image_insert_layer(new_image, pasted_layer, None, 0)
        pdb.gimp_image_delete(layer_image)

    # Save as XCF
    pdb.gimp_xcf_save(0, new_image, pdb.gimp_image_get_active_layer(new_image), output_xcf_path, output_xcf_path)
    pdb.gimp_image_delete(new_image)


register(
    "python_fu_import_layers_from_filelist",
    "Import layers from file list and upscale by 4×",
    "Reads a plain text file list, imports each image as a layer, upscales by 4×, and saves as XCF.",
    "Your Name",
    "Your Name",
    "2025",
    "Import Layers from Filelist (4× Upscale)",
    "",
    [
        (PF_FILE, "filelist_path", "Path to file list", None),
        (PF_FILE, "output_xcf_path", "Output XCF file path", None)
    ],
    [],
    import_layers_from_filelist,
    menu="<Image>/File/Import"
)

main()
