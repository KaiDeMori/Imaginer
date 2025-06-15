#!/usr/bin/env python3
"""
GIMP 3 Plug-in: Import Layers from File List
Reads a plain text file (one filename per line) and imports each image as a new layer into the current image.

Usage:
- Place this script in your GIMP 3 plug-ins folder.
- Restart GIMP if needed.
- Access via menu: File > Import Layers from File List

See migration notes: ../GIMP/gimp3_api_migration_notes.md
"""

import gi
import os
from gi.repository import Gimp, Gio, GLib, GObject, GimpUi

class ImportLayersFromFileList(Gimp.PlugIn):
    __gproperties__ = {
        "filelist_path": (
            str,
            "File List Path",
            "Path to the text file containing image filenames (one per line)",
            "",
            GObject.ParamFlags.READWRITE
        )
    }

    def do_query_procedures(self):
        return ["python-fu-import-layers-from-filelist"]

    def do_create_procedure(self, name):
        if name == "python-fu-import-layers-from-filelist":
            proc = Gimp.Procedure.new(self, name, Gimp.PDBProcType.PLUGIN,
                                      self.run, None)
            proc.set_menu_label("Import Layers from File List")
            proc.set_documentation(
                "Import images as layers from a file list.",
                "Reads a text file with one image filename per line and imports each as a new layer.",
                name
            )
            proc.set_attribution("GitHub Copilot", "GitHub Copilot", "2025")
            proc.add_menu_path("<Image>/File/Import Layers from File List")
            proc.add_argument_from_property(self, "filelist_path")
            return proc
        return None

    def run(self, procedure, run_mode, image, n_drawables, drawables, args, data):
        filelist_path = args.index(0)
        if not filelist_path or not os.path.isfile(filelist_path):
            return procedure.new_return_values(Gimp.PDBStatusType.CALLING_ERROR, GLib.Error("Invalid file list path."))
        with open(filelist_path, "r", encoding="utf-8") as f:
            files = [line.strip() for line in f if line.strip()]
        if not files:
            return procedure.new_return_values(Gimp.PDBStatusType.CALLING_ERROR, GLib.Error("File list is empty."))
        for filepath in files:
            if not os.path.isfile(filepath):
                continue
            layer = Gimp.file_load_layer(image, Gio.File.new_for_path(filepath))
            if layer:
                image.insert_layer(layer, None, -1)
        return procedure.new_return_values(Gimp.PDBStatusType.SUCCESS, None)

Gimp.main(ImportLayersFromFileList.__gtype__, [])
