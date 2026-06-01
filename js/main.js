class PortfolioApp {
    constructor() {
        this.navbar = document.getElementById('navbar');
        this.menuBtn = document.getElementById('mobile-menu-btn');
        this.mobileMenu = document.getElementById('mobile-menu');
        this.mainSections = document.querySelectorAll('.site-main > section');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.mobileLinks = document.querySelectorAll('.mobile-link');
        this.revealElements = document.querySelectorAll('.reveal');
        this.visibleSections = new Map();
        this.activeSectionId = '';
        this.langToggles = document.querySelectorAll('.lang-toggle');
        this.copyEmailBtn = document.getElementById('copy-email-btn');
        this.projectCards = document.querySelectorAll('[data-project-category]');
        this.filterBtns = document.querySelectorAll('[data-project-filter]');
        this.themeToggle = document.getElementById('theme-toggle');

        this.isMenuOpen = false;
        this.currentLang = localStorage.getItem('portfolio_lang') || 'it';
        this.currentFilter = 'all';
        this.currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!this.prefersReducedMotion) {
            document.documentElement.classList.add('motion-enhanced');
        }

        this.init();
    }

    init() {
        this.setupThemeToggle();
        this.applyTheme(this.currentTheme);
        this.setupMobileMenu();
        this.setupSmoothScrolling();
        this.setupSectionMotion();
        this.enhanceRevealTargets();
        this.setupIntersectionObservers();
        this.setupInteractiveMotion();
        this.setupScrollListener();
        this.setupContactForm();
        this.setupCopyEmail();
        this.setupLanguageToggle();
        this.setupProjectFilters();
        this.setupSpotlightCards();
        this.setupPressFeedback();
        this.setupFaqAnimations();
        this.setupAmbientMotion();
        this.applyLanguage(this.currentLang);
        requestAnimationFrame(() => document.body.classList.add('page-loaded'));
        this.applyProjectFilter(this.currentFilter, true);
    }

    setupThemeToggle() {
        if (!this.themeToggle) return;

        this.themeToggle.addEventListener('click', () => {
            this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            this.themeToggle.classList.remove('theme-spin');
            void this.themeToggle.offsetWidth;
            this.themeToggle.classList.add('theme-spin');
            this.applyTheme(this.currentTheme, true);
            localStorage.setItem('portfolio_theme', this.currentTheme);
            setTimeout(() => this.themeToggle.classList.remove('theme-spin'), 550);
        });
    }

    applyTheme(theme, animate = false) {
        const update = () => {
            document.documentElement.setAttribute('data-theme', theme);
            const meta = document.querySelector('meta[name="theme-color"]');
            if (meta) {
                meta.setAttribute('content', theme === 'light' ? '#f8f7fc' : '#08060f');
            }
            if (this.themeToggle) {
                const label = theme === 'dark'
                    ? (translations[this.currentLang]?.theme_toggle_light || 'Attiva tema chiaro')
                    : (translations[this.currentLang]?.theme_toggle_dark || 'Attiva tema scuro');
                this.themeToggle.setAttribute('aria-label', label);
            }
        };

        if (animate && !this.prefersReducedMotion) {
            document.documentElement.classList.add('theme-transitioning');
            if (typeof document.startViewTransition === 'function') {
                document.startViewTransition(update).finished.finally(() => {
                    document.documentElement.classList.remove('theme-transitioning');
                });
            } else {
                update();
                setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 420);
            }
        } else {
            update();
        }
    }

    setupLanguageToggle() {
        this.langToggles.forEach((toggle) => {
            toggle.addEventListener('click', () => {
                const nextLang = this.currentLang === 'it' ? 'en' : 'it';
                if (this.prefersReducedMotion) {
                    this.currentLang = nextLang;
                    localStorage.setItem('portfolio_lang', nextLang);
                    this.applyLanguage(nextLang);
                    return;
                }

                this.langToggles.forEach((btn) => {
                    btn.classList.remove('lang-pop');
                    void btn.offsetWidth;
                    btn.classList.add('lang-pop');
                });

                document.documentElement.classList.add('lang-transitioning');

                requestAnimationFrame(() => {
                    setTimeout(() => {
                        this.currentLang = nextLang;
                        localStorage.setItem('portfolio_lang', nextLang);
                        this.applyLanguage(nextLang);
                        document.documentElement.classList.remove('lang-transitioning');
                        document.documentElement.classList.add('lang-entered');
                        setTimeout(() => document.documentElement.classList.remove('lang-entered'), 450);
                    }, 130);
                });
            });
        });
    }

    applyLanguage(lang) {
        document.documentElement.lang = lang === 'it' ? 'it' : 'en';
        document.documentElement.setAttribute('data-lang', lang);

        const itTexts = document.querySelectorAll('.lang-it-text');
        const enTexts = document.querySelectorAll('.lang-en-text');

        if (lang === 'it') {
            itTexts.forEach((el) => { el.className = 'lang-it-text lang-active'; });
            enTexts.forEach((el) => { el.className = 'lang-en-text lang-inactive'; });
        } else {
            itTexts.forEach((el) => { el.className = 'lang-it-text lang-inactive'; });
            enTexts.forEach((el) => { el.className = 'lang-en-text lang-active'; });
        }

        if (this.themeToggle) {
            const theme = document.documentElement.getAttribute('data-theme');
            const labelKey = theme === 'dark' ? 'theme_toggle_light' : 'theme_toggle_dark';
            if (translations[lang][labelKey]) {
                this.themeToggle.setAttribute('aria-label', translations[lang][labelKey]);
            }
        }

        document.querySelectorAll('[data-i18n]').forEach((el) => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) {
                el.innerHTML = translations[lang][key];
            }
        });

        document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
            const key = el.getAttribute('data-i18n-ph');
            if (translations[lang][key]) {
                el.setAttribute('placeholder', translations[lang][key]);
            }
        });

        ['proj3_bullets', 'proj_luxury_bullets', 'pkg1_feat', 'pkg2_feat', 'pkg3_feat'].forEach((key) => {
            document.querySelectorAll(`[data-i18n="${key}"]`).forEach((el) => {
                if (translations[lang][key]) el.innerHTML = translations[lang][key];
            });
        });

        if (typeof applySeoLanguage === 'function') {
            applySeoLanguage(lang);
        }
    }

    setupProjectFilters() {
        if (!this.filterBtns.length) return;

        this.filterBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-project-filter');
                this.currentFilter = filter;
                this.filterBtns.forEach((b) => {
                    const isActive = b === btn;
                    b.classList.toggle('filter-active', isActive);
                    if (isActive) {
                        b.classList.remove('filter-pop');
                        void b.offsetWidth;
                        b.classList.add('filter-pop');
                    }
                });
                this.applyProjectFilter(filter);
            });
        });
    }

    applyProjectFilter(filter, isInitial = false) {
        this.projectCards.forEach((card) => {
            const cat = card.getAttribute('data-project-category');
            const show = filter === 'all' || cat === filter;
            card.classList.toggle('project-hidden', !show);
            card.setAttribute('aria-hidden', show ? 'false' : 'true');
            if (!isInitial) {
                if (show) {
                    card.classList.remove('project-enter');
                    void card.offsetWidth;
                    card.classList.add('project-enter');
                } else {
                    card.classList.remove('project-enter');
                }
            }
        });
    }

    setupSpotlightCards() {
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

        let rafId = null;
        let activeCard = null;
        let clientX = 0;
        let clientY = 0;

        document.querySelectorAll('.spotlight-card').forEach((card) => {
            card.addEventListener('mousemove', (e) => {
                activeCard = card;
                clientX = e.clientX;
                clientY = e.clientY;
                if (rafId) return;
                rafId = requestAnimationFrame(() => {
                    if (activeCard) {
                        const rect = activeCard.getBoundingClientRect();
                        activeCard.style.setProperty('--spot-x', `${clientX - rect.left}px`);
                        activeCard.style.setProperty('--spot-y', `${clientY - rect.top}px`);
                        if (!this.prefersReducedMotion) {
                            const cx = rect.left + rect.width / 2;
                            const cy = rect.top + rect.height / 2;
                            const rotateY = ((clientX - cx) / rect.width) * 6;
                            const rotateX = ((cy - clientY) / rect.height) * 6;
                            activeCard.style.setProperty('--tilt-x', `${rotateX}deg`);
                            activeCard.style.setProperty('--tilt-y', `${rotateY}deg`);
                        }
                    }
                    rafId = null;
                });
            }, { passive: true });

            card.addEventListener('mouseleave', () => {
                card.style.setProperty('--tilt-x', '0deg');
                card.style.setProperty('--tilt-y', '0deg');
            });
        });
    }

    setupAmbientMotion() {
        if (this.prefersReducedMotion) return;

        const blobs = document.querySelectorAll('.site-blobs .blob');
        if (!blobs.length) return;

        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const y = window.scrollY;
                blobs.forEach((blob, index) => {
                    const offset = y * (0.02 + index * 0.015);
                    blob.style.setProperty('--parallax-y', `${offset}px`);
                });
                ticking = false;
            });
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    setupCopyEmail() {
        if (!this.copyEmailBtn) return;
        const email = 'gabrielelazzara67@gmail.com';
        this.copyEmailBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(email);
                this.copyEmailBtn.classList.remove('is-copied');
                void this.copyEmailBtn.offsetWidth;
                this.copyEmailBtn.classList.add('is-copied');
                const span = this.copyEmailBtn.querySelector('[data-i18n]') || this.copyEmailBtn;
                span.textContent = translations[this.currentLang].contact_copied;
                setTimeout(() => {
                    this.copyEmailBtn.classList.remove('is-copied');
                    this.applyLanguage(this.currentLang);
                }, 2000);
            } catch {
                window.location.href = `mailto:${email}`;
            }
        });
    }

    setupMobileMenu() {
        this.menuBtn.addEventListener('click', () => this.toggleMenu());
        this.mobileLinks.forEach((link) => {
            link.addEventListener('click', () => {
                if (this.isMenuOpen) this.toggleMenu();
            });
        });
    }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        this.menuBtn.classList.toggle('menu-open');

        if (this.isMenuOpen) {
            this.mobileMenu.classList.remove('hidden');
            this.mobileMenu.classList.add('flex');
            this.mobileMenu.setAttribute('aria-hidden', 'false');
            requestAnimationFrame(() => {
                this.mobileMenu.classList.add('menu-visible');
                document.body.style.overflow = 'hidden';
            });
        } else {
            this.mobileMenu.classList.remove('menu-visible');
            this.mobileMenu.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            setTimeout(() => {
                this.mobileMenu.classList.add('hidden');
                this.mobileMenu.classList.remove('flex');
            }, 300);
        }
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href');
                if (targetId === '#') return;
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    e.preventDefault();
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    setupSectionMotion() {
        if (this.prefersReducedMotion) return;

        this.mainSections.forEach((section) => {
            section.classList.add('motion-section');
        });
    }

    enhanceRevealTargets() {
        if (this.prefersReducedMotion) return;

        const selectors = [
            '.section-eyebrow:not(.reveal)',
            '.section-lead:not(.reveal)',
            '.timeline-item:not(.reveal)',
            '.faq-item:not(.reveal)',
            '.footer-link:not(.reveal)',
            '.case-metric-grid > div:not(.reveal)',
            '.about-float-badge:not(.reveal)',
            '.hero-scroll-cue:not(.reveal)',
            '.filter-btn:not(.reveal)',
            '.seo-visible-block:not(.reveal)',
            '.pkg-card:not(.reveal)',
            '.mobile-link:not(.reveal)',
            '.project-card .project-card-actions a:not(.reveal)',
            '.marquee-item:not(.reveal)',
        ];

        let delayIndex = 0;
        selectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach((el) => {
                el.classList.add('reveal', 'reveal-fade');
                el.style.transitionDelay = `${(delayIndex % 12) * 40}ms`;
                delayIndex += 1;
            });
        });

        document.querySelectorAll('#skills .skill-tag').forEach((tag, index) => {
            tag.style.setProperty('--stagger', `${(index % 12) * 35}ms`);
        });

        this.revealElements = document.querySelectorAll('.reveal');
    }

    setupIntersectionObservers() {
        const pending = new Map();
        let revealRaf = null;

        const flushReveal = () => {
            pending.forEach((isActive, el) => {
                el.classList.toggle('active', isActive);
            });
            pending.clear();
            revealRaf = null;
        };

        const revealObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    pending.set(entry.target, entry.isIntersecting);
                });
                if (!revealRaf) {
                    revealRaf = requestAnimationFrame(flushReveal);
                }
            },
            {
                threshold: 0.1,
                rootMargin: '8% 0px 8% 0px',
            }
        );

        this.revealElements.forEach((el) => revealObserver.observe(el));

        const sectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const section = entry.target;
                    section.classList.toggle('section-visible', entry.isIntersecting);

                    if (entry.isIntersecting && section.id === 'skills' && !section.dataset.staggered) {
                        section.querySelectorAll('.skill-tag').forEach((tag) => {
                            tag.classList.add('tag-motion');
                        });
                        section.dataset.staggered = '1';
                    }

                    const id = section.getAttribute('id');
                    if (!id) return;
                    if (entry.isIntersecting) {
                        this.visibleSections.set(id, entry.intersectionRatio);
                    } else {
                        this.visibleSections.delete(id);
                    }
                });
                this.syncActiveNavFromSections();
            },
            { threshold: [0, 0.15, 0.35], rootMargin: '-12% 0px -12% 0px' }
        );

        this.mainSections.forEach((section) => sectionObserver.observe(section));
    }

    setupInteractiveMotion() {
        if (this.prefersReducedMotion) return;

        const interactiveSelector = [
            'a.btn-primary',
            'a.btn-ghost',
            'a.hero-action-btn',
            'button.btn-primary',
            '.filter-btn',
            '.nav-link-cta',
            '.mobile-link-accent',
            '.project-card a[class*="rounded"]',
            '#contact-form button[type="submit"]',
            '#copy-email-btn',
            'footer.site-footer a.rounded-full',
            '.faq-item summary',
            '.nav-link',
            '.mobile-link',
        ].join(', ');

        document.querySelectorAll(interactiveSelector).forEach((el) => {
            el.classList.add('motion-interactive');
        });
    }

    syncActiveNavFromSections() {
        let bestId = '';
        let bestRatio = 0;
        this.visibleSections.forEach((ratio, id) => {
            if (ratio > bestRatio) {
                bestRatio = ratio;
                bestId = id;
            }
        });
        if (bestId) this.updateActiveNavLink(bestId);
    }

    updateActiveNavLink(sectionId) {
        if (sectionId === this.activeSectionId) return;
        this.activeSectionId = sectionId;

        this.navLinks.forEach((link) => {
            const href = link.getAttribute('href');
            const isActive = href === `#${sectionId}`;
            link.classList.toggle('active-link', isActive);
            link.classList.toggle('text-white', isActive);
            link.classList.toggle('bg-white/10', isActive);
            link.classList.toggle('text-gray-300', !isActive);
        });
    }

    setupScrollListener() {
        let ticking = false;

        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                this.navbar.classList.toggle('navbar-scrolled', window.scrollY > 50);
                ticking = false;
            });
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    setupPressFeedback() {
        if (this.prefersReducedMotion) return;

        const pressables = document.querySelectorAll(
            '.motion-interactive, .theme-toggle, .lang-toggle'
        );

        pressables.forEach((el) => {
            const onDown = () => el.classList.add('is-pressed');
            const onUp = () => el.classList.remove('is-pressed');
            el.addEventListener('pointerdown', onDown);
            el.addEventListener('pointerup', onUp);
            el.addEventListener('pointerleave', onUp);
            el.addEventListener('pointercancel', onUp);
        });
    }

    setupFaqAnimations() {
        document.querySelectorAll('.faq-item').forEach((item) => {
            item.addEventListener('toggle', () => {
                if (!item.open || this.prefersReducedMotion) return;
                const body = item.querySelector('p, .faq-answer');
                if (!body) return;
                body.classList.remove('faq-replay');
                void body.offsetWidth;
                body.classList.add('faq-replay');
            });
        });
    }

    getWhatsAppNumber() {
        return [51, 57, 51, 57, 49, 52, 57, 52, 54, 56, 49, 51]
            .map((code) => String.fromCharCode(code))
            .join('');
    }

    buildWhatsAppMessage(name, email, message) {
        const lang = this.currentLang;
        const t = translations[lang] || translations.it;
        const lines = [
            t.whatsapp_intro,
            '',
            `${t.whatsapp_label_name} ${name.trim()}`,
            `${t.whatsapp_label_email} ${email.trim()}`,
            '',
            t.whatsapp_label_message,
            message.trim(),
        ];
        return lines.join('\n');
    }

    setupContactForm() {
        const contactForm = document.getElementById('contact-form');
        if (!contactForm) return;

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const nameInput = contactForm.querySelector('input[name="name"]');
            const emailInput = contactForm.querySelector('input[name="email"]');
            const messageInput = contactForm.querySelector('textarea[name="message"]');

            if (!contactForm.reportValidity()) return;

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const message = messageInput.value.trim();

            const text = encodeURIComponent(this.buildWhatsAppMessage(name, email, message));
            const url = `https://wa.me/${this.getWhatsAppNumber()}?text=${text}`;

            window.open(url, '_blank', 'noopener,noreferrer');

            const btn = contactForm.querySelector('button[type="submit"]');
            const originalHtml = btn.innerHTML;
            const t = translations[this.currentLang] || translations.it;
            btn.innerHTML = `${t.whatsapp_opening} <i class="fab fa-whatsapp ml-1" aria-hidden="true"></i>`;

            setTimeout(() => {
                btn.innerHTML = originalHtml;
                contactForm.reset();
            }, 3000);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PortfolioApp();
});
