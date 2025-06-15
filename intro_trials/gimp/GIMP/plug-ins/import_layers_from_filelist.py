from gimpfu import *

def import_layers_from_filelist(filelist_path):
    # Get the current image (must be open in GIMP)
    image = gimp.image_list()[0]
    # Read file list
    with open(filelist_path, 'r') as f:
        files = [line.strip() for line in f if line.strip()]
    for filename in files:
        # Open as layer
        layer = pdb.gimp_file_load_layer(image, filename)
        image.add_layer(layer, 0)  # Add on top; use -1 for bottom

register(
    "python_fu_import_layers_from_filelist",
    "Import layers from a plain text file list",
    "Loads each file in the list as a new layer in the current image.",
    "Your Name", "Your Name", "2025",
    "<Image>/File/Import Layers from File List...",
    "*",
    [
        (PF_FILE, "filelist_path", "Path to file list", "")
    ],
    [],
    import_layers_from_filelist)

main()
