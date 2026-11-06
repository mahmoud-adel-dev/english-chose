import 'dart:async';

import 'package:flutter/material.dart';

import '../services/quota_countdown.dart';

class QuotaLimitNotice extends StatefulWidget {
  final String? resetsAtUtc;
  final DateTime Function() now;
  final Future<void> Function()? onExpired;

  const QuotaLimitNotice({
    super.key,
    required this.resetsAtUtc,
    DateTime Function()? now,
    this.onExpired,
  }) : now = now ?? DateTime.now;

  @override
  State<QuotaLimitNotice> createState() => _QuotaLimitNoticeState();
}

class _QuotaLimitNoticeState extends State<QuotaLimitNotice> {
  Timer? _timer;
  Duration? _remaining;
  bool _expiryHandled = false;

  @override
  void initState() {
    super.initState();
    _tick();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
  }

  void _tick() {
    final remaining = quotaResetRemaining(widget.resetsAtUtc, widget.now());
    if (mounted) setState(() => _remaining = remaining);

    if (remaining == Duration.zero && !_expiryHandled) {
      _expiryHandled = true;
      _timer?.cancel();
      final onExpired = widget.onExpired;
      if (onExpired != null) unawaited(onExpired());
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final countdown = _remaining == null
        ? 'Renews at the next daily reset'
        : 'Next session available in ${formatQuotaCountdown(_remaining!)}';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7ED),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFED7AA)),
      ),
      child: Row(
        children: [
          const Icon(Icons.schedule_rounded, color: Color(0xFFEA580C)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Daily sessions completed',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 3),
                Text(countdown, style: const TextStyle(fontSize: 13)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
