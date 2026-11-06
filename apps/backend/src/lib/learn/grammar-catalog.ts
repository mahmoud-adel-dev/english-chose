import { CefrLevel } from "@english-coach/contracts";

export interface GrammarExample {
  english: string;
  arabic: string;
  note?: string;
}

export interface GrammarLessonTopic {
  id: string;
  level: CefrLevel;
  title: string;
  titleArabic: string;
  summary: string;
  summaryArabic: string;
  ruleFormula: string;
  explanationEnglish: string;
  explanationArabic: string;
  examples: GrammarExample[];
  commonMistakes: {
    incorrect: string;
    correct: string;
    reason: string;
  }[];
  keyRules: string[];
}

export const GRAMMAR_CATALOG: GrammarLessonTopic[] = [
  // ==========================================
  // LEVEL A1 - BEGINNER
  // ==========================================
  {
    id: "a1-present-simple",
    level: "A1",
    title: "Present Simple (Habits & Facts)",
    titleArabic: "المضارع البسيط (العادات والحقائق)",
    summary: "Used for daily routines, permanent situations, and universal truths.",
    summaryArabic: "يُستخدم للتعبير عن العادات اليومية والحقائق العامة والثابتة.",
    ruleFormula: "Positive: Subject + Verb (+ s/es for he/she/it)\nNegative: Subject + do/does not + Base Verb\nQuestion: Do/Does + Subject + Base Verb?",
    explanationEnglish: "The Present Simple describes actions happening regularly or facts that are always true. For third person singular (he, she, it), always add -s or -es to the verb.",
    explanationArabic: "نستخدم المضارع البسيط للحديث عن أشياء نفعلها بانتظام أو حقائق علمية ثابتة. مع الضمائر (he, she, it) نضيف s أو es للفعل، وفي النفي نستخدم don't أو doesn't مع الفعل في المصدر.",
    examples: [
      { english: "I drink coffee every morning.", arabic: "أنا أشرب القهوة كل صباح." },
      { english: "She works at a hospital in London.", arabic: "هي تعمل في مستشفى في لندن." },
      { english: "Water boils at 100 degrees Celsius.", arabic: "الماء يغلي عند 100 درجة مئوية." },
      { english: "They do not like waking up early.", arabic: "هم لا يحبون الاستيقاظ مبكراً." },
      { english: "Does he speak English fluently?", arabic: "هل يتحدث الإنجليزية بطلاقة؟" }
    ],
    commonMistakes: [
      {
        incorrect: "He play football every Friday.",
        correct: "He plays football every Friday.",
        reason: "Must add -s to the verb with third person singular (He/She/It)."
      },
      {
        incorrect: "She doesn't likes fish.",
        correct: "She doesn't like fish.",
        reason: "After does/doesn't, the main verb must always be in base form (without -s)."
      }
    ],
    keyRules: [
      "Add -es after verbs ending in -ch, -sh, -ss, -x, -o (e.g., watches, goes).",
      "For verbs ending in consonant + y, change y to -ies (study -> studies).",
      "Use frequency adverbs (always, usually, often, never) before the main verb, but after verb 'to be'."
    ]
  },
  {
    id: "a1-verb-to-be",
    level: "A1",
    title: "Verb 'To Be' (am, is, are)",
    titleArabic: "فعل الكينونة (am, is, are)",
    summary: "Forms sentences describing identity, feelings, occupations, and locations.",
    summaryArabic: "يُستخدم لوصف الهوية، المشاعر، المهن، والأماكن.",
    ruleFormula: "Positive: I am | He/She/It is | You/We/They are\nNegative: Subject + am/is/are + not\nQuestion: Am/Is/Are + Subject?",
    explanationEnglish: "Verb 'to be' connects a subject to a description, profession, age, or state of being. It does not need do/does for questions or negatives.",
    explanationArabic: "فعل الكينونة يربط المبتدأ بالخبر في اللغة الإنجليزية، مثل تحديد المهنة أو العمر أو المشاعر. لا يحتاج إلى do أو does في النفي أو السؤال.",
    examples: [
      { english: "I am a dedicated student.", arabic: "أنا طالب مجتهد." },
      { english: "He is from Cairo, Egypt.", arabic: "هو من القاهرة، مصر." },
      { english: "We are excited about learning English.", arabic: "نحن متحمسون لتعلم الإنجليزية." },
      { english: "They are not at home right now.", arabic: "هم ليسوا في المنزل الآن." }
    ],
    commonMistakes: [
      {
        incorrect: "I have 25 years old.",
        correct: "I am 25 years old.",
        reason: "In English, express age with verb 'to be', not verb 'to have'."
      },
      {
        incorrect: "She is teacher.",
        correct: "She is a teacher.",
        reason: "Singular countable nouns (like professions) require the indefinite article 'a' or 'an'."
      }
    ],
    keyRules: [
      "Use 'am' only with 'I'.",
      "Use 'is' with singular nouns and he/she/it.",
      "Use 'are' with plural nouns and you/we/they."
    ]
  },
  {
    id: "a1-articles-a-an-the",
    level: "A1",
    title: "Articles: A, An & The",
    titleArabic: "أدوات التعريف والتنكير (A, An, The)",
    summary: "Mastering indefinite (a/an) and definite (the) articles.",
    summaryArabic: "إتقان أدوات النكرة (a/an) والمعرفة (the).",
    ruleFormula: "A + consonant sound (a car, a university)\nAn + vowel sound (an apple, an hour)\nThe + specific known noun",
    explanationEnglish: "Use 'a' or 'an' for non-specific singular countable nouns. Use 'the' when both speaker and listener know which specific item is being discussed.",
    explanationArabic: "نستخدم a قبل الكلمات التي تبدأ بصوت ساكن، و an قبل الكلمات التي تبدأ بصوت متحرك (a, e, i, o, u). أما the فتستخدم عند الحديث عن شيء محدد أو معروف للطرفين.",
    examples: [
      { english: "I bought a laptop yesterday. The laptop is fast.", arabic: "اشتريت حاسوباً محمولاً بالأمس. الحاسوب سريع." },
      { english: "She eats an apple after lunch.", arabic: "هي تأكل تفاحة بعد الغداء." },
      { english: "Could you close the door, please?", arabic: "هل يمكنك إغلاق الباب من فضلك؟" }
    ],
    commonMistakes: [
      {
        incorrect: "She is an university student.",
        correct: "She is a university student.",
        reason: "'University' begins with a 'y' consonant sound /juː/, so use 'a', not 'an'."
      },
      {
        incorrect: "I need a information.",
        correct: "I need information (or a piece of information).",
        reason: "'Information' is uncountable and cannot take 'a' or 'an'."
      }
    ],
    keyRules: [
      "The choice between 'a' and 'an' depends on pronunciation sound, not the written letter.",
      "Never use 'a' or 'an' with plural nouns or uncountable nouns.",
      "Use 'the' with unique things: the sun, the internet, the sky."
    ]
  },

  // ==========================================
  // LEVEL A2 - ELEMENTARY
  // ==========================================
  {
    id: "a2-past-simple",
    level: "A2",
    title: "Past Simple (Completed Actions)",
    titleArabic: "الماضي البسيط (الأفعال المنتهية)",
    summary: "Used for actions that started and finished at a specific time in the past.",
    summaryArabic: "يُستخدم للتعبير عن أحداث بدأت وانتهت في وقت محدد في الماضي.",
    ruleFormula: "Positive: Subject + Past Verb (regular: verb+ed, irregular: 2nd form)\nNegative: Subject + did not + Base Verb\nQuestion: Did + Subject + Base Verb?",
    explanationEnglish: "Past Simple expresses completed actions in the past, often marked by time indicators like yesterday, last week, ago, or in 2020.",
    explanationArabic: "يُعبر عن حدث اكتمل تماماً في الماضي مع ذكر وقت الحدوث أو فهمه من السياق. مع الأفعال المنتظمة نضيف ed، ومع الشاذة نحفظ التصريف الثاني. في النفي والسؤال نستخدم did مع الفعل في المصدر.",
    examples: [
      { english: "We visited our grandparents last weekend.", arabic: "زرنا أجدادنا في نهاية الأسبوع الماضي." },
      { english: "He bought a new car two days ago.", arabic: "هو اشترى سيارة جديدة قبل يومين." },
      { english: "I didn't watch TV last night.", arabic: "لم أشاهد التلفاز الليلة الماضية." },
      { english: "Did you finish the project on time?", arabic: "هل أنهيت المشروع في الوقت المحدد؟" }
    ],
    commonMistakes: [
      {
        incorrect: "I didn't went to the meeting.",
        correct: "I didn't go to the meeting.",
        reason: "After 'didn't', the verb must always be in base form (go, not went)."
      },
      {
        incorrect: "She goed to Paris.",
        correct: "She went to Paris.",
        reason: "'Go' is irregular; its past tense is 'went'."
      }
    ],
    keyRules: [
      "Time expressions: yesterday, ago, last month, in 2018.",
      "Regular verb spelling rules: stop -> stopped, carry -> carried.",
      "Pronunciation of -ed has 3 sounds: /t/ (walked), /d/ (played), /ɪd/ (wanted)."
    ]
  },
  {
    id: "a2-comparatives-superlatives",
    level: "A2",
    title: "Comparatives & Superlatives",
    titleArabic: "صيغ المقارنة والتفضيل",
    summary: "Comparing two items or ranking one item above all others in a group.",
    summaryArabic: "المقارنة بين شيئين أو تمييز شيء على المجموعة بأكملها.",
    ruleFormula: "Comparative: Short adj + er than | more + Long adj + than\nSuperlative: the + Short adj + est | the most + Long adj",
    explanationEnglish: "Use comparative adjectives with 'than' to compare two people or things. Use superlative adjectives with 'the' to compare three or more.",
    explanationArabic: "للصفات القصيرة نضيف er للمقارنة و est للتفضيل. للصفات الطويلة نستخدم more للمقارنة و the most للتفضيل.",
    examples: [
      { english: "My brother is taller than me.", arabic: "أخي أطول مني." },
      { english: "This phone is more expensive than that one.", arabic: "هذا الهاتف أغلى من ذاك." },
      { english: "Mount Everest is the highest mountain in the world.", arabic: "جبل إيفرست هو أعلى جبل في العالم." },
      { english: "This is the most interesting book I have ever read.", arabic: "هذا أكثر كتاب ممتع قرأته على الإطلاق." }
    ],
    commonMistakes: [
      {
        incorrect: "He is more taller than his friend.",
        correct: "He is taller than his friend.",
        reason: "Never combine 'more' with an -er adjective (double comparative)."
      },
      {
        incorrect: "She is the most good player.",
        correct: "She is the best player.",
        reason: "'Good' is irregular: good -> better -> the best."
      }
    ],
    keyRules: [
      "Irregulars: good -> better -> best, bad -> worse -> worst, far -> further -> furthest.",
      "Two-syllable adjectives ending in -y: easy -> easier -> easiest.",
      "Always include 'the' before superlative forms."
    ]
  },

  // ==========================================
  // LEVEL B1 - INTERMEDIATE
  // ==========================================
  {
    id: "b1-present-perfect",
    level: "B1",
    title: "Present Perfect vs. Past Simple",
    titleArabic: "المضارع التام مقارنة بالماضي البسيط",
    summary: "Connecting past experiences to the present moment.",
    summaryArabic: "ربط التجارب والأحداث الماضية باللحظة الحالية ونتائجها.",
    ruleFormula: "Subject + have/has + Past Participle (V3)\nSignals: just, already, yet, ever, never, since, for",
    explanationEnglish: "Present Perfect connects past actions to now, emphasizing experience, life milestones, or ongoing states without specifying a finished past time.",
    explanationArabic: "نستخدم المضارع التام عندما يهمنا أثر الفعل أو حدوثه كتجربة شخصية بدون تحديد وقت منتهٍ، أو لحدث بدأ في الماضي وما زال مستمراً (since/for). إذا ذُكر وقت محدد في الماضي نستخدم الماضي البسيط.",
    examples: [
      { english: "I have lived in Dubai for five years.", arabic: "أعيش في دبي منذ خمس سنوات (وما زلت أعيش هناك)." },
      { english: "Have you ever traveled to Japan?", arabic: "هل سافرت إلى اليابان من قبل في حياتك؟" },
      { english: "She has already finished her assignment.", arabic: "لقد أنهت واجبها بالفعل." },
      { english: "I lost my key yesterday; I cannot find it.", arabic: "فقدت مفتاحي أمس؛ لا أستطيع العثور عليه." }
    ],
    commonMistakes: [
      {
        incorrect: "I have seen that movie yesterday.",
        correct: "I saw that movie yesterday.",
        reason: "'Yesterday' is a finished past time, requiring Past Simple, not Present Perfect."
      },
      {
        incorrect: "I am knowing him for 10 years.",
        correct: "I have known him for 10 years.",
        reason: "For ongoing states starting in the past with 'for/since', use Present Perfect with stative verbs."
      }
    ],
    keyRules: [
      "'Since' marks the specific starting point (since 2015, since Monday).",
      "'For' measures the duration (for 3 hours, for 10 years).",
      "'Yet' is placed at the end of negative sentences and questions."
    ]
  },
  {
    id: "b1-conditionals-first-second",
    level: "B1",
    title: "Conditionals: 1st & 2nd (Real vs. Imaginary)",
    titleArabic: "الجمل الشرطية: الأولى والثانية (الواقعية والخيالية)",
    summary: "Expressing real future possibilities versus hypothetical/imaginary situations.",
    summaryArabic: "التعبير عن احتمالات مستقبلية واقعية مقابل مواقف افتراضية أو خيالية.",
    ruleFormula: "First: If + Present Simple, will + Base Verb\nSecond: If + Past Simple, would + Base Verb",
    explanationEnglish: "First conditional deals with realistic future conditions and outcomes. Second conditional explores imaginary, improbable, or counterfactual present/future ideas.",
    explanationArabic: "الحالة الأولى تعبر عن احتمال حقيقي وقابل للتحقق في المستقبل. الحالة الثانية تعبر عن افتراض خيالي أو غير محتمل في الوقت الحالي (لو كنت مكانك، لو ربحت مليون دولار).",
    examples: [
      { english: "If it rains tomorrow, we will stay at home.", arabic: "إذا أمطرت غداً، فسنبقى في المنزل." },
      { english: "If I won the lottery, I would travel the world.", arabic: "لو فزت باليانصيب، لسافرت حول العالم." },
      { english: "If I were you, I would take that job offer.", arabic: "لو كنت مكانك، لقبلت ذلك العرض الوظيفي." }
    ],
    commonMistakes: [
      {
        incorrect: "If I will have time, I will call you.",
        correct: "If I have time, I will call you.",
        reason: "Never use 'will' in the 'if' clause of a first conditional."
      },
      {
        incorrect: "If I was you, I would study harder.",
        correct: "If I were you, I would study harder.",
        reason: "In formal and standard English, use 'were' for all subjects in the second conditional."
      }
    ],
    keyRules: [
      "Clause order can be inverted: 'I will call you if I have time' (no comma required).",
      "In second conditional, 'would' can be replaced by 'could' or 'might' to express possibility.",
      "The past tense in the second conditional signifies social/hypothetical distance, not past time."
    ]
  },

  // ==========================================
  // LEVEL B2 - UPPER INTERMEDIATE
  // ==========================================
  {
    id: "b2-passive-voice",
    level: "B2",
    title: "Passive Voice in Professional English",
    titleArabic: "المبني للمجهول في السياق الأكاديمي والمهني",
    summary: "Focusing on the action or receiver rather than who performed it.",
    summaryArabic: "التركيز على الحدث أو النتيجة بدلاً من الفاعل.",
    ruleFormula: "Subject + [appropriate form of BE] + Past Participle (V3) (+ by Agent)",
    explanationEnglish: "Passive voice is preferred in news reports, scientific papers, and corporate correspondence to maintain objective formality or when the agent is unknown or irrelevant.",
    explanationArabic: "يُستخدم المبني للمجهول لإعطاء نبرة رسمية وموضوعية في بيئة العمل والتقارير العلمية، أو عندما يكون الفاعل مجهولاً أو غير مهم مقارنة بالنتيجة.",
    examples: [
      { english: "The quarterly report has been submitted to the executive board.", arabic: "تم تقديم التقرير ربع السنوي إلى مجلس الإدارة." },
      { english: "New cybersecurity protocols will be implemented next Monday.", arabic: "سيتم تطبيق بروتوكولات الأمن السيبراني الجديدة يوم الاثنين القادم." },
      { english: "The software was tested thoroughly before release.", arabic: "تم اختبار البرنامج بدقة قبل إطلاقه." }
    ],
    commonMistakes: [
      {
        incorrect: "The email was send this morning.",
        correct: "The email was sent this morning.",
        reason: "Must always use the past participle (V3: sent, not send)."
      },
      {
        incorrect: "The accident was happened near the station.",
        correct: "The accident happened near the station.",
        reason: "Intransitive verbs (happen, occur, arrive) cannot be put into passive voice."
      }
    ],
    keyRules: [
      "Identify the tense first, match verb 'to be' to that tense, then append V3.",
      "Include 'by + agent' only if the agent adds crucial, new information.",
      "Avoid overusing passive in everyday speech to keep communication direct."
    ]
  },
  {
    id: "b2-third-conditional-regrets",
    level: "B2",
    title: "Third Conditional & Past Regrets",
    titleArabic: "الحالة الشرطية الثالثة والندم على الماضي",
    summary: "Reflecting on past events that did not happen and their impossible outcomes.",
    summaryArabic: "التعبير عن الندم أو فرضيات لأحداث ماضية لم تقع واستحالة تغيير نتائجها.",
    ruleFormula: "If + Past Perfect (had + V3), would have + Past Participle (V3)",
    explanationEnglish: "The third conditional imagines an alternative past scenario that never occurred and reflects on its hypothetical consequences.",
    explanationArabic: "تُستخدم هذه القاعدة للتعبير عما كان يمكن أن يحدث لو تغيرت ظروف الماضي، وغالباً ما تحمل نبرة ندم أو تبرير لفرص ضائعة.",
    examples: [
      { english: "If I had practiced more, I would have passed the speaking exam.", arabic: "لو كنت قد تدربت أكثر، لكنت اجتزت اختبار المحادثة." },
      { english: "If they had left earlier, they wouldn't have missed the flight.", arabic: "لو كانوا قد غادروا مبكراً، لما فاتتهم الرحلة الجوية." },
      { english: "She could have become a doctor if she had continued her studies.", arabic: "كان بإمكانها أن تصبح طبيبة لو واصلت دراستها." }
    ],
    commonMistakes: [
      {
        incorrect: "If I would have known, I would have told you.",
        correct: "If I had known, I would have told you.",
        reason: "Never place 'would have' in the 'if' clause; use 'had + V3'."
      },
      {
        incorrect: "If he had had money, he bought a house.",
        correct: "If he had had money, he would have bought a house.",
        reason: "The main clause must contain 'would have + V3'."
      }
    ],
    keyRules: [
      "Use 'could have' for lost ability/opportunity, 'might have' for past uncertainty.",
      "'Had had' is completely grammatically correct when the main verb is 'have'.",
      "Contracted forms are frequent in speech: 'If I'd known, I'd've called.'"
    ]
  },

  // ==========================================
  // LEVEL C1 - ADVANCED
  // ==========================================
  {
    id: "c1-inversion-for-emphasis",
    level: "C1",
    title: "Inversion for Emphasis & Drama",
    titleArabic: "التقديم والتأخير (Inversion) للتوكيد والبلاغة",
    summary: "Reversing auxiliary verb and subject after negative or restrictive adverbs.",
    summaryArabic: "عكس ترتيب الفعل المساعد والفاعل بعد الظروف المنفية لإضفاء قوة وتأكيد.",
    ruleFormula: "Negative/Restrictive Adverb + Auxiliary Verb + Subject + Main Verb",
    explanationEnglish: "Inversion places negative or limiting words (seldom, rarely, hardly, not only, no sooner) at the beginning of a sentence to create rhetorical power, high formality, and emphasis.",
    explanationArabic: "عند بدء الجملة بكلمات تفيد النفي أو الندرة مثل (Never, Rarely, Scarcely, Under no circumstances)، نعكس ترتيب الفاعل والفعل المساعد تماماً كما نفعل في تكوين السؤال.",
    examples: [
      { english: "Never have I witnessed such sheer dedication.", arabic: "لم يسبق لي قط أن شاهدت مثل هذا التفاني المطلق." },
      { english: "Not only did she deliver the presentation, but she also secured the client.", arabic: "لم تكتفِ بتقديم العرض فحسب، بل حسمت الصفقة مع العميل أيضاً." },
      { english: "Seldom do we encounter professionals of this caliber.", arabic: "نادراً ما نصادف كفاءات مهنية من هذا المستوى." },
      { english: "Under no circumstances should you disclose this confidential key.", arabic: "تحت أي ظرف من الظروف لا يجوز لك الإفصاح عن هذا المفتاح السري." }
    ],
    commonMistakes: [
      {
        incorrect: "Rarely I have seen such enthusiasm.",
        correct: "Rarely have I seen such enthusiasm.",
        reason: "When a sentence starts with 'Rarely', inversion of auxiliary and subject is mandatory."
      },
      {
        incorrect: "Not only he failed, but he lied.",
        correct: "Not only did he fail, but he lied.",
        reason: "Add 'did' before the subject in the past simple inversion."
      }
    ],
    keyRules: [
      "Trigger phrases: Rarely, Barely, Scarcely... when, No sooner... than, Little did he know.",
      "The clause after 'than' or 'when' uses normal word order without inversion.",
      "Essential for achieving band 8+ in IELTS Academic writing and high CEFR C1 mastery."
    ]
  },
  {
    id: "c1-mixed-conditionals",
    level: "C1",
    title: "Mixed Conditionals (Past Cause, Present Effect)",
    titleArabic: "الجمل الشرطية المختلطة (سبب ماضٍ بنتيجة حاضرة)",
    summary: "Combining different timeframes between the condition and the consequence.",
    summaryArabic: "الربط بين أزمنة مختلفة: سبب حدث في الماضي وله أثر مباشر في الوقت الحاضر.",
    ruleFormula: "Type 1: If + Past Perfect (past condition), would + Base Verb (present result)\nType 2: If + Past Simple (present state), would have + V3 (past result)",
    explanationEnglish: "Mixed conditionals bridge past occurrences with present consequences, or ongoing general traits with specific past events.",
    explanationArabic: "تجمع هذه القاعدة بين الحالة الثانية والثالثة لتوضيح كيف أن قراراً أو حدثاً في الماضي يؤثر على واقعنا الحالي، أو كيف أن صفة دائمة لدينا غيرت مسار حدث ماضٍ.",
    examples: [
      { english: "If I had accepted the scholarship in 2020, I would be living in Canada right now.", arabic: "لو كنت قبلت المنحة في 2020، لكنت أعيش في كندا الآن." },
      { english: "If he were more fluent in English, he would have landed that international executive role.", arabic: "لو كان أكثر طلاقة في الإنجليزية (بشكل عام)، لكان قد نال ذلك المنصب القيادي الدولي." }
    ],
    commonMistakes: [
      {
        incorrect: "If I hadn't missed the flight, I would have been here now.",
        correct: "If I hadn't missed the flight, I would be here now.",
        reason: "Because the result refers to 'now', use 'would be', not 'would have been'."
      }
    ],
    keyRules: [
      "Check time markers carefully: 'yesterday' vs 'now' indicates a mixed conditional is needed.",
      "Very common in native speaker reflections and advanced business strategy discussions."
    ]
  },

  // ==========================================
  // LEVEL C2 - MASTERY & PROFICIENCY
  // ==========================================
  {
    id: "c2-subjunctive-and-nominalization",
    level: "C2",
    title: "Subjunctive Mood & Advanced Nominalization",
    titleArabic: "صيغة الاحتمال (Subjunctive) والتحويل الاسمي المتقدم",
    summary: "Formal mandates, urgent recommendations, and transforming verbs into concise abstract nouns.",
    summaryArabic: "صيغة الطلب الرسمي والإلحاح، وتحويل الأفعال إلى أسماء بأسلوب أكاديمي رفيع.",
    ruleFormula: "Subjunctive: Verb/Adj of urgency + that + Subject + Base Verb\nNominalization: Verb -> Abstract Noun (investigate -> investigation)",
    explanationEnglish: "The present subjunctive uses the bare infinitive for all persons in noun clauses expressing demand, insistence, or vital importance. Nominalization converts verbal actions into dense academic nominal phrases.",
    explanationArabic: "تُستخدم صيغة Subjunctive مع أفعال وكلمات الإلزام مثل (insist, demand, vital, essential) حيث يأتي الفعل في المصدر المجرد تماماً حتى مع he أو she. أما Nominalization فيرتقي بأسلوب الكتابة ليصبح مقتضباً ورفيعاً.",
    examples: [
      { english: "It is imperative that each participant adhere to the designated protocol.", arabic: "من المحتم أن يلتزم كل مشارك بالبروتوكول المحدد." },
      { english: "The board demanded that the chief financial officer resign immediately.", arabic: "طالب المجلس بأن يقدم المدير المالي استقالته على الفور." },
      { english: "Rapid urban development has accelerated environmental degradation.", arabic: "أدى التطور الحضري السريع إلى تسارع التدهور البيئي." }
    ],
    commonMistakes: [
      {
        incorrect: "The doctor recommended that he takes a break.",
        correct: "The doctor recommended that he take a break.",
        reason: "In the present subjunctive, the verb remains bare infinitive ('take', not 'takes')."
      }
    ],
    keyRules: [
      "Verbs triggering subjunctive: demand, insist, recommend, propose, suggest, request.",
      "Adjectives triggering subjunctive: crucial, vital, imperative, essential, necessary.",
      "Negative subjunctive: 'that he not participate' (not 'that he does not participate')."
    ]
  }
];

export function getGrammarTopicsByLevel(level?: CefrLevel): GrammarLessonTopic[] {
  if (!level) return GRAMMAR_CATALOG;
  return GRAMMAR_CATALOG.filter((t) => t.level === level);
}

export function getGrammarTopicById(id: string): GrammarLessonTopic | undefined {
  return GRAMMAR_CATALOG.find((t) => t.id === id);
}
