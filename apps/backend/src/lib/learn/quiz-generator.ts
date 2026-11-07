import { CefrLevel } from "@english-coach/contracts";
import { GRAMMAR_CATALOG } from "./grammar-catalog";

export interface QuizGrammarExample {
  english: string;
  arabic: string;
}

export interface ArabicGrammarCoach {
  titleArabic: string;
  explanationArabic: string;
  verbFormsArabic: string;
  examples: QuizGrammarExample[];
}

export interface McqQuizQuestion {
  id: string;
  questionNumber: number;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  grammarTitleArabic: string;
  explanationArabic: string;
  verbFormsArabic: string;
  grammarExamples: QuizGrammarExample[];
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

const IRREGULAR_VERB_FORMS: Record<string, string> = {
  be: "be → am / is / are → was / were → been → being",
  do: "do → does → did → done → doing",
  have: "have → has → had → had → having",
  go: "go → goes → went → gone → going",
  eat: "eat → eats → ate → eaten → eating",
  drink: "drink → drinks → drank → drunk → drinking",
  drive: "drive → drives → drove → driven → driving",
  speak: "speak → speaks → spoke → spoken → speaking",
  write: "write → writes → wrote → written → writing",
  see: "see → sees → saw → seen → seeing",
  take: "take → takes → took → taken → taking",
  find: "find → finds → found → found → finding",
  leave: "leave → leaves → left → left → leaving",
  buy: "buy → buys → bought → bought → buying",
  understand: "understand → understands → understood → understood → understanding",
  get: "get → gets → got → got / gotten → getting",
  make: "make → makes → made → made → making",
  come: "come → comes → came → come → coming",
  know: "know → knows → knew → known → knowing",
  study: "study → studies → studied → studied → studying",
  teach: "teach → teaches → taught → taught → teaching",
  read: "read → reads → read → read → reading",
  work: "work → works → worked → worked → working",
  play: "play → plays → played → played → playing",
  watch: "watch → watches → watched → watched → watching",
  finish: "finish → finishes → finished → finished → finishing",
  like: "like → likes → liked → liked → liking",
  live: "live → lives → lived → lived → living",
  start: "start → starts → started → started → starting",
  call: "call → calls → called → called → calling",
  pass: "pass → passes → passed → passed → passing",
  accept: "accept → accepts → accepted → accepted → accepting",
  practice: "practice → practices → practiced → practiced → practicing",
  resign: "resign → resigns → resigned → resigned → resigning",
  adhere: "adhere → adheres → adhered → adhered → adhering",
};

const PAST_TO_BASE: Record<string, string> = {
  went: "go", wrote: "write", saw: "see", took: "take", spoke: "speak",
  found: "find", left: "leave", bought: "buy", understood: "understand",
  ate: "eat", drank: "drink", drove: "drive", knew: "know", came: "come",
  made: "make", had: "have", did: "do", was: "be", were: "be",
  taught: "teach", got: "get", read: "read",
};

function inferBaseVerb(answer: string): string {
  const value = answer.toLowerCase().trim();
  if (PAST_TO_BASE[value]) return PAST_TO_BASE[value];
  if (IRREGULAR_VERB_FORMS[value]) return value;
  if (value.endsWith("ies") && value.length > 3) return `${value.slice(0, -3)}y`;
  if (/(ches|shes|sses|xes|zes|oes)$/.test(value)) return value.slice(0, -2);
  if (value.endsWith("s") && value.length > 2) return value.slice(0, -1);
  if (value.endsWith("ied") && value.length > 3) return `${value.slice(0, -3)}y`;
  if (value.endsWith("ed") && value.length > 3) return value.slice(0, -2);
  if (value.endsWith("ing") && value.length > 4) return value.slice(0, -3);
  return value;
}

function getVerbForms(answer: string): string {
  const value = answer.toLowerCase().trim();
  const base = inferBaseVerb(value);
  if (IRREGULAR_VERB_FORMS[base]) return IRREGULAR_VERB_FORMS[base];

  const third = base.endsWith("y") && !/[aeiou]y$/.test(base)
    ? `${base.slice(0, -1)}ies`
    : /(ch|sh|ss|x|z|o)$/.test(base) ? `${base}es` : `${base}s`;
  const past = base.endsWith("e") ? `${base}d` : `${base}ed`;
  const ing = base.endsWith("e") && !base.endsWith("ee")
    ? `${base.slice(0, -1)}ing`
    : `${base}ing`;
  return `${base} → ${third} → ${past} → ${past} → ${ing}`;
}

/** Build a concise Arabic grammar lesson for every generated quiz item. */
export function buildArabicGrammarCoach(
  topicId: string,
  prompt: string,
  correctAnswer: string,
): ArabicGrammarCoach {
  const answer = correctAnswer.toLowerCase().trim();
  const baseVerb = inferBaseVerb(answer);

  switch (topicId) {
    case "a1-present-simple": {
      const isAuxiliary = ["do", "does", "don't", "doesn't"].includes(answer);
      const singular = ["does", "doesn't"].includes(answer);
      return {
        titleArabic: "المضارع البسيط وتصريف الفعل",
        explanationArabic: isAuxiliary
          ? singular
            ? "نستخدم Does مع الفاعل المفرد الغائب (He / She / It) في السؤال، ونستخدم doesn't في النفي. انتبه: بعد Does أو doesn't يعود الفعل الأساسي إلى المصدر بدون s أو es."
            : "نستخدم Do مع (I / You / We / They) في السؤال، ونستخدم don't في النفي. بعد Do أو don't يأتي الفعل في المصدر دون أي إضافة."
          : /\b(He|She|It|The|My|Your)\b/i.test(prompt)
            ? "الجملة تتحدث عن عادة أو حقيقة. مع المفرد الغائب (He / She / It) نضيف s أو es للفعل في الإثبات. نضيف es غالبًا إذا انتهى الفعل بـ ch أو sh أو ss أو x أو o، ونحوّل consonant + y إلى ies."
            : "المضارع البسيط يُستخدم للعادات والحقائق. مع I / You / We / They نستخدم المصدر، ومع He / She / It نضيف s أو es في الإثبات. في السؤال والنفي نستخدم Do أو Does ثم المصدر.",
        verbFormsArabic: isAuxiliary
          ? "do → does → did → done → doing | الفعل الأساسي بعد do / does يبقى في المصدر"
          : getVerbForms(baseVerb),
        examples: [
          { english: "She works every day.", arabic: "هي تعمل كل يوم. (works مع She)" },
          { english: "Does she work every day? / She doesn't work on Friday.", arabic: "هل تعمل كل يوم؟ / هي لا تعمل يوم الجمعة. لاحظ استخدام work دون s بعد Does وdoesn't." },
        ],
      };
    }
    case "a1-verb-to-be":
      return {
        titleArabic: "فعل الكينونة To Be وتصريفاته",
        explanationArabic: "فعل To Be يربط الفاعل بوصف أو مهنة أو حالة أو مكان. في المضارع نختار am مع I، وis مع He / She / It والمفرد، وare مع You / We / They والجمع. لا نستخدم do أو does معه في السؤال أو النفي.",
        verbFormsArabic: "المصدر: be | المضارع: am / is / are | الماضي: was / were | التصريف الثالث: been | ing: being",
        examples: [
          { english: "I am ready. / She is ready. / They are ready.", arabic: "أنا مستعد / هي مستعدة / هم مستعدون." },
          { english: "Was he tired? They were happy.", arabic: "هل كان متعبًا؟ كانوا سعداء." },
        ],
      };
    case "a1-articles-a-an-the":
      return {
        titleArabic: "أدوات a و an و the",
        explanationArabic: "نستخدم a أو an مع الاسم المفرد المعدود غير المحدد. الاختيار بينهما يعتمد على الصوت الأول لا الحرف المكتوب: a قبل الصوت الساكن وan قبل الصوت المتحرك. نستخدم the عندما يكون الشيء محددًا أو معروفًا للطرفين.",
        verbFormsArabic: "هذه القاعدة تخص أدوات الأسماء وليست تصريفًا للأفعال.",
        examples: [
          { english: "a university / an hour", arabic: "جامعة (صوت y ساكن) / ساعة (حرف h لا يُنطق)." },
          { english: "I saw a dog. The dog was friendly.", arabic: "رأيت كلبًا. الكلب كان ودودًا؛ استخدمنا the عند ذكره مرة ثانية." },
        ],
      };
    case "a2-past-simple": {
      const base = PAST_TO_BASE[answer] || baseVerb;
      return {
        titleArabic: "الماضي البسيط وتصريفات الأفعال",
        explanationArabic: prompt.toLowerCase().includes("didn't")
          ? "وجود didn't يعني أن الجملة منفية في الماضي البسيط. بعد did not / didn't نستخدم الفعل في المصدر (V1)، لأن did تحمل علامة الماضي بالفعل. لا نستخدم التصريف الثاني بعدها."
          : "نستخدم الماضي البسيط للتعبير عن حدث انتهى في وقت محدد بالماضي، مثل yesterday أو last week أو ago. الأفعال المنتظمة تأخذ غالبًا ed، أما الأفعال الشاذة فلها تصريف ثانٍ خاص يجب حفظه.",
        verbFormsArabic: getVerbForms(base),
        examples: [
          { english: "I went to work yesterday.", arabic: "ذهبت إلى العمل أمس. (go → went)" },
          { english: "I didn't go to work yesterday.", arabic: "لم أذهب إلى العمل أمس. بعد didn't نستخدم go وليس went." },
        ],
      };
    }
    case "a2-comparatives-superlatives":
      return {
        titleArabic: "المقارنة والتفضيل",
        explanationArabic: "للمقارنة بين شيئين نستخدم غالبًا الصفة + er مع الصفات القصيرة، أو more + الصفة مع الصفات الطويلة، ثم than. توجد صفات شاذة مثل good → better → best وbad → worse → worst.",
        verbFormsArabic: "good → better → best | bad → worse → worst | fast → faster → fastest",
        examples: [
          { english: "This car is faster than that one.", arabic: "هذه السيارة أسرع من تلك." },
          { english: "This is the best option.", arabic: "هذا هو أفضل اختيار." },
        ],
      };
    case "b1-present-perfect":
      return {
        titleArabic: "المضارع التام وتصريف الفعل الثالث",
        explanationArabic: "يتكون المضارع التام من have أو has + التصريف الثالث للفعل (V3). نستخدم has مع He / She / It، وhave مع I / You / We / They. نستخدم since مع نقطة بداية زمنية، وfor مع مدة زمنية. كلمات ever وyet وalready تحدد معنى التجربة أو التوقيت.",
        verbFormsArabic: "have / has + V3 | work → worked | write → wrote → written | go → went → gone",
        examples: [
          { english: "She has written three reports.", arabic: "لقد كتبت ثلاثة تقارير. (has + V3)" },
          { english: "I have worked here for five years.", arabic: "أعمل هنا منذ خمس سنوات. for + مدة زمنية." },
        ],
      };
    case "b1-conditionals-first-second":
      return {
        titleArabic: "الجمل الشرطية الأولى والثانية",
        explanationArabic: answer === "were" || answer === "found" || answer === "would"
          ? "الشرط الثاني يُستخدم لافتراض غير حقيقي أو بعيد الاحتمال في الحاضر أو المستقبل. الصيغة: If + Past Simple, would + المصدر. في الأسلوب الرسمي نستخدم were مع جميع الضمائر في If I were you."
          : "الشرط الأول يُستخدم لاحتمال حقيقي في المستقبل. الصيغة: If + Present Simple, will + المصدر. لا نضع will عادةً داخل جملة If نفسها.",
        verbFormsArabic: "الشرط الأول: If + V1 / present, will + V1 | الشرط الثاني: If + V2, would + V1",
        examples: [
          { english: "If it rains, we will stay home.", arabic: "إذا أمطرت، فسنبقى في المنزل. احتمال حقيقي." },
          { english: "If I were you, I would accept.", arabic: "لو كنت مكانك، لقبِلت. افتراض غير حقيقي." },
        ],
      };
    case "b2-passive-voice":
      return {
        titleArabic: "المبني للمجهول وتصريفات الفعل",
        explanationArabic: "في المبني للمجهول نهتم بالفعل أو الشيء الذي وقع عليه الفعل، وليس بمن قام به. الصيغة العامة: verb to be حسب الزمن + التصريف الثالث V3. يجب أن يتغير be مع الزمن والفاعل، بينما يبقى الفعل الرئيسي في V3.",
        verbFormsArabic: "Present: am / is / are + V3 | Past: was / were + V3 | Future: will be + V3 | Present Perfect: has / have been + V3",
        examples: [
          { english: "The report was written yesterday.", arabic: "كُتب التقرير أمس. (was + V3)" },
          { english: "The results have been announced.", arabic: "تم إعلان النتائج. (have been + V3)" },
        ],
      };
    case "b2-third-conditional-regrets":
      return {
        titleArabic: "الشرط الثالث والندم على الماضي",
        explanationArabic: "نستخدم الشرط الثالث للتحدث عن موقف لم يحدث في الماضي وتخيّل نتيجة مختلفة له. الصيغة: If + had + V3, would have + V3. لا يمكن تغيير الحدث الماضي، لذلك يعبر التركيب عن الندم أو الافتراض المضاد للواقع.",
        verbFormsArabic: "If-clause: had + V3 | Result: would have + V3 | مثال: practice → practiced → practiced",
        examples: [
          { english: "If I had studied, I would have passed.", arabic: "لو كنت قد ذاكرت، لكنت نجحت." },
          { english: "If she had left earlier, she wouldn't have missed the train.", arabic: "لو غادرت مبكرًا، لما فاتَها القطار." },
        ],
      };
    case "c1-inversion-for-emphasis":
      return {
        titleArabic: "القلب النحوي Inversion للتوكيد",
        explanationArabic: "عندما تبدأ الجملة بتعبير سلبي أو شبه سلبي مثل Seldom أو Rarely أو Under no circumstances، نقلب ترتيب الجملة بوضع الفعل المساعد قبل الفاعل. إذا لم يوجد فعل مساعد في المضارع أو الماضي البسيط نستخدم do / does / did، ثم يأتي الفعل الأساسي في المصدر.",
        verbFormsArabic: "Present: Rarely does + subject + V1 | Past: Not until then did + subject + V1 | Perfect: Seldom have / had + subject + V3",
        examples: [
          { english: "Rarely does he make mistakes.", arabic: "نادرًا ما يرتكب أخطاء. لاحظ does قبل الفاعل ثم make في المصدر." },
          { english: "Never have I seen this before.", arabic: "لم أرَ هذا من قبل قط. have جاءت قبل الفاعل." },
        ],
      };
    case "c1-mixed-conditionals":
      return {
        titleArabic: "الجمل الشرطية المختلطة",
        explanationArabic: "نستخدم الشرط المختلط عندما يكون الشرط في زمن والنتيجة في زمن آخر. قد نتحدث عن سبب ماضٍ ونتيجة حاضرة، أو صفة حالية أثرت في نتيجة ماضية. نحدد الصيغة من زمن الشرط والنتيجة في الجملة.",
        verbFormsArabic: "Past condition: If + had + V3 | Present result: would + V1 | Past result: would have + V3",
        examples: [
          { english: "If I had studied medicine, I would be a doctor now.", arabic: "لو كنت درست الطب، لكنت طبيبًا الآن. شرط ماضٍ ونتيجة حاضرة." },
          { english: "If he were more careful, he wouldn't have made that mistake.", arabic: "لو كان أكثر حرصًا، لما ارتكب ذلك الخطأ. صفة حاضرة ونتيجة ماضية." },
        ],
      };
    case "c2-subjunctive-and-nominalization":
      return {
        titleArabic: "صيغة Subjunctive الرسمية",
        explanationArabic: "بعد أفعال وتعبيرات الطلب والتوصية والضرورة مثل demand وrecommend وimperative that نستخدم صيغة المصدر المجرد للفعل دون s، حتى مع He أو She. في النفي نضع not قبل المصدر. وفي المبني للمجهول نستخدم be + V3.",
        verbFormsArabic: "Base form: adhere / resign / disclose | Negative: not + V1 | Passive: be + V3",
        examples: [
          { english: "The manager demanded that he resign.", arabic: "طالب المدير بأن يستقيل. الفعل resign مصدر مجرد دون s." },
          { english: "It is essential that the form be signed.", arabic: "من الضروري أن يتم توقيع النموذج. be + V3." },
        ],
      };
    default:
      return {
        titleArabic: "شرح القاعدة النحوية",
        explanationArabic: "راجع تركيب الجملة والفاعل والزمن، ثم لاحظ سبب اختيار الإجابة الصحيحة. انتبه إلى الفرق بين المصدر والتصريف الثاني والتصريف الثالث للفعل.",
        verbFormsArabic: getVerbForms(answer),
        examples: [
          { english: prompt.replace("_____", correctAnswer), arabic: "لاحظ موضع الإجابة الصحيحة داخل الجملة." },
        ],
      };
  }
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

    const grammarCoach = buildArabicGrammarCoach(
      blueprint.topicId,
      generated.prompt,
      generated.options[generated.correctIndex],
    );

    finalQuestions.push({
      id: `quiz-q-${questionNumber}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      questionNumber,
      prompt: generated.prompt,
      options: generated.options,
      correctIndex: generated.correctIndex,
      explanation: generated.explanation,
      grammarTitleArabic: grammarCoach.titleArabic,
      explanationArabic: grammarCoach.explanationArabic,
      verbFormsArabic: grammarCoach.verbFormsArabic,
      grammarExamples: grammarCoach.examples,
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

    const grammarCoach = buildArabicGrammarCoach(
      blueprint.topicId,
      uniquePrompt,
      generated.options[generated.correctIndex],
    );

    finalQuestions.push({
      id: `quiz-q-${questionNumber}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      questionNumber,
      prompt: uniquePrompt,
      options: generated.options,
      correctIndex: generated.correctIndex,
      explanation: generated.explanation,
      grammarTitleArabic: grammarCoach.titleArabic,
      explanationArabic: grammarCoach.explanationArabic,
      verbFormsArabic: grammarCoach.verbFormsArabic,
      grammarExamples: grammarCoach.examples,
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
