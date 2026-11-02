"""
Build the two static language pages from index.html + js/i18n.js.

    python scripts/build-i18n.py

- index.html     → Italian page at /      (rewritten in place)
- en/index.html  → English page at /en/

For each page it pre-renders every [data-i18n] text, placeholder and aria-label,
and regenerates the SEO block between <!-- seo:start --> and <!-- seo:end -->
(title, meta, canonical, hreflang, Open Graph, JSON-LD). Crawlers therefore get
real, language-specific HTML without having to run JavaScript.

Run it after editing index.html or js/i18n.js. Requires Node.js (to read i18n.js).
"""

import html
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://onlyg4bb0.github.io/GabrielLazzara/"
PAGE_URL = {"it": BASE, "en": BASE + "en/"}
UPDATED = "2026-11-02"
OG_IMAGE = BASE + "assets/og-image.jpg"
EMAIL = "gabrielelazzara67@gmail.com"
SAME_AS = [
    "https://github.com/OnlyG4BB0",
    "https://www.instagram.com/gabriel_lazzara_/",
    "https://www.youtube.com/@ONLY_G4BB0",
]

SEO = {
    "it": {
        "title": "Gabriel Lazzara · Web Developer e Sviluppatore Web a Palermo",
        "description": "Web developer a Palermo: siti, landing page e web app veloci, multilingua e ottimizzati per Google. Guarda i progetti e richiedi un preventivo senza impegno.",
        "og_title": "Gabriel Lazzara · Web Developer a Palermo",
        "og_description": "Siti web, landing page e web app su misura con SEO tecnica, multilingua e deploy. Portfolio e progetti cliente.",
        "og_alt": "Gabriel Lazzara — Web Developer, Full-Stack, Palermo",
        "locale": "it_IT",
        "locale_alt": "en_US",
        "in_language": "it-IT",
        "job_title": "Web Developer e sviluppatore full-stack",
        "person_description": "Web developer e sviluppatore full-stack a Palermo: siti professionali, landing page e web app con SEO tecnica, multilingua e deploy.",
        "business_name": "Gabriel Lazzara — Sviluppo Web",
        "business_description": "Sviluppo di siti web, landing page e web app a Palermo e da remoto: SEO tecnica, dati strutturati, siti multilingua, performance e deploy.",
        "region": "Sicilia",
        "country": "Italia",
        "projects_name": "Progetti di Gabriel Lazzara",
        "services_name": "Servizi di sviluppo web",
        "lang_link": '<a href="./en/" class="footer-lang" hreflang="en" lang="en" data-lang-link>English version</a>',
    },
    "en": {
        "title": "Gabriel Lazzara · Full-Stack Web Developer in Palermo, Italy",
        "description": "Full-stack web developer in Palermo, Italy: fast, multilingual websites, landing pages and web apps built to rank on Google. See the work and get a quote.",
        "og_title": "Gabriel Lazzara · Full-Stack Web Developer, Palermo",
        "og_description": "Custom websites, landing pages and web apps with technical SEO, multilingual setup and deploy. Portfolio and client work.",
        "og_alt": "Gabriel Lazzara — Web Developer, Full-Stack, Palermo",
        "locale": "en_US",
        "locale_alt": "it_IT",
        "in_language": "en",
        "job_title": "Full-stack web developer",
        "person_description": "Full-stack web developer in Palermo, Italy: business websites, landing pages and web apps with technical SEO, multilingual delivery and deploy.",
        "business_name": "Gabriel Lazzara — Web Development",
        "business_description": "Websites, landing pages and web apps from Palermo and remote: technical SEO, structured data, multilingual sites, performance and deploy.",
        "region": "Sicily",
        "country": "Italy",
        "projects_name": "Projects by Gabriel Lazzara",
        "services_name": "Web development services",
        "lang_link": '<a href="../" class="footer-lang" hreflang="it" lang="it" data-lang-link>Versione italiana</a>',
    },
}

