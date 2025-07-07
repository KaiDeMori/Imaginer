---
applyTo: "**"
---

# Instructions for Better Comments

- Keep the comments timeless and general.
- Use comments to explain the "why" and "how" of the code, **not** the "what".

## No actual values in the comments, except they are necessary for understanding the code.

GOOD:
// This variable defines the rotation angle in radians.

BAD: 
// Math.PI / 2 (90 degrees) is used to rotate the image by 90 degrees clockwise (in radians).

## No specific dates or version numbers in comments.

GOOD:
// This function processes the image data.

BAD:
// This function processes the image data as of version 1.2.3.

## No specific names in comments, except they are necessary for understanding the code.

GOOD:
// This function processes the image data.

BAD:
// This function processes the image data for the Imaginer project.

## No redundant comments

GOOD:

```javascript
function rotate_image(image, angle) {
   […]
}
```
*(no comment needed, the function name is self-explanatory)*

BAD:

```javascript
// This function rotates an image by a specified angle.
function rotate_image(image, angle) {
   […]
}
```
