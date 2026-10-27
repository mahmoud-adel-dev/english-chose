class IdentifiedErrorModel {
  final String category;
  final String wrongSnippet;
  final String correctSnippet;
  final String explanation;

  IdentifiedErrorModel({
    required this.category,
    required this.wrongSnippet,
    required this.correctSnippet,
    required this.explanation,
  });

  factory IdentifiedErrorModel.fromJson(Map<String, dynamic> json) {
    return IdentifiedErrorModel(
      category: json['category'] ?? 'GRAMMAR',
      wrongSnippet: json['wrongSnippet'] ?? '',
      correctSnippet: json['correctSnippet'] ?? '',
      explanation: json['explanation'] ?? '',
    );
  }
}

class EvaluationResultModel {
  final String submissionId;
  final String questionId;
  final int attemptNumber;
  final String rawTranscript;
  final bool isMeaningAccurate;
  final String correctedSentence;
  final double grammarScore;
  final double vocabularyScore;
  final double overallScore;
  final double fluencyScore;
  final double pronunciationScore;
  final String explanationMarkdown;
  final List<IdentifiedErrorModel> identifiedErrors;
  final bool retryEligible;
  final bool isPassed;

  EvaluationResultModel({
    required this.submissionId,
    required this.questionId,
    required this.attemptNumber,
    required this.rawTranscript,
    required this.isMeaningAccurate,
    required this.correctedSentence,
    required this.grammarScore,
    required this.vocabularyScore,
    required this.overallScore,
    required this.fluencyScore,
    required this.pronunciationScore,
    required this.explanationMarkdown,
    required this.identifiedErrors,
    required this.retryEligible,
    required this.isPassed,
  });

  factory EvaluationResultModel.fromJson(Map<String, dynamic> json) {
    final scores = json['scores'] as Map<String, dynamic>? ?? {};
    return EvaluationResultModel(
      submissionId: json['submissionId'] ?? '',
      questionId: json['questionId'] ?? '',
      attemptNumber: (json['attemptNumber'] as num?)?.toInt() ?? 1,
      rawTranscript: json['rawTranscript'] ?? '',
      isMeaningAccurate: json['isMeaningAccurate'] ?? false,
      correctedSentence: json['correctedSentence'] ?? '',
      grammarScore: (scores['grammar'] as num?)?.toDouble() ?? 0.0,
      vocabularyScore: (scores['vocabulary'] as num?)?.toDouble() ?? 0.0,
      overallScore: (scores['overall'] as num?)?.toDouble() ?? 0.0,
      fluencyScore: (scores['fluency'] as num?)?.toDouble() ?? 0.0,
      pronunciationScore: (scores['pronunciation'] as num?)?.toDouble() ?? 0.0,
      explanationMarkdown: json['explanationMarkdown'] ?? '',
      identifiedErrors: (json['identifiedErrors'] as List<dynamic>?)
              ?.map((e) => IdentifiedErrorModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      retryEligible: json['retryEligible'] ?? true,
      isPassed: json['isPassed'] ?? false,
    );
  }
}

