import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

enum LogType { apiRequest, apiResponse, apiError, appEvent }

class LogEntry {
  final String id;
  final DateTime timestamp;
  final LogType type;
  final String title;
  final String? url;
  final String? method;
  final int? statusCode;
  final int? latencyMs;
  final String? requestBody;
  final String? responseBody;
  final String? errorMessage;
  final bool isError;

  LogEntry({
    required this.id,
    required this.timestamp,
    required this.type,
    required this.title,
    this.url,
    this.method,
    this.statusCode,
    this.latencyMs,
    this.requestBody,
    this.responseBody,
    this.errorMessage,
    this.isError = false,
  });

  String get formattedTime {
    final h = timestamp.hour.toString().padLeft(2, '0');
    final m = timestamp.minute.toString().padLeft(2, '0');
    final s = timestamp.second.toString().padLeft(2, '0');
    final ms = timestamp.millisecond.toString().padLeft(3, '0');
    return '$h:$m:$s.$ms';
  }

  String get stage {
    switch (type) {
      case LogType.apiRequest:
        return 'Sending request';
      case LogType.apiResponse:
      case LogType.apiError:
        return statusCode == null ? 'Network / device' : 'Server response';
      case LogType.appEvent:
        return 'Application';
    }
  }

  String get statusExplanation {
    final code = statusCode;
    if (code == null) {
      return isError
          ? 'The request did not reach a valid server response.'
          : 'Local application event.';
    }
    if (code >= 200 && code < 300) {
      return 'The server accepted and completed the request.';
    }
    if (code == 400) return 'The server rejected invalid or incomplete input.';
    if (code == 401) {
      return 'The server rejected authentication for this request.';
    }
    if (code == 403) {
      return 'The account is authenticated but lacks permission.';
    }
    if (code == 404) {
      return 'The requested API route or resource was not found.';
    }
    if (code == 408) return 'The request exceeded the allowed response time.';
    if (code == 409) return 'The request conflicts with existing stored data.';
    if (code == 429) return 'The request quota or rate limit was exceeded.';
    if (code >= 500) return 'The server failed while processing the request.';
    return 'The server returned HTTP status $code.';
  }

  String get likelyCause {
    final code = statusCode;
    if (code == 401) {
      return 'Expired token, invalid credentials, or Google sign-in configuration mismatch.';
    }
    if (code == 403) {
      return 'This feature requires an administrator account or an enabled account.';
    }
    if (code == 404) {
      return 'Wrong base URL, missing deployment route, or deleted record.';
    }
    if (code == 408) {
      return 'Slow connection, unavailable server, or an upstream AI timeout.';
    }
    if (code == 409) {
      return 'The same email, word, or unique record already exists.';
    }
    if (code == 429) {
      return 'Daily quota or provider rate limit has been reached.';
    }
    if (code != null && code >= 500) {
      return 'Database, migration, server configuration, or upstream provider failure.';
    }
    if (isError) {
      return 'Network connectivity, malformed response, or a device-side exception.';
    }
    return 'No error detected.';
  }
}

const _sensitiveKeys = {
  'authorization',
  'password',
  'token',
  'idtoken',
  'accesstoken',
  'refreshtoken',
  'apikey',
  'clientsecret',
  'secret',
};

String? redactSensitiveLogData(String? raw) {
  if (raw == null || raw.isEmpty) return raw;
  try {
    dynamic redact(dynamic value) {
      if (value is List) return value.map(redact).toList();
      if (value is Map) {
        return value.map((key, item) {
          final normalized = key
              .toString()
              .replaceAll(RegExp(r'[^a-zA-Z]'), '')
              .toLowerCase();
          return MapEntry(
            key,
            _sensitiveKeys.contains(normalized) ? '[REDACTED]' : redact(item),
          );
        });
      }
      return value;
    }

    return jsonEncode(redact(jsonDecode(raw)));
  } catch (_) {
    return raw.replaceAll(
      RegExp(
        r'((?:password|token|api[_-]?key|client[_-]?secret)\s*[=:]\s*)[^\s,}]+',
        caseSensitive: false,
      ),
      r'$1[REDACTED]',
    );
  }
}

