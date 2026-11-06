import 'package:flutter/material.dart';
import '../config/api_config.dart';
import '../models/user.dart';
import '../models/session.dart';
import '../models/evaluation.dart';
import '../models/assessment.dart';
import '../models/learn.dart';
import '../services/api_service.dart';
import '../services/google_sign_in_service.dart';

class AppProvider with ChangeNotifier {
  UserModel? _user;
  LearningProfileModel? _profile;
  DailySessionModel? _currentSession;
  EvaluationResultModel? _lastEvaluation;
  AssessmentItemModel? _currentAssessmentItem;
  AssessmentResultModel? _lastAssessmentResult;
  Map<String, dynamic>? _quota;
  List<Map<String, dynamic>> _savedWords = [];
  String? _learningSupportContent;
  Map<String, dynamic>? _lastSessionSummary;
  Map<String, dynamic>? _googleAuthConfig;

  // Learn module state
  List<GrammarTopicModel> _grammarTopics = [];
  List<LearningTipModel> _learningTips = [];
  QuizModel? _activeQuiz;
  bool _isLearnLoading = false;

  // Admin states
  Map<String, dynamic>? _adminAnalytics;
  List<dynamic> _adminProviderCatalog = [];
  List<dynamic> _adminProviders = [];
  List<dynamic> _adminModels = [];
  List<dynamic> _adminRoutings = [];
  List<dynamic> _adminUsers = [];
  List<dynamic> _adminQuotaTiers = [];
  Map<String, dynamic>? _adminGoogleAuthConfig;
  bool _isAdminLoading = false;

  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get user => _user;
  LearningProfileModel? get profile => _profile;
  DailySessionModel? get currentSession => _currentSession;
  EvaluationResultModel? get lastEvaluation => _lastEvaluation;
  AssessmentItemModel? get currentAssessmentItem => _currentAssessmentItem;
  AssessmentResultModel? get lastAssessmentResult => _lastAssessmentResult;
  Map<String, dynamic>? get quota => _quota;
  List<Map<String, dynamic>> get savedWords => _savedWords;
  String? get learningSupportContent => _learningSupportContent;
  Map<String, dynamic>? get lastSessionSummary => _lastSessionSummary;
  Map<String, dynamic>? get googleAuthConfig => _googleAuthConfig;
  bool get isGoogleLoginEnabled =>
      _googleAuthConfig?['enabled'] == true &&
      (_googleAuthConfig?['webClientId']?.toString().isNotEmpty ?? false);
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _user != null;
  bool get isAdmin => _user?.role == 'ADMIN' || _user?.role == 'SUPER_ADMIN';

  // Admin getters
  Map<String, dynamic>? get adminAnalytics => _adminAnalytics;
  List<dynamic> get adminProviderCatalog => _adminProviderCatalog;
  List<dynamic> get adminProviders => _adminProviders;
  List<dynamic> get adminModels => _adminModels;
  List<dynamic> get adminRoutings => _adminRoutings;
  List<dynamic> get adminUsers => _adminUsers;
  List<dynamic> get adminQuotaTiers => _adminQuotaTiers;
  Map<String, dynamic>? get adminGoogleAuthConfig => _adminGoogleAuthConfig;
  bool get isAdminLoading => _isAdminLoading;

  // Learn module getters
  List<GrammarTopicModel> get grammarTopics => _grammarTopics;
  List<LearningTipModel> get learningTips => _learningTips;
  QuizModel? get activeQuiz => _activeQuiz;
  bool get isLearnLoading => _isLearnLoading;

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  void clearLearningSupport() {
    _learningSupportContent = null;
    notifyListeners();
  }

