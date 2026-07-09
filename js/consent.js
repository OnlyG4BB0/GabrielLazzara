/**
 * Cookie consent (GDPR / ePrivacy) — blocca analytics fino al consenso.
 */
const CONSENT_STORAGE_KEY = 'portfolio_consent_v1';
const CONSENT_VERSION = 1;

const ConsentManager = {
    state: null,

    read() {
        try {
            const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (parsed?.version !== CONSENT_VERSION) return null;
            return parsed;
        } catch {
            return null;
        }
    },

    save(analytics) {
        this.state = {
            version: CONSENT_VERSION,
            necessary: true,
            analytics: Boolean(analytics),
            ts: Date.now(),
        };
        localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(this.state));
        this.apply();
        this.hideBanner();
        window.dispatchEvent(new CustomEvent('portfolio:consent', { detail: this.state }));
    },

    hasChoice() {
        return Boolean(this.read());
    },

    analyticsAllowed() {
        const s = this.state || this.read();
        return Boolean(s?.analytics);
    },

    loadPlausible() {
        if (document.getElementById('plausible-script')) return;
        const script = document.createElement('script');
        script.id = 'plausible-script';
        script.defer = true;
        script.dataset.domain = 'onlyg4bb0.github.io';
        script.src = 'https://plausible.io/js/script.js';
        document.head.appendChild(script);
    },

    apply() {
        if (this.analyticsAllowed()) {
            this.loadPlausible();
        }
    },

    hideBanner() {
        const banner = document.getElementById('cookie-consent');
        if (!banner) return;
        banner.classList.remove('cookie-consent--visible');
        banner.classList.add('cookie-consent--hiding');
        window.setTimeout(() => {
            banner.hidden = true;
            banner.setAttribute('aria-hidden', 'true');
            banner.classList.remove('cookie-consent--hiding');
        }, 320);
    },

    showBanner() {
        const banner = document.getElementById('cookie-consent');
        if (!banner) return;
        banner.hidden = false;
        banner.setAttribute('aria-hidden', 'false');
        banner.classList.remove('cookie-consent--hiding');
        void banner.offsetWidth;
        banner.classList.add('cookie-consent--visible');
    },

    bindButtonMotion(btn) {
        if (!btn || btn.dataset.consentMotionBound === '1') return;
        btn.dataset.consentMotionBound = '1';
        btn.classList.add('neo-ripple-host');

        const onDown = (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            btn.classList.add('is-pressed');
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 1.35;
            const ripple = document.createElement('span');
            ripple.className = 'neo-ripple cookie-consent__ripple';
            ripple.style.width = `${size}px`;
            ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
            ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
            btn.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        };
        const onUp = () => btn.classList.remove('is-pressed');

        btn.addEventListener('pointerdown', onDown);
        btn.addEventListener('pointerup', onUp);
        btn.addEventListener('pointerleave', onUp);
        btn.addEventListener('pointercancel', onUp);
    },

    bindUi() {
        const banner = document.getElementById('cookie-consent');
        if (!banner || banner.dataset.bound === '1') return;
        banner.dataset.bound = '1';

        banner.querySelectorAll('.cookie-consent__btn').forEach((btn) => this.bindButtonMotion(btn));

        banner.querySelector('[data-consent-accept]')?.addEventListener('click', () => this.save(true));
        banner.querySelector('[data-consent-reject]')?.addEventListener('click', () => this.save(false));
        banner.querySelector('[data-consent-necessary]')?.addEventListener('click', () => this.save(false));

        document.querySelectorAll('[data-open-consent]').forEach((btn) => {
            btn.addEventListener('click', () => this.showBanner());
        });
    },

    init() {
        this.state = this.read();
        this.bindUi();
        this.apply();
        if (!this.hasChoice()) {
            window.requestAnimationFrame(() => this.showBanner());
        }
    },
};

document.addEventListener('DOMContentLoaded', () => ConsentManager.init());
