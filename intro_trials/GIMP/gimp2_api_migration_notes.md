
# ---
#
# GIMP 2.10 Python-Fu Plug-in API: Key Notes (2025)
#
# This project exclusively supports GIMP 2.10 and the Python-Fu (gimpfu) system.
#
# What is supported (GIMP 2.10 only):
# - `from gimpfu import *` and `register(...)` (Python-Fu system)
# - `pdb.gimp_*` functions and the `pdb` object
# - GIMP 2.10 menu registration and parameter handling
# - Python 2 syntax for plug-ins
#
# Additional notes:
# - To refresh plug-ins: use Filters → Python-Fu → Refresh Scripts or restart GIMP
# - For debugging: start GIMP from a terminal to see errors
#
# ---
#
# **Minimal GIMP 2.10 plug-in requirements:**
# 1. Use `from gimpfu import *`
# 2. Register plug-ins using `register(...)`
# 3. Use `pdb.gimp_*` functions for image and layer operations
# 4. Return the resulting image object to GIMP
#
# GIMP 2.10 API Notes


## Purpose
This document collects technical notes and reference links for developing and maintaining GIMP 2.10 plug-ins and scripts using the Python-Fu (gimpfu) system.


## Key Findings
- GIMP 2.10 supports the Python-Fu (gimpfu) system for plug-ins and scripts.
- Plug-ins should use `from gimpfu import *` and the `register(...)` function for registration.
- Use `pdb.gimp_*` functions for image and layer operations.
- All scripts and plug-ins in this project must be compatible with GIMP 2.10 only.


## Reference URLs
- GIMP 2.10 Python-Fu documentation: https://www.gimp.org/docs/python/
- GIMP-Forum.net (Python-Fu Plugin Development): https://www.gimp-forum.net/Forum-Python-Fu


## Checklist for GIMP 2.10 Plug-ins
- [ ] Ensure all scripts and plug-ins use gimpfu and Python 2 syntax.
- [ ] Register plug-ins using the `register(...)` function.
- [ ] Use `pdb.gimp_*` functions for all image and layer operations.
- [ ] Test plug-ins in GIMP 2.10 and update as needed.


## Notes
- This document should be updated as new information and tips for GIMP 2.10 Python-Fu become available.
- Contributors are encouraged to add working code samples, troubleshooting tips, and additional reference links.
