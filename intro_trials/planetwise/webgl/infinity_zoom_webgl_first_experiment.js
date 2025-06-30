// Infinity Zoom – WebGL core (skeleton)
// This is a starting point for the WebGL infinity zoom experiment.

// Placeholder for LAYERS_DATA (image paths are relative, base path added dynamically)
const IMAGE_BASE_PATH = '../zoom_images/';

const LAYERS_DATA = [
   { zoom: 25, image: '60_alien_island.png' },
   { zoom: 25, image: '70_alien_forest.png' },
   { zoom: 25, image: '80_alien_village.png' },
   { zoom: 25, image: '90_alien_hut.png' },
   { zoom: 25, image: '100_alien_closeup.png' },
];

// Helper to get the full image path
function get_image_path(filename) {
   return IMAGE_BASE_PATH + filename;
}

// Main entry point
window.addEventListener('DOMContentLoaded', () => {
   const canvas = document.getElementById('zoom-canvas');
   const gl = canvas.getContext('webgl2');
   if (!gl) {
      alert('WebGL2 not supported.');
      return;
   }
   // TODO: Implement resize, image preloading, texture upload, shader setup, animation loop, etc.
   // This is just a skeleton for now.
   resizeCanvasToDisplaySize(canvas);
   window.addEventListener('resize', () => resizeCanvasToDisplaySize(canvas));

   // Load all images, then animate with wild transforms
   let loaded = 0;
   const images = new Array(LAYERS_DATA.length);
   for (let i = 0; i < LAYERS_DATA.length; ++i) {
      images[i] = new window.Image();
      images[i].src = get_image_path(LAYERS_DATA[i].image);
      images[i].onload = () => {
         loaded++;
         if (loaded === LAYERS_DATA.length) startAnim();
      };
      images[i].onerror = () => {
         alert('Failed to load image: ' + images[i].src);
      };
   }

   function startAnim() {
      // Setup shaders
      const vertSrc = `#version 300 es\nprecision mediump float;\nin vec2 a_position;\nin vec2 a_texcoord;\nuniform mat3 u_matrix;\nout vec2 v_texcoord;\nvoid main() {\n  vec3 pos = u_matrix * vec3(a_position, 1.0);\n  v_texcoord = a_texcoord;\n  gl_Position = vec4(pos.xy, 0, 1);\n}`;
      const fragSrc = `#version 300 es\nprecision mediump float;\nuniform sampler2D u_image;\nuniform float u_alpha;\nuniform float u_feather;\nin vec2 v_texcoord;\nout vec4 outColor;\nvoid main() {\n  float min_edge = min(min(v_texcoord.x, 1.0 - v_texcoord.x), min(v_texcoord.y, 1.0 - v_texcoord.y));\n  float feather = u_feather;\n  float edge_alpha = 1.0;\n  if (min_edge < feather) {\n    edge_alpha = min_edge / feather;\n  }\n  vec4 color = texture(u_image, v_texcoord);\n  outColor = vec4(color.rgb, color.a * edge_alpha * u_alpha);\n}`;
      function compileShader(type, src) {
         const sh = gl.createShader(type);
         gl.shaderSource(sh, src);
         gl.compileShader(sh);
         if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(sh));
         }
         return sh;
      }
      const vs = compileShader(gl.VERTEX_SHADER, vertSrc);
      const fs = compileShader(gl.FRAGMENT_SHADER, fragSrc);
      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
         throw new Error(gl.getProgramInfoLog(prog));
      }
      gl.useProgram(prog);

      // Quad geometry (always square, aspect-corrected in matrix)
      const posBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
         -1, -1, 0, 0,
         1, -1, 1, 0,
         -1, 1, 0, 1,
         1, 1, 1, 1
      ]), gl.STATIC_DRAW);
      const a_position = gl.getAttribLocation(prog, 'a_position');
      const a_texcoord = gl.getAttribLocation(prog, 'a_texcoord');
      gl.enableVertexAttribArray(a_position);
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(a_texcoord);
      gl.vertexAttribPointer(a_texcoord, 2, gl.FLOAT, false, 16, 8);

      // Texture setup for all images
      const textures = images.map(img => {
         const tex = gl.createTexture();
         gl.bindTexture(gl.TEXTURE_2D, tex);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
         gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
         return tex;
      });

      // Uniform locations
      const u_matrix = gl.getUniformLocation(prog, 'u_matrix');
      const u_image = gl.getUniformLocation(prog, 'u_image');
      const u_alpha = gl.getUniformLocation(prog, 'u_alpha');
      const u_feather = gl.getUniformLocation(prog, 'u_feather');

      // Enable alpha blending
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      function makeMatrix(img, canvas) {
         // Compute aspect-correct scale
         const imgAspect = img.width / img.height;
         const canvasAspect = canvas.width / canvas.height;
         let sx = 1, sy = 1;
         if (imgAspect > canvasAspect) {
            sy = canvasAspect / imgAspect;
         } else {
            sx = imgAspect / canvasAspect;
         }
         return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
      }

      function mul3(a, b) {
         // 3x3 matrix multiply
         return [
            a[0] * b[0] + a[1] * b[3] + a[2] * b[6], a[0] * b[1] + a[1] * b[4] + a[2] * b[7], a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
            a[3] * b[0] + a[4] * b[3] + a[5] * b[6], a[3] * b[1] + a[4] * b[4] + a[5] * b[7], a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
            a[6] * b[0] + a[7] * b[3] + a[8] * b[6], a[6] * b[1] + a[7] * b[4] + a[8] * b[7], a[6] * b[2] + a[7] * b[5] + a[8] * b[8]
         ];
      }

      function makeTransform(scale, angle) {
         const c = Math.cos(angle), s = Math.sin(angle);
         return [
            scale * c, -scale * s, 0,
            scale * s, scale * c, 0,
            0, 0, 1
         ];
      }

      function draw(time) {
         gl.viewport(0, 0, canvas.width, canvas.height);
         gl.clearColor(0, 0, 0, 1);
         gl.clear(gl.COLOR_BUFFER_BIT);
         // Always draw in original order
         for (let idx = 0; idx < images.length; ++idx) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textures[idx]);
            gl.uniform1i(u_image, 0);
            // Even more radical zoom and rotation
            const t = time * 0.001 + idx * 1.3;
            const scale = 0.5 + 2.0 * Math.abs(Math.sin(t * 0.7 + idx)); // extreme zoom
            const angle = t * (0.5 + 0.2 * idx);
            const aspectMat = makeMatrix(images[idx], canvas);
            const transMat = makeTransform(scale, angle);
            const mat = mul3(transMat, aspectMat);
            gl.uniformMatrix3fv(u_matrix, false, mat);
            // Set feather width (e.g. 8% of image size)
            gl.uniform1f(u_feather, 0.08);
            // Set alpha to 1.0 (fully opaque, feathering only)
            gl.uniform1f(u_alpha, 1.0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
         }
         requestAnimationFrame(draw);
      }
      requestAnimationFrame(draw);
   }
});

function resizeCanvasToDisplaySize(canvas) {
   const dpr = window.devicePixelRatio || 1;
   const width = Math.round(window.innerWidth * dpr);
   const height = Math.round(window.innerHeight * dpr);
   if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
   }
}