export interface AudioDrill {
  text: string;
  phoneticIpa: string;
  focusPoint: string;
  arabicTip: string;
}

export interface LearningTipItem {
  id: string;
  category: "PRONUNCIATION" | "LISTENING";
  title: string;
  titleArabic: string;
  summary: string;
  summaryArabic: string;
  badge: string;
  contentMarkdown: string;
  drills: AudioDrill[];
}

export const TIPS_CATALOG: LearningTipItem[] = [
  // ==========================================
  // PRONUNCIATION TIPS
  // ==========================================
  {
    id: "pron-p-vs-b",
    category: "PRONUNCIATION",
    title: "Mastering /p/ vs /b/ (Aspiration Secret)",
    titleArabic: "التمييز الدقيق بين حرفي P و B (سر الهواء)",
    badge: "Crucial Distinction",
    summary: "How to stop confusing P and B by mastering the burst of air (aspiration).",
    summaryArabic: "كيف تتخلص نهائياً من الخلط بين صوت P وصوت B باستخدام تقنية حبس الهواء ونفخه.",
    contentMarkdown: `### 🎯 The Difference:
- **/b/** is **voiced** (اهتزاز الحبال الصوتية): Your vocal cords vibrate, and there is almost NO air coming out of your mouth.
- **/p/** is **voiceless and aspirated** (انفجار هوائي صامت): No vocal cord vibration, but there is a sudden burst of air puffing out!

### 💡 The Paper Test:
Hold a piece of paper 2 inches in front of your lips.
1. Say **"Bark"**: The paper should barely move.
2. Say **"Park"**: The paper MUST fly forward from the breath puff!

### ⚠️ Common Confusion Pairs:
- **Pin** vs **Bin**
- **Pack** vs **Back**
- **Peach** vs **Beach**
- **Pay** vs **Bay**`,
    drills: [
      {
        text: "Please put the paper in the purple pack.",
        phoneticIpa: "/pliːz pʊt ðə ˈpeɪpər ɪn ðə ˈpɜːrpl pæk/",
        focusPoint: "Explosive /p/ sound without voicing",
        arabicTip: "تأكد من خروج نفخة هواء واضحة مع كل كلمة تبدأ بحرف P"
      },
      {
        text: "Bob bought big brown bananas from the bazaar.",
        phoneticIpa: "/bɒb bɔːt bɪɡ braʊn bəˈnɑːnəz frəm ðə bəˈzɑːr/",
        focusPoint: "Voiced /b/ sound without air burst",
        arabicTip: "انتبه لاهتزاز الحنجرة بدون نفخ هواء زائد"
      },
      {
        text: "The pilot parked his private plane by the harbor.",
        phoneticIpa: "/ðə ˈpaɪlət pɑːrkt hɪz ˈpraɪvət pleɪn baɪ ðə ˈhɑːrbər/",
        focusPoint: "Contrasting /p/ in pilot/parked with /b/ in by/harbor",
        arabicTip: "التبديل السريع بين انفجار P ونعومة B"
      }
    ]
  },
  {
    id: "pron-th-sounds",
    category: "PRONUNCIATION",
    title: "The Two 'TH' Sounds (/θ/ vs /ð/)",
    titleArabic: "نطق صوتي الـ TH (الثاء والذال الإنجليزية)",
    badge: "Mouth Mechanics",
    summary: "Preventing TH from turning into S, Z, or T sounds.",
    summaryArabic: "منع تحول صوت TH إلى S أو Z أو T من خلال ضبط موضع اللسان بين الأسنان.",
    contentMarkdown: `### 🎯 Two Distinct Sounds:
1. **/θ/ Voiceless (مثل حرف الثاء):** Think, Thought, Three, Healthy, Earth.
2. **/ð/ Voiceless (مثل حرف الذال):** This, That, The, Father, Breathe.

### 👅 The Golden Rule of Tongue Placement:
Place the tip of your tongue slightly **between** your upper and lower teeth. If your tongue stays behind your teeth, you will mistakenly pronounce 'Three' as 'Tree' or 'Free'!`,
    drills: [
      {
        text: "I think three thousand thieves threatened them.",
        phoneticIpa: "/aɪ θɪŋk θriː ˈθaʊzənd θiːvz ˈθrɛtnd ðɛm/",
        focusPoint: "Voiceless /θ/ in think/three vs voiced /ð/ in them",
        arabicTip: "أخرج طرف لسانك قليلاً بين أسنانك لتوليد صوت الثاء الصافي"
      },
      {
        text: "My mother and father breathe together in the fresh air.",
        phoneticIpa: "/maɪ ˈmʌðər ænd ˈfɑːðər briːð təˈɡɛðər/",
        focusPoint: "Voiced /ð/ in mother, father, breathe",
        arabicTip: "اهتزاز صوتي شبيه بحرف الذال المعجم"
      }
    ]
  },
  {
    id: "pron-connected-speech",
    category: "PRONUNCIATION",
    title: "Connected Speech & Linking (Sounds Like a Native)",
    titleArabic: "الكلام المتصل وربط الكلمات (سر النطق الطبيعي)",
    badge: "Fluency Booster",
    summary: "Why native speakers sound fast: Consonant-to-Vowel linking and Elision.",
    summaryArabic: "كيف يربط المتحدثون الأصليون نهايات الكلمات ببداياتها لتبدو الجملة ككلمة واحدة انسيابية.",
    contentMarkdown: `### 🔗 Consonant to Vowel Linking:
When a word ends in a consonant and the next begins with a vowel, push the consonant over!
- **Not at all** ➔ Sounds like *"No-ta-tall"*
- **Check it out** ➔ Sounds like *"Che-ki-tout"*
- **Hold on** ➔ Sounds like *"Hol-don"*

### ✂️ Sound Deletion (Elision):
Native speakers often drop the /t/ or /d/ when caught between other consonants:
- *"Next door"* ➔ *"Nex-door"*
- *"Last night"* ➔ *"Las-night"*`,
    drills: [
      {
        text: "Can I have an apple and an orange, please?",
        phoneticIpa: "/kæ-naɪ-hæ-və-næpl ən-ən-ˈɔːrɪndʒ pliːz/",
        focusPoint: "Linking consonants across word boundaries",
        arabicTip: "انطق: Ca-ni ha-va-napple بدل التوقف بين كل كلمة"
      },
      {
        text: "Hold on a second, check it out right now.",
        phoneticIpa: "/hoʊl-dɒ-nə ˈsɛkənd, tʃɛ-kɪ-taʊt raɪt naʊ/",
        focusPoint: "Smooth linking of 'hold on' and 'check it out'",
        arabicTip: "تدرب على الربط المستمر بدون تقطيع"
      }
    ]
  },
  {
    id: "pron-word-stress",
    category: "PRONUNCIATION",
    title: "Word Stress & Syllable Rhythm",
    titleArabic: "نبر الكلمات (Word Stress) والإيقاع الموسيقي",
    badge: "Clarity Secret",
    summary: "Misplaced stress makes English incomprehensible even with correct grammar.",
    summaryArabic: "النبر الخاطئ على المقاطع الصوتية هو السبب الأول لعدم فهم الأجانب لكلامك رغم صحة القواعد.",
    contentMarkdown: `### 🎵 What is Stress?
In English, one syllable in every multi-syllable word is pronounced **LOUDER, LONGER, and HIGHER in pitch**.

### ⚡ Noun vs Verb Shift:
Many 2-syllable English words change meaning solely based on stress!
- **REC-ord** (Noun: سجل) vs **re-CORD** (Verb: يسجل)
- **PRES-ent** (Noun: هدية/حاضر) vs **pre-SENT** (Verb: يقدم)
- **PRO-ject** (Noun: مشروع) vs **pro-JECT** (Verb: يسقط/يتوقع)`,
    drills: [
      {
        text: "They will record a new record in the studio tomorrow.",
        phoneticIpa: "/ðeɪ wɪl rɪˈkɔːrd ə njuː ˈrɛkɔːrd ɪn ðə ˈstjuːdiəʊ/",
        focusPoint: "Shift between verb /rɪˈkɔːrd/ and noun /ˈrɛkɔːrd/",
        arabicTip: "اضغط على المقطع الأول في الاسم، والمقطع الثاني في الفعل"
      }
    ]
  },

  // ==========================================
  // LISTENING POWER TIPS
  // ==========================================
  {
    id: "list-the-schwa-sound",
    category: "LISTENING",
    title: "The Schwa /ə/: The Secret to Understanding Fast English",
    titleArabic: "صوت الشوا /ə/: مفتاح فهم الإنجليزية السريعة",
    badge: "Ear Opener",
    summary: "The most common sound in the English language and why it makes words disappear.",
    summaryArabic: "الصوت الأكثر تكراراً في الإنجليزية والذي يحول الكلمات غير المشددة إلى همسات سريعة.",
    contentMarkdown: `### ❓ What is the Schwa?
The Schwa is a lazy, completely relaxed vowel sound produced without moving tongue or lips. It sounds like a quick, quiet "uh".
It replaces almost ANY vowel in unstressed syllables!

### 🔍 Look at these examples:
- **A**bout ➔ **/əˈbaʊt/**
- Ban**a**n**a** ➔ **/bəˈnænə/**
- P**o**lice ➔ **/pəˈliːs/**
- Ph**o**t**o**graphy ➔ **/fəˈtɒɡrəfi/**

### 👂 Why it matters for listening:
If you expect to hear "Po-lice" or "To the store", you will miss it because native speakers say:
*"p'LEES"* and *"t'the store"*.`,
    drills: [
      {
        text: "I want to go to the cinema today.",
        phoneticIpa: "/aɪ wɒnt tə ɡoʊ tə ðə ˈsɪnəmə təˈdeɪ/",
        focusPoint: "Weak forms of 'to' (/tə/) and 'today' (/təˈdeɪ/)",
        arabicTip: "لاحظ كيف تتحول 'to' إلى 'تَ' سريعة جداً"
      }
    ]
  },
  {
    id: "list-informal-contractions",
    category: "LISTENING",
    title: "Decoding Fast Speech Reductions (Gonna, Wanna, Kinda)",
    titleArabic: "فك شفرات الاختصارات السريعة (Gonna, Wanna, Shoulda)",
    badge: "Native Decoder",
    summary: "Understanding how auxiliary verbs compress in real conversational English.",
    summaryArabic: "كيف تنضغط الأفعال المساعدة في المحادثات اليومية لتصبح مقطعاً واحداً مدمجاً.",
    contentMarkdown: `### 🚀 Common Spoken Reductions:
- **Going to** ➔ **Gonna** ("I'm gonna leave.")
- **Want to** ➔ **Wanna** ("Do you wanna eat?")
- **Kind of** ➔ **Kinda** ("It's kinda cold.")
- **Should have** ➔ **Shoulda** ("You shoulda called me.")
- **Could have** ➔ **Coulda** ("I coulda done it.")
- **Give me** ➔ **Gimme** ("Gimme that book.")
- **Let me** ➔ **Lemme** ("Lemme see.")

### 💡 Golden Tip:
You don't have to force yourself to write these in essays, but your **ears MUST instantly recognize them** without freezing!`,
    drills: [
      {
        text: "You should have told me you were going to be late.",
        phoneticIpa: "/juː ˈʃʊdə toʊld miː juː wər ˈɡənə bi leɪt/",
        focusPoint: "Should have -> shoulda, going to -> gonna",
        arabicTip: "استمع للانسياب: You shoulda told me you're gonna be late"
      }
    ]
  },
  {
    id: "list-active-listening-protocol",
    category: "LISTENING",
    title: "The 3-Step Active Listening Protocol (Shadowing)",
    titleArabic: "بروتوكول الاستماع النشط ثلاثي الخطوات (تقنية الظل)",
    badge: "Study Method",
    summary: "The proven daily method to double your listening retention in 30 days.",
    summaryArabic: "الطريقة العلمية المجربة لمضاعفة قدرتك على استيعاب الإنجليزية المنطوقة خلال 30 يوماً.",
    contentMarkdown: `### 📋 Step 1: Blind Listening (بدون نص)
Listen to a 1-2 minute English clip (podcast or video) with NO subtitles.
- Don't worry about understanding every single word.
- Focus on grasping the overall message (Gist).

### 📋 Step 2: Read & Verify (مع النص المكتوب)
Listen again while reading the transcript or English subtitles.
- Highlight every word you missed.
- Notice: Did you miss it because you didn't know the word, or because of how it was pronounced (linking/reduction)?

### 📋 Step 3: Shadowing (المحاكاة والتكرار كظل المتحدث)
Play the clip sentence by sentence, pause, and imitate the speaker's exact melody, emotion, and pace out loud!`,
    drills: [
      {
        text: "Consistency is more important than intensity when learning a language.",
        phoneticIpa: "/kənˈsɪstənsi ɪz mɔːr ɪmˈpɔːrtnt ðæn ɪnˈtɛnsəti wɛn ˈlɜːrnɪŋ ə ˈlæŋɡwɪdʒ/",
        focusPoint: "Shadowing sentence rhythm and thought groups",
        arabicTip: "كرر الجملة بنفس النغمة والسرعة فور سماعها"
      }
    ]
  }
];

export function getTipsByCategory(category?: "PRONUNCIATION" | "LISTENING"): LearningTipItem[] {
  if (!category) return TIPS_CATALOG;
  return TIPS_CATALOG.filter((t) => t.category === category);
}
