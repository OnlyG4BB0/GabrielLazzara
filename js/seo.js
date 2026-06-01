/**
 * SEO meta e structured data per lingua (IT / EN) + termini internazionali.
 */
/** Termini aggiuntivi per ricerche in altre lingue (stesso URL, toggle UI). */
const SEO_KEYWORDS_GLOBAL =
    'Gabriel Lazzara, web developer Palermo, sviluppatore web Palermo, full stack developer Sicily, ' +
    'freelance web developer Italy, siti web Palermo, portfolio developer, landing page, web application, ' +
    'technical SEO, multilingual website, React developer, Python developer, PHP developer, ' +
    'GitHub Pages, VPS deploy, Oracle Cloud, Webentwickler Palermo, développeur web Palerme, ' +
    'desarrollador web Palermo, sitio web Palermo, sviluppatore freelance, Mondello, Sicilia';

const seoByLang = {
    it: {
        title: 'Gabriel Lazzara | Sviluppatore Web Full-Stack a Palermo · Portfolio',
        description:
            'Gabriel Lazzara — sviluppatore web full-stack a Palermo (Sicilia). Siti vetrina, landing page e web app con SEO tecnica, multilingua (IT/EN), Schema.org e deploy su VPS o GitHub Pages. Portfolio, progetti cliente e preventivo.',
        keywords:
            'Gabriel Lazzara, sviluppatore web Palermo, sviluppatore full stack Sicilia, creazione siti web Palermo, ' +
            'realizzazione siti internet, portfolio developer, freelance web Palermo, landing page professionale, ' +
            'web app su misura, SEO locale Palermo, siti multilingua, e-commerce, prenotazioni online, React, Python, PHP, Tailwind',
        ogTitle: 'Gabriel Lazzara | Sviluppatore Web Full-Stack',
        ogDescription:
            'Siti e web app su misura da Palermo: SEO, multilingua, performance e deploy. Progetti cliente e portfolio.',
        ogLocale: 'it_IT',
        ogLocaleAlternate: 'en_US',
        htmlLang: 'it',
    },
    en: {
        title: 'Gabriel Lazzara | Full-Stack Web Developer in Palermo · Portfolio',
        description:
            'Gabriel Lazzara — full-stack web developer in Palermo, Sicily (Italy). Business websites, landing pages and web apps with technical SEO, multilingual setup (EN/IT), Schema.org and VPS or GitHub Pages deployment. Portfolio, client work and quotes.',
        keywords:
            'Gabriel Lazzara, web developer Palermo, full stack developer Sicily, website developer Italy, ' +
            'freelance web developer Palermo, portfolio developer, custom landing page, web application development, ' +
            'local SEO Palermo, multilingual website, boat rental website, React developer, Python developer, PHP developer, Tailwind CSS',
        ogTitle: 'Gabriel Lazzara | Full-Stack Web Developer',
        ogDescription:
            'Custom websites and web apps from Palermo: SEO, multilingual, performance and deploy. Client projects and portfolio.',
        ogLocale: 'en_US',
        ogLocaleAlternate: 'it_IT',
        htmlLang: 'en',
    },
};

const faqSchemaByLang = {
    it: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        inLanguage: 'it-IT',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'Quali servizi offri?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Realizzo siti web, landing page e web app responsive con SEO tecnica, integrazione form, multilingua e deploy su GitHub Pages o VPS.',
                },
            },
            {
                '@type': 'Question',
                name: 'In quanto tempo consegni un progetto?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Dipende dalla complessità: una landing può richiedere pochi giorni, un sito più strutturato da 1 a 3 settimane.',
                },
            },
            {
                '@type': 'Question',
                name: 'Lavori con clienti fuori Palermo?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Sì, lavoro in presenza a Palermo e da remoto con clienti in tutta Italia e all’estero.',
                },
            },
            {
                '@type': 'Question',
                name: 'Il sito sarà visibile su Google?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Sì: HTML semantico, meta tag, sitemap, robots.txt, hreflang e dati strutturati Schema.org sono inclusi nel workflow.',
                },
            },
            {
                '@type': 'Question',
                name: 'Offri manutenzione dopo il lancio?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Sì: aggiornamenti contenuti, piccole modifiche e monitoraggio su accordo mensile o a richiesta.',
                },
            },
        ],
    },
    en: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        inLanguage: 'en-US',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'What services do you offer?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Business websites, landing pages and responsive web apps with technical SEO, contact forms, multilingual setup and deploy on GitHub Pages or VPS.',
                },
            },
            {
                '@type': 'Question',
                name: 'How long does a project take?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'It depends on scope: a landing page can take a few days; a larger site typically 1–3 weeks.',
                },
            },
            {
                '@type': 'Question',
                name: 'Do you work with clients outside Palermo?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes — on-site in Palermo and remotely across Italy and internationally.',
                },
            },
            {
                '@type': 'Question',
                name: 'Will my site rank on Google?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes — semantic HTML, meta tags, sitemap, robots.txt, hreflang and Schema.org structured data are part of the baseline delivery.',
                },
            },
            {
                '@type': 'Question',
                name: 'Do you offer post-launch maintenance?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes — content updates, small changes and monitoring on a monthly retainer or on demand.',
                },
            },
        ],
    },
};

function setMetaContent(selector, value) {
    const el = document.querySelector(selector);
    if (el && value) el.setAttribute('content', value);
}

function applySeoLanguage(lang) {
    const seo = seoByLang[lang] || seoByLang.it;

    document.documentElement.lang = seo.htmlLang;

    document.title = seo.title;
    setMetaContent('meta[name="description"]', seo.description);
    setMetaContent('meta[name="keywords"]', `${seo.keywords}, ${SEO_KEYWORDS_GLOBAL}`);

    setMetaContent('meta[property="og:title"]', seo.ogTitle);
    setMetaContent('meta[property="og:description"]', seo.ogDescription);
    setMetaContent('meta[property="og:locale"]', seo.ogLocale);
    setMetaContent('meta[property="og:locale:alternate"]', seo.ogLocaleAlternate);

    setMetaContent('meta[name="twitter:title"]', seo.ogTitle);
    setMetaContent('meta[name="twitter:description"]', seo.ogDescription);

    const faqEl = document.getElementById('ld-faq');
    if (faqEl && faqSchemaByLang[lang]) {
        faqEl.textContent = JSON.stringify(faqSchemaByLang[lang]);
    }
}
