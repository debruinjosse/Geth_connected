export type CardCategory =
  | "Communication"
  | "Creativity"
  | "Competence"
  | "Collegiality"
  | "Open Category"
  | "Communicatie"
  | "Creativiteit"
  | "Competentie"
  | "Collegialiteit"
  | "Open kaart";

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
    "title": "Listener",
    "category": "Communication",
    "description": "You give people the space to tell their full story without interruption. Through your attention, people feel heard and taken seriously.",
    "recognitionSentence": "You listened to me today with genuine interest, without interrupting. I truly felt heard.",
    "slug": "luisteraar",
    "active": true
  },
  {
    "id": 2,
    "cardNumber": 2,
    "title": "Clear Communicator",
    "category": "Communication",
    "description": "You translate complex situations into understandable language, tailored to the other person. You know exactly how to communicate something in the right way so it truly lands.",
    "recognitionSentence": "Thanks to your clear explanation, I understood exactly what was meant.",
    "slug": "helder",
    "active": true
  },
  {
    "id": 3,
    "cardNumber": 3,
    "title": "Honest",
    "category": "Communication",
    "description": "You say what needs to be said in a clear and respectful way. Through your honesty, clarity emerges and others know where they stand.",
    "recognitionSentence": "I appreciate that you named it honestly. It brought clarity and helped us make a better choice.",
    "slug": "eerlijk",
    "active": true
  },
  {
    "id": 4,
    "cardNumber": 4,
    "title": "Uniter",
    "category": "Communication",
    "description": "You see what people have in common and bring them together naturally. This creates connections that strengthen both the work and the collaboration.",
    "recognitionSentence": "You bring people together who help and strengthen each other. It is second nature to you.",
    "slug": "verbinder",
    "active": true
  },
  {
    "id": 5,
    "cardNumber": 5,
    "title": "Empathetic",
    "category": "Communication",
    "description": "You sense what someone needs, even when it has not been spoken out loud. Your compassion and ability to put yourself in someone else's position make collaboration more human.",
    "recognitionSentence": "With you, I do not have to explain everything. You sense the atmosphere and understand the situation. I feel truly understood.",
    "slug": "empathisch",
    "active": true
  },
  {
    "id": 6,
    "cardNumber": 6,
    "title": "Persuasive",
    "category": "Communication",
    "description": "You know how to bring people along with your story without forcing anything. You combine logic with feeling, which naturally creates movement.",
    "recognitionSentence": "You convinced me today not with pressure, but with insight. That allowed me to say yes wholeheartedly, and it truly felt like my own choice.",
    "slug": "overtuigend",
    "active": true
  },
  {
    "id": 7,
    "cardNumber": 7,
    "title": "Hospitable",
    "category": "Communication",
    "description": "You make people feel welcome from the very first moment. You have a natural sense of what someone needs to feel at ease.",
    "recognitionSentence": "You made me feel welcome today. That is not something to take for granted, and it makes me want to come here again.",
    "slug": "gastvrij",
    "active": true
  },
  {
    "id": 8,
    "cardNumber": 8,
    "title": "Inspiring",
    "category": "Communication",
    "description": "Through your words and energy, you give people the desire to start or keep going. After a conversation with you, more feels possible.",
    "recognitionSentence": "After our conversation, I felt renewed energy to keep going. You helped me to see that it is possible.",
    "slug": "inspirerend",
    "active": true
  },
  {
    "id": 9,
    "cardNumber": 9,
    "title": "Diplomatic",
    "category": "Communication",
    "description": "You sense when a conversation becomes difficult and know exactly which softening words to choose. As a result, you prevent situations from escalating and keep everyone involved.",
    "recognitionSentence": "The way you chose the right words kept the conversation calm and made sure everyone continued to listen.",
    "slug": "diplomatiek",
    "active": true
  },
  {
    "id": 10,
    "cardNumber": 10,
    "title": "Guiding",
    "category": "Communication",
    "description": "You give clear direction without dominating. When others are uncertain, you offer practical handles and show which possibilities exist to move forward.",
    "recognitionSentence": "You gave us exactly the clarity and guidance we needed to move forward.",
    "slug": "leidend",
    "active": true
  },
  {
    "id": 11,
    "cardNumber": 11,
    "title": "Curious",
    "category": "Communication",
    "description": "You want to understand every side of a story. Through your questions, depth emerges and people gain a more complete picture of what is going on.",
    "recognitionSentence": "Your questions made me look further than I would have on my own. Only then did I truly understand the situation.",
    "slug": "nieuwsgierig",
    "active": true
  },
  {
    "id": 12,
    "cardNumber": 12,
    "title": "Enthusiastic",
    "category": "Communication",
    "description": "You bring life into a conversation. Your enthusiasm is contagious.",
    "recognitionSentence": "Every time you speak, I become enthusiastic and want to help. That is simply a gift you have.",
    "slug": "enthousiast",
    "active": true
  },
  {
    "id": 13,
    "cardNumber": 13,
    "title": "Trustworthy",
    "category": "Communication",
    "description": "You have the ability to calm people in uncertain moments. Your words and presence bring calm to those who need it.",
    "recognitionSentence": "You helped me calm down exactly when I needed it. Because of you, I feel at ease again.",
    "slug": "geruststeller",
    "active": true
  },
  {
    "id": 14,
    "cardNumber": 14,
    "title": "Innovative",
    "category": "Creativity",
    "description": "You think outside the box. Your ideas open windows that others had not yet seen. You bring a fresh, innovative view of what could be possible.",
    "recognitionSentence": "Your idea brought exactly the fresh perspective we needed, and it truly delivered something valuable.",
    "slug": "vernieuwend",
    "active": true
  },
  {
    "id": 15,
    "cardNumber": 15,
    "title": "Adventurous",
    "category": "Creativity",
    "description": "You embrace the unknown. Where others become cautious, you see an opportunity. Your willingness to take risks opens new paths for the whole team.",
    "recognitionSentence": "You dared to take a step today that we all found exciting. Thanks to you, we are moving forward.",
    "slug": "avontuurlijk",
    "active": true
  },
  {
    "id": 16,
    "cardNumber": 16,
    "title": "Humorous",
    "category": "Creativity",
    "description": "You bring joy, lightness and positivity into situations that risk getting stuck. Thanks to your humor, it feels good to take part.",
    "recognitionSentence": "Your humor immediately made everything feel lighter and gave the group positive energy again.",
    "slug": "humor",
    "active": true
  },
  {
    "id": 17,
    "cardNumber": 17,
    "title": "Visionary",
    "category": "Creativity",
    "description": "You can picture what may be possible in the long term and give direction to it. In doing so, you help others look beyond today.",
    "recognitionSentence": "You showed me where we could stand in the future. That suddenly made it concrete and tangible.",
    "slug": "visionair",
    "active": true
  },
  {
    "id": 18,
    "cardNumber": 18,
    "title": "Investigative",
    "category": "Creativity",
    "description": "You ask sharp questions and uncover insights that help others make better choices.",
    "recognitionSentence": "Because you looked further than the rest and kept asking questions, you helped us make a better decision. Without you, we would have missed that.",
    "slug": "onderzoekend",
    "active": true
  },
  {
    "id": 19,
    "cardNumber": 19,
    "title": "Authentic",
    "category": "Creativity",
    "description": "You are not led by what is conventional. In what you create or say, there is something uniquely yours that is recognizable and distinctive.",
    "recognitionSentence": "I immediately recognize you in what you create, do or say. You always bring something that is truly your own.",
    "slug": "authentiek",
    "active": true
  },
  {
    "id": 20,
    "cardNumber": 20,
    "title": "Observant",
    "category": "Creativity",
    "description": "You see what others do not see, simply because of the way you look. Details, atmosphere, what is happening beneath the surface, nothing escapes you.",
    "recognitionSentence": "You noticed something today that the rest of us had missed. Thanks to you, we did not let it slip by.",
    "slug": "opmerkzaam",
    "active": true
  },
  {
    "id": 21,
    "cardNumber": 21,
    "title": "Polished",
    "category": "Creativity",
    "description": "You never deliver half-finished work. What you create looks good. That sense of quality reflects on everything you touch.",
    "recognitionSentence": "What you created today radiated quality and was cared for down to the smallest detail. That is your standard.",
    "slug": "verzorgd",
    "active": true
  },
  {
    "id": 22,
    "cardNumber": 22,
    "title": "Problem Solver",
    "category": "Creativity",
    "description": "You see problems as invitations to look differently. Where others get stuck, you often discover a creative way through.",
    "recognitionSentence": "You saw an opportunity where we mainly saw a problem. It is valuable that you saw that.",
    "slug": "oplosser",
    "active": true
  },
  {
    "id": 23,
    "cardNumber": 23,
    "title": "Intuitive",
    "category": "Creativity",
    "description": "You dare to trust your feeling. Your intuition is not a random impulse, but a sensitivity for what is right in the moment.",
    "recognitionSentence": "You sensed flawlessly what was needed here, even before everything had been said.",
    "slug": "intuitief",
    "active": true
  },
  {
    "id": 24,
    "cardNumber": 24,
    "title": "Improviser",
    "category": "Creativity",
    "description": "You remain calm when plans change. You turn unexpected situations into something useful.",
    "recognitionSentence": "The way you adapted so smoothly helped all of us stay calm as well.",
    "slug": "improvisator",
    "active": true
  },
  {
    "id": 25,
    "cardNumber": 25,
    "title": "Challenger",
    "category": "Creativity",
    "description": "You constructively challenge the status quo. You ask the question, 'But why, actually?' And that question creates insight.",
    "recognitionSentence": "You showed me my own assumptions today. It was uncomfortable, but clarifying — exactly what I needed.",
    "slug": "uitdager",
    "active": true
  },
  {
    "id": 26,
    "cardNumber": 26,
    "title": "Dreamer",
    "category": "Creativity",
    "description": "You dare to think big. Your dreams are the seeds of the future, both for you and for others.",
    "recognitionSentence": "Your dream today gave me the courage to dare to think big as well.",
    "slug": "dromer",
    "active": true
  },
  {
    "id": 27,
    "cardNumber": 27,
    "title": "Goal-Oriented",
    "category": "Competence",
    "description": "You know what you are working toward and keep a sharp focus on what truly matters. This helps others stay focused on the goal.",
    "recognitionSentence": "You kept us focused on the essence when we were about to drift away. Thanks to you, we kept the goal in sight.",
    "slug": "doelgericht",
    "active": true
  },
  {
    "id": 28,
    "cardNumber": 28,
    "title": "Analytical",
    "category": "Competence",
    "description": "You see structure where others see chaos. You dissect problems with precision and quickly find the heart of the matter.",
    "recognitionSentence": "Your analysis brought calm to something that was unclear to us. Clear and direct, that gave me confidence.",
    "slug": "analytisch",
    "active": true
  },
  {
    "id": 29,
    "cardNumber": 29,
    "title": "Reliable",
    "category": "Competence",
    "description": "You do what you say, always. Your reliability is the foundation others dare to build on.",
    "recognitionSentence": "I can build on you; that gives stability to me, to the team and to the result.",
    "slug": "betrouwbaar",
    "active": true
  },
  {
    "id": 30,
    "cardNumber": 30,
    "title": "Strategic",
    "category": "Competence",
    "description": "You think three steps ahead. You see patterns and opportunities that others do not yet see, and you provide insights that hold true in the long term.",
    "recognitionSentence": "Today, you saw what this decision will mean two years from now.",
    "slug": "strategisch",
    "active": true
  },
  {
    "id": 31,
    "cardNumber": 31,
    "title": "Precise",
    "category": "Competence",
    "description": "You miss nothing. Your eye for detail protects quality, even when others would already be satisfied.",
    "recognitionSentence": "You saw what we did not see. And because of that, our work became truly good.",
    "slug": "nauwkeurig",
    "active": true
  },
  {
    "id": 32,
    "cardNumber": 32,
    "title": "Decisive in Action",
    "category": "Competence",
    "description": "You move when others are still weighing things up. Through your decisiveness, momentum is created and it becomes easier for others to join in.",
    "recognitionSentence": "The fact that you simply started gave all of us the push we needed.",
    "slug": "daadkrachtig",
    "active": true
  },
  {
    "id": 33,
    "cardNumber": 33,
    "title": "Eager to Learn",
    "category": "Competence",
    "description": "You grow consciously. You seek feedback, embrace discomfort and turn every mistake into a step forward.",
    "recognitionSentence": "The way you handled that feedback showed me how growth happens and how you can learn from mistakes.",
    "slug": "leergierig",
    "active": true
  },
  {
    "id": 34,
    "cardNumber": 34,
    "title": "Organizer",
    "category": "Competence",
    "description": "You bring order to complexity. Your ability to structure things makes it possible for everyone to perform.",
    "recognitionSentence": "Thanks to you, everyone knew what they had to do today. That is invaluable.",
    "slug": "organisator",
    "active": true
  },
  {
    "id": 35,
    "cardNumber": 35,
    "title": "Resilient",
    "category": "Competence",
    "description": "You remain stable when things go wrong. You put setbacks into perspective and recover quickly, making them feel less like major setbacks.",
    "recognitionSentence": "The way you recovered inspired me. You showed that you do not let yourself be stopped.",
    "slug": "veerkrachtig",
    "active": true
  },
  {
    "id": 36,
    "cardNumber": 36,
    "title": "Results-Oriented",
    "category": "Competence",
    "description": "You keep the end goal clearly in mind. You know the difference between being busy and being productive, and you always choose what truly contributes to the goal.",
    "recognitionSentence": "You brought focus to what truly contributes. Thanks to you, we are making real progress.",
    "slug": "resultaatgericht",
    "active": true
  },
  {
    "id": 37,
    "cardNumber": 37,
    "title": "Proactive",
    "category": "Competence",
    "description": "You do not wait. You see what is needed before others notice it, and you act before being asked.",
    "recognitionSentence": "You had already arranged this before I had even thought of it. That brings peace of mind.",
    "slug": "proactief",
    "active": true
  },
  {
    "id": 38,
    "cardNumber": 38,
    "title": "Decision-Maker",
    "category": "Competence",
    "description": "You make decisions, even when not everything is clear. You know that not deciding can also be a choice, and you take responsibility for your choice.",
    "recognitionSentence": "You made a decision while we were still hesitating. Thanks to you, we could move forward.",
    "slug": "besluitvaardig",
    "active": true
  },
  {
    "id": 39,
    "cardNumber": 39,
    "title": "Critical Thinker",
    "category": "Competence",
    "description": "You do not simply accept what is placed in front of you. Your critical eye protects quality and brings out the best.",
    "recognitionSentence": "Because you dared to ask, we gained insight in time. Without you, we would have missed that.",
    "slug": "kritisch",
    "active": true
  },
  {
    "id": 40,
    "cardNumber": 40,
    "title": "Caring",
    "category": "Collegiality",
    "description": "You pay attention to people, not out of obligation, but out of genuine care. You notice when things are not going well before someone has said it themselves.",
    "recognitionSentence": "Thanks to your care, I felt seen at a moment when I really needed it.",
    "slug": "zorgzaam",
    "active": true
  },
  {
    "id": 41,
    "cardNumber": 41,
    "title": "Loyal",
    "category": "Collegiality",
    "description": "You stand by the people around you, especially when things become difficult. You do not abandon people when times are tough, but choose loyalty, trust and genuine connection.",
    "recognitionSentence": "That you were there, even when it was difficult, means more than you know. Your loyalty gave me trust, stability and the certainty that I can count on you.",
    "slug": "loyaal",
    "active": true
  },
  {
    "id": 42,
    "cardNumber": 42,
    "title": "Team Player",
    "category": "Collegiality",
    "description": "You put the team's interest first. You share credit, support others and contribute to the shared goal.",
    "recognitionSentence": "You kept the team strong today without needing to be in the foreground. Precisely because of that, everyone could perform better.",
    "slug": "teamspeler",
    "active": true
  },
  {
    "id": 43,
    "cardNumber": 43,
    "title": "Trusted Confidant",
    "category": "Collegiality",
    "description": "People choose you when they need to share something confidential. You protect that trust carefully and discreetly.",
    "recognitionSentence": "I can tell you things I do not tell anyone else. That trust is not something to take for granted, and I am glad you are here.",
    "slug": "vertrouwenspersoon",
    "active": true
  },
  {
    "id": 44,
    "cardNumber": 44,
    "title": "Supportive",
    "category": "Collegiality",
    "description": "You are there for others when it counts. You help and offer support when they truly need it.",
    "recognitionSentence": "You were there for me, and that was exactly enough. You gave me calm and confidence when I needed it.",
    "slug": "ondersteunend",
    "active": true
  },
  {
    "id": 45,
    "cardNumber": 45,
    "title": "Respectful",
    "category": "Collegiality",
    "description": "You respect the boundaries, pace and perspectives of others. You do not impose, but create space so the other person can be themselves.",
    "recognitionSentence": "You gave me the space today to contribute in my own way. That felt like genuine collaboration.",
    "slug": "respectvol",
    "active": true
  },
  {
    "id": 46,
    "cardNumber": 46,
    "title": "Grateful",
    "category": "Collegiality",
    "description": "You see what others contribute and say it out loud. You let people know that their contribution matters, and that changes the atmosphere.",
    "recognitionSentence": "I appreciate that you said that out loud today. It gives me energy to keep going.",
    "slug": "dankbaar",
    "active": true
  },
  {
    "id": 47,
    "cardNumber": 47,
    "title": "Inclusive",
    "category": "Collegiality",
    "description": "You make sure no one is left out. You bring quiet voices forward and create space for those who normally do not get space.",
    "recognitionSentence": "You made sure today that I belonged too. That gives me a sense of equality and of contributing something meaningful.",
    "slug": "inclusief",
    "active": true
  },
  {
    "id": 48,
    "cardNumber": 48,
    "title": "Patient",
    "category": "Collegiality",
    "description": "You give people the time they need. You do not force a pace that does not suit them, and that makes collaboration feel safe.",
    "recognitionSentence": "Because you gave me time without impatience, the pressure disappeared. That allowed me to show what I am capable of.",
    "slug": "geduldig",
    "active": true
  },
  {
    "id": 49,
    "cardNumber": 49,
    "title": "Protective",
    "category": "Collegiality",
    "description": "You stand up for others when needed. You do not allow people to be dismissed or ignored — gently, but firmly. You care for someone's well-being.",
    "recognitionSentence": "I appreciate that you stood up for me. You made sure I felt safe.",
    "slug": "beschermend",
    "active": true
  },
  {
    "id": 50,
    "cardNumber": 50,
    "title": "Energetic",
    "category": "Collegiality",
    "description": "You bring energy into a room. Your presence lifts the team's energy and helps us continue when others start to drop off.",
    "recognitionSentence": "Every time you are there, the atmosphere is better. That is purely your contribution. Your energy is contagious and brings enthusiasm.",
    "slug": "energiek",
    "active": true
  },
  {
    "id": 51,
    "cardNumber": 51,
    "title": "Present",
    "category": "Collegiality",
    "description": "You are truly present. No half attention, no distraction you focus fully on the person in front of you.",
    "recognitionSentence": "You were fully there today, and I felt it. That makes the difference. Full attention is the best thing you can give someone.",
    "slug": "aanwezig",
    "active": true
  },
  {
    "id": 52,
    "cardNumber": 52,
    "title": "Appreciative",
    "category": "Collegiality",
    "description": "You see the good in people. Your appreciation is not just a compliment; it is a mirror that allows people to stand taller. You make someone's contribution visible through appreciation. This quality is the foundation for a good working environment, good employees and good results.",
    "recognitionSentence": "The fact that you appreciate my contribution makes me feel seen. It gives me strength, positivity and energy.",
    "slug": "waarderend",
    "active": true
  },
  {
    "id": 53,
    "cardNumber": 53,
    "title": "Open Card",
    "category": "Open Category",
    "description": "Fill in the quality you want to appreciate:",
    "recognitionSentence": "Create your own recognition sentence:",
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
  Communication: { label: "Communication", color: "var(--theme-emerald)" },
  Creativity: { label: "Creativity", color: "var(--theme-gold)" },
  Competence: { label: "Competence", color: "var(--theme-orange)" },
  Collegiality: { label: "Collegiality", color: "var(--theme-sky)" },
  "Open Category": { label: "Open Card", color: "var(--theme-ink)" },
  Communicatie: { label: "Communication", color: "var(--theme-emerald)" },
  Creativiteit: { label: "Creativity", color: "var(--theme-gold)" },
  Competentie: { label: "Competence", color: "var(--theme-orange)" },
  Collegialiteit: { label: "Collegiality", color: "var(--theme-sky)" },
  "Open kaart": { label: "Open Card", color: "var(--theme-ink)" }
};

