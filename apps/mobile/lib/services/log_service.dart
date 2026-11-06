import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

enum LogType {
  apiRequest,
  apiResponse,
  apiError,
  appEvent,
}

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
}

class LogService extends ChangeNotifier {
  static final LogService _instance = LogService._internal();
  factory LogService() => _instance;
  LogService._internal();

  static const int maxLogs = 100;
  final List<LogEntry> _logs = [];

  List<LogEntry> get logs => List.unmodifiable(_logs);
  int get errorCount => _logs.where((l) => l.isError).length;

  void logRequest({
    required String method,
    required String url,
    String? body,
  }) {
    final entry = LogEntry(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      timestamp: DateTime.now(),
      type: LogType.apiRequest,
      title: '$method ${Uri.tryParse(url)?.path ?? url}',
      method: method,
      url: url,
      requestBody: body,
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
      title: '$method ${Uri.tryParse(url)?.path ?? url} → $statusCode (${latencyMs}ms)',
      method: method,
      url: url,
      statusCode: statusCode,
      latencyMs: latencyMs,
      responseBody: responseBody,
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
      errorMessage: error,
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
      errorMessage: details,
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
      buffer.writeln('[${l.formattedTime}] [${l.type.name.toUpperCase()}] ${l.title}');
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
