/* ============================================================
   Burger Lab — Restaurant FX engine (vanilla, dependency-free)
   - Global animated background layer
   - Hero ember + floating-food canvas particles
   - Cursor-follow glow + card spotlight
   - Scroll reveal (IntersectionObserver)
   - Cart badge / total change "bump" feedback
   Safe & additive: no dependency on app internals; self-guards
   for reduced-motion and hidden tabs.
   ============================================================ */
(function () {
    "use strict";

    var reduceMotion = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- 1. Global animated background ---------- */
    function buildBackground() {
        if (document.querySelector(".resto-bg")) return;
        var bg = document.createElement("div");
        bg.className = "resto-bg";
        bg.setAttribute("aria-hidden", "true");
        bg.innerHTML =
            '<div class="resto-grain"></div>' +
            '<div class="resto-blob b1"></div>' +
            '<div class="resto-blob b2"></div>' +
            '<div class="resto-blob b3"></div>';
        document.body.insertBefore(bg, document.body.firstChild);
    }

    /* ---------- 2. Hero particles (embers + floating food) ---------- */
    function buildHero() {
        var hero = document.querySelector(".hero");
        if (!hero) return;

        // Cursor-follow glow + steam wisps
        var glow = document.createElement("div");
        glow.className = "hero-cursor-glow";
        glow.setAttribute("aria-hidden", "true");
        hero.appendChild(glow);

        ["s1", "s2", "s3"].forEach(function (c) {
            var s = document.createElement("div");
            s.className = "hero-steam " + c;
            s.setAttribute("aria-hidden", "true");
            hero.appendChild(s);
        });

        hero.addEventListener("mousemove", function (e) {
            var r = hero.getBoundingClientRect();
            glow.style.left = (e.clientX - r.left) + "px";
            glow.style.top = (e.clientY - r.top) + "px";
        });

        if (reduceMotion) return;

        // Canvas particle field
        var canvas = document.createElement("canvas");
        canvas.className = "hero-particles";
        canvas.setAttribute("aria-hidden", "true");
        hero.insertBefore(canvas, hero.firstChild);
        var ctx = canvas.getContext("2d");

        var foods = ["\uD83C\uDF54", "\uD83C\uDF5F", "\uD83E\uDDC0", "\uD83C\uDF45", "\uD83E\uDD5B", "\uD83C\uDF2F"]; // 🍔🍟🧀🍅🥛🌯
        var particles = [];
        var running = true;

        function size() {
            canvas.width = hero.clientWidth;
            canvas.height = hero.clientHeight;
        }
        size();
        window.addEventListener("resize", size);

        function spawn(initial) {
            var isFood = Math.random() < 0.28;
            return {
                x: Math.random() * canvas.width,
                y: initial ? Math.random() * canvas.height : canvas.height + 20,
                r: isFood ? 12 + Math.random() * 12 : 1 + Math.random() * 2.5,
                vy: -(0.3 + Math.random() * 0.9),
                vx: (Math.random() - 0.5) * 0.4,
                life: 0,
                ttl: 200 + Math.random() * 260,
                food: isFood ? foods[(Math.random() * foods.length) | 0] : null,
                hue: 20 + Math.random() * 25,
                spin: (Math.random() - 0.5) * 0.02,
                rot: Math.random() * Math.PI
            };
        }

        var target = Math.min(46, Math.round((canvas.width * canvas.height) / 26000));
        for (var i = 0; i < target; i++) particles.push(spawn(true));

        function frame() {
            if (!running) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life++;
                p.rot += p.spin;
                var fade = Math.min(1, p.life / 40) * Math.max(0, 1 - p.life / p.ttl);

                if (p.food) {
                    ctx.save();
                    ctx.globalAlpha = fade * 0.55;
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rot);
                    ctx.font = p.r * 2 + "px serif";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(p.food, 0, 0);
                    ctx.restore();
                } else {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fillStyle = "hsla(" + p.hue + ",100%,60%," + (fade * 0.9) + ")";
                    ctx.shadowColor = "rgba(255,140,0,0.8)";
                    ctx.shadowBlur = 8;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }

                if (p.y < -30 || p.life > p.ttl) particles[i] = spawn(false);
            }
            requestAnimationFrame(frame);
        }
        frame();

        document.addEventListener("visibilitychange", function () {
            running = !document.hidden;
            if (running) frame();
        });
    }

    /* ---------- 3. Menu card spotlight (mouse position) ---------- */
    function cardSpotlight() {
        document.addEventListener("mousemove", function (e) {
            var card = e.target.closest && e.target.closest(".menu-item-card");
            if (!card) return;
            var r = card.getBoundingClientRect();
            card.style.setProperty("--mx", (e.clientX - r.left) + "px");
            card.style.setProperty("--my", (e.clientY - r.top) + "px");
        });
    }

    /* ---------- 4. Scroll reveal ---------- */
    function scrollReveal() {
        var targets = document.querySelectorAll(
            ".section-head, .info-card, .about-copy, .contact-actions, .menu-toolbar, .checkout-card, .fx-steps"
        );
        if (!targets.length) return;
        if (reduceMotion || !("IntersectionObserver" in window)) {
            targets.forEach(function (t) { t.classList.add("in-view"); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) {
                    en.target.classList.add("in-view");
                    io.unobserve(en.target);
                }
            });
        }, { threshold: 0.12 });
        targets.forEach(function (t, i) {
            t.classList.add("fx-reveal");
            t.style.transitionDelay = Math.min(i % 6, 5) * 60 + "ms";
            io.observe(t);
        });
    }

    /* ---------- 5. Value change "bump" feedback ---------- */
    function watchValue(selector) {
        var el = typeof selector === "string"
            ? document.querySelector(selector) : selector;
        if (!el) return;
        var last = el.textContent;
        var mo = new MutationObserver(function () {
            if (el.textContent !== last) {
                last = el.textContent;
                el.classList.remove("fx-bump");
                void el.offsetWidth; // reflow to restart animation
                el.classList.add("fx-bump");
            }
        });
        mo.observe(el, { childList: true, characterData: true, subtree: true });
    }
    function bumps() {
        ["#cartBadge", "#cartTotal"].forEach(watchValue);
        // Checkout totals are re-rendered; observe container and rebind.
        var checkout = document.getElementById("checkoutContent");
        if (checkout) {
            var rebind = function () {
                var t = checkout.querySelector(".summary-row.total strong");
                if (t) watchValue(t);
            };
            new MutationObserver(rebind).observe(checkout, { childList: true, subtree: true });
            rebind();
        }
    }

    /* ---------- 6. Checkout order-steps strip ---------- */
    function checkoutSteps() {
        var content = document.getElementById("checkoutContent");
        if (!content) return;
        var inject = function () {
            var shell = content.querySelector(".checkout-shell");
            if (!shell || shell.querySelector(".fx-steps")) return;
            var steps = document.createElement("div");
            steps.className = "fx-steps";
            steps.innerHTML =
                '<span class="fx-step done"><span class="fx-step-num">1</span> السلة</span>' +
                '<span class="fx-step-divider"></span>' +
                '<span class="fx-step done"><span class="fx-step-num">2</span> بياناتك</span>' +
                '<span class="fx-step-divider"></span>' +
                '<span class="fx-step"><span class="fx-step-num">3</span> تأكيد الطلب</span>';
            shell.insertBefore(steps, shell.firstChild);
        };
        new MutationObserver(inject).observe(content, { childList: true, subtree: true });
        inject();
    }

    /* ---------- init ---------- */
    function init() {
        buildBackground();
        buildHero();
        cardSpotlight();
        scrollReveal();
        bumps();
        checkoutSteps();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
