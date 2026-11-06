import 'package:flutter/material.dart';

class GoogleSignInButton extends StatelessWidget {
  final bool enabled;
  final bool loading;
  final VoidCallback? onPressed;

  const GoogleSignInButton({
    super.key,
    required this.enabled,
    this.loading = false,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    if (!enabled) return const SizedBox.shrink();
    return OutlinedButton.icon(
      onPressed: loading ? null : onPressed,
      icon: loading
          ? const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : const Text(
              'G',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
            ),
      label: Text(loading ? 'Connecting to Google...' : 'Continue with Google'),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 14),
      ),
    );
  }
}
