import 'package:flutter/foundation.dart';
import 'package:flutter_tts/flutter_tts.dart';

/// Text-to-Speech service for English Coach.
/// Reads questions, corrected sentences, and feedback aloud to train listening skills.
class TtsService {
  static final TtsService _instance = TtsService._internal();
  factory TtsService() => _instance;
  TtsService._internal();

  FlutterTts? _flutterTts;
  bool _isInitialized = false;
  bool _isSpeaking = false;

  // Callbacks
  VoidCallback? onStart;
  VoidCallback? onComplete;
  VoidCallback? onError;

  bool get isSpeaking => _isSpeaking;
  bool get isInitialized => _isInitialized;

  /// Initialize TTS engine with English voice settings optimized for language learning.
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      _flutterTts = FlutterTts();

      // Configure for clear English pronunciation
      await _flutterTts!.setLanguage('en-US');
      await _flutterTts!.setSpeechRate(0.45); // Slower for learners
      await _flutterTts!.setVolume(1.0);
      await _flutterTts!.setPitch(1.0);

      // Web-specific setup
      if (kIsWeb) {
        await _flutterTts!.awaitSpeakCompletion(true);
      }

      // Set up callbacks
      _flutterTts!.setStartHandler(() {
        _isSpeaking = true;
        onStart?.call();
      });

      _flutterTts!.setCompletionHandler(() {
        _isSpeaking = false;
        onComplete?.call();
      });

      _flutterTts!.setErrorHandler((msg) {
        _isSpeaking = false;
        debugPrint('[TTS] Error: $msg');
        onError?.call();
      });

      _flutterTts!.setCancelHandler(() {
        _isSpeaking = false;
      });

      _isInitialized = true;
      debugPrint('[TTS] Initialized successfully');
    } catch (e) {
      debugPrint('[TTS] Initialization error: $e');
    }
  }

  /// Speak the given text aloud.
  Future<void> speak(String text) async {
    if (!_isInitialized || _flutterTts == null) {
      await initialize();
    }
    if (text.trim().isEmpty) return;

    // Stop any current speech first
    await stop();

    try {
      await _flutterTts!.speak(text);
    } catch (e) {
      debugPrint('[TTS] Speak error: $e');
      _isSpeaking = false;
    }
  }

  /// Speak text at a specific speed (0.0 to 1.0).
  /// Useful for: normal (0.45), slow (0.25), fast (0.65)
  Future<void> speakAtSpeed(String text, double speed) async {
    if (!_isInitialized || _flutterTts == null) {
      await initialize();
    }
    await _flutterTts!.setSpeechRate(speed.clamp(0.1, 1.0));
    await speak(text);
    // Reset to default speed
    await _flutterTts!.setSpeechRate(0.45);
  }

  /// Stop current speech.
  Future<void> stop() async {
    if (_flutterTts != null) {
      await _flutterTts!.stop();
      _isSpeaking = false;
    }
  }

  /// Set speech rate (0.0 slow → 1.0 fast). Default is 0.45 for learners.
  Future<void> setSpeechRate(double rate) async {
    if (_flutterTts != null) {
      await _flutterTts!.setSpeechRate(rate.clamp(0.1, 1.0));
    }
  }

  /// Dispose of TTS resources.
  Future<void> dispose() async {
    await stop();
    _flutterTts = null;
    _isInitialized = false;
  }
}

