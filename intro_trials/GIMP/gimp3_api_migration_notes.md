# ---
#
# GIMP 3 Python Plug-in API: Key Migration Findings (2025)
#
# What is obsolete (GIMP 2 only, do NOT use in GIMP 3):
# - `from gimpfu import *` and `register(...)` (old Python-Fu system)
# - `pdb.gimp_*` functions and the `pdb` object
# - `Gimp.file_load`, `Gimp.Image.new_from_file` (old-style image loading)
# - Any use of the GIMP 2 menu registration or parameter handling
#
# What is required for GIMP 3 plug-ins:
# - Use PyGObject: `from gi.repository import Gimp, Gio, GLib, Gegl, GObject`
# - Register plug-ins using the `@Gimp.plugin` decorator or XML-based registration
# - Define input parameters in the decorator/registration, not in a `register()` call
# - Use GIMP 3 API for image and layer operations (see official docs for up-to-date methods)
# - Standard Python file I/O for reading file lists, etc.
# - Return the resulting image object to GIMP
# - Use standard Python error handling and logging
#
# Additional notes:
# - The GIMP 3 Python console does not provide `pdb` or legacy Python-Fu commands
# - To refresh plug-ins: use Filters → Development → Rescan Plug-ins or restart GIMP
# - For debugging: use Filters → Development → Show Plug-in Log (if available) or start GIMP from a terminal to see errors
#
# ---
#
# **Minimal GIMP 3 plug-in requirements:**
# 1. PyGObject imports as above
# 2. A function decorated with `@Gimp.plugin` (or XML registration)
# 3. Use of GIMP 3’s new image/layer creation and insertion methods
# 4. Return the resulting image object
# 5. No use of legacy Python-Fu or pdb
# GIMP 3 API Migration Notes

## Purpose
This document collects technical notes, migration tips, and reference links for updating GIMP plug-ins and scripts from the old Python-Fu (gimpfu) system to the new GIMP 3 Python 3 API (PyGObject).

---

## Key Findings
- GIMP 3 no longer supports the old Python-Fu (gimpfu) system. Plug-ins must be written in Python 3 using PyGObject (GObject Introspection).
- Menu registration and parameter handling are different; plug-ins use the new GIMP 3 API and XML-based or decorator-based procedure registration.
- Existing scripts using `from gimpfu import *` and `register(...)` will not work in GIMP 3 and must be rewritten.
- Refer to the official GIMP 3 Python documentation and migration guides for up-to-date examples and best practices.

---

## Reference URLs
- GIMP 3.0 Release Notes: https://www.gimp.org/news/2023/12/20/gimp-3-0-release-notes/
- GIMP-Forum.net (Python Plugin Development): https://www.gimp-forum.net/Thread-Gimp-3-0-Python-Plugin-Development
- GIMP Developer Mailing List: https://www.gimpusers.com/forums/gimp-developer/22941-python-plugins-in-gimp-3-0

---

## Migration Checklist
- [ ] Identify all scripts and plug-ins using gimpfu or Python 2 syntax.
- [ ] Rewrite scripts using Python 3 and PyGObject.
- [ ] Update menu registration and parameter handling to match GIMP 3 conventions.
- [ ] Test plug-ins in GIMP 3 and update as needed.

---

## Notes
- This document should be updated as new information and migration tips become available.
- Contributors are encouraged to add working code samples, troubleshooting tips, and additional reference links.
