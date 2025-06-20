#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
GIMP 2.10 Python-Fu Plug-in: Infinite Zoom Project Manager
Unified plug-in for creating or opening infinite zoom projects.

- Open existing project: paste/select base directory (loads sequence file and stacks images)
- Create new list: select up to 4 PNGs, writes sequence file, and opens project
"""

from gimpfu import *
import os

def read_file_list(file_list_path):
    with open(file_list_path, 'r') as f:
        lines = [line.strip() for line in f if line.strip()]
    return lines

def stack_images_from_project_file(project_file_path):
    base_dir = os.path.dirname(project_file_path)
    sequence_file = os.path.join(base_dir, "GIMP_infinite_zoom_sequence_files.txt")
    if not os.path.isfile(sequence_file):
        pdb.gimp_message("Sequence file not found in project directory: {}".format(base_dir))
        return
    png_files = read_file_list(sequence_file)
    if not png_files:
        pdb.gimp_message("No PNG files found in sequence file.")
        return
    png_paths = [os.path.join(base_dir, fname) for fname in png_files]
    first_image_path = png_paths[0]
    if not os.path.isfile(first_image_path):
        pdb.gimp_message("File not found: {}".format(first_image_path))
        return
    temp_image = pdb.file_png_load(first_image_path, first_image_path)
    width = temp_image.width
    height = temp_image.height
    image = pdb.gimp_image_new(width, height, RGB)
    pdb.gimp_image_delete(temp_image)
    for png_path in png_paths:
        if not os.path.isfile(png_path):
            pdb.gimp_message("File not found: {}".format(png_path))
            continue
        layer = pdb.gimp_file_load_layer(image, png_path)
        layer_name = os.path.splitext(os.path.basename(png_path))[0]
        layer.name = layer_name
        pdb.gimp_image_insert_layer(image, layer, None, 0)
    gimp.Display(image)
    gimp.displays_flush()

def infinite_zoom_project_manager(mode, project_file, png1, png2, png3, png4):
    if mode == 0:
        # Open existing project using the project file (just stack and display, do not save)
        stack_images_from_project_file(project_file)
    else:
        # Create new list and open project
        png_files = [f for f in [png1, png2, png3, png4] if f and os.path.isfile(f)]
        if not png_files:
            pdb.gimp_message("No files selected.")
            return
        out_dir = os.path.dirname(png_files[0])
        out_path = os.path.join(out_dir, "GIMP_infinite_zoom_sequence_files.txt")
        with open(out_path, 'w') as f:
            for path in png_files:
                f.write(os.path.basename(path) + '\n')
        pdb.gimp_message("Wrote file list to: {}".format(out_path))
        # Save the project file path for future use
        project_file_path = os.path.join(out_dir, "infinite_zoom_project.xcf")
        # Stack and display the image
        base_dir = out_dir
        sequence_file = out_path
        png_files_list = read_file_list(sequence_file)
        if not png_files_list:
            pdb.gimp_message("No PNG files found in sequence file.")
            return
        png_paths = [os.path.join(base_dir, fname) for fname in png_files_list]
        first_image_path = png_paths[0]
        if not os.path.isfile(first_image_path):
            pdb.gimp_message("File not found: {}".format(first_image_path))
            return
        temp_image = pdb.file_png_load(first_image_path, first_image_path)
        width = temp_image.width
        height = temp_image.height
        image = pdb.gimp_image_new(width, height, RGB)
        pdb.gimp_image_delete(temp_image)
        for png_path in png_paths:
            if not os.path.isfile(png_path):
                pdb.gimp_message("File not found: {}".format(png_path))
                continue
            layer = pdb.gimp_file_load_layer(image, png_path)
            layer_name = os.path.splitext(os.path.basename(png_path))[0]
            layer.name = layer_name
            pdb.gimp_image_insert_layer(image, layer, None, 0)
        # Save the image as 'infinite_zoom_project.xcf' in the base directory, but do not overwrite if it exists
        xcf_path = os.path.join(base_dir, "infinite_zoom_project.xcf")
        if os.path.exists(xcf_path):
            pdb.gimp_message("Project file already exists and will not be overwritten: {}".format(xcf_path))
        else:
            pdb.gimp_xcf_save(0, image, image.active_drawable, xcf_path, xcf_path)
            pdb.gimp_message("Project saved as: {}".format(xcf_path))
        gimp.Display(image)
        gimp.displays_flush()

register(
    "python_fu_infinite_zoom_project_manager",
    "Infinite Zoom Project Manager",
    "Open an existing infinite zoom project or create a new one.\n\n- To open: select the project file (infinite_zoom_project.xcf, expects GIMP_infinite_zoom_sequence_files.txt in the same directory).\n- To create: select up to 4 PNGs; the first sets the base directory.",
    "AIxGIMP Team",
    "AIxGIMP Team",
    "2025",
    "Infinite Zoom Project Manager...",
    "",
    [
        (PF_OPTION, "mode", "Action", 0, ["Open existing project", "Create new list & open"]),
        (PF_LABEL, "label_open", "--- Open Mode ---"),
        (PF_FILE, "project_file", "Project file (for open mode only)", None),
        (PF_LABEL, "label_create", "--- Create Mode ---"),
        (PF_FILE, "png1", "PNG file 1 (sets base directory, for create mode only)", None),
        (PF_FILE, "png2", "PNG file 2 (for create mode only)", None),
        (PF_FILE, "png3", "PNG file 3 (for create mode only)", None),
        (PF_FILE, "png4", "PNG file 4 (for create mode only)", None),
    ],
    [],
    infinite_zoom_project_manager,
    menu="<Image>/AIxGIMP/Infinite Zoom"
)

main()
