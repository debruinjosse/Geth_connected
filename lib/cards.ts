export type CardCategory = "Communicatie" | "Creativiteit" | "Competentie" | "Collegialiteit" | "Open kaart";

export type GethCard = {
  id: number;
  cardNumber: number;
  title: string;
  category: string;
  description: string;
  recognitionSentence: string;
  slug: string;
  active: boolean;
};

export type CardLibraryRow = {
  card_number: number;
  title: string;
  category: string;
  description: string;
  recognition_sentence: string;
  qr_slug: string;
  active: boolean;
};

export type SupportedCardLocale = "en" | "nl" | "fr" | "da";

const rawCards: GethCard[] = [
  {
    "id": 1,
    "cardNumber": 1,
    "title": "Luisteraar",
    "category": "Communicatie",
    "description": "Jij geeft mensen de ruimte om volledig hun verhaal te doen zonder te onderbreken. Door jouw aandacht voelen mensen zich gehoord en serieus.",
    "recognitionSentence": "Jij luisterde naar mij vandaag, oprecht geïnteresseerd, zonder te onderbreken. Ik voelde me echt gehoord.",
    "slug": "luisteraar",
    "active": true
  },
  {
    "id": 2,
    "cardNumber": 2,
    "title": "Helder",
    "category": "Communicatie",
    "description": "Jij vertaalt (complexe) situaties naar begrijpelijke taal, afgestemd op de ander. Jij weet precies hoe je iets op de juiste manier kunt overbrengen, zodat het echt landt.",
    "recognitionSentence": "Dankzij jouw duidelijke uitleg begreep ik wat er precies bedoeld werd.",
    "slug": "helder",
    "active": true
  },
  {
    "id": 3,
    "cardNumber": 3,
    "title": "Eerlijk",
    "category": "Communicatie",
    "description": "Jij benoemt wat nodig is op een duidelijke en respectvolle manier. Door jouw eerlijkheid ontstaat helderheid en weten anderen waar ze aan toe zijn.",
    "recognitionSentence": "Ik waardeer dat je het eerlijk benoemde. Dat gaf duidelijkheid en hielp ons een betere keuze maken.",
    "slug": "eerlijk",
    "active": true
  },
  {
    "id": 4,
    "cardNumber": 4,
    "title": "Verbinder",
    "category": "Communicatie",
    "description": "Jij ziet wat mensen met elkaar gemeen hebben en brengt hen op een natuurlijke manier samen. Daardoor ontstaan verbindingen die het werk en de samenwerking versterken.",
    "recognitionSentence": "Jij brengt mensen bij elkaar die elkaar verder helpen en versterken. Het is je tweede natuur.",
    "slug": "verbinder",
    "active": true
  },
  {
    "id": 5,
    "cardNumber": 5,
    "title": "Empathisch",
    "category": "Communicatie",
    "description": "Jij voelt aan wat iemand nodig heeft, eventueel ook zonder dat het uitgesproken wordt. Jouw medeleven en vermogen om je in een ander te verplaatsen maakt de samenwerking menselijk.",
    "recognitionSentence": "Bij jou hoef ik niets uit te leggen, jij voelt de sfeer aan en hebt begrip voor de situatie. Ik voel mij echt begrepen.",
    "slug": "empathisch",
    "active": true
  },
  {
    "id": 6,
    "cardNumber": 6,
    "title": "Overtuigend",
    "category": "Communicatie",
    "description": "Jij weet mensen mee te nemen in jouw verhaal zonder te forceren. Je combineert logica met gevoel en daardoor ontstaat beweging vanzelf.",
    "recognitionSentence": "Jij overtuigde me vandaag niet met druk, maar met inzicht. Daardoor kon ik volmondig ja zeggen waardoor het echt als mijn keuze voelde.",
    "slug": "overtuigend",
    "active": true
  },
  {
    "id": 7,
    "cardNumber": 7,
    "title": "Gastvrij",
    "category": "Communicatie",
    "description": "Jij zorgt ervoor dat mensen zich welkom voelen vanaf het eerste moment. Jij hebt een natuurlijk gevoel voor wat iemand nodig heeft om zich op zijn gemak te voelen.",
    "recognitionSentence": "Jij zorgde er vandaag voor dat ik me welkom voelde. Dat is niet vanzelfsprekend en zorgt ervoor dat ik hier graag naartoe kom.",
    "slug": "gastvrij",
    "active": true
  },
  {
    "id": 8,
    "cardNumber": 8,
    "title": "Inspirerend",
    "category": "Communicatie",
    "description": "Jij geeft mensen met jouw woorden en energie zin om dingen op te pakken of door te pakken. Na een gesprek met jou voelt er (vaak) meer mogelijk.",
    "recognitionSentence": "Na ons gesprek kreeg ik nieuwe energie om door te pakken. Jij liet me inzien dat het mogelijk is.",
    "slug": "inspirerend",
    "active": true
  },
  {
    "id": 9,
    "cardNumber": 9,
    "title": "Diplomatiek",
    "category": "Communicatie",
    "description": "Jij voelt aan wanneer een gesprek lastig wordt en weet dan precies de juiste, verzachtende woorden te kiezen. Daardoor zorg jij dat situaties niet escaleren en iedereen betrokken blijft.",
    "recognitionSentence": "De manier waarop jij de juiste woorden koos, hield het gesprek rustig en zorgde dat iedereen bleef luisteren.",
    "slug": "diplomatiek",
    "active": true
  },
  {
    "id": 10,
    "cardNumber": 10,
    "title": "Leidend",
    "category": "Communicatie",
    "description": "Jij geeft helder richting zonder te overheersen. Wanneer anderen twijfelen, bied jij handvatten en laat je zien welke mogelijkheden er zijn om verder te kunnen.",
    "recognitionSentence": "Jij gaf ons precies de duidelijkheid en handvatten die we nodig hadden om verder te kunnen.",
    "slug": "leidend",
    "active": true
  },
  {
    "id": 11,
    "cardNumber": 11,
    "title": "Nieuwsgierig",
    "category": "Communicatie",
    "description": "Jij wilt graag alle kanten van een verhaal begrijpen. Door jouw vragen ontstaat er verdieping en krijgen mensen een completer beeld van wat er speelt.",
    "recognitionSentence": "Jouw vragen lieten me verder kijken dan ik zelf zou zijn gegaan. Daardoor begreep ik de situatie pas echt.",
    "slug": "nieuwsgierig",
    "active": true
  },
  {
    "id": 12,
    "cardNumber": 12,
    "title": "Enthousiast",
    "category": "Communicatie",
    "description": "Jij brengt leven in een gesprek. Jouw enthousiasme werkt aanstekelijk.",
    "recognitionSentence": "Elke keer als jij praat, raak ik enthousiast en krijg ik zin om mee te helpen. Dat is een gave die heb jij gewoon.",
    "slug": "enthousiast",
    "active": true
  },
  {
    "id": 13,
    "cardNumber": 13,
    "title": "Geruststeller",
    "category": "Communicatie",
    "description": "Jij hebt het vermogen om mensen tot rust te brengen in onzekere momenten. Jouw woorden en aanwezigheid geven kalmte aan wie dat nodig heeft.",
    "recognitionSentence": "Jij zorgde ervoor dat ik rustig werd juist toen ik het nodig had. Door jou voel ik me weer op mijn gemak.",
    "slug": "geruststeller",
    "active": true
  },
  {
    "id": 14,
    "cardNumber": 14,
    "title": "Vernieuwend",
    "category": "Creativiteit",
    "description": "Jij denkt out of the box. Jouw ideeën openen vensters die anderen nog niet zagen. Jij geeft een frisse, innovatieve blik op wat er mogelijk kan zijn.",
    "recognitionSentence": "Jouw idee bracht precies de frisse blik die nodig was, dat heeft echt iets opgeleverd.",
    "slug": "vernieuwend",
    "active": true
  },
  {
    "id": 15,
    "cardNumber": 15,
    "title": "Avontuurlijk",
    "category": "Creativiteit",
    "description": "Jij omarmt het onbekende. Waar anderen voorzichtig worden, zie jij een kans. Jouw bereidheid om risico te nemen opent nieuwe wegen voor het hele team.",
    "recognitionSentence": "Jij durfde vandaag een stap te zetten die wij allemaal spannend vonden. Dankzij jou komen we verder.",
    "slug": "avontuurlijk",
    "active": true
  },
  {
    "id": 16,
    "cardNumber": 16,
    "title": "Humor",
    "category": "Creativiteit",
    "description": "Jij brengt plezier, luchtigheid en positiviteit in wat dreigt vast te lopen. Dankzij jouw humor voelt het prettig om mee te doen.",
    "recognitionSentence": "Jij bracht precies de energie die nodig was om het prettig te laten voelen en dat voelde ik direct.",
    "slug": "humor",
    "active": true
  },
  {
    "id": 17,
    "cardNumber": 17,
    "title": "Visionair",
    "category": "Creativiteit",
    "description": "Jij ziet voor je wat er mogelijk is op langere termijn en weet daar richting aan te geven. Daarmee help je anderen om verder te kijken dan vandaag.",
    "recognitionSentence": "Jij liet me zien waar we in de toekomst kunnen staan. Dat maakte het ineens concreet en tastbaar.",
    "slug": "visionair",
    "active": true
  },
  {
    "id": 18,
    "cardNumber": 18,
    "title": "Onderzoekend",
    "category": "Creativiteit",
    "description": "Jij stelt scherpe vragen en ontdekt inzichten die anderen helpen betere keuzes te maken.",
    "recognitionSentence": "Dat jij verder keek dan de rest en doorvroeg, hielp ons een beter besluit te nemen. Zonder jou hadden we dat gemist.",
    "slug": "onderzoekend",
    "active": true
  },
  {
    "id": 19,
    "cardNumber": 19,
    "title": "Authentiek",
    "category": "Creativiteit",
    "description": "Jij laat je niet leiden door wat gangbaar is. In wat jij maakt of zegt zit iets eigens dat herkenbaar en onderscheidend is.",
    "recognitionSentence": "Ik herken jou direct in wat jij maakt, doet of zegt. Jij brengt altijd iets dat echt van jou is.",
    "slug": "authentiek",
    "active": true
  },
  {
    "id": 20,
    "cardNumber": 20,
    "title": "Opmerkzaam",
    "category": "Creativiteit",
    "description": "Jij ziet wat anderen niet zien. Puur omdat jij zo kijkt. Details, sfeer, wat er onder de oppervlakte speelt. Niets gaat aan jou voorbij.",
    "recognitionSentence": "Jij merkte vandaag iets op watr de rest had gemist. Dankzij jou hebben we het niet laten liggen.",
    "slug": "opmerkzaam",
    "active": true
  },
  {
    "id": 21,
    "cardNumber": 21,
    "title": "Verzorgd",
    "category": "Creativiteit",
    "description": "Jij levert nooit half werk. Wat jij maakt ziet er goed uit. Dat gevoel voor kwaliteit straalt af op alles wat jij aanraakt.",
    "recognitionSentence": "Wat jij vandaag maakte straalde kwaliteit uit en was tot in de puntjes verzorgd, dat is jouw standaard.",
    "slug": "verzorgd",
    "active": true
  },
  {
    "id": 22,
    "cardNumber": 22,
    "title": "Oplosser",
    "category": "Creativiteit",
    "description": "Jij ziet problemen als uitnodigingen om anders te kijken. Waar anderen vastlopen, ontdek jij vaak een creatieve doorgang.",
    "recognitionSentence": "Jij zag een kans waar wij vooral een probleem zagen. Waardevol dat jij dat zag.",
    "slug": "oplosser",
    "active": true
  },
  {
    "id": 23,
    "cardNumber": 23,
    "title": "Intuïtief",
    "category": "Creativiteit",
    "description": "Jij durft te vertrouwen op je gevoel. Jouw intuïtie is geen losse ingeving, maar een gevoeligheid voor wat klopt in het moment.",
    "recognitionSentence": "Je voelde feilloos aan wat hier nodig was, nog voordat alles was uitgesproken.",
    "slug": "intuitief",
    "active": true
  },
  {
    "id": 24,
    "cardNumber": 24,
    "title": "Improvisator",
    "category": "Creativiteit",
    "description": "Jij blijft kalm als plannen veranderen. Jij maakt van onverwachte situaties iets bruikbaars.",
    "recognitionSentence": "Dat jij zo soepel schakelde, zorgde ervoor dat wij ook rustig konden blijven.",
    "slug": "improvisator",
    "active": true
  },
  {
    "id": 25,
    "cardNumber": 25,
    "title": "Uitdager",
    "category": "Creativiteit",
    "description": "Jij daagt constructief de status quo uit. Jij stelt de vraag \"maar waarom eigenlijk?\" En die vraag zorgt voor inzicht.",
    "recognitionSentence": "Jij liet me vandaag mijn eigen aannames zien. Dit was ongemakkelijk maar verhelderend en precies wat ik nodig had.",
    "slug": "uitdager",
    "active": true
  },
  {
    "id": 26,
    "cardNumber": 26,
    "title": "Dromer",
    "category": "Creativiteit",
    "description": "Jij durft groot te denken. Jouw dromen zijn de zaadjes van de toekomst voor jou én voor anderen.",
    "recognitionSentence": "Jouw droom van vandaag gaf mij moed om ook iets groots te durven denken.",
    "slug": "dromer",
    "active": true
  },
  {
    "id": 27,
    "cardNumber": 27,
    "title": "Doelgericht",
    "category": "Competentie",
    "description": "Jij weet waar je naartoe werkt en houdt scherp wat er echt toe doet. Daardoor help je anderen om focus te houden op het doel.",
    "recognitionSentence": "Jij hield ons bij de kern toen wij dreigden af te dwalen. Dankzij jou hielden we het doel in zicht.",
    "slug": "doelgericht",
    "active": true
  },
  {
    "id": 28,
    "cardNumber": 28,
    "title": "Analytisch",
    "category": "Competentie",
    "description": "Jij ziet structuur waar anderen chaos zien. Jij ontleedt problemen met precisie en vindt de kern van de zaak snel.",
    "recognitionSentence": "Jouw analyse bracht rust in iets wat voor ons ondoorzichtig was.. Helder en direct, dat gaf mij vertrouwen.",
    "slug": "analytisch",
    "active": true
  },
  {
    "id": 29,
    "cardNumber": 29,
    "title": "Betrouwbaar",
    "category": "Competentie",
    "description": "Wat jij zegt, doe jij. Altijd. Jouw betrouwbaarheid is het fundament waarop anderen durven bouwen.",
    "recognitionSentence": "Ik kan op jou bouwen; dat geeft stabiliteit voor mij, voor het team en voor het resultaat.",
    "slug": "betrouwbaar",
    "active": true
  },
  {
    "id": 30,
    "cardNumber": 30,
    "title": "Strategisch",
    "category": "Competentie",
    "description": "Jij denkt drie stappen vooruit. Jij ziet patronen en kansen die anderen nog niet zien, en geeft inzichten die op lange termijn kloppen.",
    "recognitionSentence": "Jij zag vandaag wat deze beslissing over twee jaar betekent.",
    "slug": "strategisch",
    "active": true
  },
  {
    "id": 31,
    "cardNumber": 31,
    "title": "Nauwkeurig",
    "category": "Competentie",
    "description": "Jij mist niets. Jouw oog voor detail beschermt de kwaliteit, ook als anderen al tevreden zouden zijn.",
    "recognitionSentence": "Jij zag wat wij niet zagen. En daardoor werd ons werk echt goed.",
    "slug": "nauwkeurig",
    "active": true
  },
  {
    "id": 32,
    "cardNumber": 32,
    "title": "Daadkrachtig",
    "category": "Competentie",
    "description": "Jij komt in beweging waar anderen nog afwegen. Door jouw daadkracht ontstaat er tempo en wordt het voor anderen makkelijker om ook mee te gaan.",
    "recognitionSentence": "Dat jij gewoon begon, gaf ons allemaal het zetje dat we nodig hadden.",
    "slug": "daadkrachtig",
    "active": true
  },
  {
    "id": 33,
    "cardNumber": 33,
    "title": "Leergierig",
    "category": "Competentie",
    "description": "Jij groeit bewust. Jij zoekt feedback op, omarmt ongemak en maakt van elke fout een stap vooruit.",
    "recognitionSentence": "De manier waarop jij omging met die feedback liet mij zien hoe groei ontstaat en je van fouten kunt leren.",
    "slug": "leergierig",
    "active": true
  },
  {
    "id": 34,
    "cardNumber": 34,
    "title": "Organisator",
    "category": "Competentie",
    "description": "Jij brengt orde in complexiteit. Jouw vermogen om te structureren maakt het voor iedereen mogelijk om te presteren.",
    "recognitionSentence": "Dankzij jou wist iedereen vandaag wat hij/zij moest doen. Dat is van onschatbare waarde.",
    "slug": "organisator",
    "active": true
  },
  {
    "id": 35,
    "cardNumber": 35,
    "title": "Veerkrachtig",
    "category": "Competentie",
    "description": "Jij bent stabiel als het tegenzit. Tegenslagen breng jij in perspectief en jij herpakt je snel, waardoor het niet als een grote tegenslag aanvoelt.",
    "recognitionSentence": "De manier waarop jij je herpakte, inspireerde mij. Jij liet zien dat je je niet laat stoppen.",
    "slug": "veerkrachtig",
    "active": true
  },
  {
    "id": 36,
    "cardNumber": 36,
    "title": "Resultaatgericht",
    "category": "Competentie",
    "description": "Jij houdt het einddoel scherp voor ogen. Jij weet het verschil tussen druk zijn en productief zijn, en kiest altijd voor wat echt bijdraagt aan het doel.",
    "recognitionSentence": "Jij bracht focus op wat echt bijdraagt. Dankzij jou maken we echte stappen.",
    "slug": "resultaatgericht",
    "active": true
  },
  {
    "id": 37,
    "cardNumber": 37,
    "title": "Proactief",
    "category": "Competentie",
    "description": "Jij wacht niet af. Jij ziet wat er nodig is vóórdat anderen het opmerken, en handelt al voordat er gevraagd wordt.",
    "recognitionSentence": "Jij had dit al geregeld voor ik er überhaupt aan had gedacht. Dat geeft rust.",
    "slug": "proactief",
    "active": true
  },
  {
    "id": 38,
    "cardNumber": 38,
    "title": "Besluitvaardig",
    "category": "Competentie",
    "description": "Jij neemt beslissingen, ook als niet alles duidelijk is. Jij weet dat niet beslissen ook een keuze kan zijn en neemt verantwoordelijkheid voor je keuze.",
    "recognitionSentence": "Jij nam een besluit toen wij bleven twijfelen. Dankzij jou konden we verder.",
    "slug": "besluitvaardig",
    "active": true
  },
  {
    "id": 39,
    "cardNumber": 39,
    "title": "Kritisch",
    "category": "Competentie",
    "description": "Jij accepteert niet zomaar wat voor je wordt neergelegd. Jouw kritische blik beschermt de kwaliteit en zorgt dat het beste naar boven komt.",
    "recognitionSentence": "Doordat jij durfde te vragen, kwamen we op tijd tot inzicht. Zonder jou hadden we dat gemist.",
    "slug": "kritisch",
    "active": true
  },
  {
    "id": 40,
    "cardNumber": 40,
    "title": "Zorgzaam",
    "category": "Collegialiteit",
    "description": "Jij let op mensen, niet vanuit plicht, maar vanuit echte aandacht. Jij merkt op wanneer het minder goed gaat, voordat iemand het zelf heeft gezegd.",
    "recognitionSentence": "Dankzij jouw zorgzaamheid voelde ik me gezien op een moment dat ik dat hard nodig had.",
    "slug": "zorgzaam",
    "active": true
  },
  {
    "id": 41,
    "cardNumber": 41,
    "title": "Loyaal",
    "category": "Collegialiteit",
    "description": "Jij blijft staan voor de mensen om je heen, juist wanneer het moeilijk wordt.\nJe verlaat mensen niet wanneer het tegenzit, maar kiest voor trouw, vertrouwen en echte verbondenheid.",
    "recognitionSentence": "Dat jij er was, ook toen het moeilijk was, betekent meer dan jij weet. Jouw loyaliteit gaf mij vertrouwen, stabiliteit en de zekerheid dat ik op je kan bouwen.",
    "slug": "loyaal",
    "active": true
  },
  {
    "id": 42,
    "cardNumber": 42,
    "title": "Teamspeler",
    "category": "Collegialiteit",
    "description": "Jij plaatst het belang van het team voorop. Jij deelt credits, ondersteunt anderen en draagt bij aan het gezamenlijk doel.",
    "recognitionSentence": "Jij hield vandaag het team sterk zonder zelf op de voorgrond te hoeven staan. Juist daardoor kon iedereen beter presteren.",
    "slug": "teamspeler",
    "active": true
  },
  {
    "id": 43,
    "cardNumber": 43,
    "title": "Vertrouwenspersoon",
    "category": "Collegialiteit",
    "description": "Mensen kiezen jou als ze iets vertrouwelijks moeten delen. Jij bewaart dat vertrouwen zorgvuldig en discreet.",
    "recognitionSentence": "Ik kan jou dingen vertellen die ik niemand anders vertel. Dat vertrouwen is niet vanzelfsprekend en ik ben blij dat jij er bent.",
    "slug": "vertrouwenspersoon",
    "active": true
  },
  {
    "id": 44,
    "cardNumber": 44,
    "title": "Ondersteunend",
    "category": "Collegialiteit",
    "description": "Jij bent er voor anderen op het moment dat het telt. Jij helpt en geeft steun wanneer ze dat echt nodig hebben.",
    "recognitionSentence": "Jij was er voor mij, dat was precies genoeg. Jij gaf me rust en vertrouwen toen ik het nodig had.",
    "slug": "ondersteunend",
    "active": true
  },
  {
    "id": 45,
    "cardNumber": 45,
    "title": "Respectvol",
    "category": "Collegialiteit",
    "description": "Jij respecteert de grenzen, het tempo en de perspectieven van anderen. Jij legt niets op, maar schept ruimte zodat de ander zichzelf kan zijn.",
    "recognitionSentence": "Jij gaf mij vandaag de ruimte om op mijn eigen manier bij te dragen. Dat voelde als oprechte samenwerking.",
    "slug": "respectvol",
    "active": true
  },
  {
    "id": 46,
    "cardNumber": 46,
    "title": "Dankbaar",
    "category": "Collegialiteit",
    "description": "Jij ziet wat anderen bijdragen en spreekt dat uit. Jij laat mensen weten dat hun bijdrage telt, en dat verandert de sfeer.",
    "recognitionSentence": "Dat jij dat vandaag hardop zei, waardeer ik. Het geeft me energie om door te gaan.",
    "slug": "dankbaar",
    "active": true
  },
  {
    "id": 47,
    "cardNumber": 47,
    "title": "Inclusief",
    "category": "Collegialiteit",
    "description": "Jij zorgt ervoor dat niemand buitengesloten wordt. Jij trekt stille stemmen naar voren en maakt ruimte voor wie normaal geen ruimte krijgt.",
    "recognitionSentence": "Jij zorgde er vandaag voor dat ik er ook bij hoorde. Dat geeft me het gevoel van gelijkwaardigheid en dat ik iets bijdraag.",
    "slug": "inclusief",
    "active": true
  },
  {
    "id": 48,
    "cardNumber": 48,
    "title": "Geduldig",
    "category": "Collegialiteit",
    "description": "Jij geeft mensen de tijd die ze nodig hebben. Jij dwingt geen tempo op dat niet bij hen past en dat maakt samenwerken veilig.",
    "recognitionSentence": "Dat jij mij de tijd gaf zonder ongeduld, nam de druk weg. Daardoor kon ik laten zien wat ik in huis heb.",
    "slug": "geduldig",
    "active": true
  },
  {
    "id": 49,
    "cardNumber": 49,
    "title": "Beschermend",
    "category": "Collegialiteit",
    "description": "Jij staat op voor anderen als dat nodig is. Jij laat niet toe dat mensen weggezet of genegeerd worden, zacht maar standvastig. Jij zorgt voor iemands welzijn.",
    "recognitionSentence": "Dat jij voor mij opkwam, waardeer ik. Jij zorgde ervoor dat ik me veilig voelde.",
    "slug": "beschermend",
    "active": true
  },
  {
    "id": 50,
    "cardNumber": 50,
    "title": "Energiek",
    "category": "Collegialiteit",
    "description": "Jij brengt leven in een ruimte. Jouw aanwezigheid tilt de energie van het team omhoog en zorgt ervoor dat we doorgaan op het moment dat anderen afhaken.",
    "recognitionSentence": "Elke keer als jij er bent, is de sfeer beter. Dat is puur jouw bijdrage. Jouw energie werkt aanstekelijk en brengt enthousiasme.",
    "slug": "energiek",
    "active": true
  },
  {
    "id": 51,
    "cardNumber": 51,
    "title": "Aanwezig",
    "category": "Collegialiteit",
    "description": "Jij bent echt aanwezig. Geen halve aandacht, geen afleiding, jij richt je volledig op de mens voor je.",
    "recognitionSentence": "Jij was er vandaag volledig, en ik voelde dat. Dat maakt het verschil. Volle aandacht is het beste wat je iemand kunt geven.",
    "slug": "aanwezig",
    "active": true
  },
  {
    "id": 52,
    "cardNumber": 52,
    "title": "Waarderend",
    "category": "Collegialiteit",
    "description": "Jij ziet het goede in mensen. Jouw waardering is geen complimentje, het is een spiegel die mensen groter laat zijn. Jij maakt iemands bijdrage zichtbaar door te waarderen. Deze kwaliteit is de basis voor een goede werkomgeving, goede medewerkers en een goed resultaat.",
    "recognitionSentence": "Dat je mijn bijdrage waardeert, geeft me het gevoel dat ik gezien word. Dit geeft me kracht, positiviteit en energie.",
    "slug": "waarderend",
    "active": true
  },
  {
    "id": 53,
    "cardNumber": 53,
    "title": "Open Categorie",
    "category": "Open kaart",
    "description": "Vul de te waarderen kwaliteit in:",
    "recognitionSentence": "Maak je eigen erkenningszin:",
    "slug": "open-categorie",
    "active": true
  }
];

