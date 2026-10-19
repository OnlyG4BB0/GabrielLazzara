/* ==========================================================================
   Studio motion layer — preloader, cursor, split-text, parallax, marquee
   Runs alongside main.js (PortfolioApp). No dependencies.
   ========================================================================== */
(function () {
    'use strict';

    const html = document.documentElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const isMobileViewport = window.matchMedia('(max-width: 900px)').matches;
    const isCoarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
    const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

    /* ---------- Split text ---------- */
    const seenSplits = new WeakSet();

    function splitElement(el) {
        const mode = el.dataset.split === 'words' ? 'words' : 'chars';
        let index = 0;

        const walk = (node) => {
            Array.from(node.childNodes).forEach((child) => {
                if (child.nodeType === Node.TEXT_NODE) {
                    const text = child.textContent;
                    if (!text) return;
                    const frag = document.createDocumentFragment();
                    const tokens = mode === 'words' ? text.split(/(\s+)/) : Array.from(text);
                    tokens.forEach((tok) => {
                        if (!tok) return;
                        if (/^\s+$/.test(tok)) {
                            const ws = document.createElement('span');
                            ws.className = 'ws';
                            ws.textContent = ' ';
                            frag.appendChild(ws);
                            return;
                        }
                        const outer = document.createElement('span');
                        outer.className = mode === 'words' ? 'wd' : 'ch';
                        outer.style.setProperty('--i', String(index++));
                        const inner = document.createElement('span');
                        inner.textContent = tok;
                        outer.appendChild(inner);
                        frag.appendChild(outer);
                    });
                    child.replaceWith(frag);
                } else if (
                    child.nodeType === Node.ELEMENT_NODE &&
                    !child.classList.contains('ch') &&
                    !child.classList.contains('wd') &&
                    !child.classList.contains('ws')
                ) {
                    walk(child);
                }
            });
        };

        // Reset if already split (e.g. after a language swap left fragments)
        if (el.querySelector('.ch, .wd')) {
            el.querySelectorAll('.ws').forEach((ws) => ws.replaceWith(document.createTextNode(' ')));
            el.querySelectorAll('.ch, .wd').forEach((w) => w.replaceWith(document.createTextNode(w.textContent)));
            el.normalize();
        }

        walk(el);
        el.dataset.splitReady = '1';
    }

    let splitObserver = null;

    function observeSplit(el) {
        if (reduced) {
            el.classList.add('is-in');
            return;
        }
        if (el.dataset.splitManual === '1') return;
        if (!splitObserver) {
            splitObserver = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) return;
                        entry.target.classList.add('is-in');
                        seenSplits.add(entry.target);
                        splitObserver.unobserve(entry.target);
                    });
                },
                { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
            );
        }
        splitObserver.observe(el);
    }

    function initSplits() {
        document.querySelectorAll('[data-split]').forEach((el) => {
            splitElement(el);
            observeSplit(el);
        });
    }

    function resplitAfterLanguage() {
        document.querySelectorAll('[data-split]').forEach((el) => {
            const wasIn = el.classList.contains('is-in') || seenSplits.has(el);
            el.classList.remove('is-in');
            splitElement(el);
            if (wasIn || el.dataset.splitManual === '1') {
                requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-in')));
            }
        });
    }

    /* ---------- Preloader ---------- */
    function runPreloader() {
        const pre = document.getElementById('preloader');
        const countEl = document.getElementById('preloader-count');
        const seenIntro = sessionStorage.getItem('studio_intro') === '1';

        const reveal = () => {
            html.classList.remove('is-loading');
            html.classList.add('is-revealed');
            if (pre) pre.classList.add('is-done');
            try { sessionStorage.setItem('studio_intro', '1'); } catch (_) { /* ignore */ }
            window.setTimeout(() => {
                document.querySelectorAll('[data-split][data-split-manual="1"]').forEach((el) => el.classList.add('is-in'));
                runCountUps();
            }, 260);
            window.setTimeout(() => { if (pre) pre.remove(); }, 1400);
        };

        if (!pre || reduced) {
            if (pre) pre.remove();
            html.classList.remove('is-loading');
            html.classList.add('is-revealed');
            document.querySelectorAll('[data-split][data-split-manual="1"]').forEach((el) => el.classList.add('is-in'));
            runCountUps();
            return;
        }

        const duration = seenIntro ? 420 : 1350;
        const start = performance.now();

        const tick = (now) => {
            const t = clamp((now - start) / duration, 0, 1);
            const p = easeOutExpo(t);
            if (countEl) countEl.textContent = String(Math.round(p * 100));
            pre.style.setProperty('--p', p.toFixed(3));
            if (t < 1) {
                requestAnimationFrame(tick);
            } else {
                window.setTimeout(reveal, seenIntro ? 60 : 180);
            }
        };

        requestAnimationFrame(tick);
    }

    /* ---------- Count-up ---------- */
    let countsDone = false;

    function runCountUps() {
        if (countsDone) return;
        countsDone = true;
        document.querySelectorAll('[data-count]').forEach((el) => {
            const target = parseFloat(el.dataset.count);
            const suffix = el.dataset.suffix || '';
            if (Number.isNaN(target)) return;
            if (reduced) { el.textContent = `${target}${suffix}`; return; }
            const start = performance.now();
            const dur = 1400;
            const step = (now) => {
                const t = clamp((now - start) / dur, 0, 1);
                el.textContent = `${Math.round(easeOutExpo(t) * target)}${suffix}`;
                if (t < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        });
    }

    /* ---------- Aurora + custom cursor ---------- */
    function initPointer() {
        const aurora = document.querySelector('.studio-aurora');
        const dot = document.querySelector('.cursor');
        const ring = document.querySelector('.cursor-ring');
        const label = ring ? ring.querySelector('.cursor-ring__label') : null;

        if (!finePointer || isCoarsePointer || isMobileViewport || reduced) {
            html.classList.remove('has-cursor');
            if (dot) dot.style.display = 'none';
            if (ring) ring.style.display = 'none';
            return;
        }

        let mx = window.innerWidth / 2;
        let my = window.innerHeight / 2;
        let rx = mx;
        let ry = my;
        let auroraPending = false;
        let active = false;

        const useCursor = Boolean(dot && ring);
        if (useCursor) {
            html.classList.add('has-cursor', 'cursor-hidden');
        }

        window.addEventListener('mousemove', (e) => {
            mx = e.clientX;
            my = e.clientY;
            if (!active) {
                active = true;
                rx = mx;
                ry = my;
                html.classList.remove('cursor-hidden');
            }
            if (useCursor && dot) dot.style.transform = `translate3d(${mx - 4}px, ${my - 4}px, 0)`;
            if (aurora && !auroraPending) {
                auroraPending = true;
                requestAnimationFrame(() => {
                    aurora.style.setProperty('--mx', `${mx}px`);
                    aurora.style.setProperty('--my', `${my}px`);
                    auroraPending = false;
                });
            }
        }, { passive: true });

        if (!useCursor) return;

        const loop = () => {
            rx = lerp(rx, mx, 0.16);
            ry = lerp(ry, my, 0.16);
            const scale = html.classList.contains('cursor-down') ? 0.85 : 1;
            ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${scale})`;
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);

        const INTERACTIVE = 'a, button, summary, label, [role="button"], [role="tab"], input[type="checkbox"]';

        document.addEventListener('mouseover', (e) => {
            const view = e.target.closest('[data-cursor="view"]');
            if (view) {
                html.classList.add('cursor-view');
                html.classList.remove('cursor-hover');
                if (label) label.textContent = view.dataset.cursorLabel || 'Apri';
                return;
            }
            html.classList.remove('cursor-view');
            const interactive = e.target.closest(INTERACTIVE);
            html.classList.toggle('cursor-hover', Boolean(interactive));
        });

        document.addEventListener('mouseout', (e) => {
            if (!e.relatedTarget) {
                html.classList.remove('cursor-hover', 'cursor-view');
            }
        });

        document.addEventListener('mousedown', () => html.classList.add('cursor-down'));
        document.addEventListener('mouseup', () => html.classList.remove('cursor-down'));
        document.addEventListener('mouseleave', () => html.classList.add('cursor-hidden'));
        document.addEventListener('mouseenter', () => html.classList.remove('cursor-hidden'));
        window.addEventListener('blur', () => html.classList.add('cursor-hidden'));
    }

    /* ---------- Scroll: progress, nav hide, parallax, marquee ---------- */
    function initScroll() {
        const progress = document.querySelector('.studio-progress');
        const navbar = document.getElementById('navbar');
        const mobileMenu = document.getElementById('mobile-menu');
        const parallaxEls = Array.from(document.querySelectorAll('[data-parallax]'));
        const track = document.querySelector('.marquee-track');
        const marqueeWrap = document.querySelector('.marquee-wrap');

        let lastY = window.scrollY;
        let vel = 0;
        let targetVel = 0;
        let marqueeX = 0;
        let marqueeHalf = 0;
        let marqueeVisible = true;
        let dir = 1;
        let navHiddenAt = 0;

        const useParallax = finePointer && !reduced && parallaxEls.length > 0;
        const useMarquee = Boolean(track) && !reduced;

        if (useMarquee) {
            html.classList.add('js-marquee');
            const measure = () => { marqueeHalf = track.scrollWidth / 2; };
            measure();
            window.addEventListener('resize', measure, { passive: true });
            if (marqueeWrap && 'IntersectionObserver' in window) {
                new IntersectionObserver((entries) => {
                    marqueeVisible = entries[0]?.isIntersecting ?? true;
                }, { rootMargin: '120px 0px' }).observe(marqueeWrap);
            }
        }

        const onScroll = () => {
            const y = window.scrollY;
            const dy = y - lastY;
            lastY = y;

            if (progress) {
                const max = document.documentElement.scrollHeight - window.innerHeight;
                progress.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : '0');
            }

            if (navbar) {
                const menuOpen = mobileMenu && !mobileMenu.classList.contains('hidden');
                const smooth = html.classList.contains('is-smooth-scrolling');
                if (!menuOpen && !smooth) {
                    if (dy > 6 && y > 260) {
                        navbar.classList.add('nav-hidden');
                        navHiddenAt = y;
                    } else if (dy < -4 || y < 120 || (navHiddenAt && y < navHiddenAt - 320)) {
                        navbar.classList.remove('nav-hidden');
                    }
                } else {
                    navbar.classList.remove('nav-hidden');
                }
            }

            if (useMarquee) {
                targetVel = clamp(dy * 0.28, -14, 14);
                if (dy !== 0) dir = dy < 0 ? -1 : 1;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        const frame = () => {
            if (useParallax) {
                const vh = window.innerHeight;
                parallaxEls.forEach((el) => {
                    const speed = parseFloat(el.dataset.parallax) || 0.12;
                    const rect = el.getBoundingClientRect();
                    if (rect.bottom < -200 || rect.top > vh + 200) return;
                    const offset = rect.top + rect.height / 2 - vh / 2;
                    el.style.setProperty('--py', `${(-offset * speed).toFixed(1)}px`);
                });
            }

            if (useMarquee && marqueeVisible && marqueeHalf > 0) {
                vel = lerp(vel, targetVel, 0.08);
                targetVel *= 0.9;
                const speed = 0.9 + Math.min(Math.abs(vel), 14);
                marqueeX -= speed * dir;
                if (marqueeX <= -marqueeHalf) marqueeX += marqueeHalf;
                if (marqueeX > 0) marqueeX -= marqueeHalf;
                const skew = clamp(vel * 0.4, -7, 7);
                track.style.transform = `translate3d(${marqueeX.toFixed(2)}px, 0, 0) skewX(${skew.toFixed(2)}deg)`;
            }

            requestAnimationFrame(frame);
        };

        if (useParallax || useMarquee) requestAnimationFrame(frame);
    }

    /* ---------- Language swap → re-split headings ---------- */
    function initLanguageObserver() {
        if (!('MutationObserver' in window)) return;
        let lastLang = html.getAttribute('data-lang');
        new MutationObserver(() => {
            const lang = html.getAttribute('data-lang');
            if (lang === lastLang) return;
            lastLang = lang;
            resplitAfterLanguage();
        }).observe(html, { attributes: true, attributeFilter: ['data-lang'] });
    }

    /* ---------- Boot ---------- */
    function boot() {
        initSplits();
        initLanguageObserver();
        initPointer();
        initScroll();
        runPreloader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
