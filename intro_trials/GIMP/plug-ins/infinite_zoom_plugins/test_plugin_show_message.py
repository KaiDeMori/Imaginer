#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Minimal GIMP Python-Fu test plugin.
Shows a message when run from the menu.
"""

from gimpfu import *

def test_plugin_show_message():
    pdb.gimp_message("Hello from minimal test plugin!")

register(
    "python_fu_test_plugin_show_message",
    "Test Plugin: Show Message",
    "Shows a message to confirm Python plug-in loading.",
    "AIxGIMP Team",
    "AIxGIMP Team",
    "2025",
    "Test Plugin: Show Message...",
    "*",
    [],
    [],
    test_plugin_show_message,
    menu="<Image>/AIxGIMP/TESTS"
)

main()
