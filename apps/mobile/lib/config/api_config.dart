/// Centralized API configuration for English Coach mobile application.
/// Defaults to the production Vercel deployment: https://english-chose.vercel.app/api
/// Can be overridden at build/run time using:
/// `flutter run --dart-define=API_BASE_URL=http://<host>:<port>/api`
class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://english-chose.vercel.app/api',
  );

  // Authentication endpoints
  static const String login = '$baseUrl/auth/login';
  static const String register = '$baseUrl/auth/register';
  static const String me = '$baseUrl/auth/me';

  // Learner profile & Quotas
  static const String profile = '$baseUrl/profile';
  static const String quota = '$baseUrl/quota';

  // Daily Training Sessions
  static const String sessionStart = '$baseUrl/sessions/start';
  static const String sessionCurrent = '$baseUrl/sessions/current';
  static String sessionSubmit(String sessionId, String questionId) =>
      '$baseUrl/sessions/$sessionId/questions/$questionId/submit';

  // CEFR Placement Assessment
  static const String assessmentStart = '$baseUrl/assessment/start';
  static String assessmentSubmit(String id) => '$baseUrl/assessment/$id/submit';

  // Admin & Governance Endpoints
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