const encodingFixes: Array<[string, string]> = [
  ["Ã¡", "á"],
  ["Ã©", "é"],
  ["Ã¨", "è"],
  ["Ã«", "ë"],
  ["Ãª", "ê"],
  ["Ã¯", "ï"],
  ["Ã¼", "ü"],
  ["Ã³", "ó"],
  ["Ã§", "ç"],
  ["â€™", "'"],
  ["â€œ", '"'],
  ["â€", '"'],
  ["Â·", "·"],
  ["Â", ""]
];

function cleanText(value: string) {
  return encodingFixes.reduce((result, [from, to]) => result.split(from).join(to), value);
}

export const categoryMeta: Record<CardCategory, { label: string; color: string }> = {
  Communicatie: { label: "Communication", color: "var(--theme-emerald)" },
  Creativiteit: { label: "Creativity", color: "var(--theme-gold)" },
  Competentie: { label: "Competence", color: "var(--theme-orange)" },
  Collegialiteit: { label: "Collegiality", color: "var(--theme-sky)" },
  "Open kaart": { label: "Open Card", color: "var(--theme-ink)" }
};

const categoryLabelsByLocale: Record<SupportedCardLocale, Record<CardCategory, string>> = {
  en: {
    Communicatie: "Communication",
    Creativiteit: "Creativity",
    Competentie: "Competence",
    Collegialiteit: "Collegiality",
    "Open kaart": "Open Card"
  },
  nl: {
    Communicatie: "Communicatie",
    Creativiteit: "Creativiteit",
    Competentie: "Competentie",
    Collegialiteit: "Collegialiteit",
    "Open kaart": "Open kaart"
  },
  fr: {
    Communicatie: "Communication",
    Creativiteit: "Creativite",
    Competentie: "Competence",
    Collegialiteit: "Esprit d'equipe",
    "Open kaart": "Carte ouverte"
  },
  da: {
    Communicatie: "Kommunikation",
    Creativiteit: "Kreativitet",
    Competentie: "Kompetence",
    Collegialiteit: "Kollegialitet",
    "Open kaart": "Abent kort"
  }
};

