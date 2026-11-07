import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_sign_in_web/web_only.dart' as google_web;

import '../services/google_sign_in_service.dart';

Widget buildGoogleWebSignInControl({
  required String clientId,
  required ValueChanged<String> onIdToken,
  required ValueChanged<Object> onError,
}) {
  return _GoogleWebSignInControl(
    clientId: clientId,
    onIdToken: onIdToken,
    onError: onError,
  );
}

class _GoogleWebSignInControl extends StatefulWidget {
  final String clientId;
  final ValueChanged<String> onIdToken;
  final ValueChanged<Object> onError;

  const _GoogleWebSignInControl({
    required this.clientId,
    required this.onIdToken,
    required this.onError,
  });

  @override
  State<_GoogleWebSignInControl> createState() =>
      _GoogleWebSignInControlState();
}

class _GoogleWebSignInControlState extends State<_GoogleWebSignInControl> {
  StreamSubscription<String>? _tokenSubscription;
  late final Future<void> _initialization;

  @override
  void initState() {
    super.initState();
    _tokenSubscription = GoogleSignInService.instance.idTokens.listen(
      widget.onIdToken,
      onError: widget.onError,
    );
    _initialization = GoogleSignInService.instance.initialize(widget.clientId);
  }

  @override
  void dispose() {
    _tokenSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<void>(
      future: _initialization,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          WidgetsBinding.instance.addPostFrameCallback(
            (_) => widget.onError(snapshot.error!),
          );
          return const SizedBox.shrink();
        }
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(
            child: SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          );
        }
        return Center(child: google_web.renderButton());
      },
    );
  }
}
