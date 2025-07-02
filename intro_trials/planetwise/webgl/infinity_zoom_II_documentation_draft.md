-----
NEW PROJECT
"Infinity Zoom II"
*DRAFT*
-----


# intro sequence

## init webgl canvas
 - fully black

## load first X layers in gpu
 -  pre-calculation of visible layers for the first layer
    * assuming the first layer has scale 1.0:
      Which of the following layers have to be shown?
    * if (draw_size > LAYERED_ZOOM_MINIMUM_RENDER_SIZE) (in pixels) a layer has to be visible
 - load visible layers in GPU
 - not showing them, yet

## global rotation starts
 - the exact rotation value when the first image is shown is not relevant
 - the only thing relevant is that the scene rotates all the time

## show first layer (planet)
 - starts "far away"
    * extremely zoomed-out -> the image is tiny
    * one pixel size
 - zooms-in (gets bigger) very quickly (~.5 seconds)
 - stops zooming when scale 1
    * fills the viewport from the inside
    * no cropping, depending on screen AR letter or pillarbox will occur
    * still rotating, of course

## next layers
 - calculation which of the next layers have to be shown
    * draw_size > LAYERED_ZOOM_MINIMUM_RENDER_SIZE (in pixels)
    * they should already be in the gpu from the pre-calculation step
 - soft fade-in of the visible layers
    * fade-in duration 0.5 seconds
 - keep this for another 0.5 seconds
    * planet and next x layers stay stationary
    * still rotating, of course

## end of intro
 - after ~1 second (0.5 + 0.5 + some overhead) the intro is finished
 - the exact duration of the intro is not of importance

## the actual zoom-in
 - begin of the main zoom-in animation
 - layer by layer the zoom-in gets deeper
 - until last layer is reached (an alien lying in the grass)
 - the zoom stops when the last layer is covering the viewport
 - the rotation now also stops (in whatever angle it was)

### general zoom-in progression

planet -> ocean -> atoll -> island -> forest -> alien

This does not correspond 1:1 to layers and is just for better understanding.

## FIN

-----

# general concepts

## single rotation value
 - every image has to be rotated the same amount
 - synchronous rotation

## constant rotation
 - the scene (every image drawn) constantly rotates slowly
 - slowly means PI/60 radians per second
 - rotation only stops when the last layer fully covers the viewport

## usage of mipmaps
 - LINEAR_MIPMAP_LINEAR

## Visibility
 - If a layer *would* be drawn smaller than LAYERED_ZOOM_MINIMUM_RENDER_SIZE, then it is not shown — yet.

# Glossary
These are the only terms to be used when describing certain concepts.

## Layers
 - Absolute: first, second, third layer etc
 - Relatvive: previous, current, next layer
 - By name: conceptual name like "planet"
 - **NO** "top", "bottom" or any other wording.

## "scale"
 - each layer has it's own scale at which it is shown.
 - If layer X is shown with a scale of one:
  * It is fully visible and touches he viewport from inside.
  * Unless the viewport is exactly square, there will be  either letterboxing or pillarboxing.

## "covering"
 - A layer completely covers the viewport.
 - it's scale is big enough, that it is bigger than the viewport in both dimensions.
 - very dependent on concrete screen parameters

## logging
 - a custom `log(msg)` method is available in the global context
 - takes one argument: the fully formatted message

## initial "zoom" value for each layer
 - each layer has an initial "zoom" value defined, additionally to the image
 - The "zoom" for each layer determines how much the current layer is smaller than the previous one in percent.

Example: If the second layer has "zoom:25", then the second layer is 25% smaller (in width & height) than the first layer.

### Axioms
> The planet is always the first layer.

> The alien lying in the grass is always the last layer.

> If the current layer fully covers the viewport ("is covering"), the previous layer can be discarded (since it has no pixels on the screen left).

-----