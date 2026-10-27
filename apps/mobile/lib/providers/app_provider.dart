import 'package:flutter/material.dart';
import '../config/api_config.dart';
import '../models/user.dart';
import '../models/session.dart';
import '../models/evaluation.dart';
import '../models/assessment.dart';
import '../services/api_service.dart';

class AppProvider with ChangeNotifier {
  UserModel? _user;
  LearningProfileModel? _profile;
  DailySessionModel? _currentSession;
  EvaluationResultModel? _lastEvaluation;
  AssessmentItemModel? _currentAssessmentItem;
  AssessmentResultModel? _lastAssessmentResult;
  Map<String, dynamic>? _quota;

  // Admin states
  Map<String, dynamic>? _adminAnalytics;
  List<dynamic> _adminProviderCatalog = [];
  List<dynamic> _adminProviders = [];
  List<dynamic> _adminModels = [];
  List<dynamic> _adminRoutings = [];
  List<dynamic> _adminUsers = [];
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
  bool get isAdminLoading => _isAdminLoading;

  void clearError() {
    _errorMessage = null;
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
      _errorMessage = e.toString();
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
    } catch (e) {
      debugPrint('Admin fetch error: $e');
    } finally {
      _isAdminLoading = false;
      notifyListeners();
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
}
