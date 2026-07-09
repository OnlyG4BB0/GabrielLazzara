/**
 * Contenuti legali IT/EN per privacy, cookie e note legali.
 */
const LEGAL_PAGES = {
    privacy: {
        it: {
            title: 'Informativa sulla privacy',
            metaDescription:
                'Informativa privacy GDPR di Gabriel Lazzara — web developer a Palermo: trattamento dati, contatti, diritti e cookie.',
            sections: [
                {
                    heading: '1. Titolare del trattamento',
                    body: `
                        <p>Il titolare del trattamento dei dati personali è <strong>${LEGAL_CONFIG.ownerName}</strong> (${LEGAL_CONFIG.businessName}), con sede operativa in ${LEGAL_CONFIG.address}.</p>
                        <p>Email di contatto: <a href="mailto:${LEGAL_CONFIG.email}">${LEGAL_CONFIG.email}</a></p>
                    `,
                },
                {
                    heading: '2. Tipologie di dati trattati',
                    body: `
                        <p>Attraverso questo sito possono essere trattati:</p>
                        <ul>
                            <li><strong>Dati di contatto</strong> (nome, email, messaggio) inseriti nel form o inviati via email/WhatsApp;</li>
                            <li><strong>Dati tecnici</strong> (indirizzo IP, user agent, log del server/hosting) per sicurezza e funzionamento;</li>
                            <li><strong>Preferenze locali</strong> (lingua, tema, scelte cookie) salvate nel browser;</li>
                            <li><strong>Dati di navigazione anonimi</strong> solo se accetti cookie analitici opzionali.</li>
                        </ul>
                    `,
                },
                {
                    heading: '3. Finalità e base giuridica',
                    body: `
                        <ul>
                            <li><strong>Rispondere a richieste di contatto / preventivo</strong> — base giuridica: esecuzione di misure precontrattuali (art. 6.1.b GDPR) e, ove applicabile, consenso (art. 6.1.a).</li>
                            <li><strong>Funzionamento tecnico del sito</strong> (lingua, tema, sicurezza) — legittimo interesse (art. 6.1.f) e necessità tecnica.</li>
                            <li><strong>Statistiche aggregate anonime</strong> (es. Plausible) — solo con tuo consenso (art. 6.1.a).</li>
                            <li><strong>Adempimenti di legge</strong> — obbligo legale (art. 6.1.c).</li>
                        </ul>
                    `,
                },
                {
                    heading: '4. Modalità del trattamento',
                    body: `
                        <p>I dati sono trattati con strumenti informatici e misure di sicurezza adeguate. Il form contatti <strong>non memorizza</strong> i dati su database del sito: al submit reindirizza a WhatsApp (Meta Platforms) o puoi contattarmi via email.</p>
                    `,
                },
                {
                    heading: '5. Conservazione',
                    body: `
                        <ul>
                            <li>Richieste di contatto: fino a 24 mesi dalla chiusura della conversazione, salvo obblighi diversi.</li>
                            <li>Preferenze browser (lingua/tema/consenso): fino a revoca o cancellazione locale.</li>
                            <li>Log hosting: secondo policy del provider (GitHub).</li>
                        </ul>
                    `,
                },
                {
                    heading: '6. Destinatari e responsabili',
                    body: `
                        <p>I dati possono essere comunicati a fornitori che supportano il servizio:</p>
                        <ul>
                            <li><strong>GitHub Pages</strong> — hosting del sito;</li>
                            <li><strong>Meta / WhatsApp</strong> — se invii il messaggio tramite WhatsApp;</li>
                            <li><strong>Google Fonts / CDN</strong> — caricamento risorse (può comportare trasferimento IP verso USA);</li>
                            <li><strong>Plausible Analytics</strong> — solo con consenso, hosting UE, senza cookie di profilazione.</li>
                        </ul>
                    `,
                },
                {
                    heading: '7. Trasferimenti extra-UE',
                    body: `
                        <p>Alcuni fornitori (es. Meta, Google, GitHub) possono trattare dati anche fuori dallo SEE. In tali casi il trasferimento avviene nel rispetto degli artt. 44–49 GDPR (clausole contrattuali standard o decisioni di adeguatezza ove applicabili).</p>
                    `,
                },
                {
                    heading: '8. Diritti dell\'interessato',
                    body: `
                        <p>Hai diritto di accesso, rettifica, cancellazione, limitazione, opposizione, portabilità (ove applicabile) e revoca del consenso senza pregiudicare la liceità del trattamento basata sul consenso prestato prima della revoca.</p>
                        <p>Per esercitare i diritti scrivi a <a href="mailto:${LEGAL_CONFIG.email}">${LEGAL_CONFIG.email}</a>.</p>
                    `,
                },
                {
                    heading: '9. Reclamo all\'autorità di controllo',
                    body: `
                        <p>Puoi proporre reclamo al <strong>Garante per la protezione dei dati personali</strong> — <a href="https://www.garanteprivacy.it" rel="noopener noreferrer" target="_blank">www.garanteprivacy.it</a>.</p>
                    `,
                },
                {
                    heading: '10. Natura del conferimento',
                    body: `
                        <p>Il conferimento dei dati nel form è facoltativo ma necessario per essere ricontattato. Il rifiuto comporta l'impossibilità di gestire la richiesta tramite form.</p>
                    `,
                },
            ],
        },
        en: {
            title: 'Privacy Policy',
            metaDescription:
                'GDPR privacy notice for Gabriel Lazzara — web developer in Palermo: data processing, rights and cookies.',
            sections: [
                {
                    heading: '1. Data controller',
                    body: `
                        <p>The data controller is <strong>${LEGAL_CONFIG.ownerName}</strong> (${LEGAL_CONFIG.businessName}), operating from ${LEGAL_CONFIG.address}.</p>
                        <p>Contact email: <a href="mailto:${LEGAL_CONFIG.email}">${LEGAL_CONFIG.email}</a></p>
                    `,
                },
                {
                    heading: '2. Categories of data',
                    body: `
                        <p>This website may process:</p>
                        <ul>
                            <li><strong>Contact data</strong> (name, email, message) via the form, email or WhatsApp;</li>
                            <li><strong>Technical data</strong> (IP address, user agent, hosting logs);</li>
                            <li><strong>Local preferences</strong> (language, theme, cookie choices) stored in your browser;</li>
                            <li><strong>Anonymous analytics</strong> only if you accept optional analytics cookies.</li>
                        </ul>
                    `,
                },
                {
                    heading: '3. Purposes and legal basis',
                    body: `
                        <ul>
                            <li><strong>Contact / quote requests</strong> — pre-contractual measures (GDPR Art. 6.1.b) and, where applicable, consent (Art. 6.1.a).</li>
                            <li><strong>Technical operation</strong> — legitimate interest (Art. 6.1.f) and technical necessity.</li>
                            <li><strong>Aggregated statistics</strong> (e.g. Plausible) — only with your consent (Art. 6.1.a).</li>
                            <li><strong>Legal compliance</strong> — legal obligation (Art. 6.1.c).</li>
                        </ul>
                    `,
                },
                {
                    heading: '4. Processing methods',
                    body: `
                        <p>Data is processed using IT tools with appropriate security. The contact form <strong>does not store</strong> submissions in a site database; it opens WhatsApp (Meta Platforms) or you may email directly.</p>
                    `,
                },
                {
                    heading: '5. Retention',
                    body: `
                        <ul>
                            <li>Contact requests: up to 24 months after the conversation ends, unless longer retention is required by law.</li>
                            <li>Browser preferences: until revoked or cleared locally.</li>
                            <li>Hosting logs: per GitHub policy.</li>
                        </ul>
                    `,
                },
                {
                    heading: '6. Recipients',
                    body: `
                        <ul>
                            <li><strong>GitHub Pages</strong> — website hosting;</li>
                            <li><strong>Meta / WhatsApp</strong> — if you send a message via WhatsApp;</li>
                            <li><strong>Google Fonts / CDNs</strong> — asset delivery (may involve US transfers);</li>
                            <li><strong>Plausible Analytics</strong> — only with consent, EU-hosted, no profiling cookies.</li>
                        </ul>
                    `,
                },
                {
                    heading: '7. International transfers',
                    body: `
                        <p>Some providers (Meta, Google, GitHub) may process data outside the EEA under GDPR Chapter V safeguards (SCCs or adequacy decisions where applicable).</p>
                    `,
                },
                {
                    heading: '8. Your rights',
                    body: `
                        <p>You may request access, rectification, erasure, restriction, objection, portability (where applicable) and withdraw consent at any time.</p>
                        <p>Contact: <a href="mailto:${LEGAL_CONFIG.email}">${LEGAL_CONFIG.email}</a></p>
                    `,
                },
                {
                    heading: '9. Supervisory authority',
                    body: `
                        <p>You may lodge a complaint with the Italian Data Protection Authority (Garante) — <a href="https://www.garanteprivacy.it" rel="noopener noreferrer" target="_blank">www.garanteprivacy.it</a>.</p>
                    `,
                },
                {
                    heading: '10. Mandatory nature',
                    body: `
                        <p>Providing contact data is optional but required to receive a reply via the form. Without it, the request cannot be handled through the form.</p>
                    `,
                },
            ],
        },
    },
    cookie: {
        it: {
            title: 'Cookie e tecnologie simili',
            metaDescription: 'Policy cookie e localStorage del portfolio Gabriel Lazzara — preferenze, analytics e terze parti.',
            sections: [
                {
                    heading: '1. Cosa utilizziamo',
                    body: `
                        <p>Questo sito usa <strong>cookie tecnici</strong> e tecnologie equivalenti (localStorage) per funzionare correttamente. Non usiamo cookie di profilazione senza consenso.</p>
                    `,
                },
                {
                    heading: '2. Necessari (sempre attivi)',
                    body: `
                        <table class="legal-table">
                            <thead><tr><th>Nome</th><th>Tipo</th><th>Finalità</th><th>Durata</th></tr></thead>
                            <tbody>
                                <tr><td><code>portfolio_lang</code></td><td>localStorage</td><td>Lingua dell'interfaccia</td><td>Fino a cancellazione</td></tr>
                                <tr><td><code>portfolio_theme</code></td><td>localStorage</td><td>Tema chiaro/scuro</td><td>Fino a cancellazione</td></tr>
                                <tr><td><code>portfolio_consent_v1</code></td><td>localStorage</td><td>Memorizza scelta cookie</td><td>12 mesi</td></tr>
                            </tbody>
                        </table>
                    `,
                },
                {
                    heading: '3. Analitici (solo con consenso)',
                    body: `
                        <p>Se accetti, possiamo caricare <strong>Plausible Analytics</strong> (statistiche aggregate, senza cookie di tracciamento cross-site). Puoi rifiutare o revocare dal banner o da <button type="button" class="legal-inline-btn" data-open-consent>Preferenze cookie</button>.</p>
                    `,
                },
                {
                    heading: '4. Terze parti (risorse esterne)',
                    body: `
                        <p>Il sito carica risorse da:</p>
                        <ul>
                            <li>Google Fonts (tipografia);</li>
                            <li>cdnjs / jsDelivr (icone, librerie);</li>
                            <li>GitHub Pages (hosting).</li>
                        </ul>
                        <p>Questi servizi possono registrare log tecnici. Consulta le rispettive informative.</p>
                    `,
                },
                {
                    heading: '5. Come gestire le preferenze',
                    body: `
                        <p>Puoi cancellare localStorage dal browser, usare il banner cookie o la modalità navigazione privata. La revoca non blocca i cookie strettamente necessari al funzionamento.</p>
                    `,
                },
            ],
        },
        en: {
            title: 'Cookie Policy',
            metaDescription: 'Cookie and localStorage policy for Gabriel Lazzara portfolio — preferences, analytics and third parties.',
            sections: [
                {
                    heading: '1. What we use',
                    body: `
                        <p>This site uses <strong>technical cookies</strong> and similar technologies (localStorage). We do not use profiling cookies without consent.</p>
                    `,
                },
                {
                    heading: '2. Strictly necessary',
                    body: `
                        <table class="legal-table">
                            <thead><tr><th>Name</th><th>Type</th><th>Purpose</th><th>Duration</th></tr></thead>
                            <tbody>
                                <tr><td><code>portfolio_lang</code></td><td>localStorage</td><td>UI language</td><td>Until cleared</td></tr>
                                <tr><td><code>portfolio_theme</code></td><td>localStorage</td><td>Light/dark theme</td><td>Until cleared</td></tr>
                                <tr><td><code>portfolio_consent_v1</code></td><td>localStorage</td><td>Stores cookie choice</td><td>12 months</td></tr>
                            </tbody>
                        </table>
                    `,
                },
                {
                    heading: '3. Analytics (consent required)',
                    body: `
                        <p>If you accept, we may load <strong>Plausible Analytics</strong> (aggregated stats, no cross-site tracking cookies). You can refuse or withdraw via the banner or <button type="button" class="legal-inline-btn" data-open-consent>Cookie preferences</button>.</p>
                    `,
                },
                {
                    heading: '4. Third-party resources',
                    body: `
                        <ul>
                            <li>Google Fonts;</li>
                            <li>cdnjs / jsDelivr;</li>
                            <li>GitHub Pages hosting.</li>
                        </ul>
                    `,
                },
                {
                    heading: '5. Managing preferences',
                    body: `
                        <p>Clear localStorage in your browser, use the cookie banner, or browse in private mode. Withdrawal does not block strictly necessary storage.</p>
                    `,
                },
            ],
        },
    },
    imprint: {
        it: {
            title: 'Note legali',
            metaDescription: 'Note legali e informazioni sul titolare — Gabriel Lazzara, web developer a Palermo.',
            sections: [
                {
                    heading: 'Informazioni sul titolare del sito',
                    body: `
                        <dl class="legal-dl">
                            <dt>Denominazione</dt><dd>${LEGAL_CONFIG.businessName}</dd>
                            <dt>Titolare</dt><dd>${LEGAL_CONFIG.ownerName}</dd>
                            <dt>Sede operativa</dt><dd>${LEGAL_CONFIG.address}</dd>
                            <dt>Email</dt><dd><a href="mailto:${LEGAL_CONFIG.email}">${LEGAL_CONFIG.email}</a></dd>
                            <dt>PEC</dt><dd>${LEGAL_CONFIG.pec || 'Non disponibile / non obbligatoria per persona fisica'}</dd>
                            <dt>Codice Fiscale</dt><dd>${LEGAL_CONFIG.taxCode || 'Disponibile su richiesta via email'}</dd>
                            <dt>Partita IVA</dt><dd>${LEGAL_CONFIG.vatId || 'Disponibile su richiesta via email'}</dd>
                            <dt>REA</dt><dd>${LEGAL_CONFIG.rea || 'Non iscritto / non applicabile'}</dd>
                            <dt>Attività</dt><dd>${LEGAL_CONFIG.activityIt}</dd>
                        </dl>
                        <p class="legal-note">Ai sensi del D.Lgs. 70/2003 (e-commerce) e della normativa italiana sulla prestazione di servizi nella società dell'informazione.</p>
                    `,
                },
                {
                    heading: 'Hosting',
                    body: `<p>Sito ospitato su <strong>${LEGAL_CONFIG.hostingProvider}</strong>.</p>`,
                },
                {
                    heading: 'Proprietà intellettuale',
                    body: `
                        <p>Testi, layout, codice e marchi presenti nel sito sono di proprietà di ${LEGAL_CONFIG.ownerName} salvo diversa indicazione. È vietata la riproduzione non autorizzata.</p>
                    `,
                },
                {
                    heading: 'Link esterni',
                    body: `
                        <p>Il sito contiene link a siti terzi (GitHub, social, progetti cliente). Non siamo responsabili dei contenuti di siti esterni.</p>
                    `,
                },
                {
                    heading: 'Documenti correlati',
                    body: `
                        <ul>
                            <li><a href="./privacy.html">Informativa privacy</a></li>
                            <li><a href="./cookie.html">Cookie policy</a></li>
                        </ul>
                    `,
                },
            ],
        },
        en: {
            title: 'Legal Notice',
            metaDescription: 'Legal notice and provider information — Gabriel Lazzara, web developer in Palermo, Italy.',
            sections: [
                {
                    heading: 'Website provider',
                    body: `
                        <dl class="legal-dl">
                            <dt>Business name</dt><dd>${LEGAL_CONFIG.businessName}</dd>
                            <dt>Owner</dt><dd>${LEGAL_CONFIG.ownerName}</dd>
                            <dt>Address</dt><dd>${LEGAL_CONFIG.address}</dd>
                            <dt>Email</dt><dd><a href="mailto:${LEGAL_CONFIG.email}">${LEGAL_CONFIG.email}</a></dd>
                            <dt>PEC</dt><dd>${LEGAL_CONFIG.pec || 'Not available'}</dd>
                            <dt>Tax code</dt><dd>${LEGAL_CONFIG.taxCode || 'Available on request'}</dd>
                            <dt>VAT ID</dt><dd>${LEGAL_CONFIG.vatId || 'Available on request'}</dd>
                            <dt>REA</dt><dd>${LEGAL_CONFIG.rea || 'Not registered / N/A'}</dd>
                            <dt>Activity</dt><dd>${LEGAL_CONFIG.activityEn}</dd>
                        </dl>
                    `,
                },
                {
                    heading: 'Hosting',
                    body: `<p>Hosted on <strong>${LEGAL_CONFIG.hostingProvider}</strong>.</p>`,
                },
                {
                    heading: 'Intellectual property',
                    body: `<p>Content and code are owned by ${LEGAL_CONFIG.ownerName} unless otherwise stated.</p>`,
                },
                {
                    heading: 'External links',
                    body: `<p>Third-party links are provided for convenience; we are not responsible for external content.</p>`,
                },
                {
                    heading: 'Related documents',
                    body: `
                        <ul>
                            <li><a href="./privacy.html?lang=en">Privacy Policy</a></li>
                            <li><a href="./cookie.html?lang=en">Cookie Policy</a></li>
                        </ul>
                    `,
                },
            ],
        },
    },
};