const cardTitleTranslations: Record<string, Record<SupportedCardLocale, string>> = {
  luisteraar: { en: "Listener", nl: "Luisteraar", fr: "A l'ecoute", da: "Lytter" },
  helder: { en: "Clear", nl: "Helder", fr: "Clair", da: "Tydelig" },
  eerlijk: { en: "Honest", nl: "Eerlijk", fr: "Honnete", da: "AErling" },
  verbinder: { en: "Connector", nl: "Verbinder", fr: "Connecteur", da: "Forbinder" },
  empathisch: { en: "Empathetic", nl: "Empathisch", fr: "Empathique", da: "Empatisk" },
  overtuigend: { en: "Persuasive", nl: "Overtuigend", fr: "Persuasif", da: "Overbevisende" },
  gastvrij: { en: "Welcoming", nl: "Gastvrij", fr: "Accueillant", da: "Gaestfri" },
  inspirerend: { en: "Inspiring", nl: "Inspirerend", fr: "Inspirant", da: "Inspirerende" },
  diplomatiek: { en: "Diplomatic", nl: "Diplomatiek", fr: "Diplomate", da: "Diplomatisk" },
  leidend: { en: "Guiding", nl: "Leidend", fr: "Guide", da: "Vejledende" },
  nieuwsgierig: { en: "Curious", nl: "Nieuwsgierig", fr: "Curieux", da: "Nysgerrig" },
  enthousiast: { en: "Enthusiastic", nl: "Enthousiast", fr: "Enthousiaste", da: "Entusiastisk" },
  geruststeller: { en: "Reassurer", nl: "Geruststeller", fr: "Rassurant", da: "Beroligende" },
  vernieuwend: { en: "Innovative", nl: "Vernieuwend", fr: "Innovant", da: "Fornyende" },
  avontuurlijk: { en: "Adventurous", nl: "Avontuurlijk", fr: "Aventureux", da: "Eventyrlysten" },
  humor: { en: "Humor", nl: "Humor", fr: "Humour", da: "Humor" },
  visionair: { en: "Visionary", nl: "Visionair", fr: "Visionnaire", da: "Visionaer" },
  onderzoekend: { en: "Investigative", nl: "Onderzoekend", fr: "Explorateur", da: "Undersogende" },
  authentiek: { en: "Authentic", nl: "Authentiek", fr: "Authentique", da: "Autentisk" },
  opmerkzaam: { en: "Observant", nl: "Opmerkzaam", fr: "Observateur", da: "Opmaerksom" },
  verzorgd: { en: "Thoughtful", nl: "Verzorgd", fr: "Soigne", da: "Omsorgsfuld" },
  oplosser: { en: "Problem solver", nl: "Oplosser", fr: "Solutionneur", da: "Problemloser" },
  intuitief: { en: "Intuitive", nl: "Intuitief", fr: "Intuitif", da: "Intuitiv" },
  improvisator: { en: "Improviser", nl: "Improvisator", fr: "Improvisateur", da: "Improvisator" },
  uitdager: { en: "Challenger", nl: "Uitdager", fr: "Challenger", da: "Udfordrer" },
  dromer: { en: "Dreamer", nl: "Dromer", fr: "Reveur", da: "Drommer" },
  doelgericht: { en: "Goal-oriented", nl: "Doelgericht", fr: "Oriente objectif", da: "Malrettet" },
  analytisch: { en: "Analytical", nl: "Analytisch", fr: "Analytique", da: "Analytisk" },
  betrouwbaar: { en: "Reliable", nl: "Betrouwbaar", fr: "Fiable", da: "Paalidelig" },
  strategisch: { en: "Strategic", nl: "Strategisch", fr: "Strategique", da: "Strategisk" },
  nauwkeurig: { en: "Precise", nl: "Nauwkeurig", fr: "Precis", da: "Praecis" },
  daadkrachtig: { en: "Decisive", nl: "Daadkrachtig", fr: "Determine", da: "Handlekraftig" },
  leergierig: { en: "Eager to learn", nl: "Leergierig", fr: "Avide d'apprendre", da: "Laeringsvillig" },
  organisator: { en: "Organizer", nl: "Organisator", fr: "Organisateur", da: "Organisator" },
  veerkrachtig: { en: "Resilient", nl: "Veerkrachtig", fr: "Resilient", da: "Robust" },
  resultaatgericht: { en: "Results-driven", nl: "Resultaatgericht", fr: "Oriente resultats", da: "Resultatorienteret" },
  proactief: { en: "Proactive", nl: "Proactief", fr: "Proactif", da: "Proaktiv" },
  besluitvaardig: { en: "Decision maker", nl: "Besluitvaardig", fr: "Decisionnaire", da: "Beslutningsdygtig" },
  kritisch: { en: "Critical thinker", nl: "Kritisch", fr: "Esprit critique", da: "Kritisk taenker" },
  zorgzaam: { en: "Caring", nl: "Zorgzaam", fr: "Attentionne", da: "Omsorgsfuld" },
  loyaal: { en: "Loyal", nl: "Loyaal", fr: "Loyal", da: "Loyal" },
  teamspeler: { en: "Team player", nl: "Teamspeler", fr: "Esprit d'equipe", da: "Holdspiller" },
  vertrouwenspersoon: { en: "Trusted person", nl: "Vertrouwenspersoon", fr: "Personne de confiance", da: "Tillidsperson" },
  ondersteunend: { en: "Supportive", nl: "Ondersteunend", fr: "Soutenant", da: "Stottende" },
  respectvol: { en: "Respectful", nl: "Respectvol", fr: "Respectueux", da: "Respektfuld" },
  dankbaar: { en: "Grateful", nl: "Dankbaar", fr: "Reconnaissant", da: "Taknemmelig" },
  inclusief: { en: "Inclusive", nl: "Inclusief", fr: "Inclusif", da: "Inkluderende" },
  geduldig: { en: "Patient", nl: "Geduldig", fr: "Patient", da: "Talmodig" },
  beschermend: { en: "Protective", nl: "Beschermend", fr: "Protecteur", da: "Beskyttende" },
  energiek: { en: "Energetic", nl: "Energiek", fr: "Energique", da: "Energisk" },
  aanwezig: { en: "Present", nl: "Aanwezig", fr: "Present", da: "Naervaerende" },
  waarderend: { en: "Appreciative", nl: "Waarderend", fr: "Valorisant", da: "Vaerdsaettende" },
  "open-categorie": { en: "Open Category", nl: "Open Categorie", fr: "Categorie ouverte", da: "Aben kategori" }
};

