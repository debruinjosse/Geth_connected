export type LegalSection = {
  title: string;
  body: string;
};

export type LegalLocale = "en" | "nl";

const termsByLocale: Record<LegalLocale, LegalSection[]> = {
  en: [
    {
      title: "Welcome",
      body:
        "Welcome to GETH® (\"GETH®\", \"we\", \"our\", or \"us\"). By accessing or using our website, purchasing our products, or using our digital platform and services, you agree to be bound by these Terms & Conditions. If you do not agree with these Terms, please do not use our website or services."
    },
    {
      title: "1. About GETH®",
      body:
        "GETH® provides employee recognition solutions through a combination of physical recognition cards, QR technology, digital dashboards, analytics, and related software services designed to improve workplace culture and employee engagement."
    },
    {
      title: "2. Eligibility",
      body:
        "You must be at least 18 years old and legally capable of entering into binding agreements to use our services. If you use GETH® on behalf of an organization, you confirm that you have authority to bind that organization to these Terms."
    },
    {
      title: "3. Accounts",
      body:
        "Some services require an account. You agree to provide accurate information, keep your login credentials confidential, notify us immediately of unauthorized use, and remain responsible for activities under your account."
    },
    {
      title: "4. Subscription Services",
      body:
        "Certain GETH® services are provided through paid subscriptions. Unless otherwise agreed in writing, subscriptions renew automatically, customers may cancel before the next billing period, and fees already paid are non-refundable."
    },
    {
      title: "5. Physical Products",
      body:
        "Orders for GETH® Cards, merchandise or related products become binding once payment has been received. Delivery times are estimates only. Minor variations in color, print or packaging do not constitute product defects."
    },
    {
      title: "6. Intellectual Property",
      body:
        "All GETH® logos, software, dashboards, graphics, methodologies, recognition frameworks, QR technology and content remain the exclusive intellectual property of GETH® unless otherwise stated. You may not copy, reproduce, distribute, modify, reverse engineer or commercially exploit any part without written permission."
    },
    {
      title: "7. Acceptable Use",
      body:
        "Users agree not to misuse the platform, upload unlawful or offensive content, attempt unauthorized access, interfere with platform security, impersonate others, or use GETH® for illegal purposes."
    },
    {
      title: "8. User Content",
      body:
        "Users retain ownership of recognition messages they submit. By submitting content, users grant GETH® a limited license to process, display and store that content solely to provide the services."
    },
    {
      title: "9. Privacy",
      body:
        "Our handling of personal information is governed by our Privacy Policy and applicable privacy legislation, including the GDPR."
    },
    {
      title: "10. Availability",
      body:
        "While we strive for continuous availability, we do not guarantee uninterrupted access. GETH® may perform maintenance, improve functionality, modify features or temporarily suspend services."
    },
    {
      title: "11. Limitation of Liability",
      body:
        "To the maximum extent permitted by law, GETH® shall not be liable for indirect damages, loss of profits, loss of data, business interruption, reputational damage or consequential damages. Total liability shall not exceed the amount paid by the customer during the preceding twelve (12) months."
    },
    {
      title: "12. No Employment or HR Decisions",
      body:
        "GETH® provides recognition tools and workplace insights only and should not be used as the sole basis for hiring, promotion, dismissal, disciplinary action or performance management."
    },
    {
      title: "13. AI and Analytics",
      body: "Certain features may use AI or automated analytics. These insights support decision-making only and are not professional advice."
    },
    {
      title: "14. Confidentiality",
      body: "Both parties agree to treat confidential information exchanged through GETH® as confidential unless disclosure is required by law."
    },
    {
      title: "15. Changes to the Services",
      body:
        "GETH® reserves the right to improve, modify or discontinue any part of the services. Significant changes will be communicated where reasonably possible."
    },
    {
      title: "16. Termination",
      body:
        "GETH® may suspend or terminate accounts for breach of these Terms, non-payment or suspected unlawful activity. Customers may terminate subscriptions according to their agreement."
    },
    {
      title: "17. Governing Law",
      body:
        "These Terms are governed by the laws of the Netherlands. Disputes shall be submitted exclusively to the competent courts in the Netherlands."
    },
    {
      title: "18. Changes to These Terms",
      body: "GETH® may update these Terms from time to time. Continued use of the services constitutes acceptance of the revised Terms."
    },
    {
      title: "19. Contact",
      body: "GETH®\nEmail: info@geth.pro\nWebsite: www.geth.pro"
    }
  ],
  nl: [
    {
      title: "Welkom",
      body:
        "Welkom bij GETH® (\"GETH®\", \"wij\", \"ons\" of \"onze\"). Door onze website te bezoeken of te gebruiken, onze producten te kopen of ons digitale platform en onze diensten te gebruiken, ga je akkoord met deze algemene voorwaarden. Ben je het niet eens met deze voorwaarden, gebruik dan onze website of diensten niet."
    },
    {
      title: "1. Over GETH®",
      body:
        "GETH® biedt oplossingen voor medewerkerswaardering via een combinatie van fysieke waarderingskaarten, QR-technologie, digitale dashboards, analyses en aanverwante softwarediensten die zijn ontworpen om de werkcultuur en de betrokkenheid van medewerkers te verbeteren."
    },
    {
      title: "2. Wie gebruik mag maken van de diensten",
      body:
        "Je moet minimaal 18 jaar oud en juridisch bevoegd zijn om bindende overeenkomsten aan te gaan om onze diensten te gebruiken. Gebruik je GETH® namens een organisatie, dan bevestig je dat je bevoegd bent om die organisatie aan deze voorwaarden te binden."
    },
    {
      title: "3. Accounts",
      body:
        "Voor sommige diensten is een account nodig. Je stemt ermee in juiste gegevens te verstrekken, je inloggegevens vertrouwelijk te houden, ons direct op de hoogte te stellen van onbevoegd gebruik en verantwoordelijk te blijven voor activiteiten onder jouw account."
    },
    {
      title: "4. Abonnementsdiensten",
      body:
        "Bepaalde GETH®-diensten worden geleverd via betaalde abonnementen. Tenzij schriftelijk anders overeengekomen, worden abonnementen automatisch verlengd, kunnen klanten opzeggen vóór de volgende factuurperiode en worden reeds betaalde bedragen niet terugbetaald."
    },
    {
      title: "5. Fysieke producten",
      body:
        "Bestellingen van GETH®-kaarten, merchandise of aanverwante producten worden bindend zodra de betaling is ontvangen. Levertijden zijn slechts een indicatie. Kleine afwijkingen in kleur, druk of verpakking gelden niet als productgebreken."
    },
    {
      title: "6. Intellectueel eigendom",
      body:
        "Alle GETH®-logo's, software, dashboards, afbeeldingen, methodieken, waarderingsmodellen, QR-technologie en content blijven het exclusieve intellectuele eigendom van GETH®, tenzij anders vermeld. Je mag geen enkel onderdeel kopiëren, verveelvoudigen, verspreiden, wijzigen, reverse-engineeren of commercieel exploiteren zonder schriftelijke toestemming."
    },
    {
      title: "7. Aanvaardbaar gebruik",
      body:
        "Gebruikers stemmen ermee in het platform niet te misbruiken, geen onrechtmatige of aanstootgevende content te uploaden, geen onbevoegde toegang te proberen te verkrijgen, de beveiliging van het platform niet te verstoren, zich niet voor te doen als iemand anders en GETH® niet voor illegale doeleinden te gebruiken."
    },
    {
      title: "8. Content van gebruikers",
      body:
        "Gebruikers behouden het eigendom van de waarderingsberichten die zij plaatsen. Door content te plaatsen geven gebruikers GETH® een beperkte licentie om die content te verwerken, weer te geven en op te slaan, uitsluitend om de diensten te leveren."
    },
    {
      title: "9. Privacy",
      body:
        "De manier waarop wij met persoonsgegevens omgaan, wordt beheerst door ons privacybeleid en de toepasselijke privacywetgeving, waaronder de AVG."
    },
    {
      title: "10. Beschikbaarheid",
      body:
        "Hoewel wij streven naar continue beschikbaarheid, garanderen wij geen ononderbroken toegang. GETH® kan onderhoud uitvoeren, functionaliteit verbeteren, functies wijzigen of diensten tijdelijk opschorten."
    },
    {
      title: "11. Beperking van aansprakelijkheid",
      body:
        "Voor zover wettelijk toegestaan is GETH® niet aansprakelijk voor indirecte schade, winstderving, gegevensverlies, bedrijfsstilstand, reputatieschade of gevolgschade. De totale aansprakelijkheid is nooit hoger dan het bedrag dat de klant in de voorafgaande twaalf (12) maanden heeft betaald."
    },
    {
      title: "12. Geen arbeids- of HR-beslissingen",
      body:
        "GETH® levert uitsluitend waarderingstools en inzichten over de werkvloer en mag niet worden gebruikt als enige basis voor werving, promotie, ontslag, disciplinaire maatregelen of prestatiebeoordeling."
    },
    {
      title: "13. AI en analyses",
      body:
        "Bepaalde functies kunnen gebruikmaken van AI of geautomatiseerde analyses. Deze inzichten ondersteunen de besluitvorming en zijn geen professioneel advies."
    },
    {
      title: "14. Vertrouwelijkheid",
      body:
        "Beide partijen komen overeen vertrouwelijke informatie die via GETH® wordt uitgewisseld vertrouwelijk te behandelen, tenzij openbaarmaking wettelijk verplicht is."
    },
    {
      title: "15. Wijzigingen in de diensten",
      body:
        "GETH® behoudt zich het recht voor om onderdelen van de diensten te verbeteren, te wijzigen of te beëindigen. Belangrijke wijzigingen worden gecommuniceerd waar dat redelijkerwijs mogelijk is."
    },
    {
      title: "16. Beëindiging",
      body:
        "GETH® kan accounts opschorten of beëindigen bij schending van deze voorwaarden, wanbetaling of vermoedelijke onrechtmatige activiteit. Klanten kunnen hun abonnement opzeggen volgens hun overeenkomst."
    },
    {
      title: "17. Toepasselijk recht",
      body:
        "Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden uitsluitend voorgelegd aan de bevoegde rechter in Nederland."
    },
    {
      title: "18. Wijzigingen in deze voorwaarden",
      body:
        "GETH® kan deze voorwaarden van tijd tot tijd bijwerken. Voortgezet gebruik van de diensten geldt als aanvaarding van de herziene voorwaarden."
    },
    {
      title: "19. Contact",
      body: "GETH®\nE-mail: info@geth.pro\nWebsite: www.geth.pro"
    }
  ]
};

