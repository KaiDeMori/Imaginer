// gpu_feather_test.js
// Test utility for GPU-side (WebGL) feathered edge pre-processing
// Usage: include in a test HTML file or run in browser console

// Creates a WebGL context, loads an image, applies feathering in a fragment shader, and draws the result to a canvas

function create_feathered_image_webgl(image, feather_size = 32) {
   // Create canvas and WebGL context
   const canvas = document.createElement('canvas');
   canvas.width = image.width;
   canvas.height = image.height;
   const gl = canvas.getContext('webgl');
   if (!gl) throw new Error('WebGL not supported');

   // Vertex shader (simple passthrough)
   const vert_src = `
        attribute vec2 a_pos;
        attribute vec2 a_tex;
        varying vec2 v_tex;
        void main() {
            v_tex = a_tex;
            gl_Position = vec4(a_pos, 0, 1);
        }
    `;
   // Fragment shader (feather alpha at edges, with true circular corners)
   const frag_src = `
        precision mediump float;
        varying vec2 v_tex;
        uniform sampler2D u_image;
        uniform float u_feather;
        void main() {
            vec4 color = texture2D(u_image, v_tex);
            float feather = u_feather;
            float edge_dist = min(min(v_tex.x, 1.0 - v_tex.x), min(v_tex.y, 1.0 - v_tex.y));
            float corner_radius = feather;
            float alpha = 1.0;
            // Check if in a corner region
            bool in_corner = false;
            float d_corner = 0.0;
            if (v_tex.x < corner_radius && v_tex.y < corner_radius) {
                in_corner = true;
                d_corner = length(v_tex - vec2(corner_radius, corner_radius));
            } else if (v_tex.x > 1.0 - corner_radius && v_tex.y < corner_radius) {
                in_corner = true;
                d_corner = length(v_tex - vec2(1.0 - corner_radius, corner_radius));
            } else if (v_tex.x < corner_radius && v_tex.y > 1.0 - corner_radius) {
                in_corner = true;
                d_corner = length(v_tex - vec2(corner_radius, 1.0 - corner_radius));
            } else if (v_tex.x > 1.0 - corner_radius && v_tex.y > 1.0 - corner_radius) {
                in_corner = true;
                d_corner = length(v_tex - vec2(1.0 - corner_radius, 1.0 - corner_radius));
            }
            if (in_corner) {
                alpha = smoothstep(feather, 0.0, d_corner);
            } else {
                alpha = smoothstep(0.0, feather, edge_dist);
            }
            gl_FragColor = vec4(color.rgb, color.a * alpha);
        }
    `;
   // Compile shaders
   function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
   }
   const vs = compile(gl.VERTEX_SHADER, vert_src);
   const fs = compile(gl.FRAGMENT_SHADER, frag_src);
   const prog = gl.createProgram();
   gl.attachShader(prog, vs);
   gl.attachShader(prog, fs);
   gl.linkProgram(prog);
   if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
   gl.useProgram(prog);

   // Quad geometry
   const pos = new Float32Array([
      -1, -1, 0, 0,
      1, -1, 1, 0,
      -1, 1, 0, 1,
      1, 1, 1, 1
   ]);
   const buf = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, buf);
   gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
   const a_pos = gl.getAttribLocation(prog, 'a_pos');
   const a_tex = gl.getAttribLocation(prog, 'a_tex');
   gl.enableVertexAttribArray(a_pos);
   gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 16, 0);
   gl.enableVertexAttribArray(a_tex);
   gl.vertexAttribPointer(a_tex, 2, gl.FLOAT, false, 16, 8);

   // Upload image as texture
   const tex = gl.createTexture();
   gl.bindTexture(gl.TEXTURE_2D, tex);
   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

   // Set uniforms
   gl.uniform1i(gl.getUniformLocation(prog, 'u_image'), 0);
   gl.uniform1f(gl.getUniformLocation(prog, 'u_feather'), feather_size / Math.max(image.width, image.height));

   // Draw
   gl.viewport(0, 0, canvas.width, canvas.height);
   gl.clear(gl.COLOR_BUFFER_BIT);
   gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

   return canvas;
}

// Example usage:
// const img = new window.Image();
// img.src = 'your_image.png';
// img.onload = () => {
//   document.body.appendChild(create_feathered_image_webgl(img, 32));
// };

window.create_feathered_image_webgl = create_feathered_image_webgl;