  // --- AUTH ---
  Future<bool> checkAuth() async {
    _isLoading = true;
    notifyListeners();
    try {
      final token = await ApiService.getToken();
      if (token == null || token.isEmpty) {
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final data = await ApiService.get(ApiConfig.me);
      _user = UserModel.fromJson(data['user']);
      _profile = LearningProfileModel.fromJson(data['profile']);
      await fetchQuota();
      if (isAdmin) {
        await fetchAdminData();
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (_) {
      await ApiService.removeToken();
      _user = null;
      _profile = null;
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final data = await ApiService.post(
        ApiConfig.login,
        body: {'email': email.trim(), 'password': password},
      );

      await ApiService.setToken(data['token']);
      _user = UserModel.fromJson(data['user']);
      _profile = LearningProfileModel.fromJson(data['profile']);
      await fetchQuota();
      if (isAdmin) {
        await fetchAdminData();
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> fetchGoogleAuthConfig() async {
    try {
      final data = await ApiService.get(ApiConfig.googleAuthConfig);
      _googleAuthConfig = Map<String, dynamic>.from(data as Map);
    } catch (_) {
      _googleAuthConfig = const {'enabled': false, 'webClientId': null};
    }
    notifyListeners();
  }

  Future<bool> loginWithGoogle() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final clientId = _googleAuthConfig?['webClientId']?.toString() ?? '';
      final idToken = await GoogleSignInService.instance.signIn(clientId);
      final data = await ApiService.post(
        ApiConfig.googleLogin,
        body: {'idToken': idToken},
      );
      await ApiService.setToken(data['token']);
      _user = UserModel.fromJson(data['user']);
      _profile = LearningProfileModel.fromJson(data['profile']);
      await fetchQuota();
      if (isAdmin) await fetchAdminData();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String name, String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final data = await ApiService.post(
        ApiConfig.register,
        body: {
          'name': name.trim(),
          'email': email.trim(),
          'password': password,
        },
      );

      await ApiService.setToken(data['token']);
      _user = UserModel.fromJson(data['user']);
      _profile = LearningProfileModel.fromJson(data['profile']);
      await fetchQuota();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await GoogleSignInService.instance.signOut();
    } catch (_) {}
    await ApiService.removeToken();
    _user = null;
    _profile = null;
    _currentSession = null;
    _lastEvaluation = null;
    _currentAssessmentItem = null;
    _lastAssessmentResult = null;
    _adminAnalytics = null;
    _adminProviderCatalog = [];
    _adminProviders = [];
    _adminModels = [];
    _adminRoutings = [];
    _adminUsers = [];
    _adminQuotaTiers = [];
    _adminGoogleAuthConfig = null;
    notifyListeners();
  }

  // --- QUOTA & PROFILE ---
  Future<void> fetchQuota() async {
    try {
      final data = await ApiService.get(ApiConfig.quota);
      _quota = data as Map<String, dynamic>;
      notifyListeners();
    } catch (_) {}
  }

  Future<void> refreshProfile() async {
    try {
      final data = await ApiService.get(ApiConfig.profile);
      _profile = LearningProfileModel.fromJson(data);
      notifyListeners();
    } catch (_) {}
  }

  Future<bool> selectStartingLevel(String level) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final data = await ApiService.put(
        ApiConfig.profile,
        body: {'currentLevel': level},
      );
      _profile = LearningProfileModel.fromJson(data);
      _lastAssessmentResult = null;
      _currentAssessmentItem = null;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // --- TRAINING SESSIONS ---
  Future<bool> startSession() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final data = await ApiService.post(ApiConfig.sessionStart);
      _currentSession = DailySessionModel.fromJson(data);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      if (e is ApiException && e.code == 'QUOTA_EXCEEDED') {
        await fetchQuota();
        _errorMessage = null;
      } else {
        _errorMessage = e.toString();
      }
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> fetchCurrentSession() async {
    try {
      final data = await ApiService.get(ApiConfig.sessionCurrent);
      _currentSession = DailySessionModel.fromJson(data);
      notifyListeners();
    } catch (_) {
      _currentSession = null;
      notifyListeners();
    }
  }

  Future<bool> finishSession() async {
    if (_currentSession == null) return false;
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final url = ApiConfig.sessionFinish(_currentSession!.id);
      final data = await ApiService.post(url);
      _lastSessionSummary = data as Map<String, dynamic>?;
      _currentSession = null;
      _lastEvaluation = null;
      await refreshProfile();
      await fetchQuota();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      // Graceful local completion fallback
      _lastSessionSummary = {
        'status': 'COMPLETED',
        'averageScore': _lastEvaluation?.overallScore.round() ?? 80,
      };
      _currentSession = null;
      _lastEvaluation = null;
      await refreshProfile();
      _isLoading = false;
      notifyListeners();
      return true;
    }
  }

  void clearSessionSummary() {
    _lastSessionSummary = null;
    notifyListeners();
  }

  Future<bool> submitAnswer(String questionId, String transcript) async {
    if (_currentSession == null) return false;
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final url = ApiConfig.sessionSubmit(_currentSession!.id, questionId);
      final data = await ApiService.post(url, body: {'transcript': transcript});

      _lastEvaluation = EvaluationResultModel.fromJson(data);
      await refreshProfile();
      await fetchQuota();
      await fetchCurrentSession();

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> requestLearningSupport({
    required String action,
    required String question,
    required String level,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    _learningSupportContent = null;
    notifyListeners();
    try {
      final data = await ApiService.post(
        ApiConfig.learningSupport,
        body: {'action': action, 'question': question, 'level': level},
      );
      _learningSupportContent = data['content'] as String?;
      _isLoading = false;
      notifyListeners();
      return _learningSupportContent != null;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> fetchSavedWords() async {
    try {
      final data = await ApiService.get(ApiConfig.vocabulary) as List<dynamic>;
      _savedWords = data
          .map((item) => Map<String, dynamic>.from(item as Map))
          .toList();
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  Future<bool> saveWord({
    required String word,
    required String translation,
    String? exampleSentence,
    String? level,
  }) async {
    try {
      await ApiService.post(
        ApiConfig.vocabulary,
        body: {
          'word': word,
          'translation': translation,
          'exampleSentence': exampleSentence,
          'level': level,
        },
      );
      await fetchSavedWords();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteSavedWord(String id) async {
    try {
      await ApiService.delete(ApiConfig.vocabularyItem(id));
      _savedWords.removeWhere((item) => item['id'] == id);
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  // --- CEFR ASSESSMENT ---
  Future<bool> startAssessment() async {
    _isLoading = true;
    _errorMessage = null;
    _lastAssessmentResult = null;
    notifyListeners();
    try {
      final data = await ApiService.post(ApiConfig.assessmentStart);
      _currentAssessmentItem = AssessmentItemModel.fromJson(data);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> submitAssessmentAnswer(String transcript) async {
    if (_currentAssessmentItem == null) return false;
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final url = ApiConfig.assessmentSubmit(_currentAssessmentItem!.id);
      final data = await ApiService.post(url, body: {'transcript': transcript});

      if (data['assessedLevel'] != null) {
        _lastAssessmentResult = AssessmentResultModel.fromJson(data);
        _currentAssessmentItem = null;
        await refreshProfile();
      } else {
        _currentAssessmentItem = AssessmentItemModel.fromJson(data);
      }

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // --- ADMIN ACTIONS ---
  Future<void> fetchAdminData() async {
    _isAdminLoading = true;
    notifyListeners();
    try {
      final analyticsData = await ApiService.get(ApiConfig.adminAnalytics);
      _adminAnalytics = analyticsData as Map<String, dynamic>;

      final providersData = await ApiService.get(ApiConfig.adminProviders);
      if (providersData is Map<String, dynamic>) {
        _adminProviderCatalog =
            (providersData['catalog'] as List<dynamic>?) ?? [];
        _adminProviders = (providersData['providers'] as List<dynamic>?) ?? [];
      } else {
        _adminProviders = providersData as List<dynamic>;
      }

      final modelsData = await ApiService.get(ApiConfig.adminModels);
      _adminModels = modelsData as List<dynamic>;

      final routingsData = await ApiService.get(ApiConfig.adminRoutings);
      _adminRoutings = routingsData as List<dynamic>;

      final usersData = await ApiService.get(ApiConfig.adminUsers);
      _adminUsers = usersData as List<dynamic>;

      final quotaTiersData = await ApiService.get(ApiConfig.adminQuotaTiers);
      _adminQuotaTiers = quotaTiersData as List<dynamic>;

      final googleAuthData = await ApiService.get(ApiConfig.adminGoogleAuth);
      _adminGoogleAuthConfig = Map<String, dynamic>.from(googleAuthData as Map);
    } catch (e) {
      debugPrint('Admin fetch error: $e');
    } finally {
      _isAdminLoading = false;
      notifyListeners();
    }
  }

  Future<bool> saveGoogleAuthConfig(Map<String, dynamic> value) async {
    _errorMessage = null;
    notifyListeners();
    try {
      final data = await ApiService.put(ApiConfig.adminGoogleAuth, body: value);
      _adminGoogleAuthConfig = Map<String, dynamic>.from(data as Map);
      await fetchGoogleAuthConfig();
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> createQuotaTier(Map<String, dynamic> value) async {
    try {
      await ApiService.post(ApiConfig.adminQuotaTiers, body: value);
      await fetchAdminData();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateQuotaTier(String id, Map<String, dynamic> value) async {
    try {
      await ApiService.put(ApiConfig.adminQuotaTier(id), body: value);
      await fetchAdminData();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> assignUserQuotaTier(String userId, String tierId) async {
    try {
      await ApiService.put(
        ApiConfig.adminUserQuotaTier(userId),
        body: {'quotaTierId': tierId},
      );
      await fetchAdminData();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateRouting({
    required String id,
    String? primaryModelId,
    String? fallbackModelId,
    String? systemPromptTpl,
    double? temperature,
    int? maxTokens,
    int? timeoutMs,
  }) async {
    try {
      await ApiService.put(
        ApiConfig.adminRoutings,
        body: {
          'id': id,
          'primaryModelId': ?primaryModelId,
          'fallbackModelId': ?fallbackModelId,
          'systemPromptTpl': ?systemPromptTpl,
          'temperature': ?temperature,
          'maxTokens': ?maxTokens,
          'timeoutMs': ?timeoutMs,
        },
      );
      await fetchAdminData();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> createModel({
    required String providerId,
    required String modelIdentifier,
    required String displayName,
    int? contextWindow,
    double? costPerInput1k,
    double? costPerOutput1k,
  }) async {
    try {
      await ApiService.post(
        ApiConfig.adminModels,
        body: {
          'providerId': providerId,
          'modelIdentifier': modelIdentifier,
          'displayName': displayName,
          'contextWindow': contextWindow ?? 128000,
          'costPerInput1k': costPerInput1k ?? 0.0015,
          'costPerOutput1k': costPerOutput1k ?? 0.006,
        },
      );
      await fetchAdminData();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> saveAndTestProvider({
    required String identifier,
    required String apiKey,
    String? managementKey,
    String? baseUrl,
  }) async {
    _errorMessage = null;
    notifyListeners();
    try {
      await ApiService.post(
        ApiConfig.adminProviders,
        body: {
          'identifier': identifier,
          if (apiKey.isNotEmpty) 'apiKey': apiKey,
          if (managementKey != null && managementKey.isNotEmpty)
            'managementKey': managementKey,
          if (baseUrl != null && baseUrl.isNotEmpty) 'baseUrl': baseUrl,
        },
      );
      await fetchAdminData();
      final configured = _adminProviders.cast<dynamic>().where(
        (item) => item is Map && item['identifier'] == identifier,
      );
      if (configured.isNotEmpty) {
        await ApiService.post(
          ApiConfig.adminProviderTest('${configured.first['id']}'),
        );
      }
      await fetchAdminData();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> testAdminProvider(String providerId) async {
    try {
      await ApiService.post(ApiConfig.adminProviderTest(providerId));
      await fetchAdminData();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> refreshAdminProviderQuota(String providerId) async {
    try {
      await ApiService.post(ApiConfig.adminProviderQuota(providerId));
      await fetchAdminData();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<List<dynamic>> discoverAdminProviderModels(String providerId) async {
    try {
      final data = await ApiService.post(
        ApiConfig.adminProviderModels(providerId),
      );
      await fetchAdminData();
      return data as List<dynamic>;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return [];
    }
  }

  Future<bool> importAdminProviderModels(
    String providerId,
    List<String> modelIdentifiers,
  ) async {
    try {
      await ApiService.put(
        ApiConfig.adminProviderModels(providerId),
        body: {'modelIdentifiers': modelIdentifiers},
      );
      await fetchAdminData();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  // ==========================================
  // LEARN & 50-QUESTION QUIZ METHODS
  // ==========================================

  void clearActiveQuiz() {
    _activeQuiz = null;
    notifyListeners();
  }

  Future<void> fetchGrammarTopics({String? level}) async {
    _isLearnLoading = true;
    notifyListeners();
    try {
      final url = level != null ? '${ApiConfig.learnGrammar}?level=$level' : ApiConfig.learnGrammar;
      final res = await ApiService.get(url);
      final list = (res['topics'] as List<dynamic>? ?? []);
      _grammarTopics = list
          .map((item) => GrammarTopicModel.fromJson(item as Map<String, dynamic>))
          .toList();
      _isLearnLoading = false;
      notifyListeners();
    } catch (e) {
      _isLearnLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  Future<void> fetchLearningTips({String? category}) async {
    _isLearnLoading = true;
    notifyListeners();
    try {
      final url = ApiConfig.learnTips(category: category);
      final res = await ApiService.get(url);
      final list = (res['tips'] as List<dynamic>? ?? []);
      _learningTips = list
          .map((item) => LearningTipModel.fromJson(item as Map<String, dynamic>))
          .toList();
      _isLearnLoading = false;
      notifyListeners();
    } catch (e) {
      _isLearnLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  Future<QuizModel?> fetch50QuestionQuiz({String? level, String? topicId}) async {
    _isLearnLoading = true;
    notifyListeners();
    try {
      final url = ApiConfig.learnQuiz(level: level, topicId: topicId);
      final res = await ApiService.get(url);
      final quizData = res['quiz'] as Map<String, dynamic>;
      _activeQuiz = QuizModel.fromJson(quizData);
      _isLearnLoading = false;
      notifyListeners();
      return _activeQuiz;
    } catch (e) {
      _isLearnLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
      return null;
    }
  }

  Future<String?> askAiGrammarExplanation({
    required String topic,
    required String query,
    required String level,
  }) async {
    try {
      final res = await ApiService.post(
        ApiConfig.learnExplain,
        body: {
          'topic': topic,
          'query': query,
          'level': level,
        },
      );
      return res['explanation'] as String?;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return null;
    }
  }
}