function normalizeLocale(locale?: string): SupportedCardLocale {
  if (locale === "nl" || locale === "fr" || locale === "da") return locale;
  return "en";
}

export const categoryColors: Record<string, string> = Object.fromEntries(
  Object.entries(categoryMeta).map(([category, meta]) => [category, meta.color])
);

export const slugAliases: Record<string, string> = {
  connector: "verbinder",
  listener: "luisteraar",
  empathetic: "empathisch",
  clear: "helder",
  "problem-solver": "oplosser",
  "goal-oriented": "doelgericht",
  supportive: "ondersteunend",
  visionary: "visionair",
  "open-card": "open-categorie"
};

export const gethCards: GethCard[] = rawCards.map((card) => ({
  ...card,
  title: cleanText(card.title),
  category: cleanText(card.category),
  description: cleanText(card.description),
  recognitionSentence: cleanText(card.recognitionSentence)
}));

export function resolveCardSlug(slug: string) {
  return slugAliases[slug.toLowerCase()] ?? slug.toLowerCase();
}

export function getCardBySlug(slug: string) {
  const resolved = resolveCardSlug(slug);
  return gethCards.find((card) => card.slug === resolved && card.active);
}

export function getCategoryDisplayName(category: string) {
  return categoryMeta[category as CardCategory]?.label ?? category;
}