# (name, url, description key, image, kind)
PROJECTS = [
    ("Rent Boat Mondello", "https://rentboatmondello.it", "proj3_desc", "assets/projects/rent-boat.jpg", "WebSite"),
    ("Luxury Sofà", "https://github.com/OnlyG4BB0/Luxury-Sof-", "proj_luxury_desc", "assets/projects/luxury-sofa.svg", "SoftwareSourceCode"),
    ("Liquid Cube", "https://onlyg4bb0.github.io/LiquidCube/", "proj1_desc", "assets/projects/liquid-cube.svg", "WebApplication"),
    ("Weatherflow", "https://onlyg4bb0.github.io/WeatherFlow/", "proj2_desc", "assets/projects/weatherflow.svg", "WebApplication"),
    ("Only Ball", "https://onlyg4bb0.github.io/onlyball/", "proj_onlyball_desc", "assets/projects/onlyball.svg", "VideoGame"),
    ("ColorBlast", "https://onlyg4bb0.github.io/ColorBlast/", "proj_colorblast_desc", "assets/projects/colorblast.svg", "VideoGame"),
    ("ReceiptVault", "https://github.com/OnlyG4BB0/ReceiptVault", "proj_receipt_desc", "assets/projects/receiptvault.svg", "MobileApplication"),
]

KNOWS_ABOUT = [
    "Web development", "Full-stack development", "JavaScript", "TypeScript", "React",
    "Svelte", "Python", "PHP", "MySQL", "Three.js", "Tailwind CSS", "Technical SEO",
    "Local SEO", "Schema.org", "Multilingual websites", "Web performance", "GitHub Pages",
]


def load_translations():
    script = r"""
const vm = require('vm'), fs = require('fs');
const ctx = vm.createContext({ window: {}, document: {} });
vm.runInContext(fs.readFileSync('js/i18n.js', 'utf8'), ctx);
process.stdout.write(vm.runInContext('JSON.stringify(translations)', ctx));
"""
    out = subprocess.run(["node", "-e", script], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", check=True)
    return json.loads(out.stdout)


def plain(fragment):
    """HTML fragment → plain text (for JSON-LD)."""
    text = re.sub(r"<br\s*/?>", " ", fragment)
    text = re.sub(r"<[^>]+>", "", text)
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def replace_inner(source, attr, key, new_inner):
    """Replace the inner HTML of every element carrying attr="key"."""
    start_re = re.compile(r'<([a-zA-Z][\w-]*)\b[^>]*\s%s="%s"[^>]*>' % (re.escape(attr), re.escape(key)))
    pos = 0
    while True:
        m = start_re.search(source, pos)
        if not m:
            return source
        tag = m.group(1).lower()
        tag_re = re.compile(r"<(/?)%s\b[^>]*>" % tag, re.IGNORECASE)
        depth, i, end = 1, m.end(), None
        while depth:
            t = tag_re.search(source, i)
            if not t:
                raise ValueError(f"Unclosed <{tag}> for {attr}={key}")
            depth += -1 if t.group(1) else 1
            i = t.end()
            if depth == 0:
                end = t.start()
        source = source[: m.end()] + new_inner + source[end:]
        pos = m.end() + len(new_inner)


def set_attr_on(source, marker_attr, attr, values):
    """For every tag with marker_attr="key", set attr to values[key]."""
    def sub(m):
        tag = m.group(0)
        key = re.search(r'\s%s="([^"]+)"' % re.escape(marker_attr), tag).group(1)
        if key not in values:
            return tag
        value = html.escape(plain(values[key]), quote=True)
        if re.search(r'\s%s="[^"]*"' % re.escape(attr), tag):
            return re.sub(r'(\s%s=")[^"]*(")' % re.escape(attr), lambda a: a.group(1) + value + a.group(2), tag, count=1)
        return tag[:-1] + f' {attr}="{value}">'
    return re.sub(r'<[a-zA-Z][^>]*\s%s="[^"]+"[^>]*>' % re.escape(marker_attr), sub, source)


def json_ld(lang, t):
    seo = SEO[lang]
    page = PAGE_URL[lang]
    services = []
    for n in range(1, 5):
        if f"srv{n}_title" in t:
            services.append({
                "@type": "Offer",
                "itemOffered": {
                    "@type": "Service",
                    "name": plain(t[f"srv{n}_title"]),
                    "description": plain(t.get(f"srv{n}_desc", "")),
                    "provider": {"@id": BASE + "#business"},
                    "areaServed": {"@type": "Country", "name": seo["country"]},
                },
            })
    faq = []
    for n in range(1, 20):
        q, a = t.get(f"faq_q{n}"), t.get(f"faq_a{n}")
        if not q or not a:
            break
        faq.append({"@type": "Question", "name": plain(q), "acceptedAnswer": {"@type": "Answer", "text": plain(a)}})

    graph = [
        {
            "@type": "WebSite",
            "@id": BASE + "#website",
            "url": BASE,
            "name": "Gabriel Lazzara",
            "alternateName": "Gabriel Lazzara Portfolio",
            "inLanguage": ["it-IT", "en"],
            "publisher": {"@id": BASE + "#person"},
        },
        {
            "@type": "ProfilePage",
            "@id": page + "#webpage",
            "url": page,
            "name": seo["title"],
            "description": seo["description"],
            "inLanguage": seo["in_language"],
            "isPartOf": {"@id": BASE + "#website"},
            "about": {"@id": BASE + "#person"},
            "mainEntity": {"@id": BASE + "#person"},
            "primaryImageOfPage": {"@type": "ImageObject", "url": OG_IMAGE, "width": 1200, "height": 630},
            "dateModified": UPDATED,
            "hasPart": [{"@id": page + "#faq"}, {"@id": page + "#projects"}],
        },
        {
            "@type": "Person",
            "@id": BASE + "#person",
            "name": "Gabriel Lazzara",
            "url": BASE,
            "image": BASE + "assets/logo-pfp-1024.png",
            "jobTitle": seo["job_title"],
            "description": seo["person_description"],
            "email": f"mailto:{EMAIL}",
            "address": {"@type": "PostalAddress", "addressLocality": "Palermo", "addressRegion": seo["region"], "addressCountry": "IT"},
            "homeLocation": {"@type": "Place", "name": "Palermo"},
            "knowsAbout": KNOWS_ABOUT,
            "knowsLanguage": ["it", "en"],
            "sameAs": SAME_AS,
        },
        {
            "@type": "ProfessionalService",
            "@id": BASE + "#business",
            "name": seo["business_name"],
            "url": page,
            "image": OG_IMAGE,
            "logo": BASE + "assets/icon-512.png",
            "description": seo["business_description"],
            "founder": {"@id": BASE + "#person"},
            "email": EMAIL,
            "address": {"@type": "PostalAddress", "addressLocality": "Palermo", "addressRegion": seo["region"], "addressCountry": "IT"},
            "geo": {"@type": "GeoCoordinates", "latitude": 38.1157, "longitude": 13.3615},
            "areaServed": [
                {"@type": "City", "name": "Palermo"},
                {"@type": "AdministrativeArea", "name": seo["region"]},
                {"@type": "Country", "name": seo["country"]},
            ],
            "knowsLanguage": ["it", "en"],
            "sameAs": SAME_AS,
            "hasOfferCatalog": {"@type": "OfferCatalog", "name": seo["services_name"], "itemListElement": services},
        },
        {
            "@type": "ItemList",
            "@id": page + "#projects",
            "name": seo["projects_name"],
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": i,
                    "item": {
                        "@type": kind,
                        "name": name,
                        "url": url,
                        "description": plain(t.get(desc_key, "")),
                        "image": BASE + image,
                        "author": {"@id": BASE + "#person"},
                    },
                }
                for i, (name, url, desc_key, image, kind) in enumerate(PROJECTS, 1)
            ],
        },
        {"@type": "FAQPage", "@id": page + "#faq", "inLanguage": seo["in_language"], "mainEntity": faq},
    ]
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, separators=(",", ":"))


