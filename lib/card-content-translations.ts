export type CardContentLocale = "en" | "nl";

export type CardContentLocaleFields = {
  description: string;
  recognitionSentence: string;
};

export const cardContentTranslations: Record<string, Record<CardContentLocale, CardContentLocaleFields>> = {
  "luisteraar": {
    "en": {
      "description": "You give people the space to tell their full story without interruption. Through your attention, people feel heard and taken seriously.",
      "recognitionSentence": "You listened to me today with genuine interest, without interrupting. I truly felt heard."
    },
    "nl": {
      "description": "Jij geeft mensen de ruimte om volledig hun verhaal te doen zonder te onderbreken. Door jouw aandacht voelen mensen zich gehoord en serieus.",
      "recognitionSentence": "Jij luisterde naar mij vandaag, oprecht geinteresseerd, zonder te onderbreken. Ik voelde me echt gehoord."
    }
  },
  "helder": {
    "en": {
      "description": "You translate complex situations into understandable language, tailored to the other person. You know exactly how to communicate something in the right way so it truly lands.",
      "recognitionSentence": "Thanks to your clear explanation, I understood exactly what was meant."
    },
    "nl": {
      "description": "Jij vertaalt complexe situaties naar begrijpelijke taal, afgestemd op de ander. Jij weet precies hoe je iets op de juiste manier kunt overbrengen, zodat het echt landt.",
      "recognitionSentence": "Dankzij jouw duidelijke uitleg begreep ik wat er precies bedoeld werd."
    }
  },
  "eerlijk": {
    "en": {
      "description": "You say what needs to be said in a clear and respectful way. Through your honesty, clarity emerges and others know where they stand.",
      "recognitionSentence": "I appreciate that you named it honestly. It brought clarity and helped us make a better choice."
    },
    "nl": {
      "description": "Jij benoemt wat nodig is op een duidelijke en respectvolle manier. Door jouw eerlijkheid ontstaat helderheid en weten anderen waar ze aan toe zijn.",
      "recognitionSentence": "Ik waardeer dat je het eerlijk benoemde. Dat gaf duidelijkheid en hielp ons een betere keuze maken."
    }
  },
  "verbinder": {
    "en": {
      "description": "You see what people have in common and bring them together naturally. This creates connections that strengthen both the work and the collaboration.",
      "recognitionSentence": "You bring people together who help and strengthen each other. It is second nature to you."
    },
    "nl": {
      "description": "Jij ziet wat mensen met elkaar gemeen hebben en brengt hen op een natuurlijke manier samen. Daardoor ontstaan verbindingen die het werk en de samenwerking versterken.",
      "recognitionSentence": "Jij brengt mensen bij elkaar die elkaar verder helpen en versterken. Het is je tweede natuur."
    }
  },
  "empathisch": {
    "en": {
      "description": "You sense what someone needs, even when it has not been spoken out loud. Your compassion and ability to put yourself in someone else's position make collaboration more human.",
      "recognitionSentence": "With you, I do not have to explain everything. You sense the atmosphere and understand the situation. I feel truly understood."
    },
    "nl": {
      "description": "Jij voelt aan wat iemand nodig heeft, eventueel ook zonder dat het uitgesproken wordt. Jouw medeleven en vermogen om je in een ander te verplaatsen maakt de samenwerking menselijk.",
      "recognitionSentence": "Bij jou hoef ik niets uit te leggen, jij voelt de sfeer aan en hebt begrip voor de situatie. Ik voel mij echt begrepen."
    }
  },
  "overtuigend": {
    "en": {
      "description": "You know how to bring people along with your story without forcing anything. You combine logic with feeling, which naturally creates movement.",
      "recognitionSentence": "You convinced me today not with pressure, but with insight. That allowed me to say yes wholeheartedly, and it truly felt like my own choice."
    },
    "nl": {
      "description": "Jij weet mensen mee te nemen in jouw verhaal zonder te forceren. Je combineert logica met gevoel en daardoor ontstaat beweging vanzelf.",
      "recognitionSentence": "Jij overtuigde me vandaag niet met druk, maar met inzicht. Daardoor kon ik volmondig ja zeggen waardoor het echt als mijn keuze voelde."
    }
  },
  "gastvrij": {
    "en": {
      "description": "You make people feel welcome from the very first moment. You have a natural sense of what someone needs to feel at ease.",
      "recognitionSentence": "You made me feel welcome today. That is not something to take for granted, and it makes me want to come here again."
    },
    "nl": {
      "description": "Jij zorgt ervoor dat mensen zich welkom voelen vanaf het eerste moment. Jij hebt een natuurlijk gevoel voor wat iemand nodig heeft om zich op zijn gemak te voelen.",
      "recognitionSentence": "Jij zorgde er vandaag voor dat ik me welkom voelde. Dat is niet vanzelfsprekend en zorgt ervoor dat ik hier graag naartoe kom."
    }
  },
  "inspirerend": {
    "en": {
      "description": "Through your words and energy, you give people the desire to start or keep going. After a conversation with you, more feels possible.",
      "recognitionSentence": "After our conversation, I felt renewed energy to keep going. You helped me to see that it is possible."
    },
    "nl": {
      "description": "Jij geeft mensen met jouw woorden en energie zin om dingen op te pakken of door te pakken. Na een gesprek met jou voelt er vaak meer mogelijk.",
      "recognitionSentence": "Na ons gesprek kreeg ik nieuwe energie om door te pakken. Jij liet me inzien dat het mogelijk is."
    }
  },
  "diplomatiek": {
    "en": {
      "description": "You sense when a conversation becomes difficult and know exactly which softening words to choose. As a result, you prevent situations from escalating and keep everyone involved.",
      "recognitionSentence": "The way you chose the right words kept the conversation calm and made sure everyone continued to listen."
    },
    "nl": {
      "description": "Jij voelt aan wanneer een gesprek lastig wordt en weet dan precies de juiste, verzachtende woorden te kiezen. Daardoor zorg jij dat situaties niet escaleren en iedereen betrokken blijft.",
      "recognitionSentence": "De manier waarop jij de juiste woorden koos, hield het gesprek rustig en zorgde dat iedereen bleef luisteren."
    }
  },
  "leidend": {
    "en": {
      "description": "You give clear direction without dominating. When others are uncertain, you offer practical handles and show which possibilities exist to move forward.",
      "recognitionSentence": "You gave us exactly the clarity and guidance we needed to move forward."
    },
    "nl": {
      "description": "Jij geeft helder richting zonder te overheersen. Wanneer anderen twijfelen, bied jij handvatten en laat je zien welke mogelijkheden er zijn om verder te kunnen.",
      "recognitionSentence": "Jij gaf ons precies de duidelijkheid en handvatten die we nodig hadden om verder te kunnen."
    }
  },
  "nieuwsgierig": {
    "en": {
      "description": "You want to understand every side of a story. Through your questions, depth emerges and people gain a more complete picture of what is going on.",
      "recognitionSentence": "Your questions made me look further than I would have on my own. Only then did I truly understand the situation."
    },
    "nl": {
      "description": "Jij wilt graag alle kanten van een verhaal begrijpen. Door jouw vragen ontstaat er verdieping en krijgen mensen een completer beeld van wat er speelt.",
      "recognitionSentence": "Jouw vragen lieten me verder kijken dan ik zelf zou zijn gegaan. Daardoor begreep ik de situatie pas echt."
    }
  },
  "enthousiast": {
    "en": {
      "description": "You bring life into a conversation. Your enthusiasm is contagious.",
      "recognitionSentence": "Every time you speak, I become enthusiastic and want to help. That is simply a gift you have."
    },
    "nl": {
      "description": "Jij brengt leven in een gesprek. Jouw enthousiasme werkt aanstekelijk.",
      "recognitionSentence": "Elke keer als jij praat, raak ik enthousiast en krijg ik zin om mee te helpen. Dat is een gave die jij gewoon hebt."
    }
  },
  "geruststeller": {
    "en": {
      "description": "You have the ability to calm people in uncertain moments. Your words and presence bring calm to those who need it.",
      "recognitionSentence": "You helped me calm down exactly when I needed it. Because of you, I feel at ease again."
    },
    "nl": {
      "description": "Jij hebt het vermogen om mensen tot rust te brengen in onzekere momenten. Jouw woorden en aanwezigheid geven kalmte aan wie dat nodig heeft.",
      "recognitionSentence": "Jij zorgde ervoor dat ik rustig werd juist toen ik het nodig had. Door jou voel ik me weer op mijn gemak."
    }
  },
  "vernieuwend": {
    "en": {
      "description": "You think outside the box. Your ideas open windows that others had not yet seen. You bring a fresh, innovative view of what could be possible.",
      "recognitionSentence": "Your idea brought exactly the fresh perspective we needed, and it truly delivered something valuable."
    },
    "nl": {
      "description": "Jij denkt out of the box. Jouw ideeen openen vensters die anderen nog niet zagen. Jij geeft een frisse, innovatieve blik op wat er mogelijk kan zijn.",
      "recognitionSentence": "Jouw idee bracht precies de frisse blik die nodig was, dat heeft echt iets opgeleverd."
    }
  },
  "avontuurlijk": {
    "en": {
      "description": "You embrace the unknown. Where others become cautious, you see an opportunity. Your willingness to take risks opens new paths for the whole team.",
      "recognitionSentence": "You dared to take a step today that we all found exciting. Thanks to you, we are moving forward."
    },
    "nl": {
      "description": "Jij omarmt het onbekende. Waar anderen voorzichtig worden, zie jij een kans. Jouw bereidheid om risico te nemen opent nieuwe wegen voor het hele team.",
      "recognitionSentence": "Jij durfde vandaag een stap te zetten die wij allemaal spannend vonden. Dankzij jou komen we verder."
    }
  },
  "humor": {
    "en": {
      "description": "You bring joy, lightness and positivity into situations that risk getting stuck. Thanks to your humor, it feels good to take part.",
      "recognitionSentence": "Your humor immediately made everything feel lighter and gave the group positive energy again."
    },
    "nl": {
      "description": "Jij brengt plezier, luchtigheid en positiviteit in wat dreigt vast te lopen. Dankzij jouw humor voelt het prettig om mee te doen.",
      "recognitionSentence": "Jij bracht precies de energie die nodig was om het prettig te laten voelen en dat voelde ik direct."
    }
  },
  "visionair": {
    "en": {
      "description": "You can picture what may be possible in the long term and give direction to it. In doing so, you help others look beyond today.",
      "recognitionSentence": "You showed me where we could stand in the future. That suddenly made it concrete and tangible."
    },
    "nl": {
      "description": "Jij ziet voor je wat er mogelijk is op langere termijn en weet daar richting aan te geven. Daarmee help je anderen om verder te kijken dan vandaag.",
      "recognitionSentence": "Jij liet me zien waar we in de toekomst kunnen staan. Dat maakte het ineens concreet en tastbaar."
    }
  },
  "onderzoekend": {
    "en": {
      "description": "You ask sharp questions and uncover insights that help others make better choices.",
      "recognitionSentence": "Because you looked further than the rest and kept asking questions, you helped us make a better decision. Without you, we would have missed that."
    },
    "nl": {
      "description": "Jij stelt scherpe vragen en ontdekt inzichten die anderen helpen betere keuzes te maken.",
      "recognitionSentence": "Dat jij verder keek dan de rest en doorvroeg, hielp ons een beter besluit te nemen. Zonder jou hadden we dat gemist."
    }
  },
  "authentiek": {
    "en": {
      "description": "You are not led by what is conventional. In what you create or say, there is something uniquely yours that is recognizable and distinctive.",
      "recognitionSentence": "I immediately recognize you in what you create, do or say. You always bring something that is truly your own."
    },
    "nl": {
      "description": "Jij laat je niet leiden door wat gangbaar is. In wat jij maakt of zegt zit iets eigens dat herkenbaar en onderscheidend is.",
      "recognitionSentence": "Ik herken jou direct in wat jij maakt, doet of zegt. Jij brengt altijd iets dat echt van jou is."
    }
  },
  "opmerkzaam": {
    "en": {
      "description": "You see what others do not see, simply because of the way you look. Details, atmosphere, what is happening beneath the surface, nothing escapes you.",
      "recognitionSentence": "You noticed something today that the rest of us had missed. Thanks to you, we did not let it slip by."
    },
    "nl": {
      "description": "Jij ziet wat anderen niet zien. Puur omdat jij zo kijkt. Details, sfeer, wat er onder de oppervlakte speelt. Niets gaat aan jou voorbij.",
      "recognitionSentence": "Jij merkte vandaag iets op wat de rest had gemist. Dankzij jou hebben we het niet laten liggen."
    }
  },
  "verzorgd": {
    "en": {
      "description": "You never deliver half-finished work. What you create looks good. That sense of quality reflects on everything you touch.",
      "recognitionSentence": "What you created today radiated quality and was cared for down to the smallest detail. That is your standard."
    },
    "nl": {
      "description": "Jij levert nooit half werk. Wat jij maakt ziet er goed uit. Dat gevoel voor kwaliteit straalt af op alles wat jij aanraakt.",
      "recognitionSentence": "Wat jij vandaag maakte straalde kwaliteit uit en was tot in de puntjes verzorgd. Dat is jouw standaard."
    }
  },
  "oplosser": {
    "en": {
      "description": "You see problems as invitations to look differently. Where others get stuck, you often discover a creative way through.",
      "recognitionSentence": "You saw an opportunity where we mainly saw a problem. It is valuable that you saw that."
    },
    "nl": {
      "description": "Jij ziet problemen als uitnodigingen om anders te kijken. Waar anderen vastlopen, ontdek jij vaak een creatieve doorgang.",
      "recognitionSentence": "Jij zag een kans waar wij vooral een probleem zagen. Waardevol dat jij dat zag."
    }
  },
  "intuitief": {
    "en": {
      "description": "You dare to trust your feeling. Your intuition is not a random impulse, but a sensitivity for what is right in the moment.",
      "recognitionSentence": "You sensed flawlessly what was needed here, even before everything had been said."
    },
    "nl": {
      "description": "Jij durft te vertrouwen op je gevoel. Jouw intuitie is geen losse ingeving, maar een gevoeligheid voor wat klopt in het moment.",
      "recognitionSentence": "Je voelde feilloos aan wat hier nodig was, nog voordat alles was uitgesproken."
    }
  },
  "improvisator": {
    "en": {
      "description": "You remain calm when plans change. You turn unexpected situations into something useful.",
      "recognitionSentence": "The way you adapted so smoothly helped all of us stay calm as well."
    },
    "nl": {
      "description": "Jij blijft kalm als plannen veranderen. Jij maakt van onverwachte situaties iets bruikbaars.",
      "recognitionSentence": "Dat jij zo soepel schakelde, zorgde ervoor dat wij ook rustig konden blijven."
    }
  },
  "uitdager": {
    "en": {
      "description": "You constructively challenge the status quo. You ask the question, 'But why, actually?' And that question creates insight.",
      "recognitionSentence": "You showed me my own assumptions today. It was uncomfortable, but clarifying — exactly what I needed."
    },
    "nl": {
      "description": "Jij daagt constructief de status quo uit. Jij stelt de vraag \"maar waarom eigenlijk?\" en die vraag zorgt voor inzicht.",
      "recognitionSentence": "Jij liet me vandaag mijn eigen aannames zien. Dit was ongemakkelijk maar verhelderend en precies wat ik nodig had."
    }
  },
  "dromer": {
    "en": {
      "description": "You dare to think big. Your dreams are the seeds of the future, both for you and for others.",
      "recognitionSentence": "Your dream today gave me the courage to dare to think big as well."
    },
    "nl": {
      "description": "Jij durft groot te denken. Jouw dromen zijn de zaadjes van de toekomst voor jou en voor anderen.",
      "recognitionSentence": "Jouw droom van vandaag gaf mij moed om ook iets groots te durven denken."
    }
  },
  "doelgericht": {
    "en": {
      "description": "You know what you are working toward and keep a sharp focus on what truly matters. This helps others stay focused on the goal.",
      "recognitionSentence": "You kept us focused on the essence when we were about to drift away. Thanks to you, we kept the goal in sight."
    },
    "nl": {
      "description": "Jij weet waar je naartoe werkt en houdt scherp wat er echt toe doet. Daardoor help je anderen om focus te houden op het doel.",
      "recognitionSentence": "Jij hield ons bij de kern toen wij dreigden af te dwalen. Dankzij jou hielden we het doel in zicht."
    }
  },
  "analytisch": {
    "en": {
      "description": "You see structure where others see chaos. You dissect problems with precision and quickly find the heart of the matter.",
      "recognitionSentence": "Your analysis brought calm to something that was unclear to us. Clear and direct, that gave me confidence."
    },
    "nl": {
      "description": "Jij ziet structuur waar anderen chaos zien. Jij ontleedt problemen met precisie en vindt de kern van de zaak snel.",
      "recognitionSentence": "Jouw analyse bracht rust in iets wat voor ons ondoorzichtig was. Helder en direct, dat gaf mij vertrouwen."
    }
  },
  "betrouwbaar": {
    "en": {
      "description": "You do what you say, always. Your reliability is the foundation others dare to build on.",
      "recognitionSentence": "I can build on you; that gives stability to me, to the team and to the result."
    },
    "nl": {
      "description": "Wat jij zegt, doe jij. Altijd. Jouw betrouwbaarheid is het fundament waarop anderen durven bouwen.",
      "recognitionSentence": "Ik kan op jou bouwen; dat geeft stabiliteit voor mij, voor het team en voor het resultaat."
    }
  },
  "strategisch": {
    "en": {
      "description": "You think three steps ahead. You see patterns and opportunities that others do not yet see, and you provide insights that hold true in the long term.",
      "recognitionSentence": "Today, you saw what this decision will mean two years from now."
    },
    "nl": {
      "description": "Jij denkt drie stappen vooruit. Jij ziet patronen en kansen die anderen nog niet zien, en geeft inzichten die op lange termijn kloppen.",
      "recognitionSentence": "Jij zag vandaag wat deze beslissing over twee jaar betekent."
    }
  },
  "nauwkeurig": {
    "en": {
      "description": "You miss nothing. Your eye for detail protects quality, even when others would already be satisfied.",
      "recognitionSentence": "You saw what we did not see. And because of that, our work became truly good."
    },
    "nl": {
      "description": "Jij mist niets. Jouw oog voor detail beschermt de kwaliteit, ook als anderen al tevreden zouden zijn.",
      "recognitionSentence": "Jij zag wat wij niet zagen. En daardoor werd ons werk echt goed."
    }
  },
  "daadkrachtig": {
    "en": {
      "description": "You move when others are still weighing things up. Through your decisiveness, momentum is created and it becomes easier for others to join in.",
      "recognitionSentence": "The fact that you simply started gave all of us the push we needed."
    },
    "nl": {
      "description": "Jij komt in beweging waar anderen nog afwegen. Door jouw daadkracht ontstaat er tempo en wordt het voor anderen makkelijker om ook mee te gaan.",
      "recognitionSentence": "Dat jij gewoon begon, gaf ons allemaal het zetje dat we nodig hadden."
    }
  },
  "leergierig": {
    "en": {
      "description": "You grow consciously. You seek feedback, embrace discomfort and turn every mistake into a step forward.",
      "recognitionSentence": "The way you handled that feedback showed me how growth happens and how you can learn from mistakes."
    },
    "nl": {
      "description": "Jij groeit bewust. Jij zoekt feedback op, omarmt ongemak en maakt van elke fout een stap vooruit.",
      "recognitionSentence": "De manier waarop jij omging met die feedback liet mij zien hoe groei ontstaat en je van fouten kunt leren."
    }
  },
  "organisator": {
    "en": {
      "description": "You bring order to complexity. Your ability to structure things makes it possible for everyone to perform.",
      "recognitionSentence": "Thanks to you, everyone knew what they had to do today. That is invaluable."
    },
    "nl": {
      "description": "Jij brengt orde in complexiteit. Jouw vermogen om te structureren maakt het voor iedereen mogelijk om te presteren.",
      "recognitionSentence": "Dankzij jou wist iedereen vandaag wat hij of zij moest doen. Dat is van onschatbare waarde."
    }
  },
  "veerkrachtig": {
    "en": {
      "description": "You remain stable when things go wrong. You put setbacks into perspective and recover quickly, making them feel less like major setbacks.",
      "recognitionSentence": "The way you recovered inspired me. You showed that you do not let yourself be stopped."
    },
    "nl": {
      "description": "Jij bent stabiel als het tegenzit. Tegenslagen breng jij in perspectief en jij herpakt je snel, waardoor het niet als een grote tegenslag aanvoelt.",
      "recognitionSentence": "De manier waarop jij je herpakte, inspireerde mij. Jij liet zien dat je je niet laat stoppen."
    }
  },
  "resultaatgericht": {
    "en": {
      "description": "You keep the end goal clearly in mind. You know the difference between being busy and being productive, and you always choose what truly contributes to the goal.",
      "recognitionSentence": "You brought focus to what truly contributes. Thanks to you, we are making real progress."
    },
    "nl": {
      "description": "Jij houdt het einddoel scherp voor ogen. Jij weet het verschil tussen druk zijn en productief zijn, en kiest altijd voor wat echt bijdraagt aan het doel.",
      "recognitionSentence": "Jij bracht focus op wat echt bijdraagt. Dankzij jou maken we echte stappen."
    }
  },
  "proactief": {
    "en": {
      "description": "You do not wait. You see what is needed before others notice it, and you act before being asked.",
      "recognitionSentence": "You had already arranged this before I had even thought of it. That brings peace of mind."
    },
    "nl": {
      "description": "Jij wacht niet af. Jij ziet wat er nodig is voordat anderen het opmerken, en handelt al voordat er gevraagd wordt.",
      "recognitionSentence": "Jij had dit al geregeld voor ik er uberhaupt aan had gedacht. Dat geeft rust."
    }
  },
  "besluitvaardig": {
    "en": {
      "description": "You make decisions, even when not everything is clear. You know that not deciding can also be a choice, and you take responsibility for your choice.",
      "recognitionSentence": "You made a decision while we were still hesitating. Thanks to you, we could move forward."
    },
    "nl": {
      "description": "Jij neemt beslissingen, ook als niet alles duidelijk is. Jij weet dat niet beslissen ook een keuze kan zijn en neemt verantwoordelijkheid voor je keuze.",
      "recognitionSentence": "Jij nam een besluit toen wij bleven twijfelen. Dankzij jou konden we verder."
    }
  },
  "kritisch": {
    "en": {
      "description": "You do not simply accept what is placed in front of you. Your critical eye protects quality and brings out the best.",
      "recognitionSentence": "Because you dared to ask, we gained insight in time. Without you, we would have missed that."
    },
    "nl": {
      "description": "Jij accepteert niet zomaar wat voor je wordt neergelegd. Jouw kritische blik beschermt de kwaliteit en zorgt dat het beste naar boven komt.",
      "recognitionSentence": "Doordat jij durfde te vragen, kwamen we op tijd tot inzicht. Zonder jou hadden we dat gemist."
    }
  },
  "zorgzaam": {
    "en": {
      "description": "You pay attention to people, not out of obligation, but out of genuine care. You notice when things are not going well before someone has said it themselves.",
      "recognitionSentence": "Thanks to your care, I felt seen at a moment when I really needed it."
    },
    "nl": {
      "description": "Jij let op mensen, niet vanuit plicht, maar vanuit echte aandacht. Jij merkt op wanneer het minder goed gaat, voordat iemand het zelf heeft gezegd.",
      "recognitionSentence": "Dankzij jouw zorgzaamheid voelde ik me gezien op een moment dat ik dat hard nodig had."
    }
  },
  "loyaal": {
    "en": {
      "description": "You stand by the people around you, especially when things become difficult. You do not abandon people when times are tough, but choose loyalty, trust and genuine connection.",
      "recognitionSentence": "That you were there, even when it was difficult, means more than you know. Your loyalty gave me trust, stability and the certainty that I can count on you."
    },
    "nl": {
      "description": "Jij blijft staan voor de mensen om je heen, juist wanneer het moeilijk wordt. Je verlaat mensen niet wanneer het tegenzit, maar kiest voor trouw, vertrouwen en echte verbondenheid.",
      "recognitionSentence": "Dat jij er was, ook toen het moeilijk was, betekent meer dan jij weet. Jouw loyaliteit gaf mij vertrouwen, stabiliteit en de zekerheid dat ik op je kan bouwen."
    }
  },
  "teamspeler": {
    "en": {
      "description": "You put the team's interest first. You share credit, support others and contribute to the shared goal.",
      "recognitionSentence": "You kept the team strong today without needing to be in the foreground. Precisely because of that, everyone could perform better."
    },
    "nl": {
      "description": "Jij plaatst het belang van het team voorop. Jij deelt credits, ondersteunt anderen en draagt bij aan het gezamenlijk doel.",
      "recognitionSentence": "Jij hield vandaag het team sterk zonder zelf op de voorgrond te hoeven staan. Juist daardoor kon iedereen beter presteren."
    }
  },
  "vertrouwenspersoon": {
    "en": {
      "description": "People choose you when they need to share something confidential. You protect that trust carefully and discreetly.",
      "recognitionSentence": "I can tell you things I do not tell anyone else. That trust is not something to take for granted, and I am glad you are here."
    },
    "nl": {
      "description": "Mensen kiezen jou als ze iets vertrouwelijks moeten delen. Jij bewaart dat vertrouwen zorgvuldig en discreet.",
      "recognitionSentence": "Ik kan jou dingen vertellen die ik niemand anders vertel. Dat vertrouwen is niet vanzelfsprekend en ik ben blij dat jij er bent."
    }
  },
  "ondersteunend": {
    "en": {
      "description": "You are there for others when it counts. You help and offer support when they truly need it.",
      "recognitionSentence": "You were there for me, and that was exactly enough. You gave me calm and confidence when I needed it."
    },
    "nl": {
      "description": "Jij bent er voor anderen op het moment dat het telt. Jij helpt en geeft steun wanneer ze dat echt nodig hebben.",
      "recognitionSentence": "Jij was er voor mij, dat was precies genoeg. Jij gaf me rust en vertrouwen toen ik het nodig had."
    }
  },
  "respectvol": {
    "en": {
      "description": "You respect the boundaries, pace and perspectives of others. You do not impose, but create space so the other person can be themselves.",
      "recognitionSentence": "You gave me the space today to contribute in my own way. That felt like genuine collaboration."
    },
    "nl": {
      "description": "Jij respecteert de grenzen, het tempo en de perspectieven van anderen. Jij legt niets op, maar schept ruimte zodat de ander zichzelf kan zijn.",
      "recognitionSentence": "Jij gaf mij vandaag de ruimte om op mijn eigen manier bij te dragen. Dat voelde als oprechte samenwerking."
    }
  },
  "dankbaar": {
    "en": {
      "description": "You see what others contribute and say it out loud. You let people know that their contribution matters, and that changes the atmosphere.",
      "recognitionSentence": "I appreciate that you said that out loud today. It gives me energy to keep going."
    },
    "nl": {
      "description": "Jij ziet wat anderen bijdragen en spreekt dat uit. Jij laat mensen weten dat hun bijdrage telt, en dat verandert de sfeer.",
      "recognitionSentence": "Dat jij dat vandaag hardop zei, waardeer ik. Het geeft me energie om door te gaan."
    }
  },
  "inclusief": {
    "en": {
      "description": "You make sure no one is left out. You bring quiet voices forward and create space for those who normally do not get space.",
      "recognitionSentence": "You made sure today that I belonged too. That gives me a sense of equality and of contributing something meaningful."
    },
    "nl": {
      "description": "Jij zorgt ervoor dat niemand buitengesloten wordt. Jij trekt stille stemmen naar voren en maakt ruimte voor wie normaal geen ruimte krijgt.",
      "recognitionSentence": "Jij zorgde er vandaag voor dat ik er ook bij hoorde. Dat geeft me het gevoel van gelijkwaardigheid en dat ik iets bijdraag."
    }
  },
  "geduldig": {
    "en": {
      "description": "You give people the time they need. You do not force a pace that does not suit them, and that makes collaboration feel safe.",
      "recognitionSentence": "Because you gave me time without impatience, the pressure disappeared. That allowed me to show what I am capable of."
    },
    "nl": {
      "description": "Jij geeft mensen de tijd die ze nodig hebben. Jij dwingt geen tempo op dat niet bij hen past en dat maakt samenwerken veilig.",
      "recognitionSentence": "Dat jij mij de tijd gaf zonder ongeduld, nam de druk weg. Daardoor kon ik laten zien wat ik in huis heb."
    }
  },
  "beschermend": {
    "en": {
      "description": "You stand up for others when needed. You do not allow people to be dismissed or ignored — gently, but firmly. You care for someone's well-being.",
      "recognitionSentence": "I appreciate that you stood up for me. You made sure I felt safe."
    },
    "nl": {
      "description": "Jij staat op voor anderen als dat nodig is. Jij laat niet toe dat mensen weggezet of genegeerd worden, zacht maar standvastig. Jij zorgt voor iemands welzijn.",
      "recognitionSentence": "Dat jij voor mij opkwam, waardeer ik. Jij zorgde ervoor dat ik me veilig voelde."
    }
  },
  "energiek": {
    "en": {
      "description": "You bring energy into a room. Your presence lifts the team's energy and helps us continue when others start to drop off.",
      "recognitionSentence": "Every time you are there, the atmosphere is better. That is purely your contribution. Your energy is contagious and brings enthusiasm."
    },
    "nl": {
      "description": "Jij brengt leven in een ruimte. Jouw aanwezigheid tilt de energie van het team omhoog en zorgt ervoor dat we doorgaan op het moment dat anderen afhaken.",
      "recognitionSentence": "Elke keer als jij er bent, is de sfeer beter. Dat is puur jouw bijdrage. Jouw energie werkt aanstekelijk en brengt enthousiasme."
    }
  },
  "aanwezig": {
    "en": {
      "description": "You are truly present. No half attention, no distraction you focus fully on the person in front of you.",
      "recognitionSentence": "You were fully there today, and I felt it. That makes the difference. Full attention is the best thing you can give someone."
    },
    "nl": {
      "description": "Jij bent echt aanwezig. Geen halve aandacht, geen afleiding, jij richt je volledig op de mens voor je.",
      "recognitionSentence": "Jij was er vandaag volledig, en ik voelde dat. Dat maakt het verschil. Volle aandacht is het beste wat je iemand kunt geven."
    }
  },
  "waarderend": {
    "en": {
      "description": "You see the good in people. Your appreciation is not just a compliment; it is a mirror that allows people to stand taller. You make someone's contribution visible through appreciation. This quality is the foundation for a good working environment, good employees and good results.",
      "recognitionSentence": "The fact that you appreciate my contribution makes me feel seen. It gives me strength, positivity and energy."
    },
    "nl": {
      "description": "Jij ziet het goede in mensen. Jouw waardering is geen complimentje, het is een spiegel die mensen groter laat zijn. Jij maakt iemands bijdrage zichtbaar door te waarderen. Deze kwaliteit is de basis voor een goede werkomgeving, goede medewerkers en een goed resultaat.",
      "recognitionSentence": "Dat je mijn bijdrage waardeert, geeft me het gevoel dat ik gezien word. Dit geeft me kracht, positiviteit en energie."
    }
  },
  "open-categorie": {
    "en": {
      "description": "Fill in the quality you want to appreciate:",
      "recognitionSentence": "Create your own recognition sentence:"
    },
    "nl": {
      "description": "Vul de te waarderen kwaliteit in:",
      "recognitionSentence": "Maak je eigen erkenningszin:"
    }
  }
} as Record<string, Record<CardContentLocale, CardContentLocaleFields>>;
