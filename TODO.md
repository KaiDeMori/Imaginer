# Improve deletion mechanism

WE want to change the way deletion works.
Currently, the user clicks the trash can icon, it gets red and then they click an image and a dialog appears asking if they want to delete the image.

We want to change it to the following flow:
1. User clicks the trash can icon, it gets red "Delete mode enabled"
2. User clicks on images and they get "selected for deletion" (shown with red border).
3. User clicks the trash can icon again, a dialog appears asking if they want to delete the selected images. If they confirm, the images are deleted. If they cancel, the selection is cleared and the trash can icon goes back to normal.

We also have to check the delete logic to make sure the images get properly removed not only from the visible gallery, but also from the underlying data structure that holds the images including the local storage.
Depending on how many images are selected, this might take a second or two, so we should add a loading spinner or some sort of feedback to the user that the deletion is in progress and disable all other interactions until the deletion is complete.