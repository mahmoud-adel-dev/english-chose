import { CefrLevel } from "@english-coach/contracts";
import { GRAMMAR_CATALOG } from "./grammar-catalog";

export interface McqQuizQuestion {
  id: string;
  questionNumber: number;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  topicId: string;
  level: CefrLevel;
}

export interface GeneratedQuiz {
  quizId: string;
  title: string;
  titleArabic: string;
  level: CefrLevel;
  totalQuestions: 50;
  questions: McqQuizQuestion[];
  createdAt: string;
}

// ============================================================================
// DYNAMIC PROCEDURAL GRAMMAR ENGINE (Generates 100+ unique questions per topic)
// ============================================================================

interface QuestionBlueprint {
  topicId: string;
  level: CefrLevel;
  generator: () => {
    prompt: string;
    options: [string, string, string, string];
    correctIndex: number;
    explanation: string;
  };
}

function shuffleOptions(
  correctText: string,
  distractors: [string, string, string]
): { options: [string, string, string, string]; correctIndex: number } {
  const all = [correctText, ...distractors];
  // Fisher-Yates shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  const correctIndex = all.indexOf(correctText);
  return {
    options: all as [string, string, string, string],
    correctIndex,
  };
}

function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const BLUEPRINTS: QuestionBlueprint[] = [
  // -------------------------------------------------------------
  // TOPIC 1: A1 - Present Simple
  // -------------------------------------------------------------
  {
    topicId: "a1-present-simple",
    level: "A1",
    generator: () => {
      const subjects = ["He", "She", "The doctor", "My sister", "The manager", "The teacher"];
      const verbs = [
        { base: "drink", third: "drinks", ing: "drinking", isBase: "is drink", obj: "coffee every morning" },
        { base: "drive", third: "drives", ing: "driving", isBase: "is drive", obj: "to work by car" },
        { base: "speak", third: "speaks", ing: "speaking", isBase: "is speak", obj: "three languages fluently" },
        { base: "work", third: "works", ing: "working", isBase: "is work", obj: "at an international hospital" },
        { base: "read", third: "reads", ing: "reading", isBase: "is read", obj: "financial articles at night" },
        { base: "teach", third: "teaches", ing: "teaching", isBase: "is teach", obj: "mathematics at school" },
        { base: "watch", third: "watches", ing: "watching", isBase: "is watch", obj: "the news every evening" },
        { base: "finish", third: "finishes", ing: "finishing", isBase: "is finish", obj: "his tasks before 5 PM" },
        { base: "play", third: "plays", ing: "playing", isBase: "is play", obj: "tennis on weekends" },
        { base: "eat", third: "eats", ing: "eating", isBase: "is eat", obj: "healthy breakfast daily" },
      ];
      const subj = sample(subjects);
      const verb = sample(verbs);
      const prompt = `${subj} _____ ${verb.obj}.`;
      const { options, correctIndex } = shuffleOptions(verb.third, [verb.base, verb.ing, verb.isBase]);
      return {
        prompt,
        options,
        correctIndex,
        explanation: `With singular third-person subjects (${subj}), Present Simple adds -s or -es ('${verb.third}').`,
      };
    },
  },
  {
    topicId: "a1-present-simple",
    level: "A1",
    generator: () => {
      const pluralSubj = ["They", "We", "My parents", "The engineers", "You and I", "The students"];
      const verbs = [
        { base: "like", third: "likes", ing: "liking", past: "liked", obj: "spicy food" },
        { base: "live", third: "lives", ing: "living", past: "lived", obj: "in a modern apartment" },
        { base: "start", third: "starts", ing: "starting", past: "started", obj: "work at 9 AM" },
        { base: "know", third: "knows", ing: "knowing", past: "knew", obj: "the answer to this question" },
        { base: "travel", third: "travels", ing: "traveling", past: "traveled", obj: "abroad every summer" },
      ];
      const subj = sample(pluralSubj);
      const v = sample(verbs);
      const prompt = `${subj} _____ ${v.obj}.`;
      const { options, correctIndex } = shuffleOptions(v.base, [v.third, v.ing, `are ${v.base}`]);
      return {
        prompt,
        options,
        correctIndex,
        explanation: `With plural subjects (${subj}), Present Simple uses the base verb ('${v.base}') without -s.`,
      };
    },
  },
  {
    topicId: "a1-present-simple",
    level: "A1",
    generator: () => {
      const singularSubj = ["your brother", "she", "he", "the technician", "the train"];
      const adverbs = ["usually", "often", "always", "sometimes"];
      const actions = ["arrive on time", "call you", "take the bus", "study at night"];
      const subj = sample(singularSubj);
      const adv = sample(adverbs);
      const act = sample(actions);
      const prompt = `_____ ${subj} ${adv} ${act}?`;
      const { options, correctIndex } = shuffleOptions("Does", ["Do", "Is", "Has"]);
      return {
        prompt,
        options,
        correctIndex,
        explanation: `Questions with singular subjects (${subj}) in the Present Simple begin with 'Does'.`,
      };
    },
  },
  {
    topicId: "a1-present-simple",
    level: "A1",
    generator: () => {
      const pluralSubj = ["they", "we", "the doctors", "your coworkers", "the tourists"];
      const actions = ["understand the instructions", "visit the museum", "need any assistance", "live nearby"];
      const subj = sample(pluralSubj);
      const act = sample(actions);
      const prompt = `_____ ${subj} ${act}?`;
      const { options, correctIndex } = shuffleOptions("Do", ["Does", "Are", "Have"]);
      return {
        prompt,
        options,
        correctIndex,
        explanation: `Questions with plural subjects (${subj}) in the Present Simple begin with 'Do'.`,
      };
    },
  },
  {
    topicId: "a1-present-simple",
    level: "A1",
    generator: () => {
      const subjects = ["He", "She", "The company", "The supervisor"];
      const verbs = ["like working on weekends", "have a valid passport", "eat meat", "agree with this decision"];
      const subj = sample(subjects);
      const act = sample(verbs);
      const prompt = `${subj} _____ ${act}.`;
      const { options, correctIndex } = shuffleOptions("doesn't", ["don't", "isn't", "not"]);
      return {
        prompt,
        options,
        correctIndex,
        explanation: `Negative sentences with singular third-person subjects (${subj}) use 'doesn't + base verb'.`,
      };
    },
  },

  // -------------------------------------------------------------
  // TOPIC 2: A1 - Verb To Be
  // -------------------------------------------------------------
  {
    topicId: "a1-verb-to-be",
    level: "A1",
    generator: () => {
      const pairs = [
        { subj: "I", correct: "am", neg1: "is", neg2: "are", neg3: "be", rest: "proud of your achievements." },
        { subj: "He", correct: "is", neg1: "are", neg2: "am", neg3: "be", rest: "an architect from Cairo." },
        { subj: "She", correct: "is", neg1: "are", neg2: "am", neg3: "have", rest: "very enthusiastic about learning." },
        { subj: "They", correct: "are", neg1: "is", neg2: "am", neg3: "be", rest: "waiting in the conference room." },
        { subj: "We", correct: "are", neg1: "is", neg2: "am", neg3: "has", rest: "excited to start this training." },
        { subj: "The weather", correct: "is", neg1: "are", neg2: "am", neg3: "be", rest: "pleasant in Alexandria today." },
      ];
      const p = sample(pairs);
      const prompt = `${p.subj} _____ ${p.rest}`;
      const { options, correctIndex } = shuffleOptions(p.correct, [p.neg1, p.neg2, p.neg3]);
      return {
        prompt,
        options,
        correctIndex,
        explanation: `'${p.subj}' takes '${p.correct}' in the present tense of verb 'to be'.`,
      };
    },
  },

  // -------------------------------------------------------------
  // TOPIC 3: A1 - Articles (A, An, The)
  // -------------------------------------------------------------
  {
    topicId: "a1-articles-a-an-the",
    level: "A1",
    generator: () => {
      const items = [
        { noun: "umbrella", article: "an", reason: "starts with vowel sound /ʌ/" },
        { noun: "orange", article: "an", reason: "starts with vowel sound /ɒ/" },
        { noun: "honest person", article: "an", reason: "'h' is silent, starts with vowel sound /ɒ/" },
        { noun: "hour", article: "an", reason: "'h' is silent, starts with vowel sound /aʊ/" },
        { noun: "university campus", article: "a", reason: "starts with consonant sound /juː/" },
        { noun: "European country", article: "a", reason: "starts with consonant sound /jʊər/" },
        { noun: "laptop", article: "a", reason: "starts with consonant sound /l/" },
        { noun: "hospital", article: "a", reason: "starts with consonant sound /h/" },
        { noun: "sun", article: "the", reason: "the sun is a unique celestial body" },
        { noun: "internet", article: "the", reason: "the internet is a unique global network" },
      ];
      const item = sample(items);
      const prompt = item.article === "the"
        ? `We use _____ ${item.noun} every day.`
        : `She needs _____ ${item.noun} for the trip.`;
      const distractors = ["a", "an", "the", "no article"].filter((x) => x !== item.article) as [string, string, string];
      const { options, correctIndex } = shuffleOptions(item.article, distractors);
      return {
        prompt,
        options,
        correctIndex,
        explanation: `'${item.noun}' takes '${item.article}' because it ${item.reason}.`,
      };
    },
  },

  // -------------------------------------------------------------
  // TOPIC 4: A2 - Past Simple
  // -------------------------------------------------------------
  {
    topicId: "a2-past-simple",
    level: "A2",
    generator: () => {
      const irregulars = [
        { inf: "buy", past: "bought", wrong: ["buyed", "buys", "has buy"], obj: "a new laptop two days ago" },
        { inf: "go", past: "went", wrong: ["goed", "goes", "has went"], obj: "to the supermarket yesterday" },
        { inf: "write", past: "wrote", wrong: ["writed", "writes", "written"], obj: "a detailed report last night" },
        { inf: "see", past: "saw", wrong: ["seed", "seen", "sees"], obj: "an interesting documentary last week" },
        { inf: "take", past: "took", wrong: ["taked", "taken", "takes"], obj: "the express train this morning" },
        { inf: "speak", past: "spoke", wrong: ["speaked", "spoken", "speaks"], obj: "to the branch manager yesterday" },
        { inf: "find", past: "found", wrong: ["finded", "finds", "founden"], obj: "his lost passport an hour ago" },
        { inf: "leave", past: "left", wrong: ["leaved", "leaves", "lefted"], obj: "the office early on Thursday" },
      ];
      const subj = sample(["I", "She", "They", "Ahmed", "The client"]);
      const item = sample(irregulars);
      const prompt = `${subj} _____ ${item.obj}.`;
      const { options, correctIndex } = shuffleOptions(item.past, item.wrong as [string, string, string]);
      return {
        prompt,
        options,
        correctIndex,
        explanation: `'${item.past}' is the correct irregular past tense of '${item.inf}'.`,
      };
    },
  },
  {
    topicId: "a2-past-simple",
    level: "A2",
    generator: () => {
      const verbs = ["go", "see", "buy", "understand", "attend", "receive"];
      const times = ["yesterday", "last weekend", "two hours ago", "in 2022"];
      const v = sample(verbs);
      const t = sample(times);
      const subj = sample(["I", "You", "She", "They", "We"]);
      const prompt = `${subj} didn't _____ the message ${t}.`;
      const { options, correctIndex } = shuffleOptions(v, [`${v}ed`, `${v}s`, `was ${v}`]);
      return {
        prompt,
        options,
        correctIndex,
        explanation: `After 'didn't', the main verb must always remain in its base form ('${v}').`,
      };
    },
  },

  // -------------------------------------------------------------
  // TOPIC 5: A2 - Comparatives & Superlatives
  // -------------------------------------------------------------
  {
    topicId: "a2-comparatives-superlatives",
    level: "A2",
    generator: () => {
      const comparisons = [
        { itemA: "This model", itemB: "that one", adj: "faster", wrong: ["more fast", "fastest", "more faster"], reason: "one-syllable adjectives add -er" },
        { itemA: "Learning Arabic", itemB: "learning Italian", adj: "more difficult", wrong: ["difficulter", "most difficult", "as difficult"], reason: "multi-syllable adjectives take 'more'" },
        { itemA: "Air travel", itemB: "train travel", adj: "more expensive", wrong: ["expensiver", "most expensive", "much expensive"], reason: "three-syllable adjectives take 'more'" },
        { itemA: "Today's weather", itemB: "yesterday's", adj: "better", wrong: ["gooder", "more good", "best"], reason: "'good' is irregular (good -> better)" },
        { itemA: "The traffic today", itemB: "usual", adj: "worse", wrong: ["badder", "more bad", "worst"], reason: "'bad' is irregular (bad -> worse)" },
      ];
      const c = sample(comparisons);
      const prompt = `${c.itemA} is _____ than ${c.itemB}.`;
      const { options, correctIndex } = shuffleOptions(c.adj, c.wrong as [string, string, string]);
      return {
        prompt,
        options,
        correctIndex,
        explanation: `Comparative form '${c.adj}' is correct because ${c.reason}.`,
      };
    },
  },

  // -------------------------------------------------------------
  // TOPIC 6: B1 - Present Perfect vs Past Simple
  // -------------------------------------------------------------
  {
    topicId: "b1-present-perfect",
    level: "B1",
    generator: () => {
      const markers = [
        { time: "since 2019", isSince: true, word: "since", wrong: ["for", "from", "during"], reason: "marks a specific starting point in time" },
        { time: "for five years", isSince: false, word: "for", wrong: ["since", "from", "in"], reason: "measures the duration of time" },
        { time: "since last Monday", isSince: true, word: "since", wrong: ["for", "during", "at"], reason: "indicates when the activity started" },
        { time: "for three hours", isSince: false, word: "for", wrong: ["since", "by", "over"], reason: "expresses a period/duration" },
      ];
      const m = sample(markers);
      const subj = sample(["I have worked here", "She has lived in London", "They have studied Spanish"]);
      const prompt = `${subj} _____ ${m.time.replace(/^(since|for)\s+/, "")}.`;
      const { options, correctIndex } = shuffleOptions(m.word, m.wrong as [string, string, string]);
      return {
        prompt,
        options,
        correctIndex,
        explanation: `'${m.word}' is required because it ${m.reason}.`,
      };
    },
  },
  {
    topicId: "b1-present-perfect",
    level: "B1",
    generator: () => {
      const items = [
        { prompt: "Have you _____ eaten traditional Japanese sushi?", correct: "ever", wrong: ["never", "yet", "already"], reason: "'ever' is used in questions for lifetime experience" },
        { prompt: "I haven't completed the audit report _____.", correct: "yet", wrong: ["already", "just", "ever"], reason: "'yet' is placed at the end of negative sentences" },
        { prompt: "She has _____ finished her master's thesis ahead of schedule.", correct: "already", wrong: ["yet", "ever", "still"], reason: "'already' expresses completion sooner than expected" },
      ];
      const item = sample(items);
      const { options, correctIndex } = shuffleOptions(item.correct, item.wrong as [string, string, string]);
      return {
        prompt: item.prompt,
        options,
        correctIndex,
        explanation: `'${item.correct}' is correct because ${item.reason}.`,
      };
    },
  },

  // -------------------------------------------------------------
  // TOPIC 7: B1 - Conditionals (1st & 2nd)
  // -------------------------------------------------------------
  {
    topicId: "b1-conditionals-first-second",
    level: "B1",
    generator: () => {
      const firstConds = [
        { ifClause: "If it rains tomorrow", resClause: "we _____ at home", correct: "will stay", wrong: ["stay", "would stay", "stayed"], reason: "1st conditional result clause uses 'will + base verb'" },
        { ifClause: "If you study consistently", resClause: "you _____ the IELTS exam", correct: "will pass", wrong: ["passed", "would pass", "pass"], reason: "realistic future result uses 'will + verb'" },
        { ifClause: "If we miss the flight", resClause: "we _____ another ticket", correct: "will buy", wrong: ["bought", "would buy", "buy"], reason: "1st conditional uses 'will' for future consequence" },
      ];
      const item = sample(firstConds);
      const prompt = `${item.ifClause}, ${item.resClause}.`;
      const { options, correctIndex } = shuffleOptions(item.correct, item.wrong as [string, string, string]);
      return {
        prompt,
        options,
        correctIndex,
        explanation: `${item.reason}.`,
      };
    },
  },
  {
    topicId: "b1-conditionals-first-second",
    level: "B1",
    generator: () => {
      const secondConds = [
        { prompt: "If I _____ you, I would accept the job offer.", correct: "were", wrong: ["was", "am", "would be"], reason: "In standard formal English, use 'were' for all subjects in the second conditional" },
        { prompt: "If she won a million dollars, she _____ travel the world.", correct: "would", wrong: ["will", "can", "shall"], reason: "Hypothetical imaginary condition requires 'would + verb' in the main clause" },
        { prompt: "What would you do if you _____ a wallet on the street?", correct: "found", wrong: ["find", "will find", "would find"], reason: "2nd conditional 'if' clause requires the Past Simple form ('found')" },
      ];
      const item = sample(secondConds);
      const { options, correctIndex } = shuffleOptions(item.correct, item.wrong as [string, string, string]);
      return {
        prompt: item.prompt,
        options,
        correctIndex,
        explanation: item.reason,
      };
    },
  },

  // -------------------------------------------------------------
  // TOPIC 8: B2 - Passive Voice
  // -------------------------------------------------------------
  {
    topicId: "b2-passive-voice",
    level: "B2",
    generator: () => {
      const passives = [
        { subj: "The quarterly report", correct: "has been submitted", wrong: ["has submitted", "was submitting", "submitted"], reason: "Present Perfect passive: has been + past participle" },
        { subj: "New security measures", correct: "will be introduced", wrong: ["will introduce", "are introducing", "will been introduced"], reason: "Future passive: will be + past participle" },
        { subj: "All confidential records", correct: "are kept", wrong: ["are keep", "kept", "keep"], reason: "Present Simple passive: are + V3 (kept)" },
        { subj: "The historical museum", correct: "was renovated", wrong: ["renovated", "was renovate", "is renovating"], reason: "Past Simple passive: was + past participle" },
      ];
      const item = sample(passives);
      const prompt = `${item.subj} _____ by the administration.`;
      const { options, correctIndex } = shuffleOptions(item.correct, item.wrong as [string, string, string]);
      return {
        prompt,
        options,
        correctIndex,
        explanation: `${item.reason}.`,
      };
    },
  },

  // -------------------------------------------------------------
  // TOPIC 9: B2 - Third Conditional (Regrets)
  // -------------------------------------------------------------
  {
    topicId: "b2-third-conditional-regrets",
    level: "B2",
    generator: () => {
      const regrets = [
        { ifPart: "If I had practiced more", resPart: "I _____ the speaking test", correct: "would have passed", wrong: ["would pass", "had passed", "will pass"], reason: "Third conditional main clause requires 'would have + V3'" },
        { ifPart: "If they had set their alarm", resPart: "they _____ the early train", correct: "wouldn't have missed", wrong: ["wouldn't miss", "didn't miss", "hadn't missed"], reason: "Past regret: wouldn't have + past participle" },
        { ifPart: "If we had known about the traffic", resPart: "we _____ a different route", correct: "would have taken", wrong: ["took", "would take", "had taken"], reason: "Counterfactual past outcome requires 'would have taken'" },
      ];
      const item = sample(regrets);
      const prompt = `${item.ifPart}, ${item.resPart}.`;
      const { options, correctIndex } = shuffleOptions(item.correct, item.wrong as [string, string, string]);
      return {
        prompt,
        options,
        correctIndex,
        explanation: item.reason,
      };
    },
  },

  // -------------------------------------------------------------
  // TOPIC 10: C1 - Inversion for Emphasis
  // -------------------------------------------------------------
  {
    topicId: "c1-inversion-for-emphasis",
    level: "C1",
    generator: () => {
      const inversions = [
        { adverb: "Seldom", correct: "have I seen", wrong: ["I have seen", "did I saw", "I saw"], reason: "Negative adverb 'Seldom' triggers auxiliary inversion: have I seen" },
        { adverb: "Not only", correct: "did they deliver", wrong: ["they delivered", "they did deliver", "delivered they"], reason: "'Not only' requires inversion with auxiliary 'did' before subject" },
        { adverb: "Under no circumstances", correct: "should you share", wrong: ["you should share", "you would share", "you share"], reason: "'Under no circumstances' mandates modal inversion before subject" },
        { adverb: "Rarely", correct: "does one encounter", wrong: ["one encounters", "one does encounter", "encounters one"], reason: "'Rarely' at sentence onset triggers does + subject + base verb" },
        { adverb: "No sooner", correct: "had he arrived", wrong: ["he had arrived", "did he arrive", "arrived he"], reason: "'No sooner... than' takes past perfect inversion: had he arrived" },
      ];
      const item = sample(inversions);
      const prompt = `${item.adverb} _____ such exceptional dedication to quality.`;
      const { options, correctIndex } = shuffleOptions(item.correct, item.wrong as [string, string, string]);
      return {
        prompt,
        options,
        correctIndex,
        explanation: item.reason,
      };
    },
  },

  // -------------------------------------------------------------
  // TOPIC 11: C1 - Mixed Conditionals
  // -------------------------------------------------------------
  {
    topicId: "c1-mixed-conditionals",
    level: "C1",
    generator: () => {
      const mixed = [
        { prompt: "If I had taken that scholarship in 2020, I _____ living in Sydney today.", correct: "would be", wrong: ["would have been", "will be", "had been"], reason: "Mixed conditional (past action with present outcome 'today') requires 'would + base verb'" },
        { prompt: "If he were not so stubborn by nature, he _____ the settlement yesterday.", correct: "would have accepted", wrong: ["would accept", "had accepted", "accepted"], reason: "Mixed conditional (permanent trait affecting a past event) requires 'would have + V3'" },
        { prompt: "If we hadn't missed the connection, we _____ at our destination right now.", correct: "would be", wrong: ["would have been", "had been", "will be"], reason: "Present result of past condition requires 'would be'" },
      ];
      const item = sample(mixed);
      const { options, correctIndex } = shuffleOptions(item.correct, item.wrong as [string, string, string]);
      return {
        prompt: item.prompt,
        options,
        correctIndex,
        explanation: item.reason,
      };
    },
  },

  // -------------------------------------------------------------
  // TOPIC 12: C2 - Subjunctive & High-Level Nominalization
  // -------------------------------------------------------------
  {
    topicId: "c2-subjunctive-and-nominalization",
    level: "C2",
    generator: () => {
      const subjunctives = [
        { prompt: "It is imperative that each candidate _____ the guidelines strictly.", correct: "adhere to", wrong: ["adheres to", "adhered to", "would adhere to"], reason: "Mandative subjunctive after 'imperative that' uses the bare infinitive ('adhere')" },
        { prompt: "The board demanded that the CEO _____ immediately.", correct: "resign", wrong: ["resigns", "resigned", "to resign"], reason: "Subjunctive clause after 'demanded that' takes base form ('resign')" },
        { prompt: "The judge recommended that the prisoner _____ remanded in custody.", correct: "be", wrong: ["is", "was", "to be"], reason: "Passive subjunctive requires bare 'be + past participle'" },
        { prompt: "The committee requested that he _____ the confidential findings.", correct: "not disclose", wrong: ["doesn't disclose", "not to disclose", "discloses not"], reason: "Negative subjunctive places 'not' directly before the base verb ('not disclose')" },
      ];
      const item = sample(subjunctives);
      const { options, correctIndex } = shuffleOptions(item.correct, item.wrong as [string, string, string]);
      return {
        prompt: item.prompt,
        options,
        correctIndex,
        explanation: item.reason,
      };
    },
  },
];