const privacyByLocale: Record<LegalLocale, LegalSection[]> = {
  en: [
    {
      title: "1. Introduction",
      body:
        "GETH® ('GETH®', 'we', 'our', or 'us') values your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, share and protect personal information when you visit our website, use our platform, purchase our products or interact with our services."
    },
    {
      title: "2. Data We Collect",
      body:
        "We may collect identification data such as name, email address, company and job title, account information, recognition messages, usage data, device information, cookies, payment-related information processed by payment providers, and communications you send to us."
    },
    {
      title: "3. How We Use Your Data",
      body:
        "We use your personal data to provide and improve our services, create and manage accounts, process subscriptions and orders, deliver customer support, analyse platform usage, communicate service updates, comply with legal obligations, and maintain the security of our platform."
    },
    {
      title: "4. Legal Basis",
      body:
        "Where the GDPR applies, we process personal data based on contractual necessity, legitimate interests, legal obligations, consent where required, and protection against fraud and abuse."
    },
    {
      title: "5. Sharing of Data",
      body:
        "We do not sell personal data. We may share information with trusted service providers, payment processors, hosting providers, analytics providers, professional advisers, or authorities where legally required."
    },
    {
      title: "6. International Transfers",
      body:
        "Where personal data is transferred outside the European Economic Area, GETH® will use appropriate safeguards such as Standard Contractual Clauses or other lawful transfer mechanisms."
    },
    {
      title: "7. Data Retention",
      body:
        "We retain personal data only for as long as necessary to provide our services, comply with legal obligations, resolve disputes and enforce agreements."
    },
    {
      title: "8. Security",
      body:
        "GETH® implements appropriate technical and organisational measures to protect personal data against unauthorised access, disclosure, alteration and destruction. However, no internet transmission is completely secure."
    },
    {
      title: "9. Your Rights",
      body:
        "Depending on applicable law, you may request access, correction, deletion, restriction, portability or objection to the processing of your personal data, and withdraw consent where processing is based on consent."
    },
    {
      title: "10. Cookies",
      body:
        "Our website uses cookies and similar technologies to improve functionality, analyse website performance and enhance the user experience. Where legally required, we ask for your consent before placing non-essential cookies."
    },
    {
      title: "11. Children's Privacy",
      body: "Our services are not intended for children under the age of 16 and we do not knowingly collect personal data from children."
    },
    {
      title: "12. Third-Party Services",
      body: "Our platform may contain links or integrations with third-party services. Their privacy practices are governed by their own privacy policies."
    },
    {
      title: "13. Changes to this Policy",
      body: "We may update this Privacy Policy from time to time. The latest version will always be available on our website."
    },
    {
      title: "14. Contact",
      body:
        "If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact:\nGETH\nEmail: info@geth.pro\nWebsite: www.geth.pro"
    }
  ],
  nl: [
    {
      title: "1. Inleiding",
      body:
        "GETH® ('GETH®', 'wij', 'ons' of 'onze') hecht waarde aan je privacy en zet zich in om je persoonsgegevens te beschermen. In dit privacybeleid leggen we uit hoe wij persoonsgegevens verzamelen, gebruiken, bewaren, delen en beschermen wanneer je onze website bezoekt, ons platform gebruikt, onze producten koopt of contact hebt met onze diensten."
    },
    {
      title: "2. Gegevens die wij verzamelen",
      body:
        "Wij kunnen identificatiegegevens verzamelen zoals naam, e-mailadres, bedrijf en functietitel, accountgegevens, waarderingsberichten, gebruiksgegevens, apparaatgegevens, cookies, betalingsgerelateerde gegevens die door betaaldienstverleners worden verwerkt, en berichten die je ons stuurt."
    },
    {
      title: "3. Hoe wij je gegevens gebruiken",
      body:
        "Wij gebruiken je persoonsgegevens om onze diensten te leveren en te verbeteren, accounts aan te maken en te beheren, abonnementen en bestellingen te verwerken, klantondersteuning te bieden, het gebruik van het platform te analyseren, te communiceren over serviceupdates, te voldoen aan wettelijke verplichtingen en de beveiliging van ons platform te waarborgen."
    },
    {
      title: "4. Rechtsgrondslag",
      body:
        "Waar de AVG van toepassing is, verwerken wij persoonsgegevens op basis van de noodzaak voor de uitvoering van een overeenkomst, gerechtvaardigde belangen, wettelijke verplichtingen, toestemming waar vereist, en bescherming tegen fraude en misbruik."
    },
    {
      title: "5. Delen van gegevens",
      body:
        "Wij verkopen geen persoonsgegevens. Wij kunnen gegevens delen met vertrouwde dienstverleners, betaalverwerkers, hostingpartijen, analyseleveranciers, professionele adviseurs of autoriteiten wanneer dat wettelijk verplicht is."
    },
    {
      title: "6. Internationale doorgifte",
      body:
        "Wanneer persoonsgegevens buiten de Europese Economische Ruimte worden doorgegeven, past GETH® passende waarborgen toe, zoals modelcontractbepalingen of andere rechtmatige doorgiftemechanismen."
    },
    {
      title: "7. Bewaartermijn",
      body:
        "Wij bewaren persoonsgegevens niet langer dan nodig is om onze diensten te leveren, te voldoen aan wettelijke verplichtingen, geschillen op te lossen en overeenkomsten af te dwingen."
    },
    {
      title: "8. Beveiliging",
      body:
        "GETH® neemt passende technische en organisatorische maatregelen om persoonsgegevens te beschermen tegen onbevoegde toegang, openbaarmaking, wijziging en vernietiging. Geen enkele verzending via internet is echter volledig veilig."
    },
    {
      title: "9. Je rechten",
      body:
        "Afhankelijk van de toepasselijke wetgeving kun je verzoeken om inzage, correctie, verwijdering, beperking, overdraagbaarheid of bezwaar tegen de verwerking van je persoonsgegevens, en kun je je toestemming intrekken wanneer de verwerking op toestemming is gebaseerd."
    },
    {
      title: "10. Cookies",
      body:
        "Onze website gebruikt cookies en vergelijkbare technologieën om de functionaliteit te verbeteren, de prestaties van de website te analyseren en de gebruikerservaring te verbeteren. Waar dat wettelijk vereist is, vragen wij je toestemming voordat wij niet-noodzakelijke cookies plaatsen."
    },
    {
      title: "11. Privacy van kinderen",
      body:
        "Onze diensten zijn niet bedoeld voor kinderen jonger dan 16 jaar en wij verzamelen niet bewust persoonsgegevens van kinderen."
    },
    {
      title: "12. Diensten van derden",
      body:
        "Ons platform kan links of integraties met diensten van derden bevatten. Hun privacypraktijken worden beheerst door hun eigen privacybeleid."
    },
    {
      title: "13. Wijzigingen in dit beleid",
      body:
        "Wij kunnen dit privacybeleid van tijd tot tijd bijwerken. De meest recente versie is altijd beschikbaar op onze website."
    },
    {
      title: "14. Contact",
      body:
        "Heb je vragen over dit privacybeleid of wil je je privacyrechten uitoefenen, neem dan contact op met:\nGETH\nE-mail: info@geth.pro\nWebsite: www.geth.pro"
    }
  ]
};

function resolveLegalLocale(locale?: string): LegalLocale {
  return locale === "nl" ? "nl" : "en";
}

export function getTermsContent(locale?: string): LegalSection[] {
  return termsByLocale[resolveLegalLocale(locale)];
}

export function getPrivacyContent(locale?: string): LegalSection[] {
  return privacyByLocale[resolveLegalLocale(locale)];
}
