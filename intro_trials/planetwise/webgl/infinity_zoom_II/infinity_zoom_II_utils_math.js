// Math and matrix utility stubs for Infinity Zoom II

// Returns an aspect-correct 3x3 matrix for an image and canvas
function make_matrix(img, canvas) {
   const img_aspect = img.width / img.height;
   const canvas_aspect = canvas.width / canvas.height;
   let sx = 1, sy = 1;
   if (img_aspect > canvas_aspect) {
      sy = canvas_aspect / img_aspect;
   } else {
      sx = img_aspect / canvas_aspect;
   }
   return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
}

function make_rotation_matrix(angle) {
   const c = Math.cos(angle);
   const s = Math.sin(angle);
   return [c, -s, 0, s, c, 0, 0, 0, 1];
}

function mat3_mul(a, b) {
   const r = new Array(9);
   for (let i = 0; i < 3; ++i) {
      for (let j = 0; j < 3; ++j) {
         r[i + j * 3] = a[0 + j * 3] * b[i + 0 * 3] + a[1 + j * 3] * b[i + 1 * 3] + a[2 + j * 3] * b[i + 2 * 3];
      }
   }
   return r;
}

// Expose as global for engine usage
window.infinity_zoom_II_utils_math = {
   make_matrix,
   make_rotation_matrix,
   mat3_mul
};
