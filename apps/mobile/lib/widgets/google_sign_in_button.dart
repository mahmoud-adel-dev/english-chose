import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';

import 'google_sign_in_web_control.dart';

class GoogleSignInButton extends StatelessWidget {
  final bool enabled;
  final bool loading;
  final VoidCallback? onPressed;
  final String clientId;
  final ValueChanged<String>? onIdToken;
  final ValueChanged<Object>? onError;

  const GoogleSignInButton({
    super.key,
    required this.enabled,
    this.loading = false,
    this.onPressed,
    this.clientId = '',
    this.onIdToken,
    this.onError,
  });

  @override
  Widget build(BuildContext context) {
    final Widget control;
    if (kIsWeb && enabled) {
      control = buildGoogleWebSignInControl(
        clientId: clientId,
        onIdToken: onIdToken ?? (_) {},
        onError: onError ?? (_) {},
      );
    } else {
      control = OutlinedButton.icon(
        onPressed: loading || !enabled ? null : onPressed,
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
        label: Text(
          loading ? 'Connecting to Google...' : 'Continue with Google',
        ),
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 14),
        ),
      );
    }

    return AbsorbPointer(
      absorbing: loading,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 150),
        opacity: loading ? 0.6 : 1,
        child: control,
      ),
    );
  }
}
