/* ==========================================================================
   Liquid Glass — Apple-style glass for the control layer (same system as
   teaamo-palermo's useLiquidGlass)

   Every browser gets the CSS glass in css/liquid-glass.css (.liquid-glass):
   frosted + saturated backdrop, specular rim, inner glow and a highlight that
   follows the pointer. Chromium additionally gets real, live refraction at the
   rim: an SVG feDisplacementMap used as a backdrop-filter, driven by a
   displacement map generated for the element's exact size and corner radius.
   Unlike a page snapshot, it refracts whatever is behind right now.
   ========================================================================== */
(function () {
    'use strict';

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
        '.legal-article',
    ];

    const PILL_SELECTORS = ['.hero-availability', '.about-float-badge'];

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

    // Glass controls and their refraction (strength/bevel in px, as in teaamo)
    const GLASS = [
        { selector: '#navbar .navbar-inner', refract: true, strength: 14, bevel: 20, aberration: true, mobile: { strength: 12, bevel: 16, aberration: false } },
        { selector: '#theme-toggle, .lang-toggle, #mobile-menu-btn', press: true },
        { selector: '.nav-link-cta', press: true, tint: true },
        { selector: '.hero-availability', refract: true, strength: 12, bevel: 16 },
        { selector: '.hero-action-btn.btn-ghost', refract: true, strength: 12, bevel: 16, press: true },
        { selector: '.hero-stats', refract: true, strength: 14, bevel: 18 },
        { selector: '.hero-scroll-cue', refract: true, strength: 12, bevel: 16, press: true },
        { selector: '.project-filters', refract: true, strength: 14, bevel: 18 },
        { selector: '.case-cta-secondary', refract: true, strength: 12, bevel: 16, press: true },
        { selector: '.footer-giant__arrow, .footer-social__link', refract: true, strength: 12, bevel: 16, press: true },
        { selector: '#cookie-consent', refract: true, strength: 16, bevel: 18, aberration: true, blur: 8 },
    ];

    function upgradeSurfaces() {
        const each = (selectors, fn) => document.querySelectorAll(selectors.join(',')).forEach(fn);
        each(PANEL_SELECTORS, (el) => new Container({ element: el, type: 'rounded' }));
        each(PILL_SELECTORS, (el) => new Container({ element: el, type: 'pill' }));
        each(CIRCLE_SELECTORS, (el) => new Button({ element: el, type: 'circle' }));
        each(BUTTON_SELECTORS, (el) => new Button({ element: el, type: 'pill' }));
    }

    /* ---------- Refraction ---------- */
    let refractionSupport = null;

    const canRefract = () => {
        if (refractionSupport !== null) return refractionSupport;
        const ua = navigator.userAgent;
        const isAppleWebKit = /iPhone|iPad|iPod/.test(ua) || (/Safari\//.test(ua) && !/Chrome|Chromium|Edg\//.test(ua));
        const isFirefox = /Firefox\//.test(ua);
        const reduced = window.matchMedia('(prefers-reduced-transparency: reduce)').matches
            || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        refractionSupport = !isAppleWebKit && !isFirefox && !reduced
            && typeof CSS !== 'undefined' && CSS.supports('backdrop-filter', 'url(#lg)');
        return refractionSupport;
    };

    const mapCache = new Map();

    /**
     * Displacement map for a rounded rectangle. Red/green encode an inward pull that
     * rises smoothly towards the rim, so the backdrop bends like a thick glass lens
     * at the edges while the centre stays clear.
     */
    function refractionMap(w, h, radius, bevel) {
        const key = `${w}x${h}-${radius.toFixed(1)}-${bevel}`;
        const cached = mapCache.get(key);
        if (cached) return cached;

        // Generated at most ~320px on the long side; feImage stretches it smoothly
        const s = Math.min(1, 320 / Math.max(w, h));
        const cw = Math.max(2, Math.round(w * s));
        const ch = Math.max(2, Math.round(h * s));
        const canvas = document.createElement('canvas');
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';
        const img = ctx.createImageData(cw, ch);
        const data = img.data;
        const r = Math.min(radius, w / 2, h / 2);
        const hw = w / 2;
        const hh = h / 2;

        for (let y = 0; y < ch; y++) {
            for (let x = 0; x < cw; x++) {
                const cx = (x + 0.5) / s - hw;
                const cy = (y + 0.5) / s - hh;
                const qx = Math.abs(cx) - (hw - r);
                const qy = Math.abs(cy) - (hh - r);
                const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
                const depth = -(outside + Math.min(Math.max(qx, qy), 0) - r);
                let dx = 0;
                let dy = 0;
                if (depth >= 0 && depth < bevel) {
                    let nx;
                    let ny;
                    if (qx > 0 && qy > 0 && outside > 0) {
                        nx = (Math.sign(cx) * qx) / outside;
                        ny = (Math.sign(cy) * qy) / outside;
                    } else if (qx > qy) {
                        nx = Math.sign(cx);
                        ny = 0;
                    } else {
                        nx = 0;
                        ny = Math.sign(cy);
                    }
                    const t = 1 - depth / bevel;
                    // Smooth lens shoulder plus a faint inner ripple, like a liquid meniscus
                    const mag = t * t * (3 - 2 * t) + 0.08 * Math.sin(t * Math.PI);
                    dx = -nx * mag;
                    dy = -ny * mag;
                }
                const i = (y * cw + x) * 4;
                data[i] = 128 + dx * 127;
                data[i + 1] = 128 + dy * 127;
                data[i + 2] = 128;
                data[i + 3] = 255;
            }
        }
        ctx.putImageData(img, 0, 0);
        const url = canvas.toDataURL();
        mapCache.set(key, url);
        return url;
    }

    const SVG_NS = 'http://www.w3.org/2000/svg';
    let defs = null;
    let filterCount = 0;

    function ensureDefs() {
        if (defs) return defs;
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
        defs = document.createElementNS(SVG_NS, 'defs');
        svg.appendChild(defs);
        document.body.appendChild(svg);
        return defs;
    }

    function filterMarkup(strength, aberration) {
        if (!aberration) {
            return `<feDisplacementMap in="SourceGraphic" in2="map" scale="${strength * 2}" xChannelSelector="R" yChannelSelector="G"/>`;
        }
        // Split red/green/blue slightly at the rim (three passes)
        return `
            <feDisplacementMap in="SourceGraphic" in2="map" scale="${strength * 2}" xChannelSelector="R" yChannelSelector="G" result="dr"/>
            <feColorMatrix in="dr" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>
            <feDisplacementMap in="SourceGraphic" in2="map" scale="${strength * 2.12}" xChannelSelector="R" yChannelSelector="G" result="dg"/>
            <feColorMatrix in="dg" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g"/>
            <feDisplacementMap in="SourceGraphic" in2="map" scale="${strength * 2.26}" xChannelSelector="R" yChannelSelector="G" result="db"/>
            <feColorMatrix in="db" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b"/>
            <feBlend in="r" in2="g" mode="screen" result="rg"/>
            <feBlend in="rg" in2="b" mode="screen"/>`;
    }

    function attachRefraction(el, options) {
        if (!canRefract() || typeof ResizeObserver === 'undefined') return;
        filterCount += 1;
        const id = `lg-${filterCount}`;
        const narrow = window.matchMedia('(max-width: 1023px)');

        const build = () => {
            const w = Math.round(el.offsetWidth);
            const h = Math.round(el.offsetHeight);
            if (!w || !h) return;
            const r = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, w / 2, h / 2);
            const o = narrow.matches && options.mobile ? { ...options, ...options.mobile } : options;
            const bevel = Math.min(o.bevel || 16, h / 2, w / 2);
            const key = `${w}x${h}-${r.toFixed(1)}-${bevel}-${o.strength}-${o.aberration ? 1 : 0}`;
            if (el._lgKey === key) return;
            el._lgKey = key;

            const mapUrl = refractionMap(w, h, r, bevel);
            if (!mapUrl) return;
            let filter = ensureDefs().querySelector(`#${id}`);
            if (!filter) {
                filter = document.createElementNS(SVG_NS, 'filter');
                filter.setAttribute('id', id);
                filter.setAttribute('x', '0');
                filter.setAttribute('y', '0');
                filter.setAttribute('filterUnits', 'userSpaceOnUse');
                filter.setAttribute('color-interpolation-filters', 'sRGB');
                defs.appendChild(filter);
            }
            filter.setAttribute('width', String(w));
            filter.setAttribute('height', String(h));
            filter.innerHTML =
                `<feImage href="${mapUrl}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map"/>` +
                filterMarkup(o.strength || 18, !!o.aberration);

            el.style.setProperty('--lg-refraction', `url(#${id}) blur(${o.blur || 3}px) saturate(1.9) brightness(1.06)`);
            el.dataset.refract = 'true';
        };

        // Rebuild the map once a resize/transition settles, not on every intermediate frame
        let timer = 0;
        new ResizeObserver(() => {
            window.clearTimeout(timer);
            timer = window.setTimeout(build, 140);
        }).observe(el);
        build();
    }

    // Specular highlight follows the pointer / finger
    function attachHighlight(el) {
        const move = (e) => {
            const rect = el.getBoundingClientRect();
            el.style.setProperty('--lg-x', `${(((e.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
            el.style.setProperty('--lg-y', `${(((e.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
        };
        el.addEventListener('pointermove', move, { passive: true });
        el.addEventListener('pointerdown', move, { passive: true });
        el.addEventListener('pointerleave', () => {
            el.style.removeProperty('--lg-x');
            el.style.removeProperty('--lg-y');
        }, { passive: true });
    }

    function initGlass() {
        GLASS.forEach((options) => {
            document.querySelectorAll(options.selector).forEach((el) => {
                el.classList.add('liquid-glass');
                if (options.press) el.classList.add('lg-press');
                if (options.tint) el.classList.add('lg-tint');
                attachHighlight(el);
                if (options.refract) attachRefraction(el, options);
            });
        });
    }

    /* ---------- Project filters: sliding indicator, like the teaamo tab bar ---------- */
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

        const place = () => {
            const active = buttons.find((b) => b.classList.contains('filter-active')) || buttons[0];
            thumb.style.width = `${active.offsetWidth}px`;
            thumb.style.height = `${active.offsetHeight}px`;
            thumb.style.transform = `translate3d(${active.offsetLeft}px, ${active.offsetTop}px, 0)`;
        };

        place();
        requestAnimationFrame(() => thumb.classList.add('is-ready'));
        const mo = new MutationObserver(place);
        buttons.forEach((b) => mo.observe(b, { attributes: true, attributeFilter: ['class'] }));
        new ResizeObserver(place).observe(group);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    }

    function init() {
        upgradeSurfaces();
        initGlass();
        initFilterThumb();
    }

    // After main.js's own DOMContentLoaded handler
    if (document.readyState === 'complete') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();
