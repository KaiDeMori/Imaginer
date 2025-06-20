#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
GIMP 2.10 Python-Fu Plug-in: Create PNG File List
Helper plug-in for AIxGIMP Infinite Zoom Workflow

Prompts the user to select up to 4 PNG files (all optional).
Outputs a text file (filelist.txt) in the same directory as the first selected file,
listing the selected files (one per line, base names only).
"""

from gimpfu import *
import os

def create_png_file_list(png1, png2, png3, png4):
    # Collect non-empty selections
    png_files = [f for f in [png1, png2, png3, png4] if f and os.path.isfile(f)]
    if not png_files:
        pdb.gimp_message("No files selected.")
        return
    # Use the directory of the first file
    out_dir = os.path.dirname(png_files[0])
    out_path = os.path.join(out_dir, "filelist.txt")
    # Write base names only, one per line
    with open(out_path, 'w') as f:
        for path in png_files:
            f.write(os.path.basename(path) + '\n')
    pdb.gimp_message("Wrote file list to: {}".format(out_path))

register(
    "python_fu_create_png_file_list",
    "Create PNG File List",
    "Select up to 4 PNG files and output a filelist.txt in the same directory as the first file.",
    "AIxGIMP Team",
    "AIxGIMP Team",
    "2025",
    "Create PNG File List...",
    "",
    [
        (PF_FILE, "png1", "PNG file 1", None),
        (PF_FILE, "png2", "PNG file 2", None),
        (PF_FILE, "png3", "PNG file 3", None),
        (PF_FILE, "png4", "PNG file 4", None),
    ],
    [],
    create_png_file_list,
    menu="<Image>/AIxGIMP/Infinite Zoom"
)

main()
