class GrammarExampleModel {
  final String english;
  final String arabic;
  final String? note;

  const GrammarExampleModel({
    required this.english,
    required this.arabic,
    this.note,
  });

  factory GrammarExampleModel.fromJson(Map<String, dynamic> json) {
    return GrammarExampleModel(
      english: json['english'] as String? ?? '',
      arabic: json['arabic'] as String? ?? '',
      note: json['note'] as String?,
    );
  }
}

class GrammarMistakeModel {
  final String incorrect;
  final String correct;
  final String reason;

  const GrammarMistakeModel({
    required this.incorrect,
    required this.correct,
    required this.reason,
  });

  factory GrammarMistakeModel.fromJson(Map<String, dynamic> json) {
    return GrammarMistakeModel(
      incorrect: json['incorrect'] as String? ?? '',
      correct: json['correct'] as String? ?? '',
      reason: json['reason'] as String? ?? '',
    );
  }
}

class GrammarTopicModel {
  final String id;
  final String level;
  final String title;
  final String titleArabic;
  final String summary;
  final String summaryArabic;
  final String ruleFormula;
  final String explanationEnglish;
  final String explanationArabic;
  final List<GrammarExampleModel> examples;
  final List<GrammarMistakeModel> commonMistakes;
  final List<String> keyRules;

  const GrammarTopicModel({
    required this.id,
    required this.level,
    required this.title,
    required this.titleArabic,
    required this.summary,
    required this.summaryArabic,
    required this.ruleFormula,
    required this.explanationEnglish,
    required this.explanationArabic,
    required this.examples,
    required this.commonMistakes,
    required this.keyRules,
  });

  factory GrammarTopicModel.fromJson(Map<String, dynamic> json) {
    return GrammarTopicModel(
      id: json['id'] as String? ?? '',
      level: json['level'] as String? ?? 'A1',
      title: json['title'] as String? ?? '',
      titleArabic: json['titleArabic'] as String? ?? '',
      summary: json['summary'] as String? ?? '',
      summaryArabic: json['summaryArabic'] as String? ?? '',
      ruleFormula: json['ruleFormula'] as String? ?? '',
      explanationEnglish: json['explanationEnglish'] as String? ?? '',
      explanationArabic: json['explanationArabic'] as String? ?? '',
      examples: (json['examples'] as List<dynamic>? ?? [])
          .map((e) => GrammarExampleModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      commonMistakes: (json['commonMistakes'] as List<dynamic>? ?? [])
          .map((m) => GrammarMistakeModel.fromJson(m as Map<String, dynamic>))
          .toList(),
      keyRules: (json['keyRules'] as List<dynamic>? ?? [])
          .map((r) => r.toString())
          .toList(),
    );
  }
}

class QuizQuestionModel {
  final String id;
  final int questionNumber;
  final String prompt;
  final List<String> options;
  final int correctIndex;
  final String explanation;
  final String topicId;
  final String level;

  const QuizQuestionModel({
    required this.id,
    required this.questionNumber,
    required this.prompt,
    required this.options,
    required this.correctIndex,
    required this.explanation,
    required this.topicId,
    required this.level,
  });

  factory QuizQuestionModel.fromJson(Map<String, dynamic> json) {
    return QuizQuestionModel(
      id: json['id'] as String? ?? '',
      questionNumber: (json['questionNumber'] as num?)?.toInt() ?? 1,
      prompt: json['prompt'] as String? ?? '',
      options: (json['options'] as List<dynamic>? ?? [])
          .map((o) => o.toString())
          .toList(),
      correctIndex: (json['correctIndex'] as num?)?.toInt() ?? 0,
      explanation: json['explanation'] as String? ?? '',
      topicId: json['topicId'] as String? ?? '',
      level: json['level'] as String? ?? 'B1',
    );
  }
}

class QuizModel {
  final String quizId;
  final String title;
  final String titleArabic;
  final String level;
  final int totalQuestions;
  final List<QuizQuestionModel> questions;
  final String createdAt;

  const QuizModel({
    required this.quizId,
    required this.title,
    required this.titleArabic,
    required this.level,
    required this.totalQuestions,
    required this.questions,
    required this.createdAt,
  });

  factory QuizModel.fromJson(Map<String, dynamic> json) {
    return QuizModel(
      quizId: json['quizId'] as String? ?? '',
      title: json['title'] as String? ?? '',
      titleArabic: json['titleArabic'] as String? ?? '',
      level: json['level'] as String? ?? 'B1',
      totalQuestions: (json['totalQuestions'] as num?)?.toInt() ?? 50,
      questions: (json['questions'] as List<dynamic>? ?? [])
          .map((q) => QuizQuestionModel.fromJson(q as Map<String, dynamic>))
          .toList(),
      createdAt: json['createdAt'] as String? ?? '',
    );
  }
}

class AudioDrillModel {
  final String text;
  final String phoneticIpa;
  final String focusPoint;
  final String arabicTip;

  const AudioDrillModel({
    required this.text,
    required this.phoneticIpa,
    required this.focusPoint,
    required this.arabicTip,
  });

  factory AudioDrillModel.fromJson(Map<String, dynamic> json) {
    return AudioDrillModel(
      text: json['text'] as String? ?? '',
      phoneticIpa: json['phoneticIpa'] as String? ?? '',
      focusPoint: json['focusPoint'] as String? ?? '',
      arabicTip: json['arabicTip'] as String? ?? '',
    );
  }
}

class LearningTipModel {
  final String id;
  final String category;
  final String title;
  final String titleArabic;
  final String summary;
  final String summaryArabic;
  final String badge;
  final String contentMarkdown;
  final List<AudioDrillModel> drills;

  const LearningTipModel({
    required this.id,
    required this.category,
    required this.title,
    required this.titleArabic,
    required this.summary,
    required this.summaryArabic,
    required this.badge,
    required this.contentMarkdown,
    required this.drills,
  });

  factory LearningTipModel.fromJson(Map<String, dynamic> json) {
    return LearningTipModel(
      id: json['id'] as String? ?? '',
      category: json['category'] as String? ?? 'PRONUNCIATION',
      title: json['title'] as String? ?? '',
      titleArabic: json['titleArabic'] as String? ?? '',
      summary: json['summary'] as String? ?? '',
      summaryArabic: json['summaryArabic'] as String? ?? '',
      badge: json['badge'] as String? ?? '',
      contentMarkdown: json['contentMarkdown'] as String? ?? '',
      drills: (json['drills'] as List<dynamic>? ?? [])
          .map((d) => AudioDrillModel.fromJson(d as Map<String, dynamic>))
          .toList(),
    );
  }
}