class LogService extends ChangeNotifier {
  static final LogService _instance = LogService._internal();
  factory LogService() => _instance;
  LogService._internal();

  static const int maxLogs = 100;
  final List<LogEntry> _logs = [];

  List<LogEntry> get logs => List.unmodifiable(_logs);
  int get errorCount => _logs.where((l) => l.isError).length;

  void logRequest({required String method, required String url, String? body}) {
    final entry = LogEntry(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      timestamp: DateTime.now(),
      type: LogType.apiRequest,
      title: '$method ${Uri.tryParse(url)?.path ?? url}',
      method: method,
      url: url,
      requestBody: redactSensitiveLogData(body),
      isError: false,
    );
    _addEntry(entry);
  }

  void logResponse({
    required String method,
    required String url,
    required int statusCode,
    required int latencyMs,
    String? responseBody,
  }) {
    final isErr = statusCode >= 400;
    final entry = LogEntry(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      timestamp: DateTime.now(),
      type: isErr ? LogType.apiError : LogType.apiResponse,
      title:
          '$method ${Uri.tryParse(url)?.path ?? url} → $statusCode (${latencyMs}ms)',
      method: method,
      url: url,
      statusCode: statusCode,
      latencyMs: latencyMs,
      responseBody: redactSensitiveLogData(responseBody),
      isError: isErr,
    );
    _addEntry(entry);
  }

  void logError({
    required String method,
    required String url,
    required String error,
    int? statusCode,
  }) {
    final entry = LogEntry(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      timestamp: DateTime.now(),
      type: LogType.apiError,
      title: '$method ${Uri.tryParse(url)?.path ?? url} ❌ ERROR',
      method: method,
      url: url,
      statusCode: statusCode,
      errorMessage: redactSensitiveLogData(error),
      isError: true,
    );
    _addEntry(entry);
  }

  void logEvent(String title, {String? details, bool isError = false}) {
    final entry = LogEntry(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      timestamp: DateTime.now(),
      type: LogType.appEvent,
      title: title,
      errorMessage: redactSensitiveLogData(details),
      isError: isError,
    );
    _addEntry(entry);
  }

  void _addEntry(LogEntry entry) {
    if (_logs.length >= maxLogs) {
      _logs.removeLast();
    }
    _logs.insert(0, entry);
    notifyListeners();
  }

  void clear() {
    _logs.clear();
    notifyListeners();
  }

  Future<void> copyAll() async {
    final buffer = StringBuffer();
    buffer.writeln('=== ENGLISH COACH DEBUG LOGS ===');
    buffer.writeln('Generated at: ${DateTime.now().toIso8601String()}');
    buffer.writeln('Total logs: ${_logs.length} (Errors: $errorCount)\n');

    for (final l in _logs) {
      buffer.writeln(
        '[${l.formattedTime}] [${l.type.name.toUpperCase()}] ${l.title}',
      );
      if (l.url != null) buffer.writeln('  URL: ${l.url}');
      if (l.statusCode != null) buffer.writeln('  Status: ${l.statusCode}');
      if (l.latencyMs != null) buffer.writeln('  Latency: ${l.latencyMs}ms');
      if (l.requestBody != null && l.requestBody!.isNotEmpty) {
        buffer.writeln('  Request: ${l.requestBody}');
      }
      if (l.responseBody != null && l.responseBody!.isNotEmpty) {
        buffer.writeln('  Response: ${l.responseBody}');
      }
      if (l.errorMessage != null && l.errorMessage!.isNotEmpty) {
        buffer.writeln('  Error: ${l.errorMessage}');
      }
      buffer.writeln('---');
    }

    await Clipboard.setData(ClipboardData(text: buffer.toString()));
  }
}
