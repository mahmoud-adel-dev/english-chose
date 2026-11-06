import 'dart:convert';
import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../services/log_service.dart';

class LocalLogsScreen extends StatefulWidget {
  const LocalLogsScreen({super.key});

  @override
  State<LocalLogsScreen> createState() => _LocalLogsScreenState();
}

class _LocalLogsScreenState extends State<LocalLogsScreen> {
  final _searchController = TextEditingController();
  String _filter = 'ALL'; // ALL | ERRORS | API
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: LogService(),
      builder: (context, _) {
        final allLogs = LogService().logs;
        final filteredLogs = allLogs.where((l) {
          if (_filter == 'ERRORS' && !l.isError) return false;
          if (_filter == 'API' &&
              (l.type != LogType.apiRequest && l.type != LogType.apiResponse && l.type != LogType.apiError)) {
            return false;
          }
          if (_searchQuery.isNotEmpty) {
            final query = _searchQuery.toLowerCase();
            final matchesTitle = l.title.toLowerCase().contains(query);
            final matchesUrl = l.url?.toLowerCase().contains(query) ?? false;
            final matchesErr = l.errorMessage?.toLowerCase().contains(query) ?? false;
            final matchesBody = (l.requestBody?.toLowerCase().contains(query) ?? false) ||
                (l.responseBody?.toLowerCase().contains(query) ?? false);
            return matchesTitle || matchesUrl || matchesErr || matchesBody;
          }
          return true;
        }).toList();

        return Scaffold(
          appBar: AppBar(
            title: Row(
              children: [
                const Icon(Icons.receipt_long_rounded, color: AppTheme.primaryColor),
                const SizedBox(width: 8),
                const Text('Diagnostic Logs'),
                const SizedBox(width: 8),
                if (LogService().errorCount > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppTheme.errorColor,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${LogService().errorCount} Errors',
                      style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
              ],
            ),
            actions: [
              IconButton(
                tooltip: 'Copy all logs',
                icon: const Icon(Icons.copy_rounded),
                onPressed: () async {
                  await LogService().copyAll();
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('All logs copied to clipboard!')),
                    );
                  }
                },
              ),
              IconButton(
                tooltip: 'Clear logs',
                icon: const Icon(Icons.delete_outline_rounded),
                onPressed: () => LogService().clear(),
              ),
            ],
          ),
          body: Column(
            children: [
              // Search & Filter header
              Container(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                color: Colors.white,
                child: Column(
                  children: [
                    TextField(
                      controller: _searchController,
                      decoration: InputDecoration(
                        hintText: 'Search URL, errors, status code...',
                        prefixIcon: const Icon(Icons.search_rounded, size: 20),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear_rounded, size: 18),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() => _searchQuery = '');
                                },
                              )
                            : null,
                        contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                        isDense: true,
                      ),
                      onChanged: (val) => setState(() => _searchQuery = val.trim()),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _filterChip('ALL', 'All (${allLogs.length})'),
                        const SizedBox(width: 8),
                        _filterChip(
                          'ERRORS',
                          'Errors (${LogService().errorCount})',
                          badgeColor: LogService().errorCount > 0 ? AppTheme.errorColor : null,
                        ),
                        const SizedBox(width: 8),
                        _filterChip('API', 'API Calls'),
                      ],
                    ),
                  ],
                ),
              ),
              const Divider(height: 1, color: Color(0xFFE2E8F0)),

              // Logs List
              Expanded(
                child: filteredLogs.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.check_circle_outline_rounded,
                                size: 48, color: Colors.grey.shade400),
                            const SizedBox(height: 12),
                            Text(
                              _searchQuery.isNotEmpty
                                  ? 'No logs matching "$_searchQuery"'
                                  : 'No logs recorded yet.',
                              style: TextStyle(color: Colors.grey.shade600),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        itemCount: filteredLogs.length,
                        itemBuilder: (context, index) {
                          final log = filteredLogs[index];
                          return _LogItemCard(log: log);
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _filterChip(String filterKey, String label, {Color? badgeColor}) {
    final isSelected = _filter == filterKey;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) setState(() => _filter = filterKey);
      },
      selectedColor: badgeColor ?? AppTheme.primaryColor.withValues(alpha: 0.15),
      labelStyle: TextStyle(
        fontSize: 12,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        color: isSelected
            ? (badgeColor ?? AppTheme.primaryColor)
            : const Color(0xFF64748B),
      ),
    );
  }
}

class _LogItemCard extends StatelessWidget {
  final LogEntry log;
  const _LogItemCard({required this.log});

  @override
  Widget build(BuildContext context) {
    final isErr = log.isError;
    final color = isErr
        ? AppTheme.errorColor
        : (log.statusCode != null && log.statusCode! < 300)
            ? AppTheme.successColor
            : AppTheme.primaryColor;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      elevation: 0.5,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(
          color: isErr ? AppTheme.errorColor.withValues(alpha: 0.4) : const Color(0xFFE2E8F0),
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () => _showDetailsSheet(context),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      log.statusCode != null ? '${log.statusCode}' : log.method ?? 'EVENT',
                      style: TextStyle(
                        color: color,
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      log.title,
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: isErr ? AppTheme.errorColor : const Color(0xFF0F172A),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Text(
                    log.formattedTime,
                    style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                  ),
                ],
              ),
              if (log.latencyMs != null) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.timer_outlined, size: 12, color: Color(0xFF94A3B8)),
                    const SizedBox(width: 4),
                    Text(
                      '${log.latencyMs}ms',
                      style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                    ),
                  ],
                ),
              ],
              if (log.errorMessage != null) ...[
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    log.errorMessage!,
                    style: const TextStyle(color: Color(0xFFB91C1C), fontSize: 11),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _showDetailsSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.7,
          maxChildSize: 0.95,
          minChildSize: 0.4,
          builder: (_, controller) {
            return Padding(
              padding: const EdgeInsets.all(20),
              child: ListView(
                controller: controller,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Log Details',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const Divider(),
                  _detailRow('Timestamp', log.timestamp.toIso8601String()),
                  if (log.method != null) _detailRow('Method', log.method!),
                  if (log.statusCode != null) _detailRow('Status Code', '${log.statusCode}'),
                  if (log.latencyMs != null) _detailRow('Latency', '${log.latencyMs} ms'),
                  if (log.url != null) _detailRow('URL', log.url!),
                  if (log.errorMessage != null) ...[
                    const SizedBox(height: 12),
                    const Text('Error Message:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.errorColor)),
                    const SizedBox(height: 4),
                    _codeBlock(log.errorMessage!, color: const Color(0xFFFEF2F2)),
                  ],
                  if (log.requestBody != null) ...[
                    const SizedBox(height: 12),
                    const Text('Request Payload:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 4),
                    _codeBlock(_prettyJson(log.requestBody!)),
                  ],
                  if (log.responseBody != null) ...[
                    const SizedBox(height: 12),
                    const Text('Response Body:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 4),
                    _codeBlock(_prettyJson(log.responseBody!)),
                  ],
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: Color(0xFF64748B)),
            ),
          ),
          Expanded(
            child: SelectableText(
              value,
              style: const TextStyle(fontSize: 12, color: Color(0xFF0F172A)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _codeBlock(String text, {Color? color}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color ?? const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: SelectableText(
        text,
        style: const TextStyle(fontFamily: 'monospace', fontSize: 11, height: 1.4),
      ),
    );
  }

  String _prettyJson(String raw) {
    try {
      final decoded = jsonDecode(raw);
      return const JsonEncoder.withIndent('  ').convert(decoded);
    } catch (_) {
      return raw;
    }
  }
}