export function getLocalizedCategoryDisplayName(category: string, locale?: string) {
  const normalizedLocale = normalizeLocale(locale);
  return categoryLabelsByLocale[normalizedLocale][category as CardCategory] ?? getCategoryDisplayName(category);
}

export function getLocalizedCardTitle(cardOrTitle: Pick<GethCard, "title"> & Partial<Pick<GethCard, "slug">> | string, locale?: string) {
  const normalizedLocale = normalizeLocale(locale);
  const title = typeof cardOrTitle === "string" ? cleanText(cardOrTitle) : cleanText(cardOrTitle.title);
  const slug = typeof cardOrTitle === "string" ? gethCards.find((card) => card.title === title)?.slug : cardOrTitle.slug;
  return slug ? cardTitleTranslations[slug]?.[normalizedLocale] ?? title : title;
}

export function getAnalyticCategoryLabel(category: string) {
  switch (category) {
    case "Communicatie":
      return "Great communicator";
    case "Creativiteit":
      return "Most creative";
    case "Competentie":
      return "Strong competence builder";
    case "Collegialiteit":
      return "Great teammate";
    default:
      return "Recognized strength";
  }
}

export function mapCardLibraryRowToCard(row: CardLibraryRow): GethCard {
  return {
    id: row.card_number,
    cardNumber: row.card_number,
    title: cleanText(row.title),
    category: cleanText(row.category),
    description: cleanText(row.description),
    recognitionSentence: cleanText(row.recognition_sentence),
    slug: row.qr_slug,
    active: row.active
  };
}
