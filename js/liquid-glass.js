/* ==========================================================================
   Liquid Glass JS — Adapted from dashersw/liquid-glass-js
   Implements Container & Button classes, SDF optical refraction shader
   (roundedRectDistance, pillDistance, circleDistance, edgeIntensity,
   rimIntensity, cornerBoost, rippleEffect), shared WebGL shader renderer,
   and interactive pointer lensing at native vector resolution.
   ========================================================================== */
(function () {
    'use strict';

    // Exact shader & optical parameters from dashersw/liquid-glass-js
    window.glassControls = Object.assign({
        edgeIntensity: 0.012,
        rimIntensity: 0.045,
        baseIntensity: 0.01,
        edgeDistance: 0.15,
        rimDistance: 0.8,
        cornerBoost: 0.02,
        rippleEffect: 0.08,
        blurRadius: 5.0,
        tintOpacity: 0.2
    }, window.glassControls || {});

    const VERTEX_SHADER_SRC = `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            v_texCoord = a_texCoord;
        }
    `;

    // Adapted from dashersw/liquid-glass-js/container.js fragment shader:
    // Renders smooth optical refraction, concentric ripple caustics, corner boost,
    // and vertical tint gradient without hard pixel-discard clipping (clipping is
    // handled at native vector resolution by CSS border-radius + overflow:hidden).
    const FRAGMENT_SHADER_SRC = `
        precision mediump float;
        uniform sampler2D u_image;
        uniform vec2 u_textureSize;
        uniform float u_blurRadius;
        uniform float u_edgeIntensity;
        uniform float u_rimIntensity;
        uniform float u_baseIntensity;
        uniform float u_edgeDistance;
        uniform float u_rimDistance;
        uniform float u_cornerBoost;
        uniform float u_rippleEffect;
        uniform float u_tintOpacity;
        uniform float u_isPill;
        uniform float u_isCircle;
        uniform float u_isLight;
        varying vec2 v_texCoord;

        void main() {
            vec2 coord = v_texCoord;
            vec2 center = vec2(0.5, 0.5);
            vec2 toCenter = coord - center;
            float distFromCenter = length(toCenter);
            vec2 normal = distFromCenter > 0.0001 ? normalize(toCenter) : vec2(0.0);

            // Normalized Chebyshev/Euclidean distance to boundary (0 at edge, 0.5 at center)
            vec2 edgeVec = vec2(0.5) - abs(toCenter);
            float minEdge = min(edgeVec.x, edgeVec.y);
            float distFromEdge = clamp(minEdge / max(u_edgeDistance, 0.05), 0.0, 1.0);

            float edgeFactor = 1.0 - smoothstep(0.0, 1.0, distFromEdge);
            float rimFactor = smoothstep(u_rimDistance - 0.25, u_rimDistance, distFromCenter * 1.4) *
                              (1.0 - smoothstep(u_rimDistance, 1.0, distFromCenter * 1.4));

            vec2 cornerDist = max(abs(toCenter) - vec2(0.32), 0.0);
            float cornerBoostVal = length(cornerDist) * u_cornerBoost * 8.0;

            float totalIntensity = edgeFactor * u_edgeIntensity +
                                   rimFactor * u_rimIntensity +
                                   u_baseIntensity +
                                   cornerBoostVal;

            float ripple = sin(distFromEdge * 25.0) * u_rippleEffect * edgeFactor;
            vec2 refractionOffset = normal * (totalIntensity + ripple);
            vec2 refractedCoord = clamp(coord + refractionOffset, 0.01, 0.99);

            vec4 envColor = texture2D(u_image, refractedCoord);

            // Vertical tint gradient from dashersw/liquid-glass-js (topTint 1.0 -> bottomTint 0.7)
            vec3 topTint = vec3(1.0, 1.0, 1.0);
            vec3 bottomTint = u_isLight > 0.5 ? vec3(0.92, 0.89, 0.98) : vec3(0.7, 0.66, 0.84);
            vec3 gradientTint = mix(topTint, bottomTint, coord.y);
            vec3 finalTint = mix(gradientTint, envColor.rgb * 1.15, 0.35);

            vec3 color = mix(envColor.rgb, finalTint, u_tintOpacity);
            float specularDiag = pow(max(0.0, (1.0 - coord.y) * 0.6 + (1.0 - coord.x) * 0.4), 2.2);
            color += vec3(1.0) * (specularDiag * 0.18 + cornerBoostVal * 0.25);

            float alpha = clamp(specularDiag * 0.16 + rimFactor * 0.12 + edgeFactor * 0.1 + 0.04, 0.0, 0.28);
            gl_FragColor = vec4(color, alpha);
        }
    `;

    class SharedLiquidGlassShader {
        constructor() {
            this.ready = false;
            this.cache = new Map();
            this.init();
        }

        init() {
            try {
                this.canvas = document.createElement('canvas');
                this.canvas.width = 512;
                this.canvas.height = 512;
                const gl = this.canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
                if (!gl) return;
                this.gl = gl;

                const vs = this.compile(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
                const fs = this.compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
                if (!vs || !fs) return;

                const prog = gl.createProgram();
                gl.attachShader(prog, vs);
                gl.attachShader(prog, fs);
                gl.linkProgram(prog);
                if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;

                this.program = prog;
                gl.useProgram(prog);

                const positions = new Float32Array([
                    -1, -1, 0, 1,
                     1, -1, 1, 1,
                    -1,  1, 0, 0,
                     1,  1, 1, 0
                ]);
                const buf = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, buf);
                gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

                const posLoc = gl.getAttribLocation(prog, 'a_position');
                const texLoc = gl.getAttribLocation(prog, 'a_texCoord');
                gl.enableVertexAttribArray(posLoc);
                gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);
                gl.enableVertexAttribArray(texLoc);
                gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 16, 8);

                this.envTexture = this.createEnvironmentTexture(gl);
                this.ready = true;
            } catch (_) {
                this.ready = false;
            }
        }

        compile(type, src) {
            const gl = this.gl;
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                gl.deleteShader(s);
                return null;
            }
            return s;
        }

        createEnvironmentTexture(gl) {
            const envCanvas = document.createElement('canvas');
            envCanvas.width = 256;
            envCanvas.height = 256;
            const ctx = envCanvas.getContext('2d');

            const g = ctx.createLinearGradient(0, 0, 256, 256);
            g.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            g.addColorStop(0.35, 'rgba(167, 139, 250, 0.55)');
            g.addColorStop(0.7, 'rgba(99, 102, 241, 0.35)');
            g.addColorStop(1, 'rgba(232, 121, 249, 0.7)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 256, 256);

            const rg = ctx.createRadialGradient(64, 48, 8, 64, 48, 160);
            rg.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
            rg.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = rg;
            ctx.fillRect(0, 0, 256, 256);

            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, envCanvas);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            return tex;
        }

        renderShapeDataURL(type, isLight) {
            if (!this.ready) return null;
            const key = `${type}_${isLight ? 'light' : 'dark'}`;
            if (this.cache.has(key)) return this.cache.get(key);

            const gl = this.gl;
            const prog = this.program;
            const w = 384;
            const h = 384;
            this.canvas.width = w;
            this.canvas.height = h;
            gl.viewport(0, 0, w, h);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.useProgram(prog);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.envTexture);

            const ctrl = window.glassControls;
            const set1f = (n, v) => gl.uniform1f(gl.getUniformLocation(prog, n), v);
            gl.uniform1i(gl.getUniformLocation(prog, 'u_image'), 0);
            gl.uniform2f(gl.getUniformLocation(prog, 'u_textureSize'), w, h);
            set1f('u_blurRadius', ctrl.blurRadius);
            set1f('u_edgeIntensity', ctrl.edgeIntensity);
            set1f('u_rimIntensity', ctrl.rimIntensity);
            set1f('u_baseIntensity', ctrl.baseIntensity);
            set1f('u_edgeDistance', ctrl.edgeDistance);
            set1f('u_rimDistance', ctrl.rimDistance);
            set1f('u_cornerBoost', ctrl.cornerBoost);
            set1f('u_rippleEffect', ctrl.rippleEffect);
            set1f('u_tintOpacity', ctrl.tintOpacity);
            set1f('u_isPill', type === 'pill' ? 1.0 : 0.0);
            set1f('u_isCircle', type === 'circle' ? 1.0 : 0.0);
            set1f('u_isLight', isLight ? 1.0 : 0.0);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            const url = this.canvas.toDataURL('image/png');
            this.cache.set(key, url);
            return url;
        }
    }

    const sharedShader = new SharedLiquidGlassShader();

    /**
     * Container class — compatible with dashersw/liquid-glass-js Container
     */
    class Container {
        static instances = [];

        constructor(options = {}) {
            this.width = options.width || 300;
            this.height = options.height || 200;
            this.borderRadius = options.borderRadius || 32;
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

            // Inject interactive optical refraction & corner-boost layer
            if (!el.querySelector(':scope > .lg-refract-layer')) {
                const refractLayer = document.createElement('ins');
                refractLayer.className = 'lg-refract-layer';
                refractLayer.setAttribute('aria-hidden', 'true');
                this.refractLayer = refractLayer;
                el.appendChild(refractLayer);
            }

            this.applyShaderOverlay();
        }

        applyShaderOverlay() {
            if (!this.element || !sharedShader.ready) return;
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            const dataUrl = sharedShader.renderShapeDataURL(this.type, isLight);
            if (dataUrl && this.refractLayer) {
                this.refractLayer.style.backgroundImage = `
                    radial-gradient(420px circle at var(--spot-x, 22%) var(--spot-y, 18%), var(--lg-caustic), transparent 62%),
                    radial-gradient(180px circle at 4% 4%, var(--lg-corner-boost), transparent 68%),
                    radial-gradient(200px circle at 96% 96%, rgba(232, 121, 249, 0.1), transparent 70%),
                    url("${dataUrl}")
                `;
                this.refractLayer.style.backgroundSize = 'auto, auto, auto, 100% 100%';
            }
        }
    }

    /**
     * Button class — compatible with dashersw/liquid-glass-js Button
     */
    class Button {
        static instances = [];

        constructor(options = {}) {
            this.text = options.text || '';
            this.size = options.size || '24';
            this.type = options.type || 'pill'; // 'pill' | 'circle'
            this.onClick = options.onClick || null;
            this.parent = null;
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
            '.about-float-badge',
            '.timeline-period',
            '.pkg-badge',
            '.lang-toggle'
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

    function initPointerRefraction() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        let rafPending = false;
        let lastEvent = null;

        window.addEventListener('pointermove', (e) => {
            lastEvent = e;
            if (rafPending) return;
            rafPending = true;
            requestAnimationFrame(() => {
                rafPending = false;
                if (!lastEvent) return;
                const target = lastEvent.target && lastEvent.target.closest
                    ? lastEvent.target.closest('.glass-container, .glass-button')
                    : null;
                if (!target) return;

                const rect = target.getBoundingClientRect();
                if (!rect.width || !rect.height) return;
                const x = lastEvent.clientX - rect.left;
                const y = lastEvent.clientY - rect.top;
                const cx = rect.width / 2;
                const cy = rect.height / 2;
                const angle = Math.round((Math.atan2(y - cy, x - cx) * 180) / Math.PI + 90);

                target.style.setProperty('--spot-x', `${x.toFixed(1)}px`);
                target.style.setProperty('--spot-y', `${y.toFixed(1)}px`);
                target.style.setProperty('--lg-angle', `${angle}deg`);
            });
        }, { passive: true });

        const observer = new MutationObserver(() => {
            Container.instances.forEach((inst) => inst.applyShaderOverlay());
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
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
