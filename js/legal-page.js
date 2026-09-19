function getLegalLang() {
    const param = new URLSearchParams(window.location.search).get('lang');
    if (param === 'en' || param === 'it') return param;
    const stored = localStorage.getItem('portfolio_lang');
    if (stored === 'en' || stored === 'it') return stored;
    return document.documentElement.lang === 'en' ? 'en' : 'it';
}

function renderLegalPage(pageKey) {
    const lang = getLegalLang();
    const page = LEGAL_PAGES[pageKey]?.[lang] || LEGAL_PAGES[pageKey]?.it;
    if (!page) return;

    document.documentElement.lang = lang === 'en' ? 'en' : 'it';
    document.title = `${page.title} | Gabriel Lazzara`;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && page.metaDescription) metaDesc.setAttribute('content', page.metaDescription);

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', siteUrl(`${pageKey === 'imprint' ? 'note-legali' : pageKey}.html`, lang));

    const titleEl = document.getElementById('legal-title');
    if (titleEl) titleEl.textContent = page.title;

    const updatedEl = document.getElementById('legal-updated');
    if (updatedEl) {
        updatedEl.textContent = lang === 'en'
            ? 'Last updated: 14 June 2026'
            : 'Ultimo aggiornamento: 14 giugno 2026';
    }

    const article = document.getElementById('legal-content');
    if (!article) return;

    // Keep the title + "updated" line: rebuild only the sections after them.
    article.querySelectorAll('.legal-section').forEach((el) => el.remove());
    article.insertAdjacentHTML('beforeend', page.sections.map((section) => `
        <section class="legal-section">
            <h2>${section.heading}</h2>
            ${section.body}
        </section>
    `).join(''));

    document.querySelectorAll('[data-legal-lang]').forEach((btn) => {
        const btnLang = btn.getAttribute('data-legal-lang');
        btn.classList.toggle('is-active', btnLang === lang);
        btn.setAttribute('aria-pressed', btnLang === lang ? 'true' : 'false');
    });

    document.querySelectorAll('[data-open-consent]').forEach((btn) => {
        btn.addEventListener('click', () => ConsentManager?.showBanner());
    });
}

function bindLegalLangSwitch() {
    document.querySelectorAll('[data-legal-lang]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-legal-lang');
            const url = new URL(window.location.href);
            url.searchParams.set('lang', lang);
            window.location.href = url.toString();
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const root = document.body.dataset.legalPage;
    if (!root) return;
    bindLegalLangSwitch();
    renderLegalPage(root);
});
