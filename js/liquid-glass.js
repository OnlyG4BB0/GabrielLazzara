/* ==========================================================================
   Liquid Glass JS — Lightweight & 60fps Optimized Edition
   Adapted from dashersw/liquid-glass-js Container & Button architecture.
   Zero WebGL/canvas texture overhead, zero layout thrashing on pointermove.
   ========================================================================== */
(function () {
    'use strict';

    window.glassControls = Object.assign({
        edgeIntensity: 0.008,
        rimIntensity: 0.025,
        baseIntensity: 0.006,
        edgeDistance: 0.12,
        rimDistance: 0.8,
        cornerBoost: 0.012,
        rippleEffect: 0.04,
        blurRadius: 12.0,
        tintOpacity: 0.08
    }, window.glassControls || {});

    class Container {
        static instances = [];

        constructor(options = {}) {
            this.type = options.type || 'rounded'; // 'rounded' | 'circle' | 'pill'
            this.children = [];
            this.element = options.element || null;

            if (this.element) {
                this.upgradeExistingElement(this.element);
            } else {
                this.init();
            }

            Container.instances.push(this);
        }

        addChild(child) {
            this.children.push(child);
            child.parent = this;
            if (child.element && this.element) {
                this.element.appendChild(child.element);
            }
            return child;
        }

        init() {
            this.element = document.createElement('div');
            this.upgradeExistingElement(this.element);
        }

        upgradeExistingElement(el) {
            if (el.dataset.lgUpgraded === '1') return;
            el.dataset.lgUpgraded = '1';
            el.dataset.lgType = this.type;

            el.classList.add('glass-container');
            if (this.type === 'circle') {
                el.classList.add('glass-container-circle');
            } else if (this.type === 'pill') {
                el.classList.add('glass-container-pill');
            }

            // Inject lightweight CSS-only radial sheen layer for primary cards
            if (this.type === 'rounded' && !el.querySelector(':scope > .lg-refract-layer')) {
                const refractLayer = document.createElement('ins');
                refractLayer.className = 'lg-refract-layer';
                refractLayer.setAttribute('aria-hidden', 'true');
                el.appendChild(refractLayer);
            }
        }
    }

    class Button {
        static instances = [];

        constructor(options = {}) {
            this.text = options.text || '';
            this.type = options.type || 'pill'; // 'pill' | 'circle'
            this.onClick = options.onClick || null;
            this.element = options.element || null;

            if (this.element) {
                this.upgradeExistingElement(this.element);
            } else {
                this.init();
            }

            Button.instances.push(this);
        }

        init() {
            this.element = document.createElement('button');
            this.element.textContent = this.text;
            this.upgradeExistingElement(this.element);
            if (this.onClick) {
                this.element.addEventListener('click', (e) => this.onClick(e));
            }
        }

        upgradeExistingElement(el) {
            if (el.dataset.lgButton === '1') return;
            el.dataset.lgButton = '1';
            el.classList.add('glass-button');
            if (this.type === 'circle') {
                el.classList.add('glass-button-circle');
            }
        }
    }

    window.Container = Container;
    window.Button = Button;

    function upgradePortfolioToLiquidGlass() {
        const roundedSelectors = [
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
            '#cookie-consent'
        ];

        const pillContainerSelectors = [
            '#navbar .nav-pill',
            '.hero-availability',
            '.about-float-badge'
        ];

        const circleSelectors = [
            '#theme-toggle',
            '#mobile-menu-btn',
            '.hero-scroll-cue',
            '.bento-item > i',
            '.skill-card h3 i',
            '.faq-chevron',
            '.footer-giant__arrow',
            '.footer-social__link'
        ];

        const buttonSelectors = [
            '.btn-primary',
            '.btn-ghost',
            '.filter-btn',
            '.skill-tag',
            '.topic-chip',
            '#copy-email-btn',
            '.project-card a[class*="rounded"]',
            '.contact-panel .inline-flex.glass-panel',
            '.case-cta-secondary'
        ];

        document.querySelectorAll(roundedSelectors.join(',')).forEach((el) => {
            new Container({ element: el, type: 'rounded' });
        });

        document.querySelectorAll(pillContainerSelectors.join(',')).forEach((el) => {
            new Container({ element: el, type: 'pill' });
        });

        document.querySelectorAll(circleSelectors.join(',')).forEach((el) => {
            new Button({ element: el, type: 'circle' });
        });

        document.querySelectorAll(buttonSelectors.join(',')).forEach((el) => {
            new Button({ element: el, type: 'pill' });
        });
    }

    // Zero-reflow pointer spotlight: caches rect on pointerenter only
    function initPointerRefraction() {
        if (
            window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
            window.matchMedia('(hover: none), (pointer: coarse)').matches
        ) {
            return;
        }

        let activeEl = null;
        let activeRect = null;
        let rafPending = false;
        let lastX = 0;
        let lastY = 0;

        document.querySelectorAll('.glass-container[data-lg-type="rounded"]').forEach((el) => {
            el.addEventListener('pointerenter', () => {
                activeEl = el;
                activeRect = el.getBoundingClientRect();
            }, { passive: true });

            el.addEventListener('pointerleave', () => {
                if (activeEl === el) {
                    activeEl = null;
                    activeRect = null;
                }
            }, { passive: true });
        });

        window.addEventListener('scroll', () => {
            activeRect = null;
        }, { passive: true });

        window.addEventListener('pointermove', (e) => {
            if (!activeEl || !activeRect) return;
            lastX = e.clientX - activeRect.left;
            lastY = e.clientY - activeRect.top;
            if (rafPending) return;
            rafPending = true;
            requestAnimationFrame(() => {
                rafPending = false;
                if (!activeEl) return;
                activeEl.style.setProperty('--spot-x', `${Math.round(lastX)}px`);
                activeEl.style.setProperty('--spot-y', `${Math.round(lastY)}px`);
            });
        }, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            upgradePortfolioToLiquidGlass();
            initPointerRefraction();
        });
    } else {
        upgradePortfolioToLiquidGlass();
        initPointerRefraction();
    }
})();
