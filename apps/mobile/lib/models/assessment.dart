class AssessmentItemModel {
  final String id;
  final int itemNumber;
  final int totalItems;
  final String targetLevel;
  final String promptText;
  final String? audioPromptUrl;

  AssessmentItemModel({
    required this.id,
    required this.itemNumber,
    required this.totalItems,
    required this.targetLevel,
    required this.promptText,
    this.audioPromptUrl,
  });

  factory AssessmentItemModel.fromJson(Map<String, dynamic> json) {
    return AssessmentItemModel(
      id: json['id'] ?? '',
      itemNumber: (json['itemNumber'] as num?)?.toInt() ?? 1,
      totalItems: (json['totalItems'] as num?)?.toInt() ?? 6,
      targetLevel: json['targetLevel'] ?? 'A1',
      promptText: json['promptText'] ?? '',
      audioPromptUrl: json['audioPromptUrl'],
    );
  }
}

class AssessmentResultModel {
  final String assessmentId;
  final String assessedLevel;
  final double overallScore;
  final double grammarScore;
  final double vocabularyScore;
  final double fluencyScore;
  final String studyPlanSummary;
  final String completedAt;

  AssessmentResultModel({
    required this.assessmentId,
    required this.assessedLevel,
    required this.overallScore,
    required this.grammarScore,
    required this.vocabularyScore,
    required this.fluencyScore,
    required this.studyPlanSummary,
    required this.completedAt,
  });

  factory AssessmentResultModel.fromJson(Map<String, dynamic> json) {
    final breakdown = json['skillBreakdown'] as Map<String, dynamic>? ?? {};
    return AssessmentResultModel(
      assessmentId: json['assessmentId'] ?? '',
      assessedLevel: json['assessedLevel'] ?? 'A1',
      overallScore: (json['overallScore'] as num?)?.toDouble() ?? 0.0,
      grammarScore: (breakdown['grammar'] as num?)?.toDouble() ?? 0.0,
      vocabularyScore: (breakdown['vocabulary'] as num?)?.toDouble() ?? 0.0,
      fluencyScore: (breakdown['fluency'] as num?)?.toDouble() ?? 0.0,
      studyPlanSummary: json['studyPlanSummary'] ?? '',
      completedAt: json['completedAt'] ?? '',
    );
  }
}