const categoryLabelsByLocale: Record<SupportedCardLocale, Record<CardCategory, string>> = {
  en: {
    Communication: "Communication",
    Creativity: "Creativity",
    Competence: "Competence",
    Collegiality: "Collegiality",
    "Open Category": "Open Card",
    Communicatie: "Communication",
    Creativiteit: "Creativity",
    Competentie: "Competence",
    Collegialiteit: "Collegiality",
    "Open kaart": "Open Card"
  },
  nl: {
    Communication: "Communicatie",
    Creativity: "Creativiteit",
    Competence: "Competentie",
    Collegiality: "Collegialiteit",
    "Open Category": "Open kaart",
    Communicatie: "Communicatie",
    Creativiteit: "Creativiteit",
    Competentie: "Competentie",
    Collegialiteit: "Collegialiteit",
    "Open kaart": "Open kaart"
  },
  fr: {
    Communication: "Communication",
    Creativity: "Creativite",
    Competence: "Competence",
    Collegiality: "Esprit d'equipe",
    "Open Category": "Carte ouverte",
    Communicatie: "Communication",
    Creativiteit: "Creativite",
    Competentie: "Competence",
    Collegialiteit: "Esprit d'equipe",
    "Open kaart": "Carte ouverte"
  },
  da: {
    Communication: "Kommunikation",
    Creativity: "Kreativitet",
    Competence: "Kompetence",
    Collegiality: "Kollegialitet",
    "Open Category": "Abent kort",
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

export function getCanonicalCardBySlugOrNumber(cardNumber?: number | null, slug?: string | null) {
  const resolvedSlug = slug ? resolveCardSlug(slug) : null;
  return gethCards.find((card) => card.cardNumber === cardNumber || (resolvedSlug ? card.slug === resolvedSlug : false));
}

export function getCategoryDisplayName(category: string) {
  return categoryMeta[category as CardCategory]?.label ?? category;
}

export function getLocalizedCategoryDisplayName(category: string, locale?: string) {
  const normalizedLocale = normalizeLocale(locale);
  return categoryLabelsByLocale[normalizedLocale][category as CardCategory] ?? getCategoryDisplayName(category);
}

export function getLocalizedCardTitle(cardOrTitle: Pick<GethCard, "title"> & Partial<Pick<GethCard, "slug">> | string, locale?: string) {
  const title = typeof cardOrTitle === "string" ? cleanText(cardOrTitle) : cleanText(cardOrTitle.title);
  return title;
}

export function getAnalyticCategoryLabel(category: string) {
  switch (category) {
    case "Communication":
    case "Communicatie":
      return "Great communicator";
    case "Creativity":
    case "Creativiteit":
      return "Most creative";
    case "Competence":
    case "Competentie":
      return "Strong competence builder";
    case "Collegiality":
    case "Collegialiteit":
      return "Great teammate";
    default:
      return "Recognized strength";
  }
}

export function mapCardLibraryRowToCard(row: CardLibraryRow): GethCard {
  const canonicalCard = getCanonicalCardBySlugOrNumber(row.card_number, row.qr_slug);

  return {
    id: canonicalCard?.id ?? row.card_number,
    cardNumber: canonicalCard?.cardNumber ?? row.card_number,
    title: cleanText(row.title),
    category: cleanText(row.category),
    description: cleanText(row.description),
    recognitionSentence: cleanText(row.recognition_sentence),
    slug: canonicalCard?.slug ?? row.qr_slug,
    active: row.active
  };
}
