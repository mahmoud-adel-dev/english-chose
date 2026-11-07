import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

class GoogleSignInInitializationOptions {
  final String? clientId;
  final String? serverClientId;

  const GoogleSignInInitializationOptions({this.clientId, this.serverClientId});

  @override
  bool operator ==(Object other) =>
      other is GoogleSignInInitializationOptions &&
      other.clientId == clientId &&
      other.serverClientId == serverClientId;

  @override
  int get hashCode => Object.hash(clientId, serverClientId);
}

GoogleSignInInitializationOptions googleSignInInitializationOptions({
  required bool isWeb,
  required String webClientId,
}) {
  return isWeb
      ? GoogleSignInInitializationOptions(clientId: webClientId)
      : GoogleSignInInitializationOptions(serverClientId: webClientId);
}

String friendlyGoogleSignInError(Object error) {
  final message = error.toString().toLowerCase();
  if (message.contains('cancel')) return 'Google sign-in was cancelled.';
  return 'Google sign-in is not available right now. Please try again or use your email.';
}

String requireGoogleIdToken(String? token) {
  if (token == null || token.isEmpty) {
    throw StateError('Google did not return an identity token.');
  }
  return token;
}

class GoogleSignInService {
  GoogleSignInService._();
  static final GoogleSignInService instance = GoogleSignInService._();

  String? _initializedClientId;
  final StreamController<String> _idTokenController =
      StreamController<String>.broadcast();

  Stream<String> get idTokens => _idTokenController.stream;

  Future<void> initialize(String webClientId) async {
    final clientId = webClientId.trim();
    if (clientId.isEmpty) throw StateError('Google login is not configured.');
    if (_initializedClientId != null) {
      if (_initializedClientId != clientId) {
        throw StateError(
          'Google settings changed. Restart the app before signing in.',
        );
      }
      return;
    }

    final options = googleSignInInitializationOptions(
      isWeb: kIsWeb,
      webClientId: clientId,
    );
    await GoogleSignIn.instance.initialize(
      clientId: options.clientId,
      serverClientId: options.serverClientId,
    );
    GoogleSignIn.instance.authenticationEvents.listen((event) {
      if (event is GoogleSignInAuthenticationEventSignIn) {
        try {
          _idTokenController.add(
            requireGoogleIdToken(event.user.authentication.idToken),
          );
        } catch (error, stackTrace) {
          _idTokenController.addError(error, stackTrace);
        }
      }
    }, onError: _idTokenController.addError);
    _initializedClientId = clientId;
  }

  Future<String> signIn(String webClientId) async {
    await initialize(webClientId);

    if (!GoogleSignIn.instance.supportsAuthenticate()) {
      throw UnsupportedError(
        'Interactive Google sign-in is not supported on this platform.',
      );
    }
    final account = await GoogleSignIn.instance.authenticate();
    return requireGoogleIdToken(account.authentication.idToken);
  }

  Future<void> signOut() => GoogleSignIn.instance.signOut();
}
