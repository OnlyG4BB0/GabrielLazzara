/* ==========================================================================
   Liquid Glass — the dashersw/liquid-glass-js look, rendered on the live page
   The optics (edge + rim refraction, corner boost, rim ripple, gaussian frost,
   white→grey tint, deep drop shadow) are ported from the fragment shader of
   https://github.com/dashersw/liquid-glass-js (MIT, © Armagan Amcalar).
   Instead of sampling a static html2canvas screenshot, each element gets a
   displacement map computed with the same formulas and applied through
   backdrop-filter, so the glass always shows what is really behind it.
   - Chromium (desktop and Android): full refraction (SVG filters inside backdrop-filter)
   - Safari, Firefox and low-end devices: frost + tint + shadow only
   ========================================================================== */
(function () {
    'use strict';

    const root = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reducedTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)').matches;

    // Same defaults as the library's window.glassControls
    const OPTICS = Object.assign({
        edgeIntensity: 0.01,
        rimIntensity: 0.05,
        baseIntensity: 0.01,
        edgeDistance: 0.15,
        rimDistance: 0.8,
        baseDistance: 0.1,
        cornerBoost: 0.02,
        rippleEffect: 0.1,
        // The shader works in page-texture UVs; this is the texture size (px) the offsets are scaled by
        textureScale: 1000,
    }, window.glassControls || {});

    class Container {
        static instances = [];

        constructor(options = {}) {
            this.type = options.type || 'rounded'; // 'rounded' | 'circle' | 'pill'
            this.element = options.element || document.createElement('div');
            this.upgrade(this.element);
            Container.instances.push(this);
        }

        upgrade(el) {
            if (el.dataset.lgUpgraded === '1') return;
            el.dataset.lgUpgraded = '1';
            el.dataset.lgType = this.type;
            el.classList.add('glass-container');
            if (this.type === 'circle') el.classList.add('glass-container-circle');
            if (this.type === 'pill') el.classList.add('glass-container-pill');
        }
    }

    class Button {
        static instances = [];

        constructor(options = {}) {
            this.type = options.type || 'pill'; // 'pill' | 'circle'
            this.element = options.element || document.createElement('button');
            if (!options.element && options.text) this.element.textContent = options.text;
            if (options.onClick) this.element.addEventListener('click', options.onClick);
            this.upgrade(this.element);
            Button.instances.push(this);
        }

        upgrade(el) {
            if (el.dataset.lgButton === '1') return;
            el.dataset.lgButton = '1';
            el.classList.add('glass-button');
            if (this.type === 'circle') el.classList.add('glass-button-circle');
        }
    }

    window.Container = Container;
    window.Button = Button;

    /* ---------- Surface map ---------- */
    const PANEL_SELECTORS = [
        '.about-copy-card',
        '.bento-item',
        '.timeline-item',
        '.packages-unified',
        '.process-step',
        '.skill-card',
        '.project-card',
        '.case-mockup',
        '.case-content article.glass-panel',
        '.case-metric',
        '.faq-item',
        '.cta-band',
        '.contact-panel',
        '.hero-stats',
        '.legal-article',
        '#cookie-consent',
    ];

    const PILL_SELECTORS = ['#navbar .nav-pill', '.hero-availability', '.about-float-badge', '.navbar-brand'];

    const CIRCLE_SELECTORS = [
        '#theme-toggle',
        '#mobile-menu-btn',
        '.hero-scroll-cue',
        '.bento-item > i',
        '.skill-card h3 i',
        '.faq-chevron',
        '.footer-giant__arrow',
        '.footer-social__link',
    ];

    const BUTTON_SELECTORS = [
        '.btn-primary',
        '.btn-ghost',
        '.filter-btn',
        '.skill-tag',
        '.topic-chip',
        '#copy-email-btn',
        '.project-card a[class*="rounded"]',
        '.contact-panel .inline-flex.glass-panel',
        '.case-cta-secondary',
    ];

    // Elements rendered as liquid glass (the library's Container / Button look)
    const GLASS_SELECTORS = [
        '#navbar .nav-pill',
        '.navbar-brand',
        '#theme-toggle',
        '.lang-toggle',
        '#mobile-menu-btn',
        '.hero-availability',
        '.hero-action-btn.btn-ghost',
        '.hero-stats',
        '.hero-scroll-cue',
        '.project-filters',
        '.case-cta-secondary',
        '.footer-giant__arrow',
        '.footer-social__link',
        '#cookie-consent',
    ];

    function upgradeSurfaces() {
        const each = (selectors, fn) => document.querySelectorAll(selectors.join(',')).forEach(fn);
        each(PANEL_SELECTORS, (el) => new Container({ element: el, type: 'rounded' }));
        each(PILL_SELECTORS, (el) => new Container({ element: el, type: 'pill' }));
        each(CIRCLE_SELECTORS, (el) => new Button({ element: el, type: 'circle' }));
        each(BUTTON_SELECTORS, (el) => new Button({ element: el, type: 'pill' }));
        each(GLASS_SELECTORS, (el) => el.classList.add('liquid-glass'));
    }

    /* ---------- Refraction map (port of the library's fragment shader) ---------- */
    const SVG_NS = 'http://www.w3.org/2000/svg';
    let defs = null;
    let filterCount = 0;

    // Only Chromium renders SVG filters inside backdrop-filter
    const supportsRefraction = (() => {
        const brands = navigator.userAgentData && navigator.userAgentData.brands;
        return Array.isArray(brands) && brands.some((b) => /Chromium/i.test(b.brand));
    })();

    function ensureDefs() {
        if (defs) return defs;
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
        defs = document.createElementNS(SVG_NS, 'defs');
        svg.appendChild(defs);
        document.body.appendChild(svg);
        return defs;
    }

    function radiusOf(el, w, h) {
        const raw = getComputedStyle(el).borderTopLeftRadius || '0';
        const value = parseFloat(raw) || 0;
        const r = raw.trim().endsWith('%') ? (Math.min(w, h) * value) / 100 : value;
        return Math.min(r, w / 2, h / 2);
    }

    /**
     * Per-pixel refraction offset, as in container.js:
     *   total  = edge·e^(−d·edgeDistance) + rim·e^(−d·rimDistance) [+ base when warping]
     *   offset = normal·total + normal·cornerBoost + perpendicular·ripple
     * d is the distance from the shape edge in px; the offset is in page UVs,
     * converted to px with OPTICS.textureScale. Returns the map and its scale.
     */
    function refractionMap(w, h, radius, warp) {
        const o = OPTICS;
        const minDim = Math.min(w, h);
        const isCircle = Math.abs(w - h) < 4 && Math.abs(radius - minDim / 2) < 1;
        const isPill = !isCircle && Math.abs(radius - h / 2) < 2 && w > h + 4;
        const offsets = new Float32Array(w * h * 2);
        let maxOffset = 0;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const px = x + 0.5;
                const py = y + 0.5;
                const u = px / w;
                const v = py / h;
                let sdf;
                let nx;
                let ny;

                if (isPill) {
                    const ax = Math.min(Math.max(px, radius), w - radius);
                    const dx = px - ax;
                    const dy = py - h / 2;
                    const len = Math.hypot(dx, dy);
                    sdf = len - radius;
                    nx = len > 0 ? dx / len : 0;
                    ny = len > 0 ? dy / len : 1;
                } else if (isCircle) {
                    const dx = px - w / 2;
                    const dy = py - h / 2;
                    const len = Math.hypot(dx, dy);
                    sdf = len - radius;
                    nx = len > 0 ? dx / len : 0;
                    ny = len > 0 ? dy / len : 0;
                } else {
                    const qx = Math.abs(px - w / 2) - (w / 2 - radius);
                    const qy = Math.abs(py - h / 2) - (h / 2 - radius);
                    sdf = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
                    // The shader uses the UV direction from the centre for rounded rects
                    const cx = u - 0.5;
                    const cy = v - 0.5;
                    const len = Math.hypot(cx, cy);
                    nx = len > 0 ? cx / len : 0;
                    ny = len > 0 ? cy / len : 0;
                }

                const d = Math.max(-sdf, 0);
                const edge = Math.exp(-d * o.edgeDistance);
                const rim = Math.exp(-d * o.rimDistance);
                const base = warp ? (1 - Math.exp(-d * o.baseDistance)) * o.baseIntensity : 0;
                const total = base + edge * o.edgeIntensity + rim * o.rimIntensity;

                const cornerDistance = Math.max(Math.min(u, 1 - u), Math.min(v, 1 - v)) * minDim;
                const corner = Math.exp(-cornerDistance * 0.3) * o.cornerBoost;
                const ripple = Math.sin((d / minDim) * 25) * o.rippleEffect * rim;

                const ox = (nx * (total + corner) - ny * ripple) * o.textureScale;
                const oy = (ny * (total + corner) + nx * ripple) * o.textureScale;
                const i = (y * w + x) * 2;
                offsets[i] = ox;
                offsets[i + 1] = oy;
                maxOffset = Math.max(maxOffset, Math.abs(ox), Math.abs(oy));
            }
        }

        // feDisplacementMap: P'(x) = P(x + scale·(C − ½)); encode offsets around 128
        const scale = Math.max(2, Math.ceil(maxOffset * 2));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        const img = ctx.createImageData(w, h);
        for (let p = 0, i = 0; p < w * h; p++, i += 2) {
            img.data[p * 4] = Math.round(128 + (offsets[i] / scale) * 255);
            img.data[p * 4 + 1] = Math.round(128 + (offsets[i + 1] / scale) * 255);
            img.data[p * 4 + 2] = 128;
            img.data[p * 4 + 3] = 255;
        }
        ctx.putImageData(img, 0, 0);
        return { href: canvas.toDataURL('image/png'), scale };
    }

    function buildRefraction(el) {
        const w = Math.round(el.offsetWidth);
        const h = Math.round(el.offsetHeight);
        if (w < 8 || h < 8) return;
        const r = radiusOf(el, w, h);
        const key = `${w}x${h}x${Math.round(r)}`;
        if (el._lgKey === key) return;
        el._lgKey = key;

        if (!el._lgFilterId) {
            filterCount += 1;
            el._lgFilterId = `liquid-glass-${filterCount}`;
        }
        const id = el._lgFilterId;
        const container = ensureDefs();
        let filter = container.querySelector(`#${id}`);
        if (!filter) {
            filter = document.createElementNS(SVG_NS, 'filter');
            filter.setAttribute('id', id);
            filter.setAttribute('filterUnits', 'userSpaceOnUse');
            filter.setAttribute('color-interpolation-filters', 'sRGB');
            filter.setAttribute('x', '0');
            filter.setAttribute('y', '0');
            filter.innerHTML =
                '<feImage result="map" preserveAspectRatio="none" x="0" y="0"></feImage>' +
                '<feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap>';
            container.appendChild(filter);
        }
        const { href, scale } = refractionMap(w, h, r, el.dataset.lgWarp === '1');
        filter.setAttribute('width', String(w));
        filter.setAttribute('height', String(h));
        const image = filter.querySelector('feImage');
        image.setAttribute('width', String(w));
        image.setAttribute('height', String(h));
        image.setAttribute('href', href);
        filter.querySelector('feDisplacementMap').setAttribute('scale', String(scale));

        el.style.setProperty('--lg-refraction', `url(#${id})`);
        el.classList.add('lg-refracting');
    }

    function initRefraction(targets) {
        // Low-end devices keep frost + tint only
        const lowEnd = (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory < 4)
            || (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4);
        if (!supportsRefraction || reducedTransparency || lowEnd || !targets.length) return;
        root.classList.add('lg-has-refraction');

        let queued = new Set();
        let raf = 0;
        const flush = () => {
            raf = 0;
            queued.forEach(buildRefraction);
            queued = new Set();
        };
        const queue = (el) => {
            queued.add(el);
            if (!raf) raf = requestAnimationFrame(flush);
        };

        const ro = new ResizeObserver((entries) => entries.forEach((e) => queue(e.target)));
        targets.forEach((el) => {
            ro.observe(el);
            queue(el);
        });
    }

    /* ---------- Liquid indicators (nav + project filters) ---------- */
    function squish(el) {
        if (reducedMotion) return;
        el.classList.remove('lg-squish');
        void el.offsetWidth;
        el.classList.add('lg-squish');
    }

    function initNavIndicator() {
        const indicator = document.querySelector('.nav-indicator');
        if (!indicator) return;
        let last = indicator.style.transform;
        new MutationObserver(() => {
            const next = indicator.style.transform;
            if (next && last && next !== last) squish(indicator);
            last = next;
        }).observe(indicator, { attributes: true, attributeFilter: ['style'] });
    }

    function initFilterThumb() {
        const group = document.querySelector('.project-filters');
        if (!group) return;
        const buttons = [...group.querySelectorAll('.filter-btn')];
        if (!buttons.length) return;

        const thumb = document.createElement('span');
        thumb.className = 'lg-segment-thumb';
        thumb.setAttribute('aria-hidden', 'true');
        group.prepend(thumb);
        group.classList.add('lg-segmented');

        let current = null;
        const place = (animate) => {
            const active = buttons.find((b) => b.classList.contains('filter-active')) || buttons[0];
            thumb.style.width = `${active.offsetWidth}px`;
            thumb.style.height = `${active.offsetHeight}px`;
            thumb.style.transform = `translate3d(${active.offsetLeft}px, ${active.offsetTop}px, 0)`;
            if (animate && current && current !== active) squish(thumb);
            current = active;
        };

        place(false);
        requestAnimationFrame(() => thumb.classList.add('is-ready'));
        const mo = new MutationObserver(() => place(true));
        buttons.forEach((b) => mo.observe(b, { attributes: true, attributeFilter: ['class'] }));
        new ResizeObserver(() => place(false)).observe(group);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => place(false));
    }

    function init() {
        upgradeSurfaces();
        initRefraction([...document.querySelectorAll('.liquid-glass')]);
        initNavIndicator();
        initFilterThumb();
    }

    // Lets a page opt extra elements in: LiquidGlass.apply(el)
    window.LiquidGlass = {
        optics: OPTICS,
        apply(el) {
            el.classList.add('liquid-glass');
            initRefraction([el]);
        },
    };

    // After main.js's own DOMContentLoaded handler, which sets the motion tier (motion-lite)
    if (document.readyState === 'complete') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();
