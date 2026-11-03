/* ==========================================================================
   Animated language switch (IT ⇄ EN) without a page reload
   The other language page (/ or /en/) is fetched in the background; its texts
   replace the current ones while every visible line is "rewritten": the old
   words are deleted backwards, then the new ones type in behind a short
   flickering cursor of random glyphs, in a wave from top to bottom.
   URL, <html lang> and the SEO <head> are swapped too, so each language keeps
   its own canonical page. Off-screen texts change instantly.
   ========================================================================== */
(function () {
    'use strict';

    const GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const SEO_HEAD = [
        'title',
        'meta[name="description"]',
        'meta[property^="og:"]',
        'meta[name^="twitter:"]',
        'link[rel="canonical"]',
        'link[rel="alternate"][hreflang]',
        'script[type="application/ld+json"]',
    ].join(',');
    const URL_ATTRS = ['href', 'src', 'srcset', 'poster'];

    const pageCache = new Map();

    // Site root (the Italian page), fixed at load: /GabrielLazzara/ whether we started on / or /en/.
    // Computed once because the address (and so the base URL) changes after each switch.
    const ROOT = new URL(document.documentElement.getAttribute('data-lang') === 'en' ? '../' : './', window.location.href).href;
    const siteRoot = () => ROOT;

    function pageUrl(lang) {
        return lang === 'en' ? new URL('en/', siteRoot()).href : siteRoot();
    }

    function fetchPage(lang) {
        const url = pageUrl(lang);
        if (!pageCache.has(url)) {
            pageCache.set(url, fetch(url, { credentials: 'same-origin' })
                .then((r) => {
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    return r.text();
                })
                .then((html) => new DOMParser().parseFromString(html, 'text/html'))
                .catch((err) => {
                    pageCache.delete(url);
                    throw err;
                }));
        }
        return pageCache.get(url);
    }

    // Relative URLs break once the address moves between / and /en/: pin them down
    function absolutize(rootEl, base) {
        const isRelative = (v) => v && !/^(#|[a-z][a-z0-9+.-]*:|\/\/)/i.test(v.trim());
        rootEl.querySelectorAll(URL_ATTRS.map((a) => `[${a}]`).join(',')).forEach((el) => {
            if (el.tagName === 'LINK' || el.tagName === 'SCRIPT') return;
            URL_ATTRS.forEach((attr) => {
                const value = el.getAttribute(attr);
                if (!value) return;
                if (attr === 'srcset') {
                    const next = value.split(',').map((part) => {
                        const [u, ...rest] = part.trim().split(/\s+/);
                        return [isRelative(u) ? new URL(u, base).href : u, ...rest].join(' ');
                    }).join(', ');
                    el.setAttribute(attr, next);
                } else if (isRelative(value)) {
                    el.setAttribute(attr, new URL(value, base).href);
                }
            });
        });
    }

    function textNodes(el) {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
            acceptNode: (n) => (n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
        });
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        return nodes;
    }

    function isOnScreen(el) {
        const r = el.getBoundingClientRect();
        return r.bottom > -40 && r.top < window.innerHeight + 40 && r.width > 0 && r.height > 0;
    }

    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const randomGlyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

    /**
     * Rewrite one element: erase its current text backwards, then swap in the new
     * markup and type it in with a short scramble ahead of the cursor.
     */
    function rewrite(el, newHtml, delay) {
        return new Promise((resolve) => {
            const oldNodes = textNodes(el);
            const oldTexts = oldNodes.map((n) => n.nodeValue);
            const oldLen = oldTexts.reduce((s, t) => s + t.length, 0);
            const eraseMs = Math.min(260, 60 + oldLen * 4);

            const start = performance.now() + delay;
            let phase = 'wait';
            let newNodes = [];
            let newTexts = [];
            let newLen = 0;
            let typeMs = 0;
            let typeStart = 0;

            const setProgress = (nodes, texts, visible, tail) => {
                let left = visible;
                let tailLeft = tail;
                for (let i = 0; i < nodes.length; i += 1) {
                    const t = texts[i];
                    if (left >= t.length) {
                        nodes[i].nodeValue = t;
                        left -= t.length;
                        continue;
                    }
                    let out = t.slice(0, Math.max(0, left));
                    const from = Math.max(0, left);
                    for (let c = from; c < t.length && tailLeft > 0; c += 1, tailLeft -= 1) {
                        out += /\s/.test(t[c]) ? t[c] : randomGlyph();
                    }
                    nodes[i].nodeValue = out;
                    left = 0;
                }
            };

            const step = (now) => {
                if (now < start) {
                    requestAnimationFrame(step);
                    return;
                }
                if (phase === 'wait') phase = 'erase';

                if (phase === 'erase') {
                    const p = Math.min(1, (now - start) / eraseMs);
                    setProgress(oldNodes, oldTexts, Math.round(oldLen * (1 - p)), 0);
                    if (p < 1) {
                        requestAnimationFrame(step);
                        return;
                    }
                    el.innerHTML = newHtml;
                    newNodes = textNodes(el);
                    newTexts = newNodes.map((n) => n.nodeValue);
                    newLen = newTexts.reduce((s, t) => s + t.length, 0);
                    typeMs = Math.min(900, 220 + newLen * 9);
                    typeStart = now;
                    setProgress(newNodes, newTexts, 0, 0);
                    phase = 'type';
                }

                const p = Math.min(1, (now - typeStart) / typeMs);
                const visible = Math.round(newLen * easeOut(p));
                setProgress(newNodes, newTexts, visible, p < 1 ? 4 : 0);
                if (p < 1) {
                    requestAnimationFrame(step);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(step);
        });
    }

    let switching = false;

    /**
     * Switch the page to `lang` in place. Resolves to true when done, false when the
     * caller should fall back to a normal navigation.
     */
    async function switchTo(lang, { animate = true, push = true } = {}) {
        if (switching) return true;
        if (document.documentElement.getAttribute('data-lang') === lang) return true;
        switching = true;
        try {
            const targetUrl = pageUrl(lang);
            const doc = await fetchPage(lang);
            const currentBase = window.location.href;

            // Pin every relative URL of the live page before the address changes
            absolutize(document.body, currentBase);

            // Texts: same structure on both pages, so pair the elements in order
            const liveEls = [...document.querySelectorAll('[data-i18n]')];
            const nextEls = [...doc.querySelectorAll('[data-i18n]')];
            if (liveEls.length !== nextEls.length) throw new Error('Page structure differs');
            nextEls.forEach((el) => absolutize(el, targetUrl));

            const jobs = [];
            let order = 0;
            liveEls.forEach((el, i) => {
                const next = nextEls[i];
                if (next.getAttribute('data-i18n') !== el.getAttribute('data-i18n')) return;
                const html = next.innerHTML;
                if (el.innerHTML === html) return;
                // Nested [data-i18n] are rewritten by their own entry
                if (el.parentElement && el.parentElement.closest('[data-i18n]')) return;
                if (animate && isOnScreen(el)) {
                    jobs.push(rewrite(el, html, Math.min(order * 28, 700)));
                    order += 1;
                } else {
                    el.innerHTML = html;
                }
            });

            // Attributes: placeholders, aria labels, cursor labels, hero heading, legal links
            const pairAttr = (selector, attrs) => {
                const live = document.querySelectorAll(selector);
                const next = doc.querySelectorAll(selector);
                live.forEach((el, i) => {
                    if (!next[i]) return;
                    attrs.forEach((a) => {
                        const v = next[i].getAttribute(a);
                        if (v !== null) el.setAttribute(a, a === 'href' ? new URL(v, targetUrl).href : v);
                    });
                });
            };
            pairAttr('[data-i18n-ph]', ['placeholder']);
            pairAttr('[data-i18n-aria]', ['aria-label']);
            pairAttr('[data-cursor-label]', ['data-cursor-label']);
            pairAttr('#hero-heading', ['aria-label']);
            pairAttr('#theme-toggle', ['aria-label']);
            pairAttr('a[href*="privacy.html"], a[href*="cookie.html"], a[href*="note-legali.html"]', ['href']);

            const nextLangLink = doc.querySelector('[data-lang-link]');
            const liveLangLink = document.querySelector('[data-lang-link]');
            if (nextLangLink && liveLangLink) {
                const clone = document.importNode(nextLangLink, true);
                clone.setAttribute('href', new URL(nextLangLink.getAttribute('href'), targetUrl).href);
                liveLangLink.replaceWith(clone);
            }

            // SEO head of the target page
            document.head.querySelectorAll(SEO_HEAD).forEach((n) => n.remove());
            const marker = [...document.head.childNodes].find((n) => n.nodeType === 8 && n.nodeValue.includes('seo:end'));
            doc.head.querySelectorAll(SEO_HEAD).forEach((n) => {
                const clone = document.importNode(n, true);
                if (marker) document.head.insertBefore(clone, marker);
                else document.head.appendChild(clone);
            });
            document.title = doc.title;

            document.documentElement.lang = lang;
            document.documentElement.setAttribute('data-lang', lang);
            if (push) window.history.pushState({ lang }, '', targetUrl + window.location.hash);

            await Promise.all(jobs);
            return true;
        } catch (err) {
            console.warn('[lang-rewrite] falling back to a page load:', err);
            return false;
        } finally {
            switching = false;
        }
    }

    window.LangRewrite = {
        switchTo,
        pageUrl,
        prefetch: (lang) => fetchPage(lang).catch(() => null),
    };
})();
