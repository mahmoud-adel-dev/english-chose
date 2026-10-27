class ApiConfig {
  static const String baseUrl = 'http://localhost:3000/api';

  static const String login = '$baseUrl/auth/login';
  static const String register = '$baseUrl/auth/register';
  static const String me = '$baseUrl/auth/me';
  static const String profile = '$baseUrl/profile';
  static const String quota = '$baseUrl/quota';
  static const String sessionStart = '$baseUrl/sessions/start';
  static const String sessionCurrent = '$baseUrl/sessions/current';
  static String sessionSubmit(String sessionId, String questionId) =>
      '$baseUrl/sessions/$sessionId/questions/$questionId/submit';
  static const String assessmentStart = '$baseUrl/assessment/start';
  static String assessmentSubmit(String id) => '$baseUrl/assessment/$id/submit';

  // Admin Endpoints
  static const String adminAnalytics = '$baseUrl/admin/analytics';
  static const String adminProviders = '$baseUrl/admin/providers';
  static String adminProviderTest(String id) =>
      '$baseUrl/admin/providers/$id/test';
  static String adminProviderQuota(String id) =>
      '$baseUrl/admin/providers/$id/quota';
  static String adminProviderModels(String id) =>
      '$baseUrl/admin/providers/$id/models';
  static const String adminModels = '$baseUrl/admin/models';
  static const String adminRoutings = '$baseUrl/admin/routings';
  static const String adminUsers = '$baseUrl/admin/users';
}
