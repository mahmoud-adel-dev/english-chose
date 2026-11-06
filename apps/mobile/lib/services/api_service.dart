import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'log_service.dart';

class ApiException implements Exception {
  final String code;
  final String message;
  final dynamic details;
  final int? statusCode;

  ApiException({
    required this.code,
    required this.message,
    this.details,
    this.statusCode,
  });

  @override
  String toString() => message;
}

class ApiService {
  static const String tokenKey = 'auth_token';
  static const Duration requestTimeout = Duration(seconds: 30);

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(tokenKey);
  }

  static Future<void> setToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(tokenKey, token);
  }

  static Future<void> removeToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(tokenKey);
  }

  static Future<Map<String, String>> _headers() async {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    final token = await getToken();
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static Future<dynamic> get(String url) async {
    final sw = Stopwatch()..start();
    LogService().logRequest(method: 'GET', url: url);
    try {
      final headers = await _headers();
      final res = await http
          .get(Uri.parse(url), headers: headers)
          .timeout(requestTimeout);
      sw.stop();
      LogService().logResponse(
        method: 'GET',
        url: url,
        statusCode: res.statusCode,
        latencyMs: sw.elapsedMilliseconds,
        responseBody: res.body,
      );
      return _handleResponse(res);
    } on TimeoutException {
      sw.stop();
      LogService().logError(
        method: 'GET',
        url: url,
        error: 'Connection timed out (${sw.elapsedMilliseconds}ms)',
        statusCode: 408,
      );
      throw ApiException(
        code: 'TIMEOUT',
        message: 'Connection timed out. Please check your network and try again.',
      );
    } catch (e) {
      sw.stop();
      LogService().logError(
        method: 'GET',
        url: url,
        error: e.toString(),
        statusCode: e is ApiException ? e.statusCode : 500,
      );
      if (e is ApiException) rethrow;
      throw ApiException(
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to server: $e',
      );
    }
  }

  static Future<dynamic> post(String url, {Map<String, dynamic>? body}) async {
    final sw = Stopwatch()..start();
    final bodyStr = body != null ? jsonEncode(body) : null;
    LogService().logRequest(method: 'POST', url: url, body: bodyStr);
    try {
      final headers = await _headers();
      final res = await http
          .post(
            Uri.parse(url),
            headers: headers,
            body: bodyStr,
          )
          .timeout(requestTimeout);
      sw.stop();
      LogService().logResponse(
        method: 'POST',
        url: url,
        statusCode: res.statusCode,
        latencyMs: sw.elapsedMilliseconds,
        responseBody: res.body,
      );
      return _handleResponse(res);
    } on TimeoutException {
      sw.stop();
      LogService().logError(
        method: 'POST',
        url: url,
        error: 'Connection timed out (${sw.elapsedMilliseconds}ms)',
        statusCode: 408,
      );
      throw ApiException(
        code: 'TIMEOUT',
        message: 'Connection timed out. Please check your network and try again.',
      );
    } catch (e) {
      sw.stop();
      LogService().logError(
        method: 'POST',
        url: url,
        error: e.toString(),
        statusCode: e is ApiException ? e.statusCode : 500,
      );
      if (e is ApiException) rethrow;
      throw ApiException(
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to server: $e',
      );
    }
  }

  static Future<dynamic> put(String url, {Map<String, dynamic>? body}) async {
    final sw = Stopwatch()..start();
    final bodyStr = body != null ? jsonEncode(body) : null;
    LogService().logRequest(method: 'PUT', url: url, body: bodyStr);
    try {
      final headers = await _headers();
      final res = await http
          .put(
            Uri.parse(url),
            headers: headers,
            body: bodyStr,
          )
          .timeout(requestTimeout);
      sw.stop();
      LogService().logResponse(
        method: 'PUT',
        url: url,
        statusCode: res.statusCode,
        latencyMs: sw.elapsedMilliseconds,
        responseBody: res.body,
      );
      return _handleResponse(res);
    } on TimeoutException {
      sw.stop();
      LogService().logError(
        method: 'PUT',
        url: url,
        error: 'Connection timed out (${sw.elapsedMilliseconds}ms)',
        statusCode: 408,
      );
      throw ApiException(
        code: 'TIMEOUT',
        message: 'Connection timed out. Please check your network and try again.',
      );
    } catch (e) {
      sw.stop();
      LogService().logError(
        method: 'PUT',
        url: url,
        error: e.toString(),
        statusCode: e is ApiException ? e.statusCode : 500,
      );
      if (e is ApiException) rethrow;
      throw ApiException(
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to server: $e',
      );
    }
  }

  static Future<dynamic> delete(String url) async {
    final sw = Stopwatch()..start();
    LogService().logRequest(method: 'DELETE', url: url);
    try {
      final headers = await _headers();
      final res = await http
          .delete(Uri.parse(url), headers: headers)
          .timeout(requestTimeout);
      sw.stop();
      LogService().logResponse(
        method: 'DELETE',
        url: url,
        statusCode: res.statusCode,
        latencyMs: sw.elapsedMilliseconds,
        responseBody: res.body,
      );
      return _handleResponse(res);
    } on TimeoutException {
      sw.stop();
      LogService().logError(
        method: 'DELETE',
        url: url,
        error: 'Connection timed out (${sw.elapsedMilliseconds}ms)',
        statusCode: 408,
      );
      throw ApiException(
        code: 'TIMEOUT',
        message: 'Connection timed out. Please check your network and try again.',
      );
    } catch (e) {
      sw.stop();
      LogService().logError(
        method: 'DELETE',
        url: url,
        error: e.toString(),
        statusCode: e is ApiException ? e.statusCode : 500,
      );
      if (e is ApiException) rethrow;
      throw ApiException(
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to server: $e',
      );
    }
  }

  static dynamic _handleResponse(http.Response response) {
    dynamic jsonBody;
    try {
      jsonBody = jsonDecode(response.body);
    } catch (_) {
      throw ApiException(
        code: 'PARSE_ERROR',
        message: 'Server returned unexpected response (${response.statusCode})',
        statusCode: response.statusCode,
      );
    }

    if (jsonBody is Map<String, dynamic>) {
      if (jsonBody['success'] == true) {
        return jsonBody['data'];
      } else {
        final err = jsonBody['error'] ?? {};
        throw ApiException(
          code: err['code'] ?? 'UNKNOWN_ERROR',
          message: err['message'] ?? 'An unexpected error occurred',
          details: err['details'],
          statusCode: response.statusCode,
        );
      }
    }

    if (response.statusCode >= 400) {
      throw ApiException(
        code: 'HTTP_${response.statusCode}',
        message: 'Request failed with status ${response.statusCode}',
        statusCode: response.statusCode,
      );
    }

    return jsonBody;
  }
}
