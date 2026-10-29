import { QuestionType } from "@prisma/client";

export interface QuestionTemplate {
  questionType: QuestionType;
  promptText: string;
  pedagogicalGoal: string;
  contextHint?: string;
  difficultyScore: number;
}

export const QUESTION_BANK_BY_LEVEL: Record<string, QuestionTemplate[]> = {
  A1: [
    {
      questionType: QuestionType.CONVERSATION_PROMPT,
      promptText: "Introduce yourself. Tell me your name, where you are from, and what you do.",
      pedagogicalGoal: "Basic self-introduction and present simple 'to be'",
      contextHint: "Use: 'My name is...', 'I am from...', 'I work as... / I am a student.'",
      difficultyScore: 1.0,
    },
    {
      questionType: QuestionType.SENTENCE_REPETITION,
      promptText: "I usually drink coffee with milk every morning before work.",
      pedagogicalGoal: "Basic pronunciation rhythm and common daily routine vocabulary",
      contextHint: "Pronounce 'usually' and 'coffee' clearly.",
      difficultyScore: 1.1,
    },
    {
      questionType: QuestionType.GRAMMAR_REPAIR,
      promptText: "Fix the mistake in this sentence: 'He have two brothers and one sister.'",
      pedagogicalGoal: "Third-person singular subject-verb agreement (has vs have)",
      contextHint: "Think about 'he/she/it' with the verb 'to have'.",
      difficultyScore: 1.0,
    },
    {
      questionType: QuestionType.READING_ALOUD,
      promptText: "Welcome to our English class. Please open your book to page ten.",
      pedagogicalGoal: "Clear enunciation of classroom language and numbers",
      contextHint: "Speak slowly and clearly with natural pauses.",
      difficultyScore: 1.0,
    },
    {
      questionType: QuestionType.OPEN_SPEECH,
      promptText: "What is your favorite food, and why do you like it?",
      pedagogicalGoal: "Expressing simple personal preferences with 'because'",
      contextHint: "Example: 'My favorite food is pizza because it is delicious.'",
      difficultyScore: 1.2,
    },
    {
      questionType: QuestionType.PICTURE_DESCRIPTION,
      promptText: "Look around your room. Describe three things you can see right now.",
      pedagogicalGoal: "Demonstrative pronouns and basic noun identification",
      contextHint: "Use 'There is a...', 'There are...', 'I can see...'",
      difficultyScore: 1.1,
    },
  ],

  A2: [
    {
      questionType: QuestionType.CONVERSATION_PROMPT,
      promptText: "What did you do last weekend? Describe two or three activities.",
      pedagogicalGoal: "Past simple regular and irregular verb usage",
      contextHint: "Use past verbs like 'went', 'visited', 'watched', 'ate'.",
      difficultyScore: 1.6,
    },
    {
      questionType: QuestionType.SENTENCE_REPETITION,
      promptText: "Although it was raining outside, we decided to go for a long walk in the park.",
      pedagogicalGoal: "Subordinating conjunctions and complex sentence rhythm",
      contextHint: "Notice the brief pause right after the comma.",
      difficultyScore: 1.8,
    },
    {
      questionType: QuestionType.GRAMMAR_REPAIR,
      promptText: "Fix the mistake in this sentence: 'She don't like drinking cold water in winter.'",
      pedagogicalGoal: "Subject-verb agreement in the negative present simple (doesn't vs don't)",
      contextHint: "Use 'doesn't' with third-person singular subjects.",
      difficultyScore: 1.5,
    },
    {
      questionType: QuestionType.READING_ALOUD,
      promptText: "Taking public transportation is often faster and cheaper than driving a car in big cities.",
      pedagogicalGoal: "Comparative adjectives and connected speech flow",
      contextHint: "Link 'faster and' smoothly.",
      difficultyScore: 1.7,
    },
    {
      questionType: QuestionType.OPEN_SPEECH,
      promptText: "Describe a city or place you would like to visit in the future and why.",
      pedagogicalGoal: "Expressing future wishes using 'would like to' or 'hope to'",
      contextHint: "Mention the location, weather, and attractions.",
      difficultyScore: 1.9,
    },
  ],

  B1: [
    {
      questionType: QuestionType.CONVERSATION_PROMPT,
      promptText: "Why is learning English important for your future career or travel plans?",
      pedagogicalGoal: "Expressing opinions, professional goals, and cause-and-effect reasoning",
      contextHint: "Use connectors such as 'in order to', 'for instance', and 'furthermore'.",
      difficultyScore: 2.3,
    },
    {
      questionType: QuestionType.SENTENCE_REPETITION,
      promptText: "If I had known about the schedule change earlier, I would have caught the morning flight.",
      pedagogicalGoal: "Third conditional structure and past participle pronunciation",
      contextHint: "Emphasize 'known' and 'morning flight'.",
      difficultyScore: 2.5,
    },
    {
      questionType: QuestionType.GRAMMAR_REPAIR,
      promptText: "Fix the mistake in this sentence: 'I am living here since five years and I love it.'",
      pedagogicalGoal: "Present perfect continuous vs present continuous with 'since' and 'for'",
      contextHint: "Think about duration with 'have been living for...'.",
      difficultyScore: 2.2,
    },
    {
      questionType: QuestionType.READING_ALOUD,
      promptText: "Clear communication is essential when collaborating on multidisciplinary projects with international teams.",
      pedagogicalGoal: "Stress patterns in multisyllabic professional vocabulary",
      contextHint: "Stress: es-SEN-tial, col-LAB-or-at-ing, in-ter-NA-tion-al.",
      difficultyScore: 2.4,
    },
    {
      questionType: QuestionType.OPEN_SPEECH,
      promptText: "Do you prefer working from home or from an office? Give two reasons for your preference.",
      pedagogicalGoal: "Structuring a persuasive argument with supporting examples",
      contextHint: "Contrast both sides using 'On the one hand... On the other hand...'",
      difficultyScore: 2.6,
    },
  ],

  B2: [
    {
      questionType: QuestionType.CONVERSATION_PROMPT,
      promptText: "Do you believe artificial intelligence will replace human jobs in the next decade? Justify your stance.",
      pedagogicalGoal: "Evaluating complex societal trends, predicting outcomes, and supporting assertions",
      contextHint: "Consider productivity gains vs structural unemployment.",
      difficultyScore: 3.2,
    },
    {
      questionType: QuestionType.SENTENCE_REPETITION,
      promptText: "Despite experiencing supply chain disruptions, the tech startup managed to exceed its quarterly revenue targets.",
      pedagogicalGoal: "Concessive clauses with 'despite' + gerund and business vocabulary",
      contextHint: "Keep the cadence steady through the introductory clause.",
      difficultyScore: 3.4,
    },
    {
      questionType: QuestionType.GRAMMAR_REPAIR,
      promptText: "Fix the mistake in this sentence: 'Despite of the strict regulations, the company failed to comply with the safety audit.'",
      pedagogicalGoal: "Prepositional syntax with 'despite' vs 'in spite of'",
      contextHint: "'Despite' takes a direct noun phrase without 'of'.",
      difficultyScore: 3.1,
    },
    {
      questionType: QuestionType.READING_ALOUD,
      promptText: "Subtle nuances in intonation and vocal inflection can completely alter the pragmatic interpretation of spoken discourse.",
      pedagogicalGoal: "Advanced academic articulation, phonetic precision, and rhythm control",
      contextHint: "Pronounce 'subtle' without the 'b' sound: /sʌt.əl/.",
      difficultyScore: 3.5,
    },
    {
      questionType: QuestionType.OPEN_SPEECH,
      promptText: "How can individuals maintain work-life balance in an era of constant smartphone connectivity?",
      pedagogicalGoal: "Proposing actionable strategies and discussing psychological well-being",
      contextHint: "Discuss digital detox, boundaries, and organizational culture.",
      difficultyScore: 3.3,
    },
  ],

  C1: [
    {
      questionType: QuestionType.CONVERSATION_PROMPT,
      promptText: "Analyze the societal and psychological implications of remote work on urban infrastructure and community cohesion.",
      pedagogicalGoal: "Sociolinguistic synthesis, abstract conceptual analysis, and sophisticated transitions",
      contextHint: "Touch on housing markets, loneliness, and revitalized suburban hubs.",
      difficultyScore: 4.2,
    },
    {
      questionType: QuestionType.SENTENCE_REPETITION,
      promptText: "Hardly had the controversial policy been implemented when unexpected geopolitical ramifications rendered it obsolete.",
      pedagogicalGoal: "Inversion after negative adverbials ('Hardly had...') and formal register",
      contextHint: "Maintain dramatic pitch shift on the inversion.",
      difficultyScore: 4.5,
    },
    {
      questionType: QuestionType.GRAMMAR_REPAIR,
      promptText: "Fix the mistake in this sentence: 'Scarcely the keynote speaker had begun when a fire alarm interrupted the presentation.'",
      pedagogicalGoal: "Negative adverbial inversion syntax ('Scarcely had the keynote speaker begun...')",
      contextHint: "Invert auxiliary verb and subject after 'Scarcely'.",
      difficultyScore: 4.0,
    },
    {
      questionType: QuestionType.READING_ALOUD,
      promptText: "The epistemological dilemma confronting contemporary researchers lies in reconciling empirical methodologies with phenomenological insights.",
      pedagogicalGoal: "High-level scholarly eloquence, breath control, and multisyllabic fluency",
      contextHint: "Carefully enunciate 'epistemological' and 'phenomenological'.",
      difficultyScore: 4.4,
    },
    {
      questionType: QuestionType.OPEN_SPEECH,
      promptText: "To what extent should governments regulate algorithms that influence democratic public discourse?",
      pedagogicalGoal: "Deliberating ethical governance, balancing freedom of speech against algorithmic polarization",
      contextHint: "Address transparency, antitrust, and freedom of expression.",
      difficultyScore: 4.3,
    },
  ],

  C2: [
    {
      questionType: QuestionType.CONVERSATION_PROMPT,
      promptText: "Critique the dialectic between technological determinism and the social construction of technological artifacts.",
      pedagogicalGoal: "Mastery of philosophical argumentation, counter-theses, and stylistic virtuosity",
      contextHint: "Synthesize both views: does technology shape society or does society shape technology?",
      difficultyScore: 4.9,
    },
    {
      questionType: QuestionType.SENTENCE_REPETITION,
      promptText: "Far from being an insurmountable impediment, the unforeseen regulatory impasse catalyzed unprecedented institutional modernization.",
      pedagogicalGoal: "Nuanced rhetorical subordination, polysyllabic vocabulary, and native-level cadence",
      contextHint: "Ensure crisp delivery of 'insurmountable impediment' and 'regulatory impasse'.",
      difficultyScore: 5.0,
    },
    {
      questionType: QuestionType.GRAMMAR_REPAIR,
      promptText: "Fix the mistake in this sentence: 'Under no circumstances members of the board should divulge proprietary deliberations without unanimous consent.'",
      pedagogicalGoal: "Strict formal inversion with negative prepositional phrase ('Under no circumstances should members...')",
      contextHint: "The modal 'should' must precede the subject.",
      difficultyScore: 4.8,
    },
    {
      questionType: QuestionType.READING_ALOUD,
      promptText: "The perennial tension between deterministic teleology and contingent human agency permeates twentieth-century historiographical discourse.",
      pedagogicalGoal: "Mastery of elevated academic prosody, complex rhythmic pacing, and intonation",
      contextHint: "Deliver with authoritative cadence and impeccable articulation.",
      difficultyScore: 4.9,
    },
    {
      questionType: QuestionType.OPEN_SPEECH,
      promptText: "Deconstruct the paradox between digital hyper-connectivity and the pervasive sense of existential alienation in contemporary society.",
      pedagogicalGoal: "High-register cultural philosophy, existential rhetoric, and eloquent rhetorical flow",
      contextHint: "Explore superficial virtual validation vs deep authentic interpersonal engagement.",
      difficultyScore: 5.0,
    },
  ],
};

export function getQuestionsForCefrLevel(level: string, count: number = 5): QuestionTemplate[] {
  const normalizedLevel = level.toUpperCase();
  const bank = QUESTION_BANK_BY_LEVEL[normalizedLevel] || QUESTION_BANK_BY_LEVEL["A2"];
  
  // Shuffle array using Fisher-Yates algorithm for varied practice
  const shuffled = [...bank];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}
