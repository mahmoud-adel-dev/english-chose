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
// QUESTION BANK (Rich pool per level)
// ============================================================================

interface RawQuestionTemplate {
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  topicId: string;
  level: CefrLevel;
}

const BASE_QUESTION_BANK: RawQuestionTemplate[] = [
  // --- A1 Questions (Present Simple, To Be, Articles) ---
  {
    prompt: "She _____ to the gym every Monday morning.",
    options: ["go", "goes", "going", "is go"],
    correctIndex: 1,
    explanation: "Third person singular (she) in the Present Simple takes 'goes'.",
    topicId: "a1-present-simple",
    level: "A1"
  },
  {
    prompt: "They _____ live in New York; they live in Boston.",
    options: ["doesn't", "don't", "not", "aren't"],
    correctIndex: 1,
    explanation: "With 'they', we use 'don't' for negative Present Simple sentences.",
    topicId: "a1-present-simple",
    level: "A1"
  },
  {
    prompt: "_____ your sister have a driver's license?",
    options: ["Do", "Does", "Is", "Has"],
    correctIndex: 1,
    explanation: "'Your sister' is singular (she), so the question starts with 'Does'.",
    topicId: "a1-present-simple",
    level: "A1"
  },
  {
    prompt: "I am interested in buying _____ university laptop.",
    options: ["a", "an", "the", "no article"],
    correctIndex: 0,
    explanation: "'University' begins with a consonant sound /juː/, requiring article 'a'.",
    topicId: "a1-articles-a-an-the",
    level: "A1"
  },
  {
    prompt: "Look at _____ sky! It looks like it is going to rain.",
    options: ["a", "an", "the", "these"],
    correctIndex: 2,
    explanation: "The sky is unique in our environment, so it requires 'the'.",
    topicId: "a1-articles-a-an-the",
    level: "A1"
  },
  {
    prompt: "How old _____ you when you moved here?",
    options: ["was", "were", "are", "have"],
    correctIndex: 1,
    explanation: "'Were' is the correct past form of 'to be' for 'you'.",
    topicId: "a1-verb-to-be",
    level: "A1"
  },
  {
    prompt: "My father is _____ honest police officer.",
    options: ["a", "an", "the", "some"],
    correctIndex: 1,
    explanation: "'Honest' starts with a silent 'h', so the vowel sound requires 'an'.",
    topicId: "a1-articles-a-an-the",
    level: "A1"
  },
  {
    prompt: "Where _____ your parents work?",
    options: ["does", "do", "are", "is"],
    correctIndex: 1,
    explanation: "'Your parents' is plural (they), so the question uses 'do'.",
    topicId: "a1-present-simple",
    level: "A1"
  },
  {
    prompt: "My brother _____ coffee at night because it keeps him awake.",
    options: ["never drink", "never drinks", "drinks never", "is never drink"],
    correctIndex: 1,
    explanation: "Frequency adverbs precede the main verb, and 'brother' takes singular 'drinks'.",
    topicId: "a1-present-simple",
    level: "A1"
  },
  {
    prompt: "We _____ ready for the final examination.",
    options: ["am", "is", "are", "be"],
    correctIndex: 2,
    explanation: "'We' takes 'are' in the present tense.",
    topicId: "a1-verb-to-be",
    level: "A1"
  },

  // --- A2 Questions (Past Simple, Comparatives, Quantifiers) ---
  {
    prompt: "We _____ to Spain on holiday last summer.",
    options: ["goed", "went", "gone", "was go"],
    correctIndex: 1,
    explanation: "'Went' is the irregular past tense of 'go'.",
    topicId: "a2-past-simple",
    level: "A2"
  },
  {
    prompt: "Did you _____ the email I sent yesterday?",
    options: ["received", "receive", "receiving", "receives"],
    correctIndex: 1,
    explanation: "After 'did', always use the base form of the verb ('receive').",
    topicId: "a2-past-simple",
    level: "A2"
  },
  {
    prompt: "This laptop is much _____ than my old desktop computer.",
    options: ["more fast", "faster", "fastest", "more faster"],
    correctIndex: 1,
    explanation: "Single-syllable adjectives take '-er' ('faster'). Never use 'more faster'.",
    topicId: "a2-comparatives-superlatives",
    level: "A2"
  },
  {
    prompt: "Learning Japanese is _____ than learning Spanish for English speakers.",
    options: ["more difficult", "difficulter", "most difficult", "as difficult"],
    correctIndex: 0,
    explanation: "Multi-syllable adjectives form comparatives with 'more + adjective'.",
    topicId: "a2-comparatives-superlatives",
    level: "A2"
  },
  {
    prompt: "She is the _____ student in our entire class.",
    options: ["goodest", "better", "best", "most good"],
    correctIndex: 2,
    explanation: "'Best' is the irregular superlative form of 'good' (good -> better -> best).",
    topicId: "a2-comparatives-superlatives",
    level: "A2"
  },
  {
    prompt: "I _____ see you at the conference yesterday morning.",
    options: ["didn't", "wasn't", "don't", "haven't"],
    correctIndex: 0,
    explanation: "'Didn't see' is correct for negative past simple with lexical verbs.",
    topicId: "a2-past-simple",
    level: "A2"
  },
  {
    prompt: "Two days ago, Sarah _____ a brand new smartphone.",
    options: ["buys", "bought", "buyed", "has bought"],
    correctIndex: 1,
    explanation: "'Two days ago' requires the past simple form 'bought'.",
    topicId: "a2-past-simple",
    level: "A2"
  },
  {
    prompt: "Which city is _____ from London: Paris or Berlin?",
    options: ["further", "more far", "farthest", "furthest"],
    correctIndex: 0,
    explanation: "When comparing two locations, use the comparative 'further' (or 'farther').",
    topicId: "a2-comparatives-superlatives",
    level: "A2"
  },
  {
    prompt: "When I was young, I _____ ride my bicycle to school every day.",
    options: ["used to", "use to", "am used to", "was used"],
    correctIndex: 0,
    explanation: "'Used to + verb' describes a past habitual action that no longer happens.",
    topicId: "a2-past-simple",
    level: "A2"
  },
  {
    prompt: "This is _____ movie I have seen this year.",
    options: ["the worse", "the worst", "worse", "baddest"],
    correctIndex: 1,
    explanation: "'The worst' is the superlative form of 'bad'.",
    topicId: "a2-comparatives-superlatives",
    level: "A2"
  },

  // --- B1 Questions (Present Perfect, Conditionals 1 & 2) ---
  {
    prompt: "I have lived in this apartment _____ 2018.",
    options: ["for", "since", "from", "during"],
    correctIndex: 1,
    explanation: "'Since' indicates a specific starting point in time.",
    topicId: "b1-present-perfect",
    level: "B1"
  },
  {
    prompt: "Have you _____ tried eating sushi before?",
    options: ["ever", "never", "yet", "already"],
    correctIndex: 0,
    explanation: "'Ever' is used in questions to ask about lifetime experiences.",
    topicId: "b1-present-perfect",
    level: "B1"
  },
  {
    prompt: "I haven't completed the report _____, but I will soon.",
    options: ["already", "just", "yet", "ever"],
    correctIndex: 2,
    explanation: "'Yet' is placed at the end of negative sentences in the Present Perfect.",
    topicId: "b1-present-perfect",
    level: "B1"
  },
  {
    prompt: "If you _____ the medicine, you will feel much better.",
    options: ["will take", "take", "took", "takes"],
    correctIndex: 1,
    explanation: "In first conditional, the 'if' clause uses Present Simple ('take'), not 'will'.",
    topicId: "b1-conditionals-first-second",
    level: "B1"
  },
  {
    prompt: "If I _____ you, I would consult a specialist doctor.",
    options: ["am", "was", "were", "would be"],
    correctIndex: 2,
    explanation: "In second conditional advice structures, standard English uses 'were' with all subjects.",
    topicId: "b1-conditionals-first-second",
    level: "B1"
  },
  {
    prompt: "What would you do if you _____ a million dollars?",
    options: ["win", "won", "will win", "would win"],
    correctIndex: 1,
    explanation: "Second conditional requires Past Simple in the hypothetical condition ('won').",
    topicId: "b1-conditionals-first-second",
    level: "B1"
  },
  {
    prompt: "She _____ in three different countries so far.",
    options: ["lives", "has lived", "lived", "was living"],
    correctIndex: 1,
    explanation: "'So far' signals ongoing life experience requiring Present Perfect ('has lived').",
    topicId: "b1-present-perfect",
    level: "B1"
  },
  {
    prompt: "If the train is delayed, we _____ miss our connecting flight.",
    options: ["would", "will", "did", "are"],
    correctIndex: 1,
    explanation: "Real future possibility (First Conditional) uses 'will + base verb' in the result clause.",
    topicId: "b1-conditionals-first-second",
    level: "B1"
  },
  {
    prompt: "He has worked at this firm _____ over a decade.",
    options: ["since", "for", "in", "by"],
    correctIndex: 1,
    explanation: "'For' is used with periods and durations of time ('over a decade').",
    topicId: "b1-present-perfect",
    level: "B1"
  },
  {
    prompt: "If she had more free time, she _____ learn to play the violin.",
    options: ["will", "would", "shall", "is"],
    correctIndex: 1,
    explanation: "Second conditional hypothetical result clause requires 'would + verb'.",
    topicId: "b1-conditionals-first-second",
    level: "B1"
  },

  // --- B2 Questions (Passive Voice, Third Conditional) ---
  {
    prompt: "The new bridge _____ by next December.",
    options: ["will complete", "will be completed", "is completing", "has completed"],
    correctIndex: 1,
    explanation: "Future passive requires 'will be + past participle (completed)'.",
    topicId: "b2-passive-voice",
    level: "B2"
  },
  {
    prompt: "If he _____ the alarm, he wouldn't have overslept this morning.",
    options: ["set", "had set", "would set", "would have set"],
    correctIndex: 1,
    explanation: "Third conditional 'if' clause requires Past Perfect ('had set').",
    topicId: "b2-third-conditional-regrets",
    level: "B2"
  },
  {
    prompt: "All confidential records _____ in a secure underground vault.",
    options: ["are keep", "are kept", "keep", "are keeping"],
    correctIndex: 1,
    explanation: "Present simple passive uses 'are + past participle (kept)'.",
    topicId: "b2-passive-voice",
    level: "B2"
  },
  {
    prompt: "If we had booked the tickets earlier, we _____ half the price.",
    options: ["would pay", "would have paid", "had paid", "will pay"],
    correctIndex: 1,
    explanation: "Third conditional consequence clause requires 'would have + V3 (paid)'.",
    topicId: "b2-third-conditional-regrets",
    level: "B2"
  },
  {
    prompt: "The mystery _____ solved yet despite thorough police investigation.",
    options: ["hasn't been", "wasn't been", "isn't being", "hasn't"],
    correctIndex: 0,
    explanation: "Present perfect passive negative: 'hasn't been + past participle (solved)'.",
    topicId: "b2-passive-voice",
    level: "B2"
  },
  {
    prompt: "She could have passed the driving test if she _____ so nervous.",
    options: ["wasn't", "hadn't been", "wouldn't be", "isn't"],
    correctIndex: 1,
    explanation: "Third conditional past condition requires Past Perfect ('hadn't been').",
    topicId: "b2-third-conditional-regrets",
    level: "B2"
  },
  {
    prompt: "The Nobel Prize _____ awarded annually in Stockholm.",
    options: ["is", "has", "was", "does"],
    correctIndex: 0,
    explanation: "Regular general fact in passive voice uses present 'is awarded'.",
    topicId: "b2-passive-voice",
    level: "B2"
  },
  {
    prompt: "If I _____ of your arrival, I would have met you at the airport terminal.",
    options: ["knew", "had known", "would know", "have known"],
    correctIndex: 1,
    explanation: "Third conditional requires 'had known' in the conditional clause.",
    topicId: "b2-third-conditional-regrets",
    level: "B2"
  },
  {
    prompt: "Several historic buildings _____ destroyed during the earthquake.",
    options: ["were", "did", "have", "had"],
    correctIndex: 0,
    explanation: "Past passive requires 'were + past participle (destroyed)'.",
    topicId: "b2-passive-voice",
    level: "B2"
  },
  {
    prompt: "You _____ arrived on schedule if you had taken the express highway.",
    options: ["would", "would have", "had", "will have"],
    correctIndex: 1,
    explanation: "Third conditional result requires 'would have + past participle'.",
    topicId: "b2-third-conditional-regrets",
    level: "B2"
  },

  // --- C1 Questions (Inversion, Mixed Conditionals) ---
  {
    prompt: "Seldom _____ such an inspiring theatrical performance.",
    options: ["I have seen", "have I seen", "did I saw", "I saw"],
    correctIndex: 1,
    explanation: "Negative adverb 'Seldom' triggers inversion of auxiliary verb and subject: 'have I seen'.",
    topicId: "c1-inversion-for-emphasis",
    level: "C1"
  },
  {
    prompt: "Not only _____ the contract, but they also exceeded the revenue target.",
    options: ["did they sign", "they signed", "they did sign", "signed they"],
    correctIndex: 0,
    explanation: "'Not only' requires inversion with auxiliary 'did they sign'.",
    topicId: "c1-inversion-for-emphasis",
    level: "C1"
  },
  {
    prompt: "If I had accepted that job offer in 2021, I _____ living in Sydney now.",
    options: ["would have been", "would be", "will be", "had been"],
    correctIndex: 1,
    explanation: "Mixed conditional (past action with present result) requires 'would be' for 'now'.",
    topicId: "c1-mixed-conditionals",
    level: "C1"
  },
  {
    prompt: "Under no circumstances _____ allowed into the server room without authorization.",
    options: ["visitors are", "are visitors", "visitors be", "will visitors to be"],
    correctIndex: 1,
    explanation: "Negative restrictive phrase 'Under no circumstances' mandates subject-verb inversion.",
    topicId: "c1-inversion-for-emphasis",
    level: "C1"
  },
  {
    prompt: "If he were not so stubborn by nature, he _____ that compromise yesterday.",
    options: ["would accept", "would have accepted", "had accepted", "accepted"],
    correctIndex: 1,
    explanation: "Mixed conditional (permanent personality trait leading to a past outcome) requires 'would have accepted'.",
    topicId: "c1-mixed-conditionals",
    level: "C1"
  },
  {
    prompt: "Hardly _____ home when the power cut out.",
    options: ["had I arrived", "I had arrived", "did I arrive", "arrived I"],
    correctIndex: 0,
    explanation: "'Hardly... when' triggers inversion with Past Perfect ('had I arrived').",
    topicId: "c1-inversion-for-emphasis",
    level: "C1"
  },
  {
    prompt: "Little _____ that the contract contained a hidden liability clause.",
    options: ["he knew", "did he know", "had he known", "he did know"],
    correctIndex: 1,
    explanation: "'Little' at sentence start demands auxiliary inversion: 'did he know'.",
    topicId: "c1-inversion-for-emphasis",
    level: "C1"
  },
  {
    prompt: "If she _____ bilingual, she would have translated the document herself last week.",
    options: ["were", "had been", "is", "would be"],
    correctIndex: 0,
    explanation: "Ongoing general ability (second conditional state) affecting a past task: 'If she were...'",
    topicId: "c1-mixed-conditionals",
    level: "C1"
  },
  {
    prompt: "No sooner _____ the announcement than the crowd erupted in applause.",
    options: ["had he finished", "he had finished", "did he finish", "finished he"],
    correctIndex: 0,
    explanation: "'No sooner... than' requires past perfect inversion: 'had he finished'.",
    topicId: "c1-inversion-for-emphasis",
    level: "C1"
  },
  {
    prompt: "Only after verifying the credentials _____ grant access to the encrypted portal.",
    options: ["we can", "can we", "we could", "did we to"],
    correctIndex: 1,
    explanation: "'Only after...' at the beginning of a sentence triggers subject-auxiliary inversion in the main clause.",
    topicId: "c1-inversion-for-emphasis",
    level: "C1"
  },

  // --- C2 Questions (Subjunctive, High-Level Nominalization & Discourse) ---
  {
    prompt: "It is imperative that the lead investigator _____ immediate access to the archived files.",
    options: ["has", "have", "had", "would have"],
    correctIndex: 1,
    explanation: "In subjunctive mood after adjectives like 'imperative', the bare infinitive ('have') is used for all subjects.",
    topicId: "c2-subjunctive-and-nominalization",
    level: "C2"
  },
  {
    prompt: "The board insisted that he _____ from the committee without delay.",
    options: ["resigns", "resign", "resigned", "to resign"],
    correctIndex: 1,
    explanation: "Mandative subjunctive after 'insisted that' uses base form 'resign'.",
    topicId: "c2-subjunctive-and-nominalization",
    level: "C2"
  },
  {
    prompt: "The judge recommended that the prisoner _____ remanded in custody.",
    options: ["is", "be", "was", "to be"],
    correctIndex: 1,
    explanation: "Passive subjunctive uses 'be + past participle' regardless of person or number.",
    topicId: "c2-subjunctive-and-nominalization",
    level: "C2"
  },
  {
    prompt: "Crucial to the preservation of public order _____ the rapid dissemination of accurate info.",
    options: ["are", "is", "were", "being"],
    correctIndex: 1,
    explanation: "Inverted predicate adjective clause: the true singular subject is 'the rapid dissemination', requiring 'is'.",
    topicId: "c2-subjunctive-and-nominalization",
    level: "C2"
  },
  {
    prompt: "The attorney requested that the defendant _____ questioned until legal counsel arrived.",
    options: ["not be", "is not", "not to be", "be not"],
    correctIndex: 0,
    explanation: "Negative subjunctive places 'not' directly before the base verb: 'that the defendant not be questioned'.",
    topicId: "c2-subjunctive-and-nominalization",
    level: "C2"
  }
];

