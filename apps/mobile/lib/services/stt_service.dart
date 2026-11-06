import 'package:flutter/foundation.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:speech_to_text/speech_recognition_result.dart';
import 'package:speech_to_text/speech_recognition_error.dart';
import 'speech_dictation_policy.dart';

/// Speech-to-Text service for English Coach.
/// Captures student's spoken English and converts it to text for AI evaluation.
class SttService {
  static final SttService _instance = SttService._internal();
  factory SttService() => _instance;
  SttService._internal();

  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _isInitialized = false;
  bool _isListening = false;
  String _currentTranscript = '';
  String _transcriptPrefix = '';
  double _confidence = 0.0;
  String? _lastError;

  // Callbacks
  ValueChanged<String>? onResult;
  ValueChanged<double>? onSoundLevel;
  VoidCallback? onListeningStarted;
  VoidCallback? onListeningStopped;
  ValueChanged<String>? onError;

  bool get isInitialized => _isInitialized;
  bool get isListening => _isListening;
  String get currentTranscript => _currentTranscript;
  double get confidence => _confidence;
  String? get lastError => _lastError;

  /// Initialize STT engine. Returns true if microphone permission was granted.
  Future<bool> initialize() async {
    if (_isInitialized) return true;

    try {
      final available = await _speech.initialize(
        onStatus: _onStatus,
        onError: _onError,
        debugLogging: kDebugMode,
      );

      _isInitialized = available;

      if (!available) {
        _lastError = 'Speech recognition not available on this device';
        debugPrint('[STT] Not available');
      } else {
        debugPrint('[STT] Initialized successfully');
      }

      return available;
    } catch (e) {
      _lastError = 'Failed to initialize speech recognition: $e';
      debugPrint('[STT] Init error: $e');
      return false;
    }
  }

  /// Start listening for English speech.
  Future<bool> startListening({String existingTranscript = ''}) async {
    if (!_isInitialized) {
      final ok = await initialize();
      if (!ok) return false;
    }

    if (_isListening) return true;

    _transcriptPrefix = existingTranscript.trim();
    _currentTranscript = _transcriptPrefix;
    _confidence = 0.0;
    _lastError = null;

    try {
      await _speech.listen(
        onResult: _onSpeechResult,
        onSoundLevelChange: _onSoundLevelChange,
        listenOptions: stt.SpeechListenOptions(
          listenMode: stt.ListenMode.dictation,
          cancelOnError: false,
          partialResults: true,
          localeId: 'en_US',
          listenFor: SpeechDictationPolicy.listenFor,
          pauseFor: SpeechDictationPolicy.pauseFor,
        ),
      );

      _isListening = true;
      onListeningStarted?.call();
      return true;
    } catch (e) {
      _lastError = 'Failed to start listening: $e';
      debugPrint('[STT] Start error: $e');
      return false;
    }
  }

  /// Stop listening and finalize transcript.
  Future<String> stopListening() async {
    if (!_isListening) return _currentTranscript;

    try {
      await _speech.stop();
    } catch (e) {
      debugPrint('[STT] Stop error: $e');
    }

    _isListening = false;
    onListeningStopped?.call();
    return _currentTranscript;
  }

  /// Cancel listening without keeping results.
  Future<void> cancelListening() async {
    try {
      await _speech.cancel();
    } catch (e) {
      debugPrint('[STT] Cancel error: $e');
    }
    _isListening = false;
    _currentTranscript = '';
    _transcriptPrefix = '';
    _confidence = 0.0;
    onListeningStopped?.call();
  }

  void _onSpeechResult(SpeechRecognitionResult result) {
    _currentTranscript = SpeechDictationPolicy.mergeTranscript(
      _transcriptPrefix,
      result.recognizedWords,
    );
    _confidence = result.confidence;
    onResult?.call(_currentTranscript);

    if (result.finalResult) {
      _isListening = false;
      onListeningStopped?.call();
    }
  }

  void _onSoundLevelChange(double level) {
    onSoundLevel?.call(level);
  }

  void _onStatus(String status) {
    debugPrint('[STT] Status: $status');
    if (status == 'notListening' || status == 'done') {
      _isListening = false;
      onListeningStopped?.call();
    }
  }

  void _onError(SpeechRecognitionError error) {
    _lastError = error.errorMsg;
    debugPrint(
      '[STT] Error: ${error.errorMsg} (permanent: ${error.permanent})',
    );
    if (error.permanent) {
      _isListening = false;
      onListeningStopped?.call();
    }
    onError?.call(error.errorMsg);
  }

  /// Get available locales for speech recognition.
  Future<List<stt.LocaleName>> getLocales() async {
    if (!_isInitialized) return [];
    return await _speech.locales();
  }

  /// Dispose STT resources.
  void dispose() {
    _speech.stop();
    _isInitialized = false;
    _isListening = false;
  }
}
