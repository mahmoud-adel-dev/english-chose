import 'package:google_sign_in/google_sign_in.dart';

class GoogleSignInService {
  GoogleSignInService._();
  static final GoogleSignInService instance = GoogleSignInService._();

  String? _initializedClientId;

  Future<String> signIn(String webClientId) async {
    final clientId = webClientId.trim();
    if (clientId.isEmpty) throw StateError('Google login is not configured.');
    if (_initializedClientId == null) {
      await GoogleSignIn.instance.initialize(serverClientId: clientId);
      _initializedClientId = clientId;
    } else if (_initializedClientId != clientId) {
      throw StateError(
        'Google settings changed. Restart the app before signing in.',
      );
    }

    if (!GoogleSignIn.instance.supportsAuthenticate()) {
      throw UnsupportedError(
        'Interactive Google sign-in is not supported on this platform.',
      );
    }
    final account = await GoogleSignIn.instance.authenticate();
    final idToken = account.authentication.idToken;
    if (idToken == null || idToken.isEmpty) {
      throw StateError(
        'Google did not return an identity token. Check the Web client ID.',
      );
    }
    return idToken;
  }

  Future<void> signOut() => GoogleSignIn.instance.signOut();
}
