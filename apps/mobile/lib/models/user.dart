class UserModel {
  final String id;
  final String email;
  final String name;
  final String role;
  final String createdAt;

  UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    required this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      name: json['name'] ?? '',
      role: json['role'] ?? 'STUDENT',
      createdAt: json['createdAt'] ?? '',
    );
  }
}

class LearningProfileModel {
  final String userId;
  final String currentLevel;
  final String targetLevel;
  final double overallScore;
  final double grammarScore;
  final double vocabularyScore;
  final double fluencyScore;
  final double pronunciationScore;
  final int dailyStreak;
  final String? lastTrainedDate;
  final List<String> recurringWeaknesses;

  LearningProfileModel({
    required this.userId,
    required this.currentLevel,
    required this.targetLevel,
    required this.overallScore,
    required this.grammarScore,
    required this.vocabularyScore,
    required this.fluencyScore,
    required this.pronunciationScore,
    required this.dailyStreak,
    this.lastTrainedDate,
    required this.recurringWeaknesses,
  });

  factory LearningProfileModel.fromJson(Map<String, dynamic> json) {
    return LearningProfileModel(
      userId: json['userId'] ?? '',
      currentLevel: json['currentLevel'] ?? 'A1',
      targetLevel: json['targetLevel'] ?? 'B2',
      overallScore: (json['overallScore'] as num?)?.toDouble() ?? 0.0,
      grammarScore: (json['grammarScore'] as num?)?.toDouble() ?? 0.0,
      vocabularyScore: (json['vocabularyScore'] as num?)?.toDouble() ?? 0.0,
      fluencyScore: (json['fluencyScore'] as num?)?.toDouble() ?? 0.0,
      pronunciationScore: (json['pronunciationScore'] as num?)?.toDouble() ?? 0.0,
      dailyStreak: (json['dailyStreak'] as num?)?.toInt() ?? 0,
      lastTrainedDate: json['lastTrainedDate'],
      recurringWeaknesses: (json['recurringWeaknesses'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }
}

