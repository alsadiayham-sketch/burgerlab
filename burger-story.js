/* =========================================================================
   Burger Lab - Cinematic scroll-scrubbed intro engine (frame-on-canvas)
   Instead of seeking a <video> (unreliable across browsers), the grill clip
   is pre-extracted into a numbered image sequence and the matching frame is
   drawn to a <canvas> as the user scrolls. This works identically in Chrome,
   Edge, Firefox, Safari and on mobile, and needs no HTTP Range support.
   A 3D camera (CSS transform on the wrapper) adds push-in / drift drama.
     0.00-0.10  intro : brand copy over the grill, camera pushed in
     0.10-0.86  cook  : copy fades, camera drifts while the frames advance
     0.86-1.00  ready : camera settles, brand + CTA fade back in -> menu
   ========================================================================= */
(function () {
    "use strict";

    var section = document.querySelector(".burger-intro");
    if (!section) return;
    var camera  = section.querySelector(".bi-camera");
    var canvas  = section.querySelector(".bi-video");
    var glow    = section.querySelector(".bi-glow");
    var embers  = section.querySelector(".bi-embers");
    var scrim   = section.querySelector(".bi-scrim");
    var copy    = section.querySelector(".bi-copy");
    var cue     = section.querySelector(".bi-cue");
    var caption = section.querySelector(".bi-caption");
    var capSpan = caption ? caption.querySelector("span") : null;
    if (!camera || !canvas || !canvas.getContext) return;

    var ctx = canvas.getContext("2d");
    var reduce = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---- frame sequence ---- */
    var FRAME_COUNT = 143;            /* files: frames/f_001.jpg .. f_143.jpg */
    var FRAME_DIR = "frames/";
    function frameName(i) {
        var n = String(i + 1);
        while (n.length < 3) n = "0" + n;
        return FRAME_DIR + "f_" + n + ".jpg";
    }
    var imgs = new Array(FRAME_COUNT);
    var ready = new Array(FRAME_COUNT);
    var loadedCount = 0;
    var lastDrawn = -1;

    /* ---- helpers ---- */
    function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function seg(v, a, b) { return clamp01((v - a) / (b - a)); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    function drawFrame(i) {
        i = Math.max(0, Math.min(FRAME_COUNT - 1, i));
        /* fall back to the nearest already-loaded frame while loading */
        if (!ready[i]) {
            var j = i;
            while (j >= 0 && !ready[j]) j--;
            if (j < 0) { j = i; while (j < FRAME_COUNT && !ready[j]) j++; }
            if (j < 0 || j >= FRAME_COUNT || !ready[j]) return;
            i = j;
        }
        if (i === lastDrawn) return;
        lastDrawn = i;
        ctx.drawImage(imgs[i], 0, 0, canvas.width, canvas.height);
    }

    /* ---- camera keyframes: {p, s(scale), x/y(% translate), rx/ry/rz(deg)} ---- */
    var CAM = [
        { p: 0.00, s: 1.16, x: 0,  y: 3,  rx: 6,  ry: -3, rz: -1 },
        { p: 0.10, s: 1.20, x: 1,  y: 3,  rx: 6,  ry: 2,  rz: 1  },
        { p: 0.26, s: 1.02, x: -2, y: 0,  rx: 2,  ry: -5, rz: 0  },
        { p: 0.42, s: 1.14, x: 2,  y: -1, rx: -2, ry: 5,  rz: 1  },
        { p: 0.58, s: 1.05, x: -1, y: 0,  rx: 3,  ry: -4, rz: -1 },
        { p: 0.72, s: 1.22, x: 1,  y: -2, rx: -3, ry: 3,  rz: 2  },
        { p: 0.86, s: 1.08, x: 0,  y: 0,  rx: 1,  ry: 0,  rz: 0  },
        { p: 1.00, s: 1.14, x: 0,  y: -2, rx: 2,  ry: 0,  rz: 0  }
    ];
    function camAt(p) {
        var a = CAM[0];
        for (var i = 1; i < CAM.length; i++) {
            var b = CAM[i];
            if (p <= b.p) {
                var t = easeInOut((p - a.p) / ((b.p - a.p) || 1));
                return {
                    s: lerp(a.s, b.s, t), x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t),
                    rx: lerp(a.rx, b.rx, t), ry: lerp(a.ry, b.ry, t), rz: lerp(a.rz, b.rz, t)
                };
            }
            a = b;
        }
        return CAM[CAM.length - 1];
    }

    /* ---- caption ---- */
    var curCap = null;
    function setCaption(text) {
        if (text === curCap) return;
        curCap = text;
        if (!caption) return;
        if (text) { if (capSpan) capSpan.textContent = text; caption.style.opacity = "1"; }
        else caption.style.opacity = "0";
    }

    /* ---- the frame ---- */
    function render(p) {
        var c = camAt(p);
        camera.style.transform =
            "translate(" + c.x.toFixed(2) + "%," + c.y.toFixed(2) + "%) scale(" +
            c.s.toFixed(3) + ") rotateX(" + c.rx.toFixed(2) + "deg) rotateY(" +
            c.ry.toFixed(2) + "deg) rotateZ(" + c.rz.toFixed(2) + "deg)";

        drawFrame(Math.round(clamp01(p) * (FRAME_COUNT - 1)));

        /* warmth */
        if (glow)   glow.style.opacity   = (0.35 + 0.35 * Math.sin(clamp01(p) * Math.PI)).toFixed(3);
        if (embers) embers.style.opacity = (0.85 * (1 - seg(p, 0.86, 1.0))).toFixed(3);

        /* brand copy book-ends the story */
        var vis = Math.max(1 - seg(p, 0.10, 0.22), seg(p, 0.86, 0.97));
        if (copy) {
            copy.style.opacity = vis.toFixed(3);
            copy.style.transform = "translateY(" + (-24 * (1 - vis)).toFixed(1) + "px)";
            copy.style.pointerEvents = vis < 0.08 ? "none" : "auto";
        }
        if (scrim) scrim.style.opacity = (0.24 + 0.4 * vis).toFixed(3);
        if (cue)   cue.style.opacity   = (1 - seg(p, 0.03, 0.12)).toFixed(3);

        /* captions narrate the cook */
        if (p < 0.12)       setCaption("");
        else if (p < 0.42)  setCaption("\u0628\u0646\u0634\u0648\u064A \u0639\u0644\u0649 \u0627\u0644\u0641\u062D\u0645 \uD83D\uDD25"); /* grilling on charcoal */
        else if (p < 0.70)  setCaption("\u062F\u062E\u0627\u0646 \u0648\u0637\u0639\u0645 \u0623\u0635\u0644\u064A \uD83D\uDE0B");       /* smoke & authentic taste */
        else if (p < 0.86)  setCaption("\u0637\u0627\u0632\u0629 \u0639\u0644\u0649 \u0637\u0644\u0628\u0643 \uD83C\uDF54");             /* fresh, made to order */
        else                setCaption("");
    }

    /* ---- scroll wiring ---- */
    function progress() {
        var rect = section.getBoundingClientRect();
        var total = section.offsetHeight - window.innerHeight;
        if (total <= 0) return 0;
        return clamp01(-rect.top / total);
    }
    var ticking = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () { render(progress()); ticking = false; });
    }

    /* ---- preload the sequence ---- */
    function preload() {
        for (var i = 0; i < FRAME_COUNT; i++) {
            (function (idx) {
                var im = new Image();
                im.decoding = "async";
                im.onload = function () {
                    ready[idx] = true;
                    loadedCount++;
                    /* keep the visible frame fresh as images arrive */
                    var want = Math.round(clamp01(progress()) * (FRAME_COUNT - 1));
                    if (idx === want || lastDrawn < 0) { lastDrawn = -1; render(progress()); }
                };
                im.src = frameName(idx);
                imgs[idx] = im;
            })(i);
        }
    }

    if (reduce) {                     /* static hero on a mid frame */
        preload();
        var first = new Image();
        first.onload = function () { ctx.drawImage(first, 0, 0, canvas.width, canvas.height); };
        first.src = frameName(Math.round(FRAME_COUNT * 0.45));
        return;
    }

    section.classList.add("js-on");
    preload();
    render(progress());
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () { render(progress()); });
    window.addEventListener("load", function () { render(progress()); });
})();
