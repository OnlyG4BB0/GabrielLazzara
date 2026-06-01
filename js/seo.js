/**
 * SEO meta e structured data per lingua (IT / EN) + termini internazionali.
 */
const SEO_KEYWORDS_GLOBAL =
    'Gabriel Lazzara, web developer, developer, software developer, full stack developer, ' +
    'sviluppatore web, programmatore web, freelance developer Italy, web developer Palermo, ' +
    'sviluppatore web Palermo, full stack developer Sicily, siti web Palermo, portfolio developer, ' +
    'hire web developer, assumere sviluppatore web, landing page developer, React developer, ' +
    'Python developer, PHP developer, technical SEO, multilingual website, GitHub Pages, VPS deploy, ' +
    'Webentwickler Palermo, développeur web Palerme, desarrollador web Palermo, Sicilia, Mondello';

const seoByLang = {
    it: {
        title: 'Gabriel Lazzara | Web Developer & Sviluppatore Full-Stack · Palermo',
        description:
            'Gabriel Lazzara — web developer e sviluppatore full-stack a Palermo (Sicilia). Assumo progetti siti web, landing page e web app: SEO tecnica, multilingua IT/EN, Schema.org, deploy VPS/GitHub Pages. Portfolio e preventivo.',
        keywords:
            'Gabriel Lazzara, web developer Palermo, sviluppatore web Palermo, developer Sicilia, programmatore web Palermo, ' +
            'full stack developer Italia, freelance developer Palermo, assumere sviluppatore web, portfolio developer, ' +
            'creazione siti web Palermo, siti internet Palermo, React developer, Python developer, PHP developer, SEO locale',
        ogTitle: 'Gabriel Lazzara | Web Developer Full-Stack · Palermo',
        ogDescription:
            'Sviluppatore web a Palermo: siti, landing e web app con SEO, multilingua e performance. Portfolio progetti cliente.',
        ogLocale: 'it_IT',
        ogLocaleAlternate: 'en_US',
        htmlLang: 'it',
    },
    en: {
        title: 'Gabriel Lazzara | Web Developer & Full-Stack Developer · Palermo, Italy',
        description:
            'Gabriel Lazzara — full-stack web developer in Palermo, Sicily, Italy. I build business websites, landing pages and web apps with technical SEO, multilingual setup (EN/IT), Schema.org and VPS/GitHub Pages deploy. Portfolio and quotes.',
        keywords:
            'Gabriel Lazzara, web developer Palermo, developer Sicily, full stack developer Italy, software developer Palermo, ' +
            'freelance web developer Italy, hire web developer Palermo, portfolio developer, website developer Italy, ' +
            'custom web development, React developer, Python developer, PHP developer, local SEO Palermo',
        ogTitle: 'Gabriel Lazzara | Full-Stack Web Developer',
        ogDescription:
            'Web developer in Palermo: websites, landing pages and web apps with SEO, multilingual delivery and deploy.',
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
                name: 'Quali servizi offri come sviluppatore web?',
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
            {
                '@type': 'Question',
                name: 'Come trovare un web developer a Palermo?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Gabriel Lazzara è un web developer full-stack con base a Palermo (Sicilia): portfolio online, progetti cliente pubblicati e contatto diretto per preventivi su siti web e web app.',
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
                name: 'What services do you offer as a web developer?',
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
            {
                '@type': 'Question',
                name: 'How to hire a web developer in Palermo, Italy?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Gabriel Lazzara is a full-stack web developer based in Palermo, Sicily — view the portfolio, client projects and contact form for website and web app quotes.',
                },
            },
        ],
    },
};

const personSchemaByLang = {
    it: {
        '@context': 'https://schema.org',
        '@type': 'Person',
        '@id': 'https://onlyg4bb0.github.io/GabrielLazzara/#person',
        name: 'Gabriel Lazzara',
        alternateName: [
            'Gabriel Lazzara web developer',
            'Gabriel Lazzara sviluppatore web',
            'Gabriel Lazzara developer Palermo',
        ],
        url: 'https://onlyg4bb0.github.io/GabrielLazzara/',
        image: 'https://onlyg4bb0.github.io/GabrielLazzara/assets/icon-192.png',
        jobTitle: ['Web Developer', 'Sviluppatore Web Full-Stack', 'Full-Stack Developer'],
        description:
            'Web developer e sviluppatore full-stack a Palermo (Sicilia): siti web, landing page, web app, SEO tecnica e siti multilingua.',
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'Palermo',
            addressRegion: 'Sicilia',
            addressCountry: 'IT',
        },
        sameAs: [
            'https://github.com/OnlyG4BB0',
            'https://www.instagram.com/gabriel_lazzara_/',
            'https://www.youtube.com/@ONLY_G4BB0',
        ],
        email: 'gabrielelazzara67@gmail.com',
        knowsAbout: [
            'Web development',
            'Web developer',
            'JavaScript',
            'React',
            'Python',
            'PHP',
            'Technical SEO',
            'Schema.org',
            'Multilingual websites',
        ],
    },
    en: {
        '@context': 'https://schema.org',
        '@type': 'Person',
        '@id': 'https://onlyg4bb0.github.io/GabrielLazzara/#person',
        name: 'Gabriel Lazzara',
        alternateName: [
            'Gabriel Lazzara web developer',
            'Gabriel Lazzara full stack developer',
            'Gabriel Lazzara developer Palermo',
        ],
        url: 'https://onlyg4bb0.github.io/GabrielLazzara/',
        image: 'https://onlyg4bb0.github.io/GabrielLazzara/assets/icon-192.png',
        jobTitle: ['Web Developer', 'Full-Stack Web Developer', 'Software Developer'],
        description:
            'Full-stack web developer in Palermo, Sicily, Italy — business websites, landing pages, web apps, technical SEO and multilingual sites.',
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'Palermo',
            addressRegion: 'Sicily',
            addressCountry: 'IT',
        },
        sameAs: [
            'https://github.com/OnlyG4BB0',
            'https://www.instagram.com/gabriel_lazzara_/',
            'https://www.youtube.com/@ONLY_G4BB0',
        ],
        email: 'gabrielelazzara67@gmail.com',
        knowsAbout: [
            'Web development',
            'Web developer',
            'JavaScript',
            'React',
            'Python',
            'PHP',
            'Technical SEO',
            'Schema.org',
            'Multilingual websites',
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

    const personEl = document.getElementById('ld-person');
    if (personEl && personSchemaByLang[lang]) {
        personEl.textContent = JSON.stringify(personSchemaByLang[lang]);
    }
}