def seo_block(lang, t):
    seo = SEO[lang]
    e = lambda v: html.escape(v, quote=True)
    lines = [
        f"<title>{e(seo['title'])}</title>",
        f'<meta name="description" content="{e(seo["description"])}">',
        '<meta name="author" content="Gabriel Lazzara">',
        '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">',
        '<meta name="google-site-verification" content="lyymIbVzK7B49E-pzw095UFG74sf_Gn6T4G6rZdV860">',
        '<meta name="geo.region" content="IT-PA">',
        '<meta name="geo.placename" content="Palermo">',
        '<meta name="geo.position" content="38.1157;13.3615">',
        '<meta name="ICBM" content="38.1157, 13.3615">',
        f'<link rel="canonical" href="{PAGE_URL[lang]}">',
        f'<link rel="alternate" hreflang="it" href="{PAGE_URL["it"]}">',
        f'<link rel="alternate" hreflang="en" href="{PAGE_URL["en"]}">',
        f'<link rel="alternate" hreflang="x-default" href="{PAGE_URL["it"]}">',
        *[f'<link rel="me" href="{u}">' for u in SAME_AS],
        f'<link rel="sitemap" type="application/xml" title="Sitemap" href="{BASE}sitemap.xml">',
        f'<link rel="author" href="{BASE}humans.txt">',
        f'<link rel="manifest" href="{BASE}site.webmanifest">',
        f'<link rel="apple-touch-icon" sizes="180x180" href="{BASE}apple-touch-icon.png">',
        '<meta property="og:type" content="profile">',
        '<meta property="og:site_name" content="Gabriel Lazzara">',
        f'<meta property="og:title" content="{e(seo["og_title"])}">',
        f'<meta property="og:description" content="{e(seo["og_description"])}">',
        f'<meta property="og:url" content="{PAGE_URL[lang]}">',
        f'<meta property="og:locale" content="{seo["locale"]}">',
        f'<meta property="og:locale:alternate" content="{seo["locale_alt"]}">',
        f'<meta property="og:image" content="{OG_IMAGE}">',
        '<meta property="og:image:type" content="image/jpeg">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        f'<meta property="og:image:alt" content="{e(seo["og_alt"])}">',
        '<meta property="profile:first_name" content="Gabriel">',
        '<meta property="profile:last_name" content="Lazzara">',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{e(seo["og_title"])}">',
        f'<meta name="twitter:description" content="{e(seo["og_description"])}">',
        f'<meta name="twitter:image" content="{OG_IMAGE}">',
        f'<meta name="twitter:image:alt" content="{e(seo["og_alt"])}">',
        f'<script type="application/ld+json">\n{json_ld(lang, t)}\n    </script>',
    ]
    return "\n".join("    " + l for l in lines)


