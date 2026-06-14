class PortfolioApp {
    constructor() {
        this.navbar = document.getElementById('navbar');
        this.menuBtn = document.getElementById('mobile-menu-btn');
        this.mobileMenu = document.getElementById('mobile-menu');
        this.mainSections = document.querySelectorAll('.site-main > section');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.mobileLinks = document.querySelectorAll('.mobile-link');
        this.revealElements = document.querySelectorAll('.reveal');
        this.activeSectionId = '';
        this.navSectionIds = [
            'hero',
            'about',
            'services',
            'scope',
            'process',
            'skills',
            'projects',
            'case-study',
            'faq',
            'contact',
        ];
        this.navSectionAlias = { values: 'about', experience: 'about' };
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
        this.motionTier = this.getMotionTier();

        if (this.motionTier === 'full') {
            document.documentElement.classList.add('motion-enhanced');
        } else if (this.motionTier === 'lite') {
            document.documentElement.classList.add('motion-lite');
        }

        this.init();
    }

    init() {
        this.setupThemeToggle();
        this.applyTheme(this.currentTheme);
        this.setupMobileMenu();
        this.setupSmoothScrolling();
        this.enhanceRevealTargets();
        this.setupHeroPanelTypewriter();
        this.applyLanguage(this.currentLang);
        this.setupIntersectionObservers();
        this.setupNavScrollSpy();
        this.setupInteractiveMotion();
        this.setupScrollEffects();
        this.setupContactForm();
        this.setupCopyEmail();
        this.setupLanguageToggle();
        this.setupProjectFilters();
        this.setupSpotlightCards();
        this.setupPressFeedback();
        this.setupCaseMetricMotion();
        this.setupOutboundTracking();
        requestAnimationFrame(() => {
            document.body.classList.add('page-loaded');
            document.documentElement.classList.add('page-ready');
        });
        this.applyProjectFilter(this.currentFilter, true);
    }

    setupThemeToggle() {
        if (!this.themeToggle) return;

        this.themeToggle.addEventListener('click', () => {
            if (this.themeToggle.classList.contains('is-switching')) return;

            const nextTheme = this.currentTheme === 'dark' ? 'light' : 'dark';

            if (this.prefersReducedMotion) {
                this.currentTheme = nextTheme;
                this.applyTheme(nextTheme, false);
                localStorage.setItem('portfolio_theme', nextTheme);
                return;
            }
            this.themeToggle.classList.remove('is-switching', 'to-light', 'to-dark');
            void this.themeToggle.offsetWidth;
            this.themeToggle.classList.add('is-switching', nextTheme === 'light' ? 'to-light' : 'to-dark');

            window.setTimeout(() => {
                this.currentTheme = nextTheme;
                this.applyTheme(nextTheme, true);
                localStorage.setItem('portfolio_theme', nextTheme);
            }, 240);

            window.setTimeout(() => {
                this.themeToggle.classList.remove('is-switching', 'to-light', 'to-dark');
            }, 760);
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

                const directionClass = nextLang === 'en' ? 'to-en' : 'to-it';

                this.langToggles.forEach((btn) => {
                    btn.classList.remove('is-switching', 'to-en', 'to-it', 'lang-pop');
                    void btn.offsetWidth;
                    btn.classList.add('is-switching', directionClass);
                });

                document.documentElement.classList.add('lang-transitioning');

                window.setTimeout(() => {
                    this.currentLang = nextLang;
                    localStorage.setItem('portfolio_lang', nextLang);
                    this.applyLanguage(nextLang);
                    document.documentElement.classList.remove('lang-transitioning');
                    document.documentElement.classList.add('lang-entered');
                    window.setTimeout(() => {
                        document.documentElement.classList.remove('lang-entered');
                    }, 450);
                }, 220);

                window.setTimeout(() => {
                    this.langToggles.forEach((btn) => {
                        btn.classList.remove('is-switching', 'to-en', 'to-it');
                    });
                }, 640);
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

        document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
            if (el === this.menuBtn && this.isMenuOpen) return;
            const key = el.getAttribute('data-i18n-aria');
            if (translations[lang][key]) {
                el.setAttribute('aria-label', translations[lang][key]);
            }
        });

        ['proj3_bullets', 'proj_luxury_bullets'].forEach((key) => {
            document.querySelectorAll(`[data-i18n="${key}"]`).forEach((el) => {
                if (translations[lang][key]) el.innerHTML = translations[lang][key];
            });
        });

        if (typeof applySeoLanguage === 'function') {
            applySeoLanguage(lang);
        }

        this.updateHeroHeading(lang);
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
                    b.setAttribute('aria-selected', isActive ? 'true' : 'false');
                    if (isActive) {
                        b.classList.remove('filter-pop');
                        void b.offsetWidth;
                        b.classList.add('filter-pop');
                    }
                });
                this.applyProjectFilter(filter);
                this.trackEvent('project_filter', { filter });
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

    trackEvent(name, props = {}) {
        try {
            if (typeof window.plausible === 'function') {
                window.plausible(name, { props });
            }
            if (typeof window.gtag === 'function') {
                window.gtag('event', name, props);
            }
            (window.dataLayer = window.dataLayer || []).push({ event: name, ...props });
        } catch {
            /* analytics is best-effort */
        }
    }

    setupOutboundTracking() {
        document.querySelectorAll('#projects a[href^="http"], #case-study a[href^="http"]').forEach((link) => {
            link.addEventListener('click', () => {
                const card = link.closest('[data-project-category], #case-study');
                const title = card?.querySelector('h3')?.textContent?.trim() || link.href;
                this.trackEvent('project_click', { project: title, url: link.href });
            });
        });
    }

    getMotionTier() {
        if (this.prefersReducedMotion) return 'none';
        const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
        const narrow = window.matchMedia('(max-width: 768px)').matches;
        const lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory < 4;
        const lowCpu = typeof navigator.hardwareConcurrency === 'number'
            && navigator.hardwareConcurrency <= 4;
        if (coarse || narrow || lowMemory || lowCpu) return 'lite';
        return 'full';
    }

    setupSpotlightCards() {
        if (this.motionTier === 'none') return;
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
                    }
                    rafId = null;
                });
            }, { passive: true });
        });
    }

    setupCopyEmail() {
        if (!this.copyEmailBtn) return;
        const email = 'gabrielelazzara67@gmail.com';
        this.copyEmailBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(email);
                this.trackEvent('copy_email');
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
        if (!this.menuBtn || !this.mobileMenu) return;
        this.menuBtn.addEventListener('click', () => this.toggleMenu());
        this.mobileLinks.forEach((link) => {
            link.addEventListener('click', () => {
                if (this.isMenuOpen) this.toggleMenu();
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.toggleMenu();
                this.menuBtn.focus();
            }
        });

        this.mobileMenu.addEventListener('click', (e) => {
            if (e.target === this.mobileMenu && this.isMenuOpen) this.toggleMenu();
        });
    }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        this.menuBtn.classList.toggle('menu-open');
        this.menuBtn.setAttribute('aria-expanded', this.isMenuOpen ? 'true' : 'false');
        const t = (typeof translations !== 'undefined' && translations[this.currentLang]) || {};
        this.menuBtn.setAttribute('aria-label', this.isMenuOpen
            ? (t.menu_close_aria || 'Chiudi menu')
            : (t.menu_open_aria || 'Apri menu'));

        if (this.isMenuOpen) {
            this.mobileMenu.classList.remove('hidden');
            this.mobileMenu.classList.add('flex');
            this.mobileMenu.setAttribute('aria-hidden', 'false');
            requestAnimationFrame(() => {
                this.mobileMenu.classList.add('menu-visible');
                document.body.style.overflow = 'hidden';
                this.mobileLinks[0]?.focus();
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

    getScrollOffset() {
        const navH = this.navbar ? this.navbar.offsetHeight : 0;
        return navH + 12;
    }

    cancelSmoothScroll() {
        if (this._smoothScrollFrame) {
            cancelAnimationFrame(this._smoothScrollFrame);
            this._smoothScrollFrame = null;
        }
        document.documentElement.classList.remove('is-smooth-scrolling');
    }

    smoothScrollToElement(targetSection) {
        if (this.prefersReducedMotion) {
            const top = targetSection.getBoundingClientRect().top + window.scrollY - this.getScrollOffset();
            window.scrollTo({ top, left: 0, behavior: 'auto' });
            return;
        }

        this.cancelSmoothScroll();

        const startY = window.scrollY;
        const targetY = targetSection.getBoundingClientRect().top + startY - this.getScrollOffset();
        const distance = targetY - startY;

        if (Math.abs(distance) < 4) return;

        const duration = Math.min(920, Math.max(360, Math.abs(distance) * 0.48));
        const easeOutCubic = (t) => 1 - (1 - t) ** 3;
        let startedAt = null;

        document.documentElement.classList.add('is-smooth-scrolling');

        const cancelOnUserInput = () => {
            this.cancelSmoothScroll();
            window.removeEventListener('wheel', cancelOnUserInput, cancelOpts);
            window.removeEventListener('touchstart', cancelOnUserInput, cancelOpts);
            window.removeEventListener('keydown', cancelOnUserInput, cancelOpts);
        };
        const cancelOpts = { passive: true };
        window.addEventListener('wheel', cancelOnUserInput, cancelOpts);
        window.addEventListener('touchstart', cancelOnUserInput, cancelOpts);
        window.addEventListener('keydown', cancelOnUserInput, cancelOpts);

        const step = (now) => {
            if (startedAt === null) startedAt = now;
            const progress = Math.min(1, (now - startedAt) / duration);
            window.scrollTo(0, startY + distance * easeOutCubic(progress));

            if (progress < 1) {
                this._smoothScrollFrame = requestAnimationFrame(step);
                return;
            }

            this._smoothScrollFrame = null;
            document.documentElement.classList.remove('is-smooth-scrolling');
            window.removeEventListener('wheel', cancelOnUserInput, cancelOpts);
            window.removeEventListener('touchstart', cancelOnUserInput, cancelOpts);
            window.removeEventListener('keydown', cancelOnUserInput, cancelOpts);
        };

        this._smoothScrollFrame = requestAnimationFrame(step);
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href');
                if (targetId === '#') return;
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    e.preventDefault();
                    this.smoothScrollToElement(targetSection);
                    if (this.isMenuOpen) this.toggleMenu();
                }
            });
        });
    }

    enhanceRevealTargets() {
        if (this.motionTier === 'none') return;

        const selectors = [
            '.section-eyebrow:not(.reveal)',
            '.section-lead:not(.reveal)',
            '.timeline-item:not(.reveal)',
            '.hero-scroll-cue:not(.reveal)',
            '.filter-btn:not(.reveal)',
            '.seo-visible-block:not(.reveal)',
            '.packages-unified:not(.reveal)',
        ];

        if (this.motionTier === 'full') {
            selectors.push(
                '.footer-link:not(.reveal)',
                '.about-float-badge:not(.reveal)',
                '.project-card .project-card-actions a:not(.reveal)'
            );
        }

        let delayIndex = 0;
        const maxDelaySteps = this.motionTier === 'lite' ? 6 : 10;
        selectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach((el) => {
                el.classList.add('reveal', 'reveal-fade');
                el.style.transitionDelay = `${(delayIndex % maxDelaySteps) * 35}ms`;
                delayIndex += 1;
            });
        });

        document.querySelectorAll('#skills .skill-tag').forEach((tag, index) => {
            tag.style.setProperty('--stagger', `${(index % 10) * 30}ms`);
        });

        this.revealElements = document.querySelectorAll('.reveal');
    }

    setupIntersectionObservers() {
        if (this.motionTier === 'none') {
            this.revealElements.forEach((el) => el.classList.add('active'));
            return;
        }

        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    const el = entry.target;
                    el.classList.add('active');
                    if (el.classList.contains('skill-card')) {
                        el.querySelectorAll('.skill-tag').forEach((tag, index) => {
                            tag.style.setProperty('--stagger', `${0.22 + index * 0.04}s`);
                            tag.classList.add('tag-motion');
                        });
                    }
                    if (el.classList.contains('hero-visual-col')) {
                        this.startHeroPanelTypewriterIfNeeded();
                    }
                    observer.unobserve(el);
                });
            },
            {
                threshold: 0.08,
                rootMargin: '48px 0px -4% 0px',
            }
        );

        this.revealElements.forEach((el) => {
            if (el.classList.contains('case-metric')) return;
            if (el.closest('#process .process-grid')) return;
            revealObserver.observe(el);
        });

        this.setupProcessReveal();

        const sectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    const section = entry.target;
                    if (!section.dataset.sectionSeen) {
                        section.dataset.sectionSeen = '1';
                        section.classList.add('section-visible');
                        if (section.id === 'experience') {
                            this.revealExperienceTimeline(section);
                        }
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -20% 0px' }
        );

        this.mainSections.forEach((section) => sectionObserver.observe(section));
    }

    revealExperienceTimeline(section) {
        if (this.motionTier === 'none') return;

        const items = section.querySelectorAll('.timeline--exp .timeline-item.reveal');
        items.forEach((item, index) => {
            if (item.classList.contains('active')) return;
            window.setTimeout(() => {
                item.classList.add('active');
            }, 60 + index * 110);
        });
    }

    setupProcessReveal() {
        const grid = document.querySelector('#process .process-grid--flow');
        if (!grid) return;

        if (this.motionTier === 'none') {
            grid.querySelectorAll('.process-step.reveal').forEach((step) => step.classList.add('active'));
            return;
        }

        const play = () => {
            const section = document.getElementById('process');
            if (section) this.revealProcessSteps(section);
        };

        const gridObserver = new IntersectionObserver(
            (entries) => {
                if (!entries[0]?.isIntersecting) return;
                grid.classList.add('process-grid--inview');
                play();
                gridObserver.disconnect();
            },
            { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
        );

        gridObserver.observe(grid);
    }

    revealProcessSteps(section) {
        if (this.motionTier === 'none') return;
        if (section.dataset.processPlayed === '1') return;

        const run = () => {
            if (section.dataset.processPlayed === '1') return;
            section.dataset.processPlayed = '1';

            const steps = [...section.querySelectorAll('.process-grid--flow .process-step.reveal')];
            steps.forEach((step) => step.classList.remove('active'));
            steps.forEach((step, index) => {
                window.setTimeout(() => {
                    step.classList.add('active');
                }, 70 + index * 105);
            });
        };

        const root = document.documentElement;
        if (root.classList.contains('is-smooth-scrolling') || root.classList.contains('is-scrolling')) {
            window.setTimeout(run, 420);
            return;
        }

        run();
    }

    setupNavScrollSpy() {
        const spyIds = [...this.navSectionIds, ...Object.keys(this.navSectionAlias)];
        this.navSections = spyIds
            .map((id) => document.getElementById(id))
            .filter(Boolean)
            .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

        this.cacheNavSectionMetrics();
        this.syncActiveNavFromScroll();

        window.addEventListener('resize', () => {
            this.cacheNavSectionMetrics();
            this.syncActiveNavFromScroll();
        }, { passive: true });
    }

    getNavScrollProbe() {
        const navH = this.navbar?.offsetHeight ?? 72;
        return navH + Math.min(window.innerHeight * 0.25, 168);
    }

    cacheNavSectionMetrics() {
        if (!this.navSections?.length) return;
        const scrollY = window.scrollY;
        this.navSectionMetrics = this.navSections.map((section) => ({
            id: section.id,
            top: section.getBoundingClientRect().top + scrollY,
        }));
    }

    syncActiveNavFromScroll() {
        if (!this.navSectionMetrics?.length) return;

        const probe = window.scrollY + this.getNavScrollProbe();
        let activeId = this.navSectionMetrics[0].id;

        for (let i = 0; i < this.navSectionMetrics.length; i += 1) {
            const entry = this.navSectionMetrics[i];
            if (entry.top <= probe + 2) {
                activeId = entry.id;
            }
        }

        const scrollBottom = window.scrollY + window.innerHeight;
        const pageBottom = document.documentElement.scrollHeight;
        if (scrollBottom >= pageBottom - 96) {
            const contact = document.getElementById('contact');
            if (contact) activeId = contact.id;
        }

        this.updateActiveNavLink(this.navSectionAlias[activeId] || activeId);
    }

    setupInteractiveMotion() {
        const interactiveSelector = [
            'a.btn-primary',
            'a.btn-ghost',
            'a.hero-action-btn',
            'button.btn-primary',
            '.filter-btn',
            '.nav-link-cta',
            '.mobile-link-accent',
            '.packages-unified__cta',
            '.hero-scroll-cue',
            '.case-cta-secondary',
            '.project-card a[class*="rounded"]',
            '#contact-form button[type="submit"]',
            '#copy-email-btn',
            '#mobile-menu-btn',
            'footer.site-footer a.rounded-full',
            '.faq-item summary',
            '.nav-link',
            '.mobile-link',
            '.footer-link',
            'a.rounded-xl.font-semibold',
        ].join(', ');

        document.querySelectorAll(interactiveSelector).forEach((el) => {
            el.classList.add('motion-interactive');
        });
    }

    updateActiveNavLink(sectionId) {
        if (sectionId === this.activeSectionId) return;
        this.activeSectionId = sectionId;

        const applyNavState = (link) => {
            const href = link.getAttribute('href');
            if (!href?.startsWith('#')) return;
            const isActive = href === `#${sectionId}`;
            link.classList.toggle('active-link', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
            link.classList.toggle('text-white', isActive);
            link.classList.toggle('bg-white/10', isActive);
            link.classList.toggle('text-gray-300', !isActive);
        };

        this.navLinks.forEach(applyNavState);
        this.mobileLinks.forEach(applyNavState);
    }

    setupScrollEffects() {
        let ticking = false;
        let scrollEndTimer = null;
        let lastSpyAt = 0;
        const spyIntervalMs = 120;

        const markScrolling = () => {
            document.documentElement.classList.add('is-scrolling');
            window.clearTimeout(scrollEndTimer);
            scrollEndTimer = window.setTimeout(() => {
                document.documentElement.classList.remove('is-scrolling');
                this.cacheNavSectionMetrics();
                this.syncActiveNavFromScroll();
            }, 180);
        };

        const onScroll = () => {
            markScrolling();
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                if (this.navbar) {
                    this.navbar.classList.toggle('navbar-scrolled', window.scrollY > 50);
                }
                const now = performance.now();
                if (now - lastSpyAt >= spyIntervalMs) {
                    lastSpyAt = now;
                    this.syncActiveNavFromScroll();
                }
                ticking = false;
            });
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener('click', () => {
                window.setTimeout(() => this.syncActiveNavFromScroll(), 480);
            });
        });
    }

    setupCaseMetricMotion() {
        const grid = document.querySelector('#case-study .case-metric-grid.reveal-stagger');
        if (!grid) return;

        const cards = [...grid.querySelectorAll('.case-metric.reveal')];
        if (!cards.length) return;

        const run = () => {
            cards.forEach((card) => card.classList.remove('metric-enter', 'active'));
            void grid.offsetWidth;
            cards.forEach((card, index) => {
                window.setTimeout(() => {
                    card.classList.add('metric-enter', 'active');
                }, index * 100);
            });
        };

        if (this.motionTier === 'none' || this.prefersReducedMotion) {
            cards.forEach((card) => card.classList.add('metric-enter', 'active'));
            return;
        }

        const observer = new IntersectionObserver(
            (entries, obs) => {
                if (!entries.some((e) => e.isIntersecting)) return;
                run();
                obs.disconnect();
            },
            { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
        );

        observer.observe(grid);
    }

    getHeroRoleDisplayLines(role) {
        const sep = ' · ';
        const idx = role.indexOf(sep);
        if (idx === -1) return [role];

        const lines = [role.slice(0, idx + 1)];
        role.slice(idx + sep.length).trim().split(/\s+/).forEach((word) => {
            if (word) lines.push(word);
        });
        return lines;
    }

    getHeroPanelCodeSegments() {
        return [
            { text: 'const ', class: 'tok-kw' },
            { text: 'developer', class: 'tok-prop' },
            { text: ' = {\n  ', class: 'tok-punct' },
            { text: 'name', class: 'tok-prop' },
            { text: ': ', class: 'tok-punct' },
            { text: '"Gabriel Lazzara"', class: 'tok-str' },
            { text: ',\n  ', class: 'tok-punct' },
            { text: 'location', class: 'tok-prop' },
            { text: ': ', class: 'tok-punct' },
            { text: '"Palermo, IT"', class: 'tok-str' },
            { text: ',\n  ', class: 'tok-punct' },
            { text: 'stack', class: 'tok-prop' },
            { text: ': [', class: 'tok-punct' },
            { text: '"React"', class: 'tok-str' },
            { text: ', ', class: 'tok-punct' },
            { text: '"Python"', class: 'tok-str' },
            { text: ', ', class: 'tok-punct' },
            { text: '"PHP"', class: 'tok-str' },
            { text: '],\n  ', class: 'tok-punct' },
            { text: 'focus', class: 'tok-prop' },
            { text: ': [', class: 'tok-punct' },
            { text: '"SEO"', class: 'tok-str' },
            { text: ', ', class: 'tok-punct' },
            { text: '"UX"', class: 'tok-str' },
            { text: ', ', class: 'tok-punct' },
            { text: '"deploy"', class: 'tok-str' },
            { text: ']\n};\n', class: 'tok-punct' },
            { text: 'build', class: 'tok-kw' },
            { text: '(developer); ', class: 'tok-punct' },
            { text: '// ready ✓', class: 'tok-comment' },
        ];
    }

    typewriterDelay(ms) {
        return new Promise((resolve) => {
            window.setTimeout(resolve, ms);
        });
    }

    typewriterPauseFor(char) {
        if (char === '\n') return 220;
        if (char === ';' || char === '}') return 160;
        if (char === '"' || char === '=' || char === ':') return 70;
        if (char === ' ' || char === ',') return 28;
        return 34 + Math.floor(Math.random() * 18);
    }

    heroHeadingPauseFor(char) {
        if (char === ' ') return 32;
        if (char === '·') return 140;
        if (char === '-') return 90;
        return 44 + Math.floor(Math.random() * 24);
    }

    getHeroHeadingLines(lang) {
        const role = translations[lang]?.hero_role || '';
        const roleLines = this.getHeroRoleDisplayLines(role);
        return [
            { text: 'Gabriel', className: 'hero-heading__line hero-heading__line--name' },
            { text: 'Lazzara', className: 'hero-heading__line hero-heading__line--name' },
            ...roleLines.map((line) => ({
                text: line,
                className: 'hero-heading__line hero-heading__line--role',
            })),
        ];
    }

    renderTypewriterInstant({ codeEl, cursorEl, rootEl, segments }) {
        if (!codeEl) return;
        codeEl.innerHTML = segments
            .map((seg) => `<span class="${seg.class}">${seg.text}</span>`)
            .join('');
        rootEl?.classList.add('is-done');
        if (cursorEl) {
            cursorEl.textContent = '';
            cursorEl.classList.add('is-on');
        }
    }

    async playTypewriter({ codeEl, cursorEl, rootEl, segments, isStale, startDelay = 0 }) {
        if (!codeEl) return;

        if (startDelay > 0) {
            await this.typewriterDelay(startDelay);
            if (isStale?.()) return;
        }

        if (cursorEl) {
            cursorEl.remove();
            cursorEl.textContent = '';
            cursorEl.classList.add('is-on');
        }
        codeEl.innerHTML = '';
        rootEl?.classList.remove('is-done');

        for (const segment of segments) {
            const span = document.createElement('span');
            span.className = segment.class;
            codeEl.appendChild(span);

            for (const char of segment.text) {
                if (isStale?.()) return;
                span.textContent += char;
                await this.typewriterDelay(this.typewriterPauseFor(char));
            }
        }

        if (isStale?.()) return;

        rootEl?.classList.add('is-done');
        if (cursorEl) {
            cursorEl.textContent = '';
            cursorEl.classList.add('is-on');
        }
    }

    setupHeroPanelTypewriter() {
        this.heroHeadingLines = document.getElementById('hero-heading-lines');
        this.heroHeadingRoot = document.getElementById('hero-heading');
        this.heroHeadingCursor = document.getElementById('hero-heading-cursor');
        this.heroHeadingGen = 0;
        this.heroPanelCode = document.getElementById('hero-panel-code');
        this.heroPanelRoot = document.getElementById('hero-panel-typewriter');
        this.heroPanelCursor = document.getElementById('hero-panel-cursor');
        this.heroPanelGen = 0;
        this.heroPanelHasPlayed = false;
        const motionOk = !this.prefersReducedMotion && this.motionTier !== 'none';
        this.heroHeadingEnabled = Boolean(this.heroHeadingLines && motionOk);
        this.heroVisualCol = document.querySelector('.hero-visual-col');
        this.heroPanelEnabled = Boolean(this.heroPanelCode && motionOk);
        this.heroPanelMobileMq = window.matchMedia('(max-width: 1023px)');
    }

    isHeroPanelMobile() {
        return this.heroPanelMobileMq?.matches ?? false;
    }

    prepareHeroPanelForReveal() {
        if (!this.heroPanelCode) return;
        this.heroPanelRoot?.classList.remove('is-done');
        this.heroPanelCode.innerHTML = '';
        if (this.heroPanelCursor) {
            this.heroPanelCursor.textContent = '';
            this.heroPanelCursor.classList.add('is-on');
        }
    }

    startHeroPanelTypewriterIfNeeded() {
        if (!this.heroPanelEnabled || this.heroPanelHasPlayed) return;
        this.heroPanelHasPlayed = true;
        const startDelay = this.isHeroPanelMobile() ? 320 : 520;
        this.playHeroPanelCode(startDelay);
    }

    parkHeroHeadingCursor() {
        if (!this.heroHeadingCursor || !this.heroHeadingRoot) return;
        this.heroHeadingCursor.classList.remove('is-on');
        this.heroHeadingRoot.appendChild(this.heroHeadingCursor);
    }

    renderHeroHeadingInstant(lang) {
        if (!this.heroHeadingLines) return;
        const lines = this.getHeroHeadingLines(lang);
        this.heroHeadingLines.innerHTML = lines
            .map((line) => `<span class="${line.className}"><span class="hero-heading__text">${line.text}</span></span>`)
            .join('');
        this.heroHeadingRoot?.classList.add('is-done');
        this.parkHeroHeadingCursor();
    }

    async playHeroHeadingTypewriter(lang) {
        if (!this.heroHeadingLines) return;

        const role = translations[lang]?.hero_role || '';
        const heading = this.heroHeadingRoot;
        const cursor = this.heroHeadingCursor;
        const lines = this.getHeroHeadingLines(lang);
        const gen = ++this.heroHeadingGen;

        this.heroHeadingLines.innerHTML = '';
        heading?.classList.remove('is-done');
        this.parkHeroHeadingCursor();
        if (cursor) {
            cursor.classList.add('is-on');
        }

        for (let i = 0; i < lines.length; i += 1) {
            if (gen !== this.heroHeadingGen) return;

            const line = lines[i];
            const lineEl = document.createElement('span');
            lineEl.className = line.className;
            const textEl = document.createElement('span');
            textEl.className = 'hero-heading__text';
            lineEl.appendChild(textEl);
            if (cursor) {
                lineEl.appendChild(cursor);
            }
            this.heroHeadingLines.appendChild(lineEl);

            for (const char of line.text) {
                if (gen !== this.heroHeadingGen) return;
                textEl.textContent += char;
                await this.typewriterDelay(this.heroHeadingPauseFor(char));
            }

            if (i < lines.length - 1) {
                await this.typewriterDelay(200);
            }
        }

        if (gen !== this.heroHeadingGen) return;

        heading?.classList.add('is-done');
        this.parkHeroHeadingCursor();
        if (heading) {
            heading.setAttribute('aria-label', `Gabriel Lazzara — ${role}`);
        }
    }

    updateHeroHeading(lang) {
        const role = translations[lang]?.hero_role || '';
        const heading = document.getElementById('hero-heading');
        if (heading) {
            heading.setAttribute('aria-label', `Gabriel Lazzara — ${role}`);
        }

        if (!this.heroHeadingLines) return;

        if (!this.heroHeadingEnabled) {
            this.renderHeroHeadingInstant(lang);
        } else {
            this.playHeroHeadingTypewriter(lang);
        }

        if (!this.heroPanelCode) return;

        if (!this.heroPanelEnabled) {
            this.renderHeroPanelInstant();
            return;
        }

        if (!this.heroPanelHasPlayed) {
            if (this.isHeroPanelMobile()) {
                this.prepareHeroPanelForReveal();
            } else {
                this.heroPanelHasPlayed = true;
                this.playHeroPanelCode(520);
            }
        } else if (this.heroPanelRoot?.classList.contains('is-done')) {
            this.renderHeroPanelInstant();
        }
    }

    renderHeroPanelInstant() {
        this.renderTypewriterInstant({
            codeEl: this.heroPanelCode,
            cursorEl: this.heroPanelCursor,
            rootEl: this.heroPanelRoot,
            segments: this.getHeroPanelCodeSegments(),
        });
    }

    async playHeroPanelCode(startDelay = 520) {
        if (!this.heroPanelEnabled) {
            this.renderHeroPanelInstant();
            return;
        }

        const gen = ++this.heroPanelGen;
        await this.playTypewriter({
            codeEl: this.heroPanelCode,
            cursorEl: this.heroPanelCursor,
            rootEl: this.heroPanelRoot,
            segments: this.getHeroPanelCodeSegments(),
            isStale: () => gen !== this.heroPanelGen,
            startDelay,
        });
    }

    setupPressFeedback() {
        const pressables = document.querySelectorAll(
            '.motion-interactive, .theme-toggle, .lang-toggle, .btn-primary, .btn-ghost, .filter-btn, .nav-link, .mobile-link, .footer-link'
        );

        pressables.forEach((el) => {
            if (el.dataset.pressBound === '1') return;
            el.dataset.pressBound = '1';

            const onDown = (e) => {
                if (e.pointerType === 'mouse' && e.button !== 0) return;
                el.classList.add('is-pressed');
            };
            const onUp = () => el.classList.remove('is-pressed');
            el.addEventListener('pointerdown', onDown);
            el.addEventListener('pointerup', onUp);
            el.addEventListener('pointerleave', onUp);
            el.addEventListener('pointercancel', onUp);
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

            this.trackEvent('contact_whatsapp');
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
