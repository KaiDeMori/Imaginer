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