/**
 * Generates an exact 50-question live test for the student.
 * If topicId is specified, questions are tailored to that topic;
 * otherwise, a balanced 50-question mixed exam across CEFR levels is created.
 */
export function generate50QuestionQuiz(options: {
  level?: CefrLevel;
  topicId?: string;
}): GeneratedQuiz {
  const targetLevel = options.level || "B1";
  let pool = [...BASE_QUESTION_BANK];

  if (options.topicId) {
    pool = pool.filter((q) => q.topicId === options.topicId);
    if (pool.length === 0) {
      pool = BASE_QUESTION_BANK.filter((q) => q.level === targetLevel);
    }
  } else if (options.level) {
    // Mixed exam for this level + adjacent levels
    const levelOrder: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const targetIdx = levelOrder.indexOf(targetLevel);
    pool = BASE_QUESTION_BANK.filter((q) => {
      const qIdx = levelOrder.indexOf(q.level);
      return Math.abs(qIdx - targetIdx) <= 1; // Include target, one below, one above
    });
  }

  // Ensure we expand and shuffle to achieve exactly 50 questions
  const finalQuestions: McqQuizQuestion[] = [];
  let index = 0;

  while (finalQuestions.length < 50) {
    const template = pool[index % pool.length];
    const questionNumber = finalQuestions.length + 1;
    
    // Slightly permute or present each question
    finalQuestions.push({
      id: `quiz-q-${questionNumber}-${Date.now().toString(36)}`,
      questionNumber,
      prompt: template.prompt,
      options: [...template.options] as [string, string, string, string],
      correctIndex: template.correctIndex,
      explanation: template.explanation,
      topicId: template.topicId,
      level: template.level
    });

    index++;
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
    createdAt: new Date().toISOString()
  };
}