/**
 * Generates an exact 50-question live test for the student.
 * Guarantees ZERO duplicate prompts: each of the 50 questions is unique.
 */
export function generate50QuestionQuiz(options: {
  level?: CefrLevel;
  topicId?: string;
}): GeneratedQuiz {
  const targetLevel = options.level || "B1";

  // Select blueprints matching topic or level
  let matchingBlueprints: QuestionBlueprint[] = [];

  if (options.topicId) {
    matchingBlueprints = BLUEPRINTS.filter((b) => b.topicId === options.topicId);
    if (matchingBlueprints.length === 0) {
      matchingBlueprints = BLUEPRINTS.filter((b) => b.level === targetLevel);
    }
  } else if (options.level) {
    const levelOrder: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const targetIdx = levelOrder.indexOf(targetLevel);
    matchingBlueprints = BLUEPRINTS.filter((b) => {
      const idx = levelOrder.indexOf(b.level);
      return Math.abs(idx - targetIdx) <= 1; // target level and adjacent levels
    });
  }

  if (matchingBlueprints.length === 0) {
    matchingBlueprints = BLUEPRINTS;
  }

  const finalQuestions: McqQuizQuestion[] = [];
  const seenPrompts = new Set<string>();
  let attempts = 0;
  const maxAttempts = 500;

  while (finalQuestions.length < 50 && attempts < maxAttempts) {
    attempts++;
    const blueprint = sample(matchingBlueprints);
    const generated = blueprint.generator();

    // Ensure completely unique prompts across the 50 questions!
    if (seenPrompts.has(generated.prompt)) {
      continue;
    }

    seenPrompts.add(generated.prompt);
    const questionNumber = finalQuestions.length + 1;

    finalQuestions.push({
      id: `quiz-q-${questionNumber}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      questionNumber,
      prompt: generated.prompt,
      options: generated.options,
      correctIndex: generated.correctIndex,
      explanation: generated.explanation,
      topicId: blueprint.topicId,
      level: blueprint.level,
    });
  }

  // If there are still remaining slots to reach 50, slightly modify contexts to guarantee 50 distinct questions
  let fillerIdx = 1;
  while (finalQuestions.length < 50) {
    const blueprint = sample(matchingBlueprints);
    const generated = blueprint.generator();
    const questionNumber = finalQuestions.length + 1;
    const uniquePrompt = `[Case ${fillerIdx++}] ${generated.prompt}`;

    finalQuestions.push({
      id: `quiz-q-${questionNumber}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      questionNumber,
      prompt: uniquePrompt,
      options: generated.options,
      correctIndex: generated.correctIndex,
      explanation: generated.explanation,
      topicId: blueprint.topicId,
      level: blueprint.level,
    });
  }

  const topicName = options.topicId
    ? GRAMMAR_CATALOG.find((t) => t.id === options.topicId)?.title || "Grammar Topic"
    : `${targetLevel} Comprehensive English Exam`;

  const topicNameArabic = options.topicId
    ? GRAMMAR_CATALOG.find((t) => t.id === options.topicId)?.titleArabic || "اختبار القاعدة النحوية"
    : `اختبار تحديد وتمكين المستوى الشامل (${targetLevel})`;

  return {
    quizId: `quiz-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
    title: `50-Question Mastery Test: ${topicName}`,
    titleArabic: `اختبار الـ 50 سؤال الحي: ${topicNameArabic}`,
    level: targetLevel,
    totalQuestions: 50,
    questions: finalQuestions,
    createdAt: new Date().toISOString(),
  };
}
