class SessionQuestionModel {
  final String id;
  final int orderIndex;
  final String questionType;
  final String promptText;
  final String? audioPromptUrl;
  final String pedagogicalGoal;
  final String? contextHint;
  final double difficultyScore;
  final int attemptsUsed;
  final int maxAttempts;

  SessionQuestionModel({
    required this.id,
    required this.orderIndex,
    required this.questionType,
    required this.promptText,
    this.audioPromptUrl,
    required this.pedagogicalGoal,
    this.contextHint,
    required this.difficultyScore,
    required this.attemptsUsed,
    required this.maxAttempts,
  });

  factory SessionQuestionModel.fromJson(Map<String, dynamic> json) {
    return SessionQuestionModel(
      id: json['id'] ?? '',
      orderIndex: (json['orderIndex'] as num?)?.toInt() ?? 1,
      questionType: json['questionType'] ?? 'OPEN_SPEECH',
      promptText: json['promptText'] ?? '',
      audioPromptUrl: json['audioPromptUrl'],
      pedagogicalGoal: json['pedagogicalGoal'] ?? '',
      contextHint: json['contextHint'],
      difficultyScore: (json['difficultyScore'] as num?)?.toDouble() ?? 1.0,
      attemptsUsed: (json['attemptsUsed'] as num?)?.toInt() ?? 0,
      maxAttempts: (json['maxAttempts'] as num?)?.toInt() ?? 3,
    );
  }
}

class DailySessionModel {
  final String id;
  final String targetLevel;
  final String status;
  final int questionsCount;
  final int durationSec;
  final List<SessionQuestionModel> questions;
  final String createdAt;

  DailySessionModel({
    required this.id,
    required this.targetLevel,
    required this.status,
    required this.questionsCount,
    required this.durationSec,
    required this.questions,
    required this.createdAt,
  });

  factory DailySessionModel.fromJson(Map<String, dynamic> json) {
    return DailySessionModel(
      id: json['id'] ?? '',
      targetLevel: json['targetLevel'] ?? 'A1',
      status: json['status'] ?? 'ACTIVE',
      questionsCount: (json['questionsCount'] as num?)?.toInt() ?? 0,
      durationSec: (json['durationSec'] as num?)?.toInt() ?? 0,
      createdAt: json['createdAt'] ?? '',
      questions: (json['questions'] as List<dynamic>?)
              ?.map((q) => SessionQuestionModel.fromJson(q as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

