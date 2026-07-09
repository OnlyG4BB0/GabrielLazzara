/**
 * Configurazione centralizzata URL e dati legali.
 * COMPILARE taxCode / vatId / pec prima di attività commerciale in Italia.
 */
const SITE_CONFIG = {
    url: 'https://onlyg4bb0.github.io/GabrielLazzara/',
    email: 'gabrielelazzara67@gmail.com',
    twitterHandle: '@ONLY_G4BB0',
    githubUrl: 'https://github.com/OnlyG4BB0',
};

const LEGAL_CONFIG = {
    ownerName: 'Gabriel Lazzara',
    businessName: 'Gabriel Lazzara — Sviluppo Web',
    address: 'Palermo (PA), Italia',
    email: 'gabrielelazzara67@gmail.com',
    pec: '',
    taxCode: '',
    vatId: '',
    rea: '',
    activityIt: 'Sviluppo siti web, web application e servizi informatici',
    activityEn: 'Website development, web applications and IT services',
    hostingProvider: 'GitHub Pages (GitHub, Inc.)',
    analyticsProvider: 'Plausible Analytics (opzionale, solo con consenso)',
};

function siteUrl(path = '', lang) {
    const base = SITE_CONFIG.url.replace(/\/?$/, '/');
    const suffix = path ? path.replace(/^\//, '') : '';
    const url = new URL(suffix, base);
    if (lang === 'it' || lang === 'en') {
        url.searchParams.set('lang', lang);
    }
    return url.toString();
}

function formatLegalId(value, fallbackIt, fallbackEn) {
    const lang = document.documentElement.lang === 'en' ? 'en' : 'it';
    if (value && String(value).trim()) return value;
    return lang === 'en' ? fallbackEn : fallbackIt;
}
