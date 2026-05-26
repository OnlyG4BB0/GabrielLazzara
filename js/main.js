class PortfolioApp {
    constructor() {
        this.navbar = document.getElementById('navbar');
        this.menuBtn = document.getElementById('mobile-menu-btn');
        this.mobileMenu = document.getElementById('mobile-menu');
        this.sections = document.querySelectorAll('section');
        this.mainSections = document.querySelectorAll('.site-main > section');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.mobileLinks = document.querySelectorAll('.mobile-link');
        this.revealElements = document.querySelectorAll('.reveal');
        this.blobsLayer = document.querySelector('.site-blobs');
        this.langToggles = document.querySelectorAll('.lang-toggle');
        this.copyEmailBtn = document.getElementById('copy-email-btn');
        this.projectCards = document.querySelectorAll('[data-project-category]');
        this.filterBtns = document.querySelectorAll('[data-project-filter]');
        this.themeToggle = document.getElementById('theme-toggle');

        this.isMenuOpen = false;
        this.currentLang = localStorage.getItem('portfolio_lang') || 'it';
        this.currentFilter = 'all';
        this.currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';

        this.init();
    }

    init() {
        this.setupThemeToggle();
        this.applyTheme(this.currentTheme);
        this.setupMobileMenu();
        this.setupSmoothScrolling();
        this.setupIntersectionObservers();
        this.setupScrollListener();
        this.setupContactForm();
        this.setupCopyEmail();
        this.setupLanguageToggle();
        this.setupProjectFilters();
        this.setupSpotlightCards();
        this.applyLanguage(this.currentLang);
        this.applyProjectFilter(this.currentFilter, true);
    }

    setupThemeToggle() {
        if (!this.themeToggle) return;

        this.themeToggle.addEventListener('click', () => {
            this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            this.applyTheme(this.currentTheme);
            localStorage.setItem('portfolio_theme', this.currentTheme);
        });
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.setAttribute('content', theme === 'light' ? '#f5f3fa' : '#08060f');
        }
        if (this.themeToggle) {
            const label = theme === 'dark'
                ? (translations[this.currentLang]?.theme_toggle_light || 'Attiva tema chiaro')
                : (translations[this.currentLang]?.theme_toggle_dark || 'Attiva tema scuro');
            this.themeToggle.setAttribute('aria-label', label);
        }
    }

    setupLanguageToggle() {
        this.langToggles.forEach((toggle) => {
            toggle.addEventListener('click', () => {
                this.currentLang = this.currentLang === 'it' ? 'en' : 'it';
                localStorage.setItem('portfolio_lang', this.currentLang);
                this.applyLanguage(this.currentLang);
            });
        });
    }

    applyLanguage(lang) {
        document.documentElement.lang = lang === 'it' ? 'it' : 'en';

        const itTexts = document.querySelectorAll('.lang-it-text');
        const enTexts = document.querySelectorAll('.lang-en-text');

        if (lang === 'it') {
            itTexts.forEach((el) => { el.className = 'lang-it-text lang-active text-sm transition-all'; });
            enTexts.forEach((el) => { el.className = 'lang-en-text lang-inactive text-sm transition-all'; });
        } else {
            itTexts.forEach((el) => { el.className = 'lang-it-text lang-inactive text-sm transition-all'; });
            enTexts.forEach((el) => { el.className = 'lang-en-text lang-active text-sm transition-all'; });
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
    }

    setupProjectFilters() {
        if (!this.filterBtns.length) return;

        this.filterBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-project-filter');
                this.currentFilter = filter;
                this.filterBtns.forEach((b) => b.classList.toggle('filter-active', b === btn));
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
        document.querySelectorAll('.spotlight-card').forEach((card) => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                card.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
                card.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
            });
        });
    }

    setupCopyEmail() {
        if (!this.copyEmailBtn) return;
        const email = 'gabrielelazzara67@gmail.com';
        this.copyEmailBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(email);
                const span = this.copyEmailBtn.querySelector('[data-i18n]') || this.copyEmailBtn;
                span.textContent = translations[this.currentLang].contact_copied;
                setTimeout(() => this.applyLanguage(this.currentLang), 2000);
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
            setTimeout(() => {
                this.mobileMenu.classList.remove('opacity-0');
                document.body.style.overflow = 'hidden';
            }, 10);
        } else {
            this.mobileMenu.classList.add('opacity-0');
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

    setupIntersectionObservers() {
        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.08, rootMargin: '0px 0px -5% 0px' }
        );

        this.revealElements.forEach((el) => {
            revealObserver.observe(el);
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
                el.classList.add('active');
            }
        });

        const sectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    entry.target.classList.toggle('section-visible', entry.isIntersecting);
                });
            },
            { threshold: 0.15, rootMargin: '-10% 0px -10% 0px' }
        );

        this.mainSections.forEach((section) => sectionObserver.observe(section));
    }

    setupScrollListener() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                this.navbar.classList.add('navbar-scrolled');
            } else {
                this.navbar.classList.remove('navbar-scrolled');
            }

            if (!prefersReducedMotion && this.blobsLayer) {
                const offset = window.scrollY * 0.06;
                this.blobsLayer.style.transform = `translate3d(0, ${offset}px, 0)`;
            }

            let currentSectionId = '';
            this.sections.forEach((section) => {
                if (window.scrollY >= section.offsetTop - 280) {
                    currentSectionId = section.getAttribute('id');
                }
            });

            this.navLinks.forEach((link) => {
                const href = link.getAttribute('href');
                const isActive = href === `#${currentSectionId}`;
                link.classList.toggle('active-link', isActive);
                link.classList.toggle('text-white', isActive);
                link.classList.toggle('bg-white/10', isActive);
                link.classList.toggle('text-gray-300', !isActive);
            });
        });
    }

    setupContactForm() {
        const contactForm = document.getElementById('contact-form');
        if (!contactForm) return;

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = contactForm.querySelector('input[name="name"]').value;
            const email = contactForm.querySelector('input[name="email"]').value;
            const message = contactForm.querySelector('textarea[name="message"]').value;

            const subject = encodeURIComponent(`Nuovo contatto dal Portfolio - ${name}`);
            const body = encodeURIComponent(`${message}\n\n---\nRispondi a: ${email}`);

            window.location.href = `mailto:gabrielelazzara67@gmail.com?subject=${subject}&body=${body}`;

            const btn = contactForm.querySelector('button[type="submit"]');
            const originalHtml = btn.innerHTML;
            btn.innerHTML = `${translations[this.currentLang].email_opening} <i class='fas fa-envelope ml-1'></i>`;

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
