/* ==========================================================================
   Liquid Glass — Apple-style material for the portfolio
   - Tags surfaces with the glass classes used by css/liquid-glass.css
   - Real edge refraction on Chromium: an SVG displacement map per control,
     applied through backdrop-filter (other browsers keep the CSS glass)
   - Specular light that follows the pointer on desktop
   - Liquid "squish" on the moving nav indicator and the project filter thumb
   ========================================================================== */
(function () {
    'use strict';

    const root = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reducedTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

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

            // Rim + caustic layer for panels (painted by CSS, no backdrop cost)
            if (this.type === 'rounded' && !el.querySelector(':scope > .lg-refract-layer')) {
                const layer = document.createElement('ins');
                layer.className = 'lg-refract-layer';
                layer.setAttribute('aria-hidden', 'true');
                el.appendChild(layer);
            }
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

    // Floating controls: strongest material, real refraction where supported
    const CONTROL_SELECTORS = [
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
        '.footer-giant__arrow',
        '.footer-social__link',
        '.case-cta-secondary',
        '#cookie-consent',
    ];

    function upgradeSurfaces() {
        const each = (selectors, fn) => document.querySelectorAll(selectors.join(',')).forEach(fn);
        each(PANEL_SELECTORS, (el) => new Container({ element: el, type: 'rounded' }));
        each(PILL_SELECTORS, (el) => new Container({ element: el, type: 'pill' }));
        each(CIRCLE_SELECTORS, (el) => new Button({ element: el, type: 'circle' }));
        each(BUTTON_SELECTORS, (el) => new Button({ element: el, type: 'pill' }));
        each(CONTROL_SELECTORS, (el) => el.classList.add('lg-control'));
    }

    /* ---------- Edge refraction (Chromium only) ---------- */
    // Only Chromium renders SVG filters inside backdrop-filter; elsewhere the CSS glass stays.
    const supportsLens = (() => {
        const brands = navigator.userAgentData && navigator.userAgentData.brands;
        return Array.isArray(brands) && brands.some((b) => /Chromium/i.test(b.brand));
    })();

    const SVG_NS = 'http://www.w3.org/2000/svg';
    let lensDefs = null;
    let lensCount = 0;

    function ensureDefs() {
        if (lensDefs) return lensDefs;
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
        lensDefs = document.createElementNS(SVG_NS, 'defs');
        svg.appendChild(lensDefs);
        document.body.appendChild(svg);
        return lensDefs;
    }

    function radiusOf(el, w, h) {
        const raw = getComputedStyle(el).borderTopLeftRadius || '0';
        const value = parseFloat(raw) || 0;
        const r = raw.trim().endsWith('%') ? (Math.min(w, h) * value) / 100 : value;
        return Math.min(r, w / 2, h / 2);
    }

    /**
     * Displacement map of a convex glass edge: inside a band ("bezel") along the
     * rounded-rect border, each pixel samples the backdrop slightly towards the
     * centre, strongest at the rim — the bent, magnified edge of real glass.
     * R/G encode x/y offset around a neutral 128.
     */
    function lensMap(w, h, r, bezel) {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        const img = ctx.createImageData(w, h);
        const px = img.data;
        const hw = w / 2;
        const hh = h / 2;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = (y * w + x) * 4;
                const cx = x + 0.5 - hw;
                const cy = y + 0.5 - hh;
                const ax = Math.abs(cx);
                const ay = Math.abs(cy);
                const qx = ax - (hw - r);
                const qy = ay - (hh - r);
                let dist;
                let nx;
                let ny;

                if (qx > 0 && qy > 0) {
                    const len = Math.hypot(qx, qy) || 1;
                    dist = r - len;
                    nx = (qx / len) * Math.sign(cx);
                    ny = (qy / len) * Math.sign(cy);
                } else if (hw - ax < hh - ay) {
                    dist = hw - ax;
                    nx = Math.sign(cx);
                    ny = 0;
                } else {
                    dist = hh - ay;
                    nx = 0;
                    ny = Math.sign(cy);
                }

                let dx = 0;
                let dy = 0;
                if (dist >= 0 && dist < bezel) {
                    const m = Math.pow(1 - dist / bezel, 1.8);
                    dx = -nx * m;
                    dy = -ny * m;
                }
                px[i] = 128 + Math.round(dx * 127);
                px[i + 1] = 128 + Math.round(dy * 127);
                px[i + 2] = 128;
                px[i + 3] = 255;
            }
        }
        ctx.putImageData(img, 0, 0);
        return canvas.toDataURL('image/png');
    }

    function buildLens(el) {
        const w = Math.round(el.offsetWidth);
        const h = Math.round(el.offsetHeight);
        if (w < 8 || h < 8) return;
        if (el._lgLensSize === `${w}x${h}`) return;
        el._lgLensSize = `${w}x${h}`;

        const r = radiusOf(el, w, h);
        const bezel = Math.max(6, Math.min(h * 0.34, r * 0.9 || h * 0.34, 22));
        const scale = Math.round(bezel * 2.2);

        if (!el._lgLensId) {
            lensCount += 1;
            el._lgLensId = `lg-lens-${lensCount}`;
        }
        const id = el._lgLensId;
        const defs = ensureDefs();
        let filter = defs.querySelector(`#${id}`);
        if (!filter) {
            filter = document.createElementNS(SVG_NS, 'filter');
            filter.setAttribute('id', id);
            filter.setAttribute('filterUnits', 'userSpaceOnUse');
            filter.setAttribute('color-interpolation-filters', 'sRGB');
            filter.innerHTML =
                '<feImage result="map" preserveAspectRatio="none" x="0" y="0"></feImage>' +
                '<feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap>';
            defs.appendChild(filter);
        }
        ['x', 'y'].forEach((a) => filter.setAttribute(a, '0'));
        filter.setAttribute('width', String(w));
        filter.setAttribute('height', String(h));
        const image = filter.querySelector('feImage');
        image.setAttribute('width', String(w));
        image.setAttribute('height', String(h));
        image.setAttribute('href', lensMap(w, h, r, bezel));
        filter.querySelector('feDisplacementMap').setAttribute('scale', String(scale));

        el.style.setProperty('--lg-lens', `url(#${id})`);
        el.classList.add('lg-lens');
    }

    function initLenses() {
        // Desktop-class devices only: phones and low-end machines keep the cheaper CSS glass
        const liteDevice = root.classList.contains('motion-lite')
            || window.matchMedia('(hover: none), (pointer: coarse), (max-width: 768px)').matches;
        if (!supportsLens || reducedTransparency || liteDevice) return;
        const targets = document.querySelectorAll('.lg-control');
        if (!targets.length) return;
        root.classList.add('lg-has-lens');

        let queued = new Set();
        let raf = 0;
        const flush = () => {
            raf = 0;
            queued.forEach(buildLens);
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

    /* ---------- Specular light following the pointer ---------- */
    function initSpecularLight() {
        if (reducedMotion || !finePointer) return;

        let active = null;
        let rect = null;
        let raf = 0;
        let lx = 0;
        let ly = 0;

        const surfaces = document.querySelectorAll('.lg-control, .glass-container[data-lg-type="rounded"], .glass-button');
        surfaces.forEach((el) => {
            el.addEventListener('pointerenter', () => {
                active = el;
                rect = el.getBoundingClientRect();
            }, { passive: true });
            el.addEventListener('pointerleave', () => {
                if (active !== el) return;
                el.style.removeProperty('--lg-angle');
                active = null;
                rect = null;
            }, { passive: true });
        });

        window.addEventListener('scroll', () => {
            if (active) rect = active.getBoundingClientRect();
        }, { passive: true });

        window.addEventListener('pointermove', (e) => {
            if (!active || !rect) return;
            lx = e.clientX - rect.left;
            ly = e.clientY - rect.top;
            if (raf) return;
            raf = requestAnimationFrame(() => {
                raf = 0;
                if (!active || !rect) return;
                const angle = Math.atan2(ly - rect.height / 2, lx - rect.width / 2) * (180 / Math.PI) + 90;
                active.style.setProperty('--spot-x', `${Math.round(lx)}px`);
                active.style.setProperty('--spot-y', `${Math.round(ly)}px`);
                active.style.setProperty('--lg-angle', `${Math.round(angle)}deg`);
            });
        }, { passive: true });
    }

    /* ---------- Liquid indicators ---------- */
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
        initLenses();
        initSpecularLight();
        initNavIndicator();
        initFilterThumb();
    }

    // After main.js's own DOMContentLoaded handler, which sets the motion tier (motion-lite)
    if (document.readyState === 'complete') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();
