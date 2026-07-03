/* ============================================================
   Aurora background — vanilla WebGL2 port of react-bits "Aurora"
   Source: reactbits.dev (David Haz) — GLSL shaders ported verbatim,
   ogl runtime replaced with raw WebGL2 (no dependencies).
   Renders flowing warm aurora ribbons into a container element.
   ============================================================ */
(function () {
    "use strict";

    var VERT =
        "#version 300 es\n" +
        "in vec2 position;\n" +
        "void main() { gl_Position = vec4(position, 0.0, 1.0); }\n";

    var FRAG =
        "#version 300 es\n" +
        "precision highp float;\n" +
        "uniform float uTime;\n" +
        "uniform float uAmplitude;\n" +
        "uniform vec3 uColorStops[3];\n" +
        "uniform vec2 uResolution;\n" +
        "uniform float uBlend;\n" +
        "out vec4 fragColor;\n" +
        "vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }\n" +
        "float snoise(vec2 v){\n" +
        "  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);\n" +
        "  vec2 i  = floor(v + dot(v, C.yy));\n" +
        "  vec2 x0 = v - i + dot(i, C.xx);\n" +
        "  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);\n" +
        "  vec4 x12 = x0.xyxy + C.xxzz;\n" +
        "  x12.xy -= i1;\n" +
        "  i = mod(i, 289.0);\n" +
        "  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));\n" +
        "  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);\n" +
        "  m = m * m; m = m * m;\n" +
        "  vec3 x = 2.0 * fract(p * C.www) - 1.0;\n" +
        "  vec3 h = abs(x) - 0.5;\n" +
        "  vec3 ox = floor(x + 0.5);\n" +
        "  vec3 a0 = x - ox;\n" +
        "  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);\n" +
        "  vec3 g;\n" +
        "  g.x  = a0.x  * x0.x  + h.x  * x0.y;\n" +
        "  g.yz = a0.yz * x12.xz + h.yz * x12.yw;\n" +
        "  return 130.0 * dot(m, g);\n" +
        "}\n" +
        "struct ColorStop { vec3 color; float position; };\n" +
        "#define COLOR_RAMP(colors, factor, finalColor) {              \\\n" +
        "  int index = 0;                                            \\\n" +
        "  for (int i = 0; i < 2; i++) {                               \\\n" +
        "     ColorStop currentColor = colors[i];                    \\\n" +
        "     bool isInBetween = currentColor.position <= factor;    \\\n" +
        "     index = int(mix(float(index), float(i), float(isInBetween))); \\\n" +
        "  }                                                         \\\n" +
        "  ColorStop currentColor = colors[index];                   \\\n" +
        "  ColorStop nextColor = colors[index + 1];                  \\\n" +
        "  float range = nextColor.position - currentColor.position; \\\n" +
        "  float lerpFactor = (factor - currentColor.position) / range; \\\n" +
        "  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \\\n" +
        "}\n" +
        "void main() {\n" +
        "  vec2 uv = gl_FragCoord.xy / uResolution;\n" +
        "  ColorStop colors[3];\n" +
        "  colors[0] = ColorStop(uColorStops[0], 0.0);\n" +
        "  colors[1] = ColorStop(uColorStops[1], 0.5);\n" +
        "  colors[2] = ColorStop(uColorStops[2], 1.0);\n" +
        "  vec3 rampColor;\n" +
        "  COLOR_RAMP(colors, uv.x, rampColor);\n" +
        "  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;\n" +
        "  height = exp(height);\n" +
        "  height = (uv.y * 2.0 - height + 0.2);\n" +
        "  float intensity = 0.6 * height;\n" +
        "  float midPoint = 0.20;\n" +
        "  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);\n" +
        "  vec3 auroraColor = intensity * rampColor;\n" +
        "  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);\n" +
        "}\n";

    function hexToRgb(hex) {
        var h = hex.replace("#", "");
        if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        return [
            parseInt(h.substring(0, 2), 16) / 255,
            parseInt(h.substring(2, 4), 16) / 255,
            parseInt(h.substring(4, 6), 16) / 255
        ];
    }

    function compile(gl, type, src) {
        var s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.warn("Aurora shader error:", gl.getShaderInfoLog(s));
            gl.deleteShader(s);
            return null;
        }
        return s;
    }

    function initAurora(container, opts) {
        opts = opts || {};
        var colorStops = opts.colorStops || ["#7a1512", "#ff7a18", "#ff3d2e"];
        var amplitude = opts.amplitude != null ? opts.amplitude : 1.0;
        var blend = opts.blend != null ? opts.blend : 0.5;
        var speed = opts.speed != null ? opts.speed : 0.8;

        var canvas = document.createElement("canvas");
        canvas.setAttribute("aria-hidden", "true");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.display = "block";
        var gl = canvas.getContext("webgl2", {
            alpha: true,
            premultipliedAlpha: true,
            antialias: true
        });
        if (!gl) return null; // graceful: no WebGL2 -> skip, CSS bg remains

        gl.clearColor(0, 0, 0, 0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        var vs = compile(gl, gl.VERTEX_SHADER, VERT);
        var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
        if (!vs || !fs) return null;
        var program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.warn("Aurora link error:", gl.getProgramInfoLog(program));
            return null;
        }
        gl.useProgram(program);

        // Fullscreen triangle
        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        var posLoc = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        var uTime = gl.getUniformLocation(program, "uTime");
        var uAmp = gl.getUniformLocation(program, "uAmplitude");
        var uStops = gl.getUniformLocation(program, "uColorStops");
        var uRes = gl.getUniformLocation(program, "uResolution");
        var uBlend = gl.getUniformLocation(program, "uBlend");

        var stopsFlat = new Float32Array(9);
        function setStops(arr) {
            for (var i = 0; i < 3; i++) {
                var c = hexToRgb(arr[i]);
                stopsFlat[i * 3] = c[0];
                stopsFlat[i * 3 + 1] = c[1];
                stopsFlat[i * 3 + 2] = c[2];
            }
            gl.uniform3fv(uStops, stopsFlat);
        }
        setStops(colorStops);
        gl.uniform1f(uAmp, amplitude);
        gl.uniform1f(uBlend, blend);

        function resize() {
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            var w = Math.max(1, Math.floor(container.offsetWidth * dpr));
            var h = Math.max(1, Math.floor(container.offsetHeight * dpr));
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
                gl.viewport(0, 0, w, h);
                gl.uniform2f(uRes, w, h);
            }
        }
        window.addEventListener("resize", resize);

        container.appendChild(canvas);
        resize();

        var reduce = window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var rafId = 0;
        var running = true;

        function frame(t) {
            if (!running) return;
            gl.uniform1f(uTime, t * 0.001 * speed);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            rafId = requestAnimationFrame(frame);
        }

        if (reduce) {
            // Single static frame — no animation loop.
            gl.uniform1f(uTime, 3.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        } else {
            rafId = requestAnimationFrame(frame);
            document.addEventListener("visibilitychange", function () {
                running = !document.hidden;
                if (running) rafId = requestAnimationFrame(frame);
            });
        }

        canvas.addEventListener("webglcontextlost", function (e) {
            e.preventDefault();
            running = false;
            cancelAnimationFrame(rafId);
        });

        return {
            setColorStops: setStops,
            destroy: function () {
                running = false;
                cancelAnimationFrame(rafId);
                window.removeEventListener("resize", resize);
                if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
                var ext = gl.getExtension("WEBGL_lose_context");
                if (ext) ext.loseContext();
            }
        };
    }

    // Expose for reuse
    window.initAurora = initAurora;

    // Auto-init into the hero (index page only) behind content, screen-blended.
    function auto() {
        var hero = document.querySelector(".hero");
        if (!hero || hero.querySelector(".aurora-layer")) return;
        var layer = document.createElement("div");
        layer.className = "aurora-layer";
        layer.setAttribute("aria-hidden", "true");
        hero.insertBefore(layer, hero.firstChild);
        initAurora(layer, {
            colorStops: ["#7a1512", "#ff7a18", "#ff3d2e"],
            amplitude: 1.1,
            blend: 0.55,
            speed: 0.8
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", auto);
    } else {
        auto();
    }
})();
