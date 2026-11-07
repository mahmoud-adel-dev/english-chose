class ConversationMessageModel {
  final String id;
  final String sessionId;
  final String role; // "user" or "assistant"
  final String content;
  final String? audioUrl;
  final String? correctionTip;
  final DateTime createdAt;

  ConversationMessageModel({
    required this.id,
    required this.sessionId,
    required this.role,
    required this.content,
    this.audioUrl,
    this.correctionTip,
    required this.createdAt,
  });

  factory ConversationMessageModel.fromJson(Map<String, dynamic> json) {
    return ConversationMessageModel(
      id: json['id'] ?? '',
      sessionId: json['sessionId'] ?? '',
      role: json['role'] ?? 'assistant',
      content: json['content'] ?? '',
      audioUrl: json['audioUrl'],
      correctionTip: json['correctionTip'],
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class ConversationMistakeModel {
  final String wrongSnippet;
  final String correctSnippet;
  final String explanation;

  ConversationMistakeModel({
    required this.wrongSnippet,
    required this.correctSnippet,
    required this.explanation,
  });

  factory ConversationMistakeModel.fromJson(Map<String, dynamic> json) {
    return ConversationMistakeModel(
      wrongSnippet: json['wrongSnippet'] ?? '',
      correctSnippet: json['correctSnippet'] ?? '',
      explanation: json['explanation'] ?? '',
    );
  }
}

class ConversationEvaluationReportModel {
  final double overallScore;
  final String assessedLevel;
  final double grammarScore;
  final double vocabularyScore;
  final double fluencyScore;
  final double pronunciationScore;
  final String summaryArabic;
  final List<String> strengthsArabic;
  final List<String> areasForImprovementArabic;
  final List<ConversationMistakeModel> allMistakes;

  ConversationEvaluationReportModel({
    required this.overallScore,
    required this.assessedLevel,
    required this.grammarScore,
    required this.vocabularyScore,
    required this.fluencyScore,
    required this.pronunciationScore,
    required this.summaryArabic,
    required this.strengthsArabic,
    required this.areasForImprovementArabic,
    required this.allMistakes,
  });

  factory ConversationEvaluationReportModel.fromJson(Map<String, dynamic> json) {
    final strengths = (json['strengthsArabic'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        [];
    final improvements = (json['areasForImprovementArabic'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        [];
    final mistakes = (json['allMistakes'] as List<dynamic>?)
            ?.map((e) => ConversationMistakeModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    return ConversationEvaluationReportModel(
      overallScore: (json['overallScore'] as num?)?.toDouble() ?? 80.0,
      assessedLevel: json['assessedLevel'] ?? 'B1',
      grammarScore: (json['grammarScore'] as num?)?.toDouble() ?? 80.0,
      vocabularyScore: (json['vocabularyScore'] as num?)?.toDouble() ?? 80.0,
      fluencyScore: (json['fluencyScore'] as num?)?.toDouble() ?? 80.0,
      pronunciationScore: (json['pronunciationScore'] as num?)?.toDouble() ?? 80.0,
      summaryArabic: json['summaryArabic'] ?? '',
      strengthsArabic: strengths,
      areasForImprovementArabic: improvements,
      allMistakes: mistakes,
    );
  }
}

class ConversationSessionModel {
  final String id;
  final String userId;
  final String targetLevel;
  final String status;
  final String? topic;
  final double? overallScore;
  final String? assessedLevel;
  final double? grammarScore;
  final double? vocabularyScore;
  final double? fluencyScore;
  final double? pronunciationScore;
  final ConversationEvaluationReportModel? evaluationReport;
  final DateTime createdAt;
  final DateTime? completedAt;
  final List<ConversationMessageModel> messages;

  ConversationSessionModel({
    required this.id,
    required this.userId,
    required this.targetLevel,
    required this.status,
    this.topic,
    this.overallScore,
    this.assessedLevel,
    this.grammarScore,
    this.vocabularyScore,
    this.fluencyScore,
    this.pronunciationScore,
    this.evaluationReport,
    required this.createdAt,
    this.completedAt,
    required this.messages,
  });

  factory ConversationSessionModel.fromJson(Map<String, dynamic> json) {
    final rawMessages = (json['messages'] as List<dynamic>?) ?? [];
    final messages = rawMessages
        .map((m) => ConversationMessageModel.fromJson(m as Map<String, dynamic>))
        .toList();

    ConversationEvaluationReportModel? report;
    if (json['evaluationReport'] != null && json['evaluationReport'] is Map<String, dynamic>) {
      report = ConversationEvaluationReportModel.fromJson(
        json['evaluationReport'] as Map<String, dynamic>,
      );
    }

    return ConversationSessionModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      targetLevel: json['targetLevel'] ?? 'B1',
      status: json['status'] ?? 'ACTIVE',
      topic: json['topic'],
      overallScore: (json['overallScore'] as num?)?.toDouble(),
      assessedLevel: json['assessedLevel'],
      grammarScore: (json['grammarScore'] as num?)?.toDouble(),
      vocabularyScore: (json['vocabularyScore'] as num?)?.toDouble(),
      fluencyScore: (json['fluencyScore'] as num?)?.toDouble(),
      pronunciationScore: (json['pronunciationScore'] as num?)?.toDouble(),
      evaluationReport: report,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
      completedAt: json['completedAt'] != null
          ? DateTime.tryParse(json['completedAt'])
          : null,
      messages: messages,
    );
  }
}