def render(source, lang, translations):
    t = translations[lang]
    out = source

    for key in sorted(set(re.findall(r'\sdata-i18n="([^"]+)"', out))):
        if key in t:
            out = replace_inner(out, "data-i18n", key, t[key])
    out = set_attr_on(out, "data-i18n-ph", "placeholder", t)
    out = set_attr_on(out, "data-i18n-aria", "aria-label", t)

    out = re.sub(r'<html lang="[^"]*"', f'<html lang="{lang}"', out, count=1)
    out = re.sub(r'(<html[^>]*\sdata-lang=")[^"]*"', rf'\g<1>{lang}"', out, count=1)

    hero_role = plain(t.get("hero_role", ""))
    out = re.sub(r'(<h1 id="hero-heading"[^>]*\saria-label=")[^"]*"', lambda m: f'{m.group(1)}Gabriel Lazzara — {html.escape(hero_role, quote=True)}"', out, count=1)

    active, inactive = ("it", "en") if lang == "it" else ("en", "it")
    out = re.sub(r'class="lang-%s-text lang-\w+"' % active, f'class="lang-{active}-text lang-active"', out)
    out = re.sub(r'class="lang-%s-text lang-\w+"' % inactive, f'class="lang-{inactive}-text lang-inactive"', out)

    if "theme_toggle_light" in t:
        out = re.sub(r'(<button type="button" id="theme-toggle"[^>]*\saria-label=")[^"]*"', lambda m: m.group(1) + html.escape(t["theme_toggle_light"], quote=True) + '"', out, count=1)
    if "cursor_view" in t:
        out = re.sub(r'data-cursor-label="[^"]*"', f'data-cursor-label="{html.escape(t["cursor_view"], quote=True)}"', out)

    out = re.sub(r"<a [^>]*data-lang-link[^>]*>[^<]*</a>", SEO[lang]["lang_link"], out)

    out = re.sub(
        r"(<!-- seo:start[^>]*-->)\n.*?\n?(\s*<!-- seo:end -->)",
        lambda m: m.group(1) + "\n" + seo_block(lang, t) + "\n" + m.group(2).lstrip("\n"),
        out,
        count=1,
        flags=re.S,
    )

    if lang == "en":
        # /en/ lives one level down: relative paths climb back to the site root
        out = re.sub(r'((?:href|src|srcset)=["\'])\./', r"\1../", out)
        out = re.sub(r"(,\s*)\./(assets/)", r"\1../\2", out)
        out = out.replace("href='./", "href='../")
        out = re.sub(r'href="\.\./(privacy|cookie|note-legali)\.html"', r'href="../\1.html?lang=en"', out)
    return out


def main():
    translations = load_translations()
    src_path = ROOT / "index.html"
    source = src_path.read_text(encoding="utf-8")
    if "<!-- seo:start" not in source:
        sys.exit("index.html is missing the <!-- seo:start --> marker")

    it_html = render(source, "it", translations)
    src_path.write_text(it_html, encoding="utf-8", newline="\n")

    en_dir = ROOT / "en"
    en_dir.mkdir(exist_ok=True)
    (en_dir / "index.html").write_text(render(it_html, "en", translations), encoding="utf-8", newline="\n")
    print("Built index.html (it) and en/index.html (en)")


if __name__ == "__main__":
    main()
